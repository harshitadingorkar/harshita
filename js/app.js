(() => {
const S = window.SITE, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v); } for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
const body = document.body, plane = $('#plane'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth <= 760;
const A = f => 'assets/' + f;
const DATA = { arena: null, films: null, cases: null };
const load = (k, u) => fetch(u).then(r => r.ok ? r.json() : null).then(d => (DATA[k] = d)).catch(() => null);
const ready = Promise.all([load('arena', 'data/arena.json'), load('films', 'data/films.json'), load('cases', 'data/cases.json')]).then(() => {
  if (Array.isArray(DATA.arena)) DATA.arena = { channels: DATA.arena };
  if (DATA.arena) DATA.arena.channels.forEach(c => c.blocks.forEach(b => { if (b.image && b.local && !b.image.local) b.image.local = b.local; }));
  if (Array.isArray(DATA.films)) DATA.films = DATA.films.map(x => { const po = x.poster && typeof x.poster === 'object' ? x.poster : { url: x.poster }; return { title: x.filmTitle || x.title, year: x.filmYear || x.year, rating: x.memberRating ?? x.rating, watched: x.watchedDate || x.watched, link: x.link, poster: po.url, local: po.local || x.local }; }).filter(x => x.title && (x.poster || x.local));
});

/* ---------- chrome ---------- */
$('#tagline').textContent = S.person.line;
$('#mailLink').href = 'mailto:' + S.person.email;
$('#flex').append(h('a', { href: S.person.letterboxd, target: '_blank', rel: 'noopener' }, 'the first harshita on letterboxd ↗'));
const clock = () => { const f = tz => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).toLowerCase(); $('#clock').innerHTML = `seattle <b>${f('America/Los_Angeles')}</b> · you, <b>${f()}</b>`; };
clock(); setInterval(clock, 15000);

/* ---------- filters (Ainsley-style word list) ---------- */
const fwrap = $('#filters'); let active = null;
const count = k => S.points.filter(p => p.tags.includes(k)).length;
S.filters.forEach(([k, label]) => fwrap.append(h('button', { 'data-k': k, onmouseenter: () => preview(k), onmouseleave: () => preview(active), onfocus: () => preview(k), onblur: () => preview(active), onclick: () => setFilter(active === k ? null : k) }, label, h('sup', {}, String(count(k))))));
fwrap.append(h('button', { class: 'clear', onclick: () => setFilter(null) }, 'show everything'));
function preview(k) { $$('.pt').forEach(e => { const on = k && e._p.tags.includes(k); e.classList.toggle('match', !!on); e.classList.toggle('mute', !!k && !on); }); }
function setFilter(k) { active = k; fwrap.classList.toggle('has-active', !!k); $$('button[data-k]', fwrap).forEach(b => b.classList.toggle('on', b.dataset.k === k)); preview(k); renderIndex(); }

/* ---------- plane ---------- */
const MARK = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${[0, 60, 120, 180, 240, 300].map(r => `<path transform="rotate(${r} 50 50)" d="M50 50 C 44 36, 40 22, 50 14 C 60 22, 56 36, 50 50"/>`).join('')}<circle cx="50" cy="50" r="2.4" fill="currentColor" stroke="none"/></g></svg>`;
function buildPlane() {
  plane.innerHTML = '';
  if (mobile()) return buildMobile();
  plane.append(h('div', { class: 'axis h' }), h('div', { class: 'axis v' }), h('div', { class: 'ticks', id: 'ticks' }));
  for (const [side, w] of [['top', 'wonder'], ['bottom', 'work'], ['left', 'gather'], ['right', 'make']]) plane.append(h('div', { class: 'alabel ' + side, tabindex: 0 }, w, h('small', {}, S.axes[w].gloss)));
  for (const [q, d] of Object.entries(S.quads)) plane.append(h('div', { class: 'qlabel q-' + q, html: `[ <span>${d.key}</span>: ${d.name} ]` }));
  const mark = h('button', { class: 'mark', 'aria-label': 'A note from Harshita', html: MARK + '<span class="hint">(hello)</span>', onclick: () => openAbout() });
  plane.append(mark);
  S.points.forEach(p => { const e = h('button', { class: 'pt' + (p.x > 0.55 ? ' left' : ''), 'data-kind': p.kind, 'aria-label': `${p.title}, ${p.meta}` }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, p.title, h('em', {}, p.year || ''))); e._p = p; bindPoint(e); plane.append(e); });
  layout(); preview(active);
}
function layout() {
  if (mobile()) return;
  const W = innerWidth, H = innerHeight, mx = Math.max(150, W * .14), my = Math.max(84, H * .12);
  const r = document.documentElement.style; r.setProperty('--ax-l', '64px'); r.setProperty('--ax-r', '64px'); r.setProperty('--ax-t', '56px'); r.setProperty('--ax-b', '56px');
  const cx = W / 2, cy = H / 2, sx = cx - mx - 60, sy = cy - my;
  $$('.pt').forEach(e => { e.style.left = (cx + e._p.x * sx) + 'px'; e.style.top = (cy - e._p.y * sy) + 'px'; });
  const off = 28; const ql = { tl: [cx - off, cy - off, 'right', 'bottom'], tr: [cx + off, cy - off, 'left', 'bottom'], bl: [cx - off, cy + off, 'right', 'top'], br: [cx + off, cy + off, 'left', 'top'] };
  for (const [q, [x, y, ax, ay]] of Object.entries(ql)) { const e = $('.q-' + q); e.style[ax === 'right' ? 'right' : 'left'] = (ax === 'right' ? W - x : x) + 'px'; e.style[ay === 'bottom' ? 'bottom' : 'top'] = (ay === 'bottom' ? H - y : y) + 'px'; }
  const t = $('#ticks'); t.innerHTML = ''; const step = 48;
  for (let x = cx % step; x < W; x += step) t.append(h('i', { style: `left:${x}px;top:${cy - 3}px;width:1px;height:7px` }));
  for (let y = cy % step; y < H; y += step) t.append(h('i', { style: `top:${y}px;left:${cx - 3}px;height:1px;width:7px` }));
}
function buildMobile() {
  plane.append(h('button', { class: 'mark', 'aria-label': 'A note from Harshita', html: MARK, onclick: () => openAbout() }));
  for (const [q, d] of Object.entries(S.quads)) { const g = h('section', { class: 'mgroup' }, h('h2', {}, `[ ${d.key}: ${d.name} ]`)); S.points.filter(p => p.quad === q).forEach(p => { const e = h('button', { class: 'pt', 'data-kind': p.kind }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, p.title, h('em', {}, p.meta))); e._p = p; e.onclick = () => open(p); g.append(e); }); plane.append(g); }
  preview(active);
}

/* ---------- spatial state: the interface changes with where you stand ---------- */
let mx = innerWidth / 2, my = innerHeight / 2, wonder = .5, make = .5, quad = '';
addEventListener('pointermove', e => {
  mx = e.clientX; my = e.clientY; if (mobile() || sheetOpen) return;
  wonder = 1 - my / innerHeight; make = mx / innerWidth;
  const r = document.documentElement.style; r.setProperty('--wonder', wonder.toFixed(3)); r.setProperty('--make', make.toFixed(3));
  const q = (wonder > .5 ? 't' : 'b') + (make > .5 ? 'r' : 'l');
  if (q !== quad) { quad = q; body.dataset.quad = q; body.dataset.half = wonder > .5 ? 'wonder' : 'work'; $$('#minimap button').forEach(b => b.classList.toggle('here', b.dataset.q === q)); }
}, { passive: true });
const mm = $('#minimap'); ['tl', 'tr', 'bl', 'br'].forEach(q => mm.append(h('button', { 'data-q': q, 'aria-label': S.quads[q].key + ': ' + S.quads[q].name, title: S.quads[q].name, onclick: () => { setFilter(null); const pts = S.points.filter(p => p.quad === q); $$('.pt').forEach(e => { const on = e._p.quad === q; e.classList.toggle('match', on); e.classList.toggle('mute', !on); }); clearTimeout(mm._t); mm._t = setTimeout(() => preview(active), 1600); } })));

/* grain: still in work, vibrating in wonder */
const gc = $('#grain'); let frames = [], fi = 0, lastG = 0;
(function makeGrain() { const c = document.createElement('canvas'), s = 180; c.width = c.height = s; const x = c.getContext('2d'); for (let f = 0; f < 6; f++) { const d = x.createImageData(s, s); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); frames.push(`url(${c.toDataURL()})`); } gc.style.backgroundImage = frames[0]; })();
function tickGrain(t) {
  if (!RM && !document.hidden) { const w = Math.max(0, (wonder - .5) * 2); const iv = w > .02 ? 260 - w * 210 : Infinity; if (t - lastG > iv) { lastG = t; fi = (fi + 1) % frames.length; gc.style.backgroundImage = frames[fi]; gc.style.backgroundPosition = `${Math.random() * 180 | 0}px ${Math.random() * 180 | 0}px`; } }
  // spin follows the same idea: slow in work, livelier in wonder
  const mk = $('.mark svg'); if (mk) mk.style.animationDuration = (90 - wonder * 60) + 's';
  // label pill lerp
  px += (mx - px) * .2; py += (my - py) * .2; pill.style.transform = `translate3d(${px + 16}px, ${py + 14}px, 0)`;
  requestAnimationFrame(tickGrain);
}
const pill = $('#pill'), plate = $('#plate'); let px = mx, py = my;
requestAnimationFrame(tickGrain);

/* ---------- hover: Ainsley's big plate + dmcg's cursor label ---------- */
function plateFor(p) {
  if (p.kind === 'archive' && DATA.arena) { const imgs = DATA.arena.channels.flatMap(c => c.blocks).filter(b => b.image).slice(0, 12); return h('div', { class: 'tiles' }, imgs.map(b => h('img', { src: b.image.local || b.image.thumb, alt: '' }))); }
  if (p.kind === 'films' && DATA.films) return h('div', { class: 'tiles' }, DATA.films.slice(0, 8).map(f => h('img', { src: f.local || f.poster, alt: '', style: 'height:138px' })));
  if (p.kind === 'room' && p.room === 'odds') return h('div', { class: 'tiles' }, S.odds.slice(0, 8).map(f => h('img', { src: A(f), alt: '' })));
  if (p.img) return h('img', { src: A(p.img), alt: '' });
  return null;
}
function bindPoint(e) {
  const p = e._p;
  e.addEventListener('mouseenter', () => { if (sheetOpen) return; const c = plateFor(p); plate.replaceChildren(...(c ? [c] : [])); requestAnimationFrame(() => plate.classList.toggle('on', !!c && !sheetOpen)); pill.innerHTML = `${p.title}<span class="k">${p.org}</span>`; pill.classList.add('on'); });
  e.addEventListener('mouseleave', () => { plate.classList.remove('on'); pill.classList.remove('on'); });
  e.addEventListener('click', () => open(p));
}

/* ---------- sheet ---------- */
const sheet = $('#sheet'), veil = $('#veil'); let sheetOpen = false, lastFocus = null;
function openSheet(quadKey, kicker, title, ...content) {
  plate.classList.remove('on'); pill.classList.remove('on');
  lastFocus = document.activeElement; sheet.dataset.quad = quadKey || '';
  sheet.replaceChildren(h('div', { class: 'close' }, h('span', { class: 'mono dim' }, kicker), h('button', { class: 'mono', onclick: closeSheet, 'aria-label': 'Close' }, 'close ×')), h('div', { class: 'body' }, h('h2', { class: 's-title' }, title), ...content));
  sheet.scrollTop = 0; sheetOpen = true; sheet.classList.add('on'); veil.classList.add('on'); sheet.focus({ preventScroll: true });
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { root: sheet, threshold: .15 });
  $$('.reveal,.crop', sheet).forEach((el, i) => { el.style.transitionDelay = Math.min(i, 6) * 40 + 'ms'; io.observe(el); });
}
function closeSheet() { sheetOpen = false; sheet.classList.remove('on'); veil.classList.remove('on'); lastFocus && lastFocus.focus({ preventScroll: true }); }
veil.onclick = closeSheet;
addEventListener('keydown', e => { if (e.key === 'Escape') { if (sheetOpen) closeSheet(); else if (body.classList.contains('show-index')) toggleIndex(false); } });
const kick = p => `[ ${S.quads[p.quad].key}: ${S.quads[p.quad].name} ]`;
const metaList = rows => h('dl', { class: 's-meta' }, rows.filter(r => r[1]).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]));
const caseHTML = id => DATA.cases && DATA.cases[id] ? h('div', { class: 'prose reveal', html: DATA.cases[id].html }) : null;

function open(p) {
  const K = kick(p), line = h('p', { class: 's-line reveal' }, p.line);
  if (p.kind === 'vault') return openSheet('bl', K, p.title, line, metaList([['where', p.org], ['when', p.year], ['tags', p.tags.join(' · ')]]), diagram(p.id), caseHTML(p.case), p.images ? h('div', { class: 's-imgs' }, p.images.map(f => h('img', { class: 'reveal', src: A(f), alt: p.alt || '', loading: 'lazy' }))) : null);
  if (p.kind === 'shipped') return openSheet('br', K, p.title, line, metaList([['where', p.org], ['when', p.meta.split('·')[1]?.trim()], ['tags', p.tags.join(' · ')]]), crops(p), caseHTML(p.case));
  if (p.kind === 'archive') return ready.then(() => openArena(K));
  if (p.kind === 'films') return ready.then(() => openFilms(K));
  if (p.kind === 'paper') return openSheet('tl', K, p.title, line, h('img', { class: 'reveal', src: A(p.img), alt: p.alt, style: 'width:100%;margin-top:26px' }), h('p', { class: 'reveal', style: 'margin-top:22px' }, h('a', { href: p.href, class: 'serif', style: 'font-size:22px;font-style:italic;border-bottom:1px solid currentColor' }, 'read it, like a book →')));
  if (p.kind === 'room' && p.room === 'theatre') return openSheet('tr', K, p.title, line, h('div', { class: 'gallery' }, S.theatre.map(([f, ar, c]) => h('figure', { class: 'reveal', style: ar > 1.8 ? 'grid-column:1/-1' : '' }, h('img', { src: A(f), alt: c || 'A photograph from one of her plays', loading: 'lazy' }), c ? h('figcaption', {}, c) : null))));
  if (p.kind === 'room') return openSheet('tl', K, p.title, line, h('p', { class: 'credit' }, 'visual notes, kept since college.'), h('div', { class: 'masonry' }, S.odds.map(f => h('div', { class: 'blk reveal' }, h('img', { src: A(f), alt: 'A visual note', loading: 'lazy' })))));
  if (p.kind === 'clay') return openClay(p, K, line);
  if (p.kind === 'toy') return openPlayground(K, line);
}

/* vault diagrams — razor-thin, drawn in */
function diagram(id) {
  const D = {
    influence: { h: 300, nodes: [['calls', 40, 50], ['emails', 40, 130], ['meetings', 40, 210], ['the deal', 260, 130, 1], ['champion', 470, 50], ['buyer', 500, 130], ['blocker', 470, 210]], edges: [[0, 3], [1, 3], [2, 3], [3, 4, 1], [3, 5], [3, 6, 0, 1]], note: 'sketch: the signal was already in the data she was given — the work was reading it.' },
    sony: { h: 220, nodes: [['purchase', 40, 100], ['after the purchase', 250, 100, 1], ['Sonia asks first', 470, 40], ['your data', 470, 160]], edges: [[0, 1], [1, 2, 1], [2, 3, 0, 1]], note: 'the territory: everything after the box is opened.' },
    safe: { h: 220, nodes: [['booking', 40, 60], ['the room', 40, 160], ['the exam', 260, 110, 1], ['feeling safe', 480, 110]], edges: [[0, 2], [1, 2], [2, 3, 1]], note: 'two places care can fail before the exam begins: the form and the room.' },
  }[id]; if (!D) return null;
  const W = 600, s = (t, x, y, a) => `<g><rect style="fill:var(--ground)" x="${x - 6}" y="${y - 13}" width="${t.length * 6.6 + 14}" height="22" ${a ? 'class="acc" stroke="#23389A"' : ''}/><text x="${x + 1}" y="${y + 2}">${t}</text></g>`;
  const mid = n => [n[1] + n[0].length * 3.3 + 1, n[2] - 2];
  const edges = D.edges.map(([a, b, acc, dash], i) => { const [x1, y1] = mid(D.nodes[a]), [x2, y2] = mid(D.nodes[b]); const len = Math.hypot(x2 - x1, y2 - y1) + 80; const mx2 = (x1 + x2) / 2; return `<path class="draw ${dash ? 'dash' : ''}" style="--len:${len};--d:${i * .08}s;${acc ? 'stroke:var(--co)' : ''}" d="M${x1} ${y1} C ${mx2} ${y1}, ${mx2} ${y2}, ${x2} ${y2}"/>`; }).join('');
  return h('figure', { class: 'reveal' }, h('div', { html: `<svg class="diagram" viewBox="0 0 ${W} ${D.h}" role="img" aria-label="${D.note}">${edges}${D.nodes.map(n => s(n[0], n[1], n[2], n[3])).join('')}</svg>` }), h('figcaption', { class: 'mono dim' }, D.note));
}

/* shipped — atomic crops, annotated */
const CROPS = {
  github: [{ f: 'github.jpg', z: 1.6, o: '30% 45%', a: [['22%', '30%', 'file tree']], cap: 'the pull request, cropped to the review' }],
  hpe: [{ f: 'hpe.jpg', z: 1.5, o: '50% 40%', a: [['20%', '24%', 'drift, before it hurts']], cap: 'model performance and drift' }],
};
function crops(p) {
  const list = CROPS[p.id] || [];
  const extra = (p.images || []).slice(1).map(f => h('img', { class: 'reveal', src: A(f), alt: p.alt || '', loading: 'lazy' }));
  return h('div', {}, list.map(c => h('div', {}, h('div', { class: 'crop', style: `--z:${c.z};--ox-o:${c.o}`, onclick: e => e.currentTarget.classList.toggle('zoom') }, h('img', { src: A(c.f), alt: p.alt || '' }), c.a.map(([l, t, txt]) => h('span', { class: 'anno', style: `left:${l};top:${t}` }, h('b', {}, txt)))), h('div', { class: 'cropcap' }, h('span', {}, c.cap), h('span', {}, 'click to zoom out')))), h('div', { class: 's-imgs' }, extra));
}

/* are.na */
function openArena(K) {
  const a = DATA.arena; const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase() : '';
  const grid = h('div', { class: 'masonry' }); let ch = null;
  const draw = () => { grid.replaceChildren(...(a ? a.channels.filter(c => !ch || c.slug === ch).flatMap(c => c.blocks.filter(b => b.image).map(b => h('a', { class: 'blk', href: c.url, target: '_blank', rel: 'noopener', title: `open “${c.title}” on are.na` }, h('img', { src: b.image.local || b.image.display || b.image.thumb, alt: b.title || '', loading: 'lazy' }), h('span', { class: 'tag' }, c.title + (b.connected_at || b.created_at ? ' · clipped ' + fmt(b.connected_at || b.created_at) : ''))))) : [h('p', { class: 'dim' }, 'loading the archive…')])); };
  const chans = h('div', { class: 'channels mono' }, h('button', { class: 'on', onclick: e => { ch = null; mark(e); } }, 'all'), (a ? a.channels : []).map(c => h('button', { onclick: e => { ch = c.slug; mark(e); } }, c.title)));
  const mark = e => { $$('button', chans).forEach(b => b.classList.toggle('on', b === e.currentTarget)); draw(); };
  draw();
  openSheet('tl', K, 'visual research & archives', h('p', { class: 'credit reveal' }, 'An index of curated imagery, references, and design artifacts streamed from my public Are.na channels. All rights remain with the original creators.'), chans, grid, h('p', { class: 'mono', style: 'margin-top:20px' }, h('a', { href: S.person.arena, target: '_blank', rel: 'noopener', style: 'color:var(--ox)' }, 'are.na/harshita-shyale ↗')));
}
function openFilms(K) {
  const f = DATA.films || []; const stars = r => r ? '★'.repeat(Math.floor(r)) + (r % 1 ? '½' : '') : '';
  openSheet('tl', K, 'Films', h('p', { class: 's-line reveal' }, 'she got letterboxd.com/harshita — the very first Harshita there. this is what she’s been watching.'), h('div', { class: 'films' }, f.slice(0, 36).map(x => h('a', { class: 'film reveal', href: x.link, target: '_blank', rel: 'noopener' }, h('img', { src: x.local || x.poster, alt: `${x.title} poster`, loading: 'lazy' }), h('div', { class: 't' }, x.title, ' ', h('span', { class: 'dim' }, x.year || '')), h('div', { class: 'r' }, stars(+x.rating) || (x.watched ? 'watched ' + x.watched.slice(5).replace('-', '/') : ''))))));
}
function openClay(p, K, line) {
  const cs = h('div', { class: 'contact-sheet', 'aria-label': 'Drag across to turn the bowl' }, h('img', { src: A(p.images[0]), alt: p.alt }));
  const frames = p.images; cs.addEventListener('pointermove', e => { const r = cs.getBoundingClientRect(); const i = Math.min(frames.length - 1, Math.floor((e.clientX - r.left) / r.width * frames.length)); cs.firstChild.src = A(frames[i]); });
  openSheet('tr', K, p.title, line, cs, h('p', { class: 'mono dim', style: 'margin-top:8px' }, 'move across the image to turn him around'), h('img', { class: 'reveal', src: A(p.sheet), alt: 'contact sheet', style: 'width:100%;margin-top:22px' }));
}

/* playground: the UI is the work */
function openPlayground(K, line) {
  const stage = h('div', { class: 'stage' }); ['make', 'gather', 'wonder', 'work', 'oxblood', 'cobalt', '1px', 'ease-out'].forEach((t, i) => { const c = h('span', { class: 'chip', style: `left:${10 + (i % 4) * 23}%;top:${20 + Math.floor(i / 4) * 45}%` }, t); drag(c, stage); stage.append(c); });
  const root = document.documentElement.style;
  const knob = (label, min, max, step, val, unit, fn) => { const o = h('output', {}, val + unit); const i = h('input', { type: 'range', min, max, step, value: val, oninput: e => { o.textContent = e.target.value + unit; fn(+e.target.value); } }); return h('label', { class: 'knob' }, label, i, o); };
  const theme = h('button', { class: 'mono', style: 'border-bottom:1px solid currentColor', onclick: () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? '' : 'dark'; } }, 'toggle light / dark');
  const code = h('div', { class: 'code', html: `.mark {\n  --spin: <span contenteditable="true" data-v="spin">60</span>s;\n  --size: <span contenteditable="true" data-v="size">68</span>px;\n}` });
  code.addEventListener('input', e => { const v = parseFloat(e.target.textContent); if (isNaN(v)) return; const m = $('.mark'); if (e.target.dataset.v === 'size' && m) { m.style.width = m.style.height = v + 'px'; m.style.margin = `${-v / 2}px 0 0 ${-v / 2}px`; } if (e.target.dataset.v === 'spin' && m) m.querySelector('svg').style.animationDuration = v + 's'; });
  openSheet('tr', K, 'The playground', line,
    h('div', { class: 'toys' },
      h('div', { class: 'toy reveal' }, h('h4', {}, '01 — drag the vocabulary'), stage),
      h('div', { class: 'toy reveal' }, h('h4', {}, '02 — tune the room'), knob('grain', 0, 20, 1, 7, '%', v => $('#grain').style.opacity = v / 100), knob('hairline', .05, .5, .01, .14, '', v => root.setProperty('--hair', `rgba(25,25,21,${v})`)), theme),
      h('div', { class: 'toy reveal' }, h('h4', {}, '03 — edit the code, watch the mark'), code)));
}
function drag(el, bounds) {
  let sx, sy, ox, oy, vx = 0, vy = 0, lx, ly, raf;
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); cancelAnimationFrame(raf); const r = el.getBoundingClientRect(), b = bounds.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left - b.left; oy = r.top - b.top; lx = sx; ly = sy; el.style.transition = 'box-shadow .2s'; el.style.boxShadow = '0 0 0 1px var(--accent),0 18px 30px -16px rgba(0,0,0,.45)'; });
  el.addEventListener('pointermove', e => { if (!el.hasPointerCapture(e.pointerId)) return; vx = e.clientX - lx; vy = e.clientY - ly; lx = e.clientX; ly = e.clientY; el.style.left = ox + e.clientX - sx + 'px'; el.style.top = oy + e.clientY - sy + 'px'; el.style.transform = `rotate(${Math.max(-8, Math.min(8, vx * .6))}deg)`; });
  el.addEventListener('pointerup', () => { el.style.boxShadow = ''; const b = bounds.getBoundingClientRect(); const step = () => { vx *= .92; vy *= .92; let x = el.offsetLeft + vx, y = el.offsetTop + vy; const mxx = b.width - el.offsetWidth, myy = b.height - el.offsetHeight; if (x < 0 || x > mxx) { vx *= -.6; x = Math.max(0, Math.min(mxx, x)); } if (y < 0 || y > myy) { vy *= -.6; y = Math.max(0, Math.min(myy, y)); } el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.transform = `rotate(${vx * .4}deg)`; if (Math.abs(vx) + Math.abs(vy) > .2) raf = requestAnimationFrame(step); else el.style.transform = ''; }; raf = requestAnimationFrame(step); });
}

/* about */
function openAbout() {
  openSheet('', 'a note from harshita', 'Hello.', h('div', { class: 'prose' }, S.about.map(t => h('p', { class: 'reveal' }, t)), h('h4', {}, 'what i care about'), h('ul', { class: 'reveal' }, S.values.map(v => h('li', {}, v))), h('h4', {}, 'where i’ve been')), h('div', { class: 'exp reveal' }, S.experience.flatMap(([r, o, w]) => [h('div', {}, r, ' ', h('span', { class: 'o' }, '· ' + o)), h('div', { class: 'w' }, w)])), h('p', { class: 'mono reveal', style: 'margin-top:30px;display:flex;gap:16px;flex-wrap:wrap' }, h('a', { href: 'mailto:' + S.person.email }, S.person.email), h('a', { href: S.person.linkedin, target: '_blank', rel: 'noopener' }, 'linkedin ↗'), h('a', { href: S.person.resume, target: '_blank', rel: 'noopener' }, 'résumé ↗')));
}
$('#aboutBtn').onclick = openAbout;

/* index: the recruiter's fast path */
let sortKey = 'quad', sortDir = 1;
const qOrder = { br: 0, bl: 1, tr: 2, tl: 3 };
function renderIndex() {
  const cols = [['title', 'title'], ['org', 'where'], ['year', 'year'], ['quad', 'quarter'], ['tags', 'tags']];
  const rows = S.points.filter(p => !active || p.tags.includes(active)).sort((a, b) => { const v = k => k === 'quad' ? qOrder[a.quad] - qOrder[b.quad] : String(a[k]).localeCompare(String(b[k])); return v(sortKey) * sortDir; });
  $('#index').replaceChildren(h('table', { class: 'itable' }, h('thead', {}, h('tr', {}, cols.map(([k, l]) => h('th', { class: k === sortKey ? 'sorted' : '', onclick: () => { sortDir = sortKey === k ? -sortDir : 1; sortKey = k; renderIndex(); } }, l + (k === sortKey ? (sortDir > 0 ? ' ↓' : ' ↑') : ''))))), h('tbody', {}, rows.map(p => h('tr', { class: 'row', tabindex: 0, onclick: () => open(p), onkeydown: e => e.key === 'Enter' && open(p) }, h('td', { class: 't' }, p.title), h('td', { class: 'm' }, p.org), h('td', { class: 'm' }, p.year), h('td', { class: 'm' }, S.quads[p.quad].name), h('td', { class: 'm' }, p.tags.join(', ')))))));
}
function toggleIndex(on) { body.classList.toggle('show-index', on); $('#indexBtn').classList.toggle('on', on); $('#indexBtn').textContent = on ? 'map' : 'index'; plate.classList.remove('on'); pill.classList.remove('on'); }
$('#indexBtn').onclick = () => toggleIndex(!body.classList.contains('show-index'));
$('#home').onclick = e => { e.preventDefault(); toggleIndex(false); closeSheet(); setFilter(null); };

/* boot */
buildPlane(); renderIndex();
let lastMobile = mobile(); addEventListener('resize', () => { if (mobile() !== lastMobile) { lastMobile = mobile(); buildPlane(); } else layout(); });
const intro = $('#intro'); if (sessionStorage.getItem('seen') || RM) intro.remove(); else { sessionStorage.setItem('seen', 1); setTimeout(() => intro.classList.add('done'), 600); setTimeout(() => intro.remove(), 2400); }
ready.then(() => {});
})();
