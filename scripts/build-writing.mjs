// Builds the writing section from plain files, no dependencies: node scripts/build-writing.mjs
//   data/writing/<slug>.md      a post: front matter (title, date, summary) and a body in light markdown
//   data/writing-notes.json     my later notes, dated, shown under the post they answer
//   data/writing-config.json    where visitor comments live (giscus), and the fallback email
// It writes writing/index.html and writing/<slug>/index.html, and keeps the writing urls in sitemap.xml.
// GitHub Pages serves the committed pages, so run this and commit the result.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const write = (p, s) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), s); };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://harshitashyale.com';
const when = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// ---- posts
const notes = JSON.parse(read('data/writing-notes.json'));
const config = JSON.parse(read('data/writing-config.json'));
const posts = readdirSync(join(root, 'data/writing')).filter(f => f.endsWith('.md')).map(f => {
  const raw = read('data/writing/' + f), m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(f + ': missing front matter');
  const meta = Object.fromEntries(m[1].split('\n').map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  for (const k of ['title', 'date', 'summary']) if (!meta[k]) throw new Error(f + ': missing ' + k);
  return { ...meta, slug: f.replace(/\.md$/, ''), body: m[2].trim(), notes: (notes[f.replace(/\.md$/, '')] || []).slice().sort((a, b) => a.date.localeCompare(b.date)) };
}).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

// ---- the pen sketch: ambition across, willingness up, a table beside it. Lines wobble a little, as if drawn.
const r1 = v => Math.round(v * 10) / 10;
const jit = (n, s) => Math.sin(n * 12.9898 + s * 78.233) * 1.3;
const pen = (x1, y1, x2, y2, s) => `M${r1(x1 + jit(1, s))} ${r1(y1 + jit(2, s))}Q${r1((x1 + x2) / 2 + jit(3, s) * 1.5)} ${r1((y1 + y2) / 2 + jit(4, s) * 1.5)} ${r1(x2 + jit(5, s))} ${r1(y2 + jit(6, s))}`;
const line = (x1, y1, x2, y2, s) => `<path d="${pen(x1, y1, x2, y2, s)}"/><path d="${pen(x1, y1, x2, y2, s + 3)}" class="thin"/>`;
const star = (cx, cy, ro, ri, s) => 'M' + Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? ri : ro; return `${r1(cx + Math.cos(a) * rr + jit(k, s))} ${r1(cy + Math.sin(a) * rr + jit(k + 20, s))}`; }).join('L') + 'Z';
const rays = (cx, cy, s) => Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6 + 0.1, r2 = k % 2 ? 36 : 44; return `<path d="${pen(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, s + k)}"/>`; }).join('');
const figures = {
  'experiments-figure': () => `<figure class="plot">
<table class="stall">
<caption>Three ways to stall, and the one way to start</caption>
<thead><tr><th scope="col">Way to stall</th><th scope="col">Ambition</th><th scope="col">Willingness to do</th></tr></thead>
<tbody>
<tr><th scope="row">Escapism</th><td>Low</td><td>High</td></tr>
<tr><th scope="row">Perfectionism</th><td>High</td><td>Low</td></tr>
<tr><th scope="row">Cynicism</th><td>Low</td><td>Low</td></tr>
<tr class="star"><th scope="row">Experimentalism</th><td>High</td><td>High</td></tr>
</tbody>
</table>
<svg viewBox="0 0 400 320" role="img" aria-label="A hand-drawn graph with ambition across and willingness to do up. Escapism sits top left, cynicism bottom left, perfectionism bottom right, and experimentalism, drawn as a star with rays, top right.">
<defs><filter id="pen" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter></defs>
<g class="ink" filter="url(#pen)">
<g class="mid"><path d="${pen(220, 36, 220, 262, 21)}"/><path d="${pen(56, 150, 384, 150, 22)}"/></g>
<g class="axes">${line(56, 272, 388, 272, 11)}${line(388, 272, 376, 265, 12)}${line(388, 272, 376, 279, 13)}${line(56, 272, 56, 28, 14)}${line(56, 28, 49, 40, 15)}${line(56, 28, 63, 40, 16)}</g>
<g class="dots"><circle cx="104" cy="78" r="5"/><circle cx="104" cy="226" r="5"/><circle cx="328" cy="226" r="5"/></g>
<g class="starry"><path class="body" d="${star(300, 84, 18, 8, 7)}"/><g class="rays">${rays(300, 84, 40)}</g></g>
</g>
<g class="words">
<text x="118" y="83">escapism</text>
<text x="118" y="231">cynicism</text>
<text x="314" y="231" text-anchor="end">perfectionism</text>
<text x="300" y="146" text-anchor="middle" class="em">experimentalism</text>
<text x="64" y="300" class="quiet">low</text><text x="384" y="300" text-anchor="end" class="quiet">high</text><text x="220" y="304" text-anchor="middle" class="em">ambition</text>
<text x="48" y="40" text-anchor="end" class="quiet">high</text><text x="48" y="270" text-anchor="end" class="quiet">low</text><text transform="rotate(-90 20 150)" x="20" y="150" text-anchor="middle" class="em">willingness to do</text>
</g>
</svg>
</figure>`,
};

// ---- a very small markdown: paragraphs, ## and ### headings, lists, quotes, links, *em*, **strong**, and :::figure lines
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
const render = md => md.split(/\n{2,}/).map(b => {
  b = b.trim();
  let m;
  if ((m = b.match(/^:::([\w-]+)$/))) { if (!figures[m[1]]) throw new Error('unknown figure ' + m[1]); return figures[m[1]](); }
  if ((m = b.match(/^(#{2,3}) (.+)$/))) return `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
  if (/^- /m.test(b)) return '<ul>' + b.split('\n').map(l => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('') + '</ul>';
  if (b.startsWith('> ')) return `<blockquote><p>${inline(b.replace(/^> ?/gm, ' ').trim())}</p></blockquote>`;
  return `<p>${inline(b)}</p>`;
}).join('\n');

// ---- page frame, in the same voices as /now
const head = ({ title, desc, path, depth, type, extra = '' }) => {
  const up = '../'.repeat(depth), url = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Harshita Shyale</title>
<link rel="canonical" href="${url}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Harshita Shyale">
<meta property="og:title" content="${esc(title)} — Harshita Shyale">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} — Harshita Shyale">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/og.jpg">
<meta name="description" content="${esc(desc)}">${extra}
<script>try{document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,400;0,700;1,400&family=Schibsted+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<link rel="preload" href="${up}assets/fonts/DepartureMono-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}css/writing.css">
<script src="${up}js/stats.js" async></script>
</head>`;
};
const count = n => n === 0 ? '' : n === 1 ? '1 later note' : n + ' later notes';

const postPage = (p, i) => {
  const others = posts.filter(o => o.slug !== p.slug);
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.summary, datePublished: p.date,
    dateModified: [p.date, ...p.notes.map(n => n.date)].sort().pop(), author: { '@type': 'Person', name: 'Harshita Shyale', url: SITE + '/' }, mainEntityOfPage: SITE + '/writing/' + p.slug + '/' };
  const mail = `mailto:${config.email}?subject=${encodeURIComponent('Re: ' + p.title)}`;
  return head({ title: p.title, desc: p.summary, path: `/writing/${p.slug}/`, depth: 2, type: 'article', extra: `\n<script type="application/ld+json">${JSON.stringify(ld)}</script>` }) + `
<body>
<main class="door writing">
  <nav class="top"><a href="../../">← Harshita Shyale</a><span class="right"><a href="../">writing</a></span></nav>
  <article>
    <header class="intro">
      <p class="lab">writing · <time datetime="${p.date}">${when(p.date)}</time></p>
      <h1>${esc(p.title)}</h1>
    </header>
    <div class="prose">
${render(p.body)}
    </div>
  </article>
  <section class="later" id="later" aria-labelledby="later-h"${p.notes.length ? '' : ' hidden'}>
    <h2 class="lab" id="later-h">later, from me</h2>
    <ol>${p.notes.map(n => `<li><time datetime="${n.date}">${when(n.date)}</time><p>${inline(n.text)}</p></li>`).join('')}</ol>
  </section>
  <section class="talk" id="talk" aria-labelledby="talk-h">
    <h2 class="lab" id="talk-h">leave a comment</h2>
    <p class="talk-note">Say what this made you think of, or where you disagree. I read everything, and I come back to these posts to add what I think now.</p>
    <div id="giscus" data-slug="${p.slug}"></div>
    <p class="talk-fallback" id="talk-fallback"><a href="${mail}">Write to me about this</a> by email.</p>
  </section>
  <nav class="more" aria-label="More writing">${others.length ? '<span class="lab">more</span>' + others.map(o => `<a href="../${o.slug}/">${esc(o.title)}</a>`).join('') : ''}<a href="../">all writing</a></nav>
</main>
<script src="../../js/writing.js"></script>
</body>
</html>
`;
};

const indexPage = () => {
  const desc = 'Notes to myself, in public, dated when I wrote them. I come back to each one later and leave a note underneath.';
  return head({ title: 'Writing', desc, path: '/writing/', depth: 1, type: 'website' }) + `
<body>
<main class="door writing">
  <nav class="top"><a href="../">← Harshita Shyale</a><span class="right"></span></nav>
  <header class="intro">
    <p class="lab">writing</p>
    <h1>Notes to myself, in public</h1>
    <p>Each one is dated when I wrote it. Later I come back, reread it, and leave a note underneath saying what I think now. You can leave a comment too.</p>
  </header>
  <ol class="rows">
${posts.map((p, i) => `    <li class="row" style="--i:${i}"><time class="when" datetime="${p.date}">${when(p.date)}</time><div class="say"><a class="title" href="${p.slug}/">${esc(p.title)}</a><p class="text">${esc(p.summary)}</p></div><span class="kind">${count(p.notes.length)}</span></li>`).join('\n')}
  </ol>
</main>
</body>
</html>
`;
};

write('writing/index.html', indexPage());
posts.forEach((p, i) => write(`writing/${p.slug}/index.html`, postPage(p, i)));

// ---- keep the writing urls in the sitemap
const day = new Date().toISOString().slice(0, 10);
let sm = read('sitemap.xml').replace(/\s*<url><loc>https:\/\/harshitashyale\.com\/writing\/[^<]*<\/loc>.*?<\/url>/g, '');
const urls = [['/writing/', day], ...posts.map(p => [`/writing/${p.slug}/`, [p.date, ...p.notes.map(n => n.date)].sort().pop()])];
sm = sm.replace('</urlset>', urls.map(([u, d]) => `  <url><loc>${SITE}${u}</loc><lastmod>${d}</lastmod></url>\n`).join('') + '</urlset>');
write('sitemap.xml', sm);
console.log(`built ${posts.length} posts: ${posts.map(p => p.slug).join(', ')}`);
