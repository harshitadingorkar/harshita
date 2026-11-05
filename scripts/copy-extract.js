// Collects every piece of visible copy into .artifact/copy/blocks.json for the copy editor.
// Each block has a key that says where it lives, so edits can be written back.
global.window = {};
require('../js/content.js');
const fs = require('fs'), S = window.SITE, short = JSON.parse(fs.readFileSync('data/short.json', 'utf8'));
const col = fs.readFileSync('js/collection.js', 'utf8'), app = fs.readFileSync('js/app.js', 'utf8'), door = fs.readFileSync('now/index.html', 'utf8');
const pages = [], P = id => S.points.find(p => p.id === id);
let cur;
const page = (id, title, note) => { cur = { id, title, note, blocks: [] }; pages.push(cur); };
const b = (k, label, text, kind = 'para') => { if (text && typeof text === 'string') cur.blocks.push({ k, label, text: text.replace(/<\/?b>/g, ''), kind }); };
const strip = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const ui = (k, label, re) => { const m = app.match(re); if (m) b(k, label, m[1]); };

page('work', 'Work page', 'The page recruiters land on.');
b('profile.kicker', 'Small line above the headline', S.profile.kicker, 'line');
b('person.now', 'Opening, what I’m on now', S.person.now, 'title');
b('person.usually', 'Opening, how I usually work', S.person.usually, 'line');
b('person.before', 'Opening, before', S.person.before, 'line');
b('person.index', 'Line under the opening', S.person.index, 'line');
ui('ui.selected', 'Section title', /h\('p', \{ class: 'wk-lab' \}, '(Selected work)'\)/);
for (const id of ['influence', 'github', 'sony', 'safe', 'hpe']) b(`points.${id}.card`, `${P(id).title}, card (situation, my part, outcome)`, P(id).card || P(id).line);
ui('ui.offClock', 'Off the clock line', /'(Theatre, films, clay, and collections[^']*)'/);
ui('ui.kinSummary', 'Archive link', /h\('summary', \{\}, '([^']+)'\)/);

page('map', 'Map', 'The exploratory view, and the words that appear when you hover a dot.');
b('person.index', 'Line under your name', S.person.index, 'line');
for (const p of S.points.filter(p => p.type !== 'work')) { b(`points.${p.id}.line`, `${p.title}, hover line`, p.line); if (p.hint) b(`points.${p.id}.hint`, `${p.title}, hover subtitle`, p.hint, 'line'); }
for (const p of S.points.filter(p => p.type === 'work' && p.hint)) b(`points.${p.id}.hint`, `${p.title}, hover subtitle`, p.hint, 'line');

page('about', 'About', 'Opens when someone clicks your name.');
b('profile.lede', 'Opening line', S.profile.lede, 'title');
S.profile.about.forEach((t, i) => b(`profile.about.${i}`, `Paragraph ${i + 1}`, t));
b('profile.photo.2', 'Photo caption (on hover)', S.profile.photo[2], 'line');
for (const [sec, name] of [['work', 'Work'], ['clients', 'Client work'], ['education', 'Education']]) S.profile[sec].forEach((r, i) => { b(`profile.${sec}.${i}.role`, `${name}: ${r.org}, role`, r.role, 'line'); b(`profile.${sec}.${i}.text`, `${name}: ${r.org}`, r.text); });
b('profile.agents', 'Note on “agents” (hover)', S.profile.agents);

const inf = P('influence'), st = inf.study;
page('influence', 'Influence Graph', 'Under NDA, so this one is a peek.');
b('points.influence.title', 'Title', inf.title, 'title');
b('points.influence.line', 'Line under the title', inf.line);
b('points.influence.vcap', 'Film description (screen readers)', inf.vcap);
b('study.problem.title', 'Problem heading', st.problem.title, 'title');
st.problem.body.forEach((t, i) => b(`study.problem.body.${i}`, 'The problem', t));
b('study.part', 'My part', st.part);
st.moments.forEach((m, i) => { b(`study.moments.${i}.title`, `Moment ${i + 1}, title`, m.title, 'line'); b(`study.moments.${i}.solves`, `Moment ${i + 1}, line`, m.solves); });
b('points.influence.nda', 'NDA close', inf.nda);

for (const [id, cs] of [['github', 'github'], ['safe', 'safe']]) {
  const p = P(id), c = short[cs];
  page(id, p.title, id === 'safe' ? 'Has a content note at the top.' : '');
  b(`points.${id}.title`, 'Title', p.title, 'title');
  b(`points.${id}.line`, 'Line under the title', p.line);
  if (p.credit) b(`points.${id}.credit`, 'Film credit', p.credit, 'line');
  b(`short.${cs}.facts`, 'Facts line', c.facts, 'line');
  if (c.note) b(`short.${cs}.note`, 'Content note', c.note, 'line');
  b(`short.${cs}.q`, 'The question', c.q, 'title');
  b(`short.${cs}.problem`, 'The problem', c.problem);
  if (c.numbers) c.numbers.forEach(([n, l], i) => b(`short.${cs}.numbers.${i}.1`, `Number ${n}, label`, l, 'line'));
  if (c.quote) b(`short.${cs}.quote.t`, 'Quote', c.quote.t);
  if (c.research) b(`short.${cs}.research.t`, 'Research', c.research.t);
  c.steps.forEach((s, i) => { b(`short.${cs}.steps.${i}.t`, `Step ${i + 1}, title`, s.t, 'line'); b(`short.${cs}.steps.${i}.d`, `Step ${i + 1}`, s.d); });
  b(`short.${cs}.learned`, 'What it taught me', c.learned);
  if (c.closing && c.closing.cap) b(`short.${cs}.closing.cap`, 'Closing caption', c.closing.cap, 'line');
}
const sony = P('sony');
page('sony', sony.title, 'Sony capstone.');
b('points.sony.title', 'Title', sony.title, 'title');
b('points.sony.line', 'Line under the title', sony.line);
b('points.sony.alt', 'Image description', sony.alt);
const hpe = P('hpe');
page('hpe', hpe.title, 'A short note, not a full case.');
b('points.hpe.title', 'Title', hpe.title, 'title');
b('points.hpe.line', 'Line under the title', hpe.line);
hpe.brief.forEach((t, i) => b(`points.hpe.brief.${i}`, `Paragraph ${i + 1}`, t));
b('points.hpe.nda', 'NDA note', hpe.nda);

page('theatre', 'Theatre', 'The theatre wall’s side panel.');
const intro = [...col.matchAll(/\['(Before design[^\n]*?|In Seattle I started[^\n]*?)'\]/g)];
const flat = line => line.replace(/\['([^']+)','[^']+'\]/g, '$1').replace(/', \[?'?|'?\]?, '/g, '').replace(/^\['|'\]$/g, '');
for (const [i, m] of [...col.matchAll(/^    \[('Before design.*|'In Seattle.*)\],?$/gm)].entries()) b(`theatre.intro.${i}`, `Intro, paragraph ${i + 1}`, m[1].replace(/\['([^']+)','[^']+'\]/g, '$1').replace(/', |, '|'/g, ''));
const tr = col.match(/trraammtobb:\{ kicker:'([^']*)', title:'([^']*)', ask:'([^']*)', body:'([^']*)', award:'([^']*)'/);
if (tr) { b('theatre.trraammtobb.kicker', 'TRRAAMMToBB, small line', tr[1], 'line'); b('theatre.trraammtobb.ask', 'TRRAAMMToBB, the question', tr[3], 'title'); b('theatre.trraammtobb.body', 'TRRAAMMToBB, logline', tr[4]); b('theatre.trraammtobb.award', 'TRRAAMMToBB, awards', tr[5], 'line'); }
const sp = col.match(/sips:\{ logo:'[^']*', kicker:'([^']*)', title:'[^']*', body:'([^']*)'/);
if (sp) { b('theatre.sips.kicker', 'Scripts & Sips, small line', sp[1], 'line'); b('theatre.sips.body', 'Scripts & Sips', sp[2]); }

page('collections', 'Collections', 'The side panels of the collection, films and odds & ends walls.');
for (const [id, name] of [['arena', 'Collection'], ['films', 'Films'], ['odds', 'Odds & ends']]) { const m = col.match(new RegExp(`  ${id}: \\{ title:'[^']*', sub:'([^']*)', what:'([^']*)'`)); if (m) { b(`pages.${id}.sub`, `${name}, subtitle`, m[1], 'line'); b(`pages.${id}.what`, `${name}, what this is`, m[2]); } }

page('door', 'Working with the door open', 'Your now page.');
const dh = door.match(/<header class="intro">([\s\S]*?)<\/header>/)[1];
const ps = [...dh.matchAll(/<(p|h1)([^>]*)>([\s\S]*?)<\/\1>/g)];
ps.forEach((m, i) => b(`door.intro.${i}`, i === 0 ? 'Small line' : m[1] === 'h1' ? 'Title' : `Paragraph ${i - 1}`, strip(m[3]), m[1] === 'h1' ? 'title' : i === 0 ? 'line' : 'para'));

page('sharing', 'Search & sharing', 'What Google and link previews show.');
const idx = fs.readFileSync('index.html', 'utf8');
b('meta.title', 'Browser tab and search title', idx.match(/<title>([^<]*)</)[1], 'line');
b('meta.description', 'Search description and link preview', idx.match(/name="description" content="([^"]*)"/)[1]);

fs.writeFileSync('.artifact/copy/blocks.json', JSON.stringify(pages, null, 1));
console.log(pages.map(p => p.id + ':' + p.blocks.length).join(' '));
