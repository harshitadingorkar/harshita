import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const casesDir = path.resolve(siteDir, "..", "content", "cases");
const caseIds = ["github", "hpe", "safe", "rox"];
const metadataKeys = new Set(["role", "team", "timeline", "tools", "methods"]);
const framerHosts = new Set(["nuanced-choose-563332.framer.app"]);

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatText(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(?!\s)(.+?)(?<!\s)\*/g, "<em>$1</em>")
    .replace(/_(?!\s)(.+?)(?<!\s)_/g, "<em>$1</em>");
}

function isOldFramerUrl(href) {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return (
      framerHosts.has(host) ||
      host.endsWith(".framer.app") ||
      host.endsWith(".framer.website") ||
      host.endsWith(".framer.site")
    );
  } catch {
    return false;
  }
}

function safeHref(href) {
  const value = href.trim();
  if (/^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(value)) {
    return value;
  }
  return null;
}

function imageFigure(caseId, alt, source) {
  const cleanSource = source.split(/[?#]/, 1)[0];
  const filename = path.posix.basename(cleanSource);
  if (!/^\d+\.(?:jpe?g|png)$/i.test(filename)) {
    throw new Error(`Unexpected case image path for ${caseId}: ${source}`);
  }

  const src = `assets/cases/${caseId}/${filename}`;
  const caption = alt.trim();
  return `<figure class="reveal"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" style="width:100%"><figcaption class="mono dim">${escapeHtml(caption)}</figcaption></figure>`;
}

function inlineMarkdown(value, caseId) {
  const tokens = [];
  const stash = (html) => {
    const index = tokens.push(html) - 1;
    return `\u0000${index}\u0000`;
  };

  const protectedValue = value.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (match, imageMarker, label, destination) => {
      if (imageMarker) {
        return stash(imageFigure(caseId, label, destination));
      }

      const linkedText = formatText(label);
      if (isOldFramerUrl(destination)) {
        return stash(linkedText);
      }

      const href = safeHref(destination);
      if (!href) {
        return stash(linkedText);
      }

      const external = /^https?:\/\//i.test(href);
      const target = external ? ' target="_blank" rel="noopener"' : "";
      return stash(
        `<a href="${escapeHtml(href)}"${target}>${linkedText}</a>`,
      );
    },
  );

  let html = formatText(protectedValue);
  return html.replace(/\u0000(\d+)\u0000/g, (token, index) => tokens[index]);
}

function extractMetadata(lines) {
  const metadata = [];
  const cleaned = [...lines];
  const detailsIndex = cleaned.findIndex((line) =>
    /^#{1,6}\s+Project details\s*#*\s*$/i.test(line.trim()),
  );

  if (detailsIndex < 0) {
    return { metadata, lines: cleaned };
  }

  cleaned[detailsIndex] = "";
  for (let index = detailsIndex + 1; index < cleaned.length; index += 1) {
    const line = cleaned[index];
    if (!line.trim()) {
      continue;
    }

    const match = line.match(/^\s*[-*+]\s+\*\*([^*]+):\*\*\s*(.*?)\s*$/);
    if (!match) {
      break;
    }

    const key = match[1].trim().toLowerCase();
    if (!metadataKeys.has(key)) {
      break;
    }

    metadata.push({ key, value: match[2] });
    cleaned[index] = "";
  }

  return { metadata, lines: cleaned };
}

function isBlockStart(line) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line) ||
    /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(line) ||
    /^\s*(?:---|\*\*\*|___)\s*$/.test(line)
  );
}

function renderMarkdown(caseId, markdown) {
  const { metadata, lines } = extractMetadata(
    markdown.replace(/\r\n?/g, "\n").split("\n"),
  );
  const output = [];

  if (metadata.length > 0) {
    const entries = metadata
      .map(
        ({ key, value }) =>
          `<dt>${escapeHtml(key)}</dt><dd>${inlineMarkdown(value, caseId)}</dd>`,
      )
      .join("");
    output.push(`<dl class="s-meta">${entries}</dl>`);
  }

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const tag = heading[1].length >= 3 ? "h4" : "h3";
      output.push(`<${tag}>${inlineMarkdown(heading[2], caseId)}</${tag}>`);
      index += 1;
      continue;
    }

    if (/^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(line)) {
      const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      output.push(imageFigure(caseId, image[1], image[2]));
      index += 1;
      continue;
    }

    if (/^\s*(?:---|\*\*\*|___)\s*$/.test(line)) {
      output.push("<hr>");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, "").trim());
        index += 1;
      }
      output.push(
        `<blockquote><p>${inlineMarkdown(quote.join(" "), caseId)}</p></blockquote>`,
      );
      continue;
    }

    const listItem = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
    if (listItem) {
      const ordered = /^\d/.test(listItem[1]);
      const tag = ordered ? "ol" : "ul";
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) {
          break;
        }
        items.push(`<li>${inlineMarkdown(item[2], caseId)}</li>`);
        index += 1;
      }
      output.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${inlineMarkdown(paragraph.join(" "), caseId)}</p>`);
  }

  return output.join("\n");
}

const cases = {};
for (const caseId of caseIds) {
  const markdown = await readFile(
    path.join(casesDir, `${caseId}.md`),
    "utf8",
  );
  cases[caseId] = { html: renderMarkdown(caseId, markdown) };
}

const outputPath = path.join(siteDir, "data", "cases.json");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(cases, null, 2)}\n`);

for (const [caseId, { html }] of Object.entries(cases)) {
  const headings = html.match(/<h[34]>/g) ?? [];
  const images = html.match(/<figure class="reveal">/g) ?? [];
  console.log(`${caseId}: ${headings.length} sections, ${images.length} images`);
}
console.log(`Wrote ${outputPath}`);
