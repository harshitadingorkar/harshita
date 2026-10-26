import { mkdtemp, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const dataDir = path.join(siteDir, "data");
const imageDir = path.join(dataDir, "img");
const apiRoot = "https://api.are.na/v3";
const userAgent = "portfolio-content-archive/1.0";
const imageConcurrency = 4;

async function fetchResponse(url, attempts = 4) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent },
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok) return response;

      const retryable = response.status === 429 || response.status >= 500;
      const error = new Error(`HTTP ${response.status} for ${url}`);
      if (!retryable || attempt === attempts - 1) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }

  throw lastError;
}

async function fetchJson(url) {
  return fetchResponse(url).then((response) => response.json());
}

async function fetchPaged(url, perPage = 100) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("per", String(perPage));
    requestUrl.searchParams.set("page", String(page));
    const result = await fetchJson(requestUrl);
    items.push(...(result.data ?? []));
    totalPages = Number(result.meta?.total_pages) || totalPages;

    if (!result.meta?.has_more_pages && !result.meta?.next_page) break;
    page += 1;
  } while (page <= totalPages);

  return items;
}

function imageUrl(value) {
  if (typeof value === "string") return value;
  return value?.src ?? null;
}

function connectedAt(block) {
  return block.connection?.connected_at ?? block.connected_at ?? undefined;
}

function sourceUrl(block) {
  return block.source?.url ?? block.source_url ?? null;
}

function localImagePath(relativePath) {
  return path.join(siteDir, relativePath);
}

async function downloadJpeg(url, relativePath, workDir) {
  if (!url) return null;

  const outputPath = localImagePath(relativePath);
  const inputPath = path.join(workDir, `${cryptoRandomId()}.source`);
  await mkdir(path.dirname(outputPath), { recursive: true });

  const response = await fetchResponse(url);
  await writeFile(inputPath, Buffer.from(await response.arrayBuffer()));

  try {
    await execFile("convert", [
      `${inputPath}[0]`,
      "-auto-orient",
      "-resize",
      "900x900>",
      "-strip",
      "-background",
      "#ffffff",
      "-alpha",
      "remove",
      "-alpha",
      "off",
      "-quality",
      "80",
      outputPath,
    ]);
  } catch (error) {
    throw new Error(`Image conversion failed for ${url}: ${error.message}`);
  } finally {
    await rm(inputPath, { force: true });
  }

  return relativePath;
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function mapLimit(values, limit, callback) {
  let nextIndex = 0;
  const results = new Array(values.length);
  const workers = Array.from(
    { length: Math.min(limit, values.length) },
    async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await callback(values[index], index);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

async function fetchArenaChannels() {
  const channels = await fetchPaged(
    `${apiRoot}/users/harshita-shyale/contents?type=Channel`,
  );
  const publicChannels = channels.filter(
    (channel) => channel.type === "Channel" && channel.visibility === "public",
  );

  return Promise.all(
    publicChannels.map(async (channel) => {
      const contents = await fetchPaged(
        `${apiRoot}/channels/${encodeURIComponent(channel.slug)}/contents`,
      );
      const blocks = [];
      const texts = [];

      for (const item of contents) {
        const base = {
          id: item.id,
          type: item.type,
          title: item.title ?? null,
          created_at: item.created_at ?? null,
          ...(connectedAt(item) ? { connected_at: connectedAt(item) } : {}),
          source_url: sourceUrl(item),
          block_url: `https://www.are.na/block/${item.id}`,
        };

        if (item.type === "Image") {
          const thumb = imageUrl(item.image?.small) ?? imageUrl(item.image?.square);
          const display =
            imageUrl(item.image?.large) ??
            imageUrl(item.image?.medium) ??
            imageUrl(item.image?.src);
          const image = {
            thumb,
            display,
            local: display ? `data/img/arena/${channel.slug}/${item.id}.jpg` : null,
          };
          if (Number.isFinite(item.image?.width)) image.width = item.image.width;
          if (Number.isFinite(item.image?.height)) image.height = item.image.height;
          blocks.push({ ...base, image });
        } else if (item.type === "Text") {
          texts.push({
            ...base,
            text:
              item.content?.plain ??
              item.content?.markdown ??
              item.content?.html ??
              "",
          });
        }
      }

      return {
        slug: channel.slug,
        title: channel.title,
        url: `https://www.are.na/harshita-shyale/${channel.slug}`,
        count: channel.counts?.contents ?? contents.length,
        blocks,
        texts,
      };
    }),
  );
}

function decodeHtml(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };

  return value
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
      if (code[0] === "#") {
        const number = code[1].toLowerCase() === "x"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
        return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
      }
      return named[code.toLowerCase()] ?? entity;
    })
    .replace(/\u00a0/g, " ");
}

function xmlTag(xml, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"),
  );
  if (!match) return null;
  return match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();
}

function htmlText(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function reviewFromDescription(description) {
  if (!description) return null;

  const paragraphs = [
    ...description.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi),
  ].map((match) => match[1]);
  const candidates = paragraphs.length
    ? paragraphs.filter((paragraph) => !/<img\b/i.test(paragraph))
    : [description.replace(/<p\b[^>]*>\s*<img\b[^>]*>\s*<\/p>/gi, "")];
  const review = candidates
    .map(htmlText)
    .filter((text) => text && !/^watched on\b/i.test(text))
    .join("\n\n");

  return review || null;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchFilms() {
  const response = await fetchResponse("https://letterboxd.com/harshita/rss/");
  const rss = await response.text();
  const items = [...rss.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .slice(0, 52)
    .map((match, index) => {
      const item = match[1];
      const description = xmlTag(item, "description") ?? "";
      const posterMatch = description.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
      const filmTitle = xmlTag(item, "letterboxd:filmTitle");
      const watchedDate = xmlTag(item, "letterboxd:watchedDate");
      const posterUrl = posterMatch?.[1] ? decodeHtml(posterMatch[1]) : null;
      const local = posterUrl
        ? `data/img/films/${slugify(filmTitle ?? `film-${index + 1}`)}-${watchedDate ?? index + 1}.jpg`
        : null;

      return {
        filmTitle: filmTitle ?? null,
        filmYear: xmlTag(item, "letterboxd:filmYear"),
        memberRating: xmlTag(item, "letterboxd:memberRating"),
        watchedDate,
        rewatch: xmlTag(item, "letterboxd:rewatch"),
        link: xmlTag(item, "link"),
        poster: posterUrl ? { url: posterUrl, local } : null,
        review: reviewFromDescription(description),
      };
    });

  return items;
}

async function writeJsonAtomically(outputPath, value) {
  const tempPath = `${outputPath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(tempPath, outputPath);
}

async function main() {
  await mkdir(imageDir, { recursive: true });
  const [channels, films] = await Promise.all([fetchArenaChannels(), fetchFilms()]);
  const images = [];

  for (const channel of channels) {
    for (const block of channel.blocks) {
      if (block.image.display && block.image.local) {
        images.push({ url: block.image.display, local: block.image.local });
      }
    }
  }
  for (const film of films) {
    if (film.poster?.url && film.poster.local) {
      images.push({ url: film.poster.url, local: film.poster.local });
    }
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "portfolio-data-images-"));
  try {
    await mapLimit(images, imageConcurrency, ({ url, local }) =>
      downloadJpeg(url, local, workDir),
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  await writeJsonAtomically(path.join(dataDir, "arena.json"), channels);
  await writeJsonAtomically(path.join(dataDir, "films.json"), films);

  const imageBlocks = channels.reduce(
    (total, channel) => total + channel.blocks.length,
    0,
  );
  const textBlocks = channels.reduce(
    (total, channel) => total + channel.texts.length,
    0,
  );
  console.log(
    `Wrote ${channels.length} public Are.na channels (${imageBlocks} image blocks, ${textBlocks} text blocks) and ${films.length} Letterboxd RSS items; downloaded ${images.length} JPEGs to site/data/img/.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
