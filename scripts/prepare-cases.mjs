import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const portfolioDir = path.resolve(scriptDir, "../..");
const researchDir = path.join(portfolioDir, "research");
const casesDir = path.join(portfolioDir, "content", "cases");
const assetsDir = path.join(scriptDir, "../assets/cases");
const caseIds = ["github", "hpe", "safe", "rox", "about", "home"];
const metadataLabels = new Set(["ROLE", "METHODS", "TEAM", "TIME", "TOOLS"]);
const ignoredLines = new Set(["Work", "About", "Resume", "Contact", "Edit Content"]);
const imageConcurrency = 4;

const headings = {
  github: new Set([
    "Impact:",
    "What difference did we make?",
    "Understanding Code Review",
    "What prompted us to look deeper?",
    "The Accessibility Paradox",
    "What was the new \"accessible\" design?",
    "Building understanding through Research",
    "Scenarios & Tasks",
    "Understanding the Current State",
    "Making sense of large amount of qualitative data",
    "What was missing?",
    "Findings & Solutions",
    "Making it Right",
    "Comments are inefficient for Multi-monitor setups",
    "Users need choice",
    "Icons are hard to spot",
    "Comments are lost in Code forest",
    "Impact & Learnings",
    "Context is everything",
    "\"Accessible\" Isn't Always Accessible",
    "Small changes have big impact",
  ]),
  hpe: new Set([
    "Impact:",
    "Overview",
    "Challenge",
    "Solution",
    "Design Process",
    "Key Learnings",
    "Reflections",
    "PROBLEM SPACE AND GOAL",
    "The Challenge",
    "FINAL RESULT",
    "The Solution: AI Monitoring Dashboard",
    "DESIGN PROCESS",
    "How we solved it",
    "Talked to Users, then Walked their Shoes:",
    "Designing, testing, iterating & more iterating",
    "Bringing the Dashboard to Life",
    "Testing in the Wild",
    "Next Up",
  ]),
  safe: new Set([
    "Impact:",
    "Overview",
    "Challenge",
    "Solution",
    "Design Process",
    "Key Learnings",
    "Reflections",
    "PROBLEM SPACE",
    "The Challenge",
    "FINAL RESULT",
    "Solution Overview",
    "RESEARCH",
    "How we arrived at the solution",
    "Online Netnography",
    "On-site Observation",
    "User Surveys & Interviews",
    "DESIGN PROCESS",
    "Key Findings",
    "User Groups",
    "Areas of concern",
    "Thorough, Iterative ideation",
    "USER TESTING & ITERATION",
    "Trial & Error",
    "FINAL RESULT",
    "Three phased solution",
    "01 Before Care – Appointment Booking & Check-in",
    "02 In the moment of Care – Customizable environment & comfort box",
    "03 After Care – Appointment Booking & Check-in",
    "REFLECTION & LEARNING",
    "Looking back",
    "Empathy in Sensitive Contexts",
    "Small Changes, Big Impact",
    "Getting feedback, Making it Real",
  ]),
  rox: new Set(["Meeting Analysis"]),
  about: new Set([
    "Strengths & Values",
    "Theatre & Process",
    "Visual Notetaking & Observations",
    "Odds & Ends",
  ]),
  home: new Set([
    "For anyone",
    "Recruiters",
    "Fellow Designers",
    "Experience",
    "Salesloft",
    "RoxHealth AI",
    "Github",
    "Hewlett Packard Enterprise",
    "Nutanix",
  ]),
};

async function fetchImage(url, inputPath) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "portfolio-case-study-archive/1.0" },
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} for ${url}`);
        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
      } else {
        await writeFile(inputPath, Buffer.from(await response.arrayBuffer()));
        return;
      }
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw lastError;
}

function parseCase(id, source) {
  const imageMarker = source.indexOf("IMAGES:");
  const text = (imageMarker === -1 ? source : source.slice(0, imageMarker))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !ignoredLines.has(line));
  const imageList = imageMarker === -1 ? "" : source.slice(imageMarker);
  const images = imageList
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(https?:\/\/\S+)\s*\|\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((match) => ({ url: match[1], alt: match[2].trim() }));
  const title = text.shift() ?? id;
  const subtitle = text.shift() ?? "";
  const details = {};
  const body = [];

  for (let index = 0; index < text.length; index += 1) {
    const label = text[index];
    if (!metadataLabels.has(label)) {
      body.push(label);
      continue;
    }

    const values = [];
    while (
      index + 1 < text.length &&
      !metadataLabels.has(text[index + 1]) &&
      (label !== "TIME" || values.length === 0)
    ) {
      index += 1;
      values.push(text[index]);
    }
    details[label] = values;
  }

  return { id, title, subtitle, details, body, images };
}

function metadataMarkdown(details) {
  const labels = [
    ["ROLE", "Role"],
    ["TEAM", "Team"],
    ["TIME", "Timeline"],
    ["METHODS", "Methods"],
    ["TOOLS", "Tools"],
  ];
  const lines = [];
  for (const [key, label] of labels) {
    if (details[key]?.length) {
      lines.push(`- **${label}:** ${details[key].join("; ")}`);
    }
  }
  return lines.length ? `## Project details\n\n${lines.join("\n")}\n\n` : "";
}

function imageMarkdown(id, image, number, extension) {
  const fallbackAlt = `${id} case study image ${String(number).padStart(2, "0")}`;
  const alt = image.alt || fallbackAlt;
  const filename = `${String(number).padStart(2, "0")}.${extension}`;
  return `![${alt}](../../site/assets/cases/${id}/${filename})`;
}

function renderMarkdown(project) {
  const lines = [
    `# ${project.title}`,
    "",
    project.subtitle ? `> ${project.subtitle}` : "",
    "",
    metadataMarkdown(project.details).trimEnd(),
  ].filter(Boolean);
  const imagePoints = new Map();

  project.images.forEach((image, index) => {
    const position = Math.max(
      0,
      Math.min(
        project.body.length - 1,
        Math.floor(((index + 1) * project.body.length) / (project.images.length + 1)) - 1,
      ),
    );
    if (!imagePoints.has(position)) imagePoints.set(position, []);
    imagePoints.get(position).push({ image, number: index + 1 });
  });

  for (let index = 0; index < project.body.length; index += 1) {
    const line = project.body[index];
    lines.push(headings[project.id]?.has(line) ? `## ${line}` : line, "");
    for (const { image, number } of imagePoints.get(index) ?? []) {
      const extension = image.extension;
      lines.push(imageMarkdown(project.id, image, number, extension), "");
    }
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

async function mapLimit(values, limit, callback) {
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        await callback(values[index], index);
      }
    }),
  );
}

async function prepareImage(project, image, index, workDir) {
  const number = index + 1;
  const inputPath = path.join(workDir, `${project.id}-${number}.source`);
  const outputDir = path.join(assetsDir, project.id);
  await mkdir(outputDir, { recursive: true });
  await fetchImage(image.url, inputPath);

  try {
    const { stdout } = await execFile("identify", [
      "-format",
      "%[opaque]",
      `${inputPath}[0]`,
    ]);
    const transparent = stdout.trim().split(/\r?\n/).includes("False");
    const extension = transparent ? "png" : "jpg";
    const outputPath = path.join(
      outputDir,
      `${String(number).padStart(2, "0")}.${extension}`,
    );
    const args = [
      `${inputPath}[0]`,
      "-auto-orient",
      "-resize",
      "2000x2000>",
      "-strip",
    ];
    if (transparent) {
      args.push("-define", "png:compression-level=9", outputPath);
    } else {
      args.push("-quality", "82", outputPath);
    }
    await execFile("convert", args);
    image.extension = extension;
  } catch (error) {
    throw new Error(`Could not process ${image.url}: ${error.message}`);
  } finally {
    await rm(inputPath, { force: true });
  }
}

async function main() {
  const projects = [];
  for (const id of caseIds) {
    const sourcePath = path.join(researchDir, `rendered-framer-r-${id}.txt`);
    projects.push(parseCase(id, await readFile(sourcePath, "utf8")));
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "portfolio-case-images-"));
  try {
    for (const project of projects) {
      await mapLimit(project.images, imageConcurrency, (image, index) =>
        prepareImage(project, image, index, workDir),
      );
      const markdownPath = path.join(casesDir, `${project.id}.md`);
      await writeFile(markdownPath, renderMarkdown(project));
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  const totalImages = projects.reduce(
    (count, project) => count + project.images.length,
    0,
  );
  console.log(
    `Wrote ${projects.length} case-study files and ${totalImages} local images (${projects.map((project) => `${project.id}: ${project.images.length}`).join(", ")}).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
