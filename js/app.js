(() => {
const S = window.SITE, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v); } for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
const body = document.body, plane = $('#plane'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth <= 760;
const A = f => 'assets/' + f;
const DATA = { arena: null, films: null, cases: null, short: null };
const load = (k, u) => fetch(u).then(r => r.ok ? r.json() : null).then(d => (DATA[k] = d)).catch(() => null);
const ready = Promise.all([load('arena', 'data/arena.json'), load('films', 'data/films.json'), load('cases', 'data/cases.json'), load('short', 'data/short.json')]).then(() => {
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
const MARK = `<svg viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M75.97 27.78L74.61 28.83L73.29 30.02L72.02 31.36L70.81 32.83L69.67 34.43L68.62 36.16L67.68 38.00L66.84 39.95L66.13 41.99L65.55 44.11L65.11 46.30L64.82 48.54L64.69 50.81L64.72 53.10L64.92 55.39L65.28 57.66L65.81 59.89L66.49 62.06L67.33 64.15L68.32 66.15L69.44 68.04L70.69 69.79L72.06 71.41L73.51 72.86L75.05 74.15L76.64 75.26L78.28 76.18L79.94 76.92L81.59 77.47L83.23 77.83L84.83 78.00L86.36 77.99L87.82 77.82L89.19 77.48L90.45 76.98L91.58 76.36L92.58 75.61L93.43 74.75L94.13 73.81L94.67 72.79L95.05 71.72L95.26 70.60L95.31 69.47L95.20 68.33L94.93 67.20L94.51 66.09L93.94 65.02L93.23 63.99L92.39 63.03L91.43 62.14L90.35 61.32L89.17 60.59L87.90 59.95L86.54 59.41L85.10 58.96L83.60 58.63L82.04 58.40L80.43 58.28L78.79 58.27L77.12 58.37L75.43 58.59L73.73 58.92L72.03 59.37L70.33 59.92L68.66 60.59L67.01 61.36L65.40 62.24L63.84 63.22L62.33 64.30L60.89 65.47L59.52 66.72L58.24 68.05L57.05 69.46L55.95 70.92L54.96 72.44L54.09 73.99L53.33 75.58L52.70 77.18L52.18 78.78L51.80 80.37L51.54 81.95L51.40 83.48L51.39 84.97L51.49 86.39L51.71 87.75L52.03 89.01L52.44 90.18L52.95 91.25L53.53 92.20L54.18 93.03L54.89 93.74L55.64 94.31L56.43 94.75L57.24 95.06L58.05 95.24L58.87 95.27L59.67 95.18L60.45 94.96L61.20 94.61L61.91 94.14L62.57 93.55L63.16 92.85L63.69 92.05L64.15 91.15L64.53 90.16L64.82 89.08L65.03 87.92L65.13 86.70L65.14 85.41L65.03 84.07L64.82 82.69L64.50 81.26L64.05 79.81L63.49 78.34L62.80 76.87L61.99 75.39L61.05 73.93L59.98 72.50L58.79 71.11L57.47 69.77L56.03 68.49L54.48 67.29L52.81 66.18L51.04 65.17L49.17 64.28L47.22 63.52L45.19 62.90L43.11 62.42L40.99 62.10L38.83 61.94L36.67 61.95L34.52 62.12L32.39 62.47L30.31 62.98L28.30 63.66L26.37 64.49L24.54 65.47L22.83 66.59L21.26 67.83L19.83 69.17L18.57 70.61L17.47 72.12L16.56 73.69L15.82 75.29L15.28 76.90L14.92 78.51L14.76 80.09L14.77 81.62L14.96 83.08L15.32 84.46L15.84 85.74L16.50 86.90L17.30 87.93L18.21 88.82L19.23 89.56L20.34 90.13L21.51 90.55L22.75 90.79L24.02 90.87L25.31 90.77L26.61 90.51L27.91 90.07L29.18 89.47L30.41 88.72L31.59 87.81L32.72 86.76L33.77 85.57L34.74 84.26L35.62 82.83L36.40 81.29L37.08 79.66L37.64 77.93L38.08 76.14L38.40 74.28L38.58 72.37L38.64 70.43L38.57 68.46L38.36 66.47L38.01 64.49L37.53 62.52L36.92 60.58L36.18 58.67L35.31 56.83L34.32 55.04L33.22 53.34L32.02 51.73L30.71 50.22L29.33 48.82L27.87 47.54L26.34 46.39L24.77 45.37L23.17 44.50L21.55 43.77L19.92 43.18L18.31 42.74L16.72 42.45L15.17 42.29L13.67 42.27L12.25 42.38L10.90 42.61L9.65 42.94L8.50 43.38L7.46 43.91L6.54 44.51L5.74 45.18L5.07 45.90L4.53 46.65L4.12 47.43L3.85 48.22L3.70 49.02L3.68 49.80L3.78 50.56L4.01 51.28L4.34 51.97L4.79 52.61L5.34 53.20L5.98 53.72L6.71 54.17L7.53 54.56L8.43 54.87L9.40 55.09L10.44 55.24L11.53 55.30L12.68 55.27L13.88 55.14L15.13 54.93L16.41 54.61L17.72 54.20L19.05 53.68L20.41 53.06L21.77 52.34L23.14 51.51L24.49 50.56L25.84 49.51L27.15 48.35L28.43 47.08L29.65 45.71L30.82 44.23L31.92 42.66L32.93 41.00L33.85 39.26L34.67 37.44L35.37 35.56L35.95 33.64L36.39 31.67L36.70 29.69L36.87 27.70L36.89 25.72L36.76 23.78L36.49 21.87L36.08 20.03L35.53 18.27L34.84 16.61L34.04 15.06L33.13 13.64L32.12 12.35L31.02 11.22L29.85 10.25L28.64 9.44L27.38 8.81L26.11 8.36L24.84 8.08L23.58 7.99L22.36 8.06L21.19 8.31L20.09 8.73L19.06 9.30L18.13 10.02L17.32 10.87L16.62 11.85L16.04 12.94L15.61 14.13L15.32 15.41L15.18 16.75L15.20 18.15L15.37 19.59L15.70 21.05L16.19 22.53L16.84 24.00L17.65 25.45L18.60 26.87L19.71 28.25L20.96 29.57L22.34 30.81L23.86 31.98L25.49 33.04L27.24 34.00L29.09 34.85L31.03 35.57L33.05 36.16L35.13 36.60L37.27 36.89L39.45 37.04L41.64 37.02L43.85 36.85L46.04 36.52L48.21 36.02L50.33 35.38L52.40 34.57L54.38 33.63L56.28 32.55L58.07 31.34L59.74 30.01L61.28 28.58L62.68 27.07L63.92 25.48L65.00 23.84L65.91 22.17L66.66 20.48L67.23 18.79L67.64 17.12L67.87 15.48L67.95 13.91L67.87 12.41L67.65 10.99L67.29 9.68L66.81 8.49L66.22 7.42L65.54 6.48L64.77 5.69L63.94 5.05L63.06 4.56L62.15 4.22L61.21 4.04L60.28 4.00L59.35 4.11L58.43 4.37L57.56 4.76L56.72 5.27L55.93 5.91L55.21 6.66L54.55 7.52L53.96 8.48L53.45 9.52L53.02 10.64L52.67 11.83L52.41 13.09L52.23 14.40L52.15 15.76L52.16 17.16L52.27 18.59L52.46 20.05L52.76 21.53L53.15 23.03L53.63 24.53L54.22 26.02L54.90 27.51L55.69 28.98L56.57 30.42L57.55 31.83L58.62 33.20L59.79 34.51L61.05 35.76L62.39 36.93L63.82 38.03L65.31 39.03L66.88 39.93L68.50 40.73L70.17 41.41L71.87 41.96L73.59 42.40L75.33 42.70L77.06 42.86L78.78 42.90L80.46 42.80L82.10 42.57L83.68 42.21L85.19 41.74L86.61 41.15L87.93 40.46L89.15 39.67L90.24 38.80L91.20 37.86L92.03 36.86L92.72 35.82L93.27 34.75L93.66 33.67L93.91 32.59L94.01 31.52L93.96 30.48L93.77 29.48L93.43 28.54L92.97 27.67L92.38 26.87L91.66 26.17L90.84 25.56L89.91 25.06L88.89 24.68L87.78 24.42L86.60 24.30L85.36 24.30L84.06 24.45L82.73 24.74L81.36 25.17L79.98 25.75L78.59 26.48L77.21 27.36L75.85 28.39L74.52 29.57L73.24 30.88L72.02 32.34L70.87 33.92L69.80 35.63L68.83 37.46L67.97 39.40L67.22 41.44L66.61 43.55L66.14 45.74L65.82 47.98L65.65 50.27L65.64 52.57L65.80 54.87L66.12 57.16L66.60 59.42L67.25 61.62L68.05 63.75L69.00 65.79L70.09 67.72L71.31 69.52L72.65 71.18"/></svg>`;
function buildPlane() {
  plane.innerHTML = '';
  if (mobile()) return buildMobile();
  plane.append(h('div', { class: 'axis h' }), h('div', { class: 'axis v' }), h('div', { class: 'ticks', id: 'ticks' }));
  for (const [side, w] of [['top', 'work'], ['bottom', 'wonder'], ['left', 'gather'], ['right', 'make']]) plane.append(h('div', { class: 'alabel ' + side, tabindex: 0 }, w, h('small', {}, S.axes[w].gloss)));
  for (const [q, d] of Object.entries(S.quads)) plane.append(h('div', { class: 'qlabel q-' + q, html: `${d.name}<small>${d.key}</small>` }));
  const mark = h('button', { class: 'mark', 'aria-label': 'A note from Harshita', html: MARK + '<span class="hint">(hello)</span>', onclick: () => openAbout() });
  plane.append(mark);
  S.points.forEach((p, i) => { const e = h('button', { style: '--i:' + i, class: 'pt' + (p.x > 0.55 || (p.x < 0 && p.x > -0.35) ? ' left' : ''), 'data-kind': p.kind, 'aria-label': `${p.title}, ${p.meta}` }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, p.title, h('em', {}, p.year || ''))); e._p = p; bindPoint(e); plane.append(e); });
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
  for (const [q, d] of Object.entries(S.quads)) { const g = h('section', { class: 'mgroup' }, h('h2', {}, d.name, h('small', {}, d.key))); S.points.filter(p => p.quad === q).forEach(p => { const e = h('button', { class: 'pt', 'data-kind': p.kind }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, p.title, h('em', {}, p.meta))); e._p = p; e.onclick = () => ready.then(() => open(p, e.querySelector('.dot').getBoundingClientRect())); g.append(e); }); plane.append(g); }
  preview(active);
}

/* ---------- spatial state: the interface changes with where you stand ---------- */
let mx = innerWidth / 2, my = innerHeight / 2, wonder = .5, make = .5, quad = '';
addEventListener('pointermove', e => {
  mx = e.clientX; my = e.clientY; if (mobile() || sheetOpen) return;
  wonder = my / innerHeight; make = mx / innerWidth;
  const r = document.documentElement.style; r.setProperty('--wonder', wonder.toFixed(3)); r.setProperty('--make', make.toFixed(3));
  const q = (wonder > .5 ? 'b' : 't') + (make > .5 ? 'r' : 'l');
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
  e.addEventListener('click', () => { const r = srcRect(p); ready.then(() => open(p, r)); });
}

/* ---------- sheet ---------- */
const sheet = $('#sheet'), veil = $('#veil'); let sheetOpen = false, lastFocus = null;
let curP = null, fromR = null;
const ptEl = p => $$('.pt').find(e => e._p === p);
function srcRect(p) { const m = plate.classList.contains('on') && plate.firstElementChild; if (m) return m.getBoundingClientRect(); const d = ptEl(p); return d ? d.querySelector('.dot').getBoundingClientRect() : null; }
const thumbSrc = q => q.img ? A(q.img) : q.kind === 'archive' && DATA.arena ? (b => b && (b.image.local || b.image.thumb))(DATA.arena.channels.flatMap(c => c.blocks).find(b => b.image)) : q.kind === 'films' && DATA.films && DATA.films[0] ? DATA.films[0].local || DATA.films[0].poster : null;
function heroFor(p) {
  if (p.video) return Object.assign(h('video', { src: A(p.video), poster: p.img ? A(p.img) : null, muted: true, loop: true, playsinline: true, autoplay: !RM, controls: RM, 'aria-label': p.vcap || p.title }), { muted: true, defaultMuted: true });
  if (p.kind === 'archive' || p.kind === 'films' || (p.kind === 'room' && p.room === 'odds')) return plateFor(p);
  return p.img ? h('img', { src: A(p.img), alt: p.alt || '' }) : null;
}
function dockFor(cur) {
  const name = h('span', { class: 'c-name' }, cur ? cur.title : '');
  const items = S.points.filter(thumbSrc).sort((x, y) => qOrder[x.quad] - qOrder[y.quad]).map((q, i) => h('button', { class: q === cur ? 'on' : '', style: '--i:' + i, 'aria-label': q.title, onmouseenter: () => name.textContent = q.title, onmouseleave: () => name.textContent = cur ? cur.title : '', onclick: e => { const r = e.currentTarget.getBoundingClientRect(); ready.then(() => open(q, r)); } }, h('img', { src: thumbSrc(q), alt: '' })));
  return [h('div', { class: 'c-dock', role: 'navigation', 'aria-label': 'Everything else' }, items), name];
}
function grow(card, from) {
  let went = false; const go = () => { if (went) return; went = true; card.style.visibility = '';
    if (RM || !from || !from.width) return card.animate([{ opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
    const b = card.getBoundingClientRect();
    card.animate([{ transform: `translate(${from.left - b.left}px,${from.top - b.top}px) scale(${from.width / b.width},${from.height / b.height})`, filter: 'blur(5px)', borderRadius: '3px' }, { transform: 'none', filter: 'blur(0)', borderRadius: '14px' }], { duration: 760, easing: 'cubic-bezier(.22,1,.36,1)' }); };
  card.style.visibility = 'hidden'; const im = card.querySelector('img');
  if (card.firstElementChild && card.firstElementChild.tagName === 'IMG' && !im.complete) { im.decode().catch(() => {}).then(go); setTimeout(go, 450); } else requestAnimationFrame(go);
}
function openSheet(quadKey, kicker, title, ...content) {
  plate.classList.remove('on'); pill.classList.remove('on');
  if (!sheetOpen) lastFocus = document.activeElement;
  const p = curP, from = fromR, was = sheetOpen; curP = fromR = null;
  sheet.dataset.quad = quadKey || ''; sheet._p = p; sheet.classList.remove('leaving');
  const hero = p ? heroFor(p) : null, [dock, name] = dockFor(p);
  if (was) dock.classList.add('still');
  sheet.replaceChildren(...[h('div', { class: 'c-top' }, h('button', { class: 'c-x', onclick: closeSheet, 'aria-label': 'Close' }, '×'), dock), h('div', { class: 'c-namewrap' }, name), hero ? h('div', { class: 'c-hero' + (hero.tagName === 'VIDEO' ? ' v' : '') }, hero) : null, h('div', { class: 'body' }, h('p', { class: 'c-kick reveal' }, kicker), h('h2', { class: 's-title reveal' }, title), ...content)].filter(Boolean));
  sheet.scrollTop = 0; sheetOpen = true; sheet.classList.add('on'); body.classList.add('case-open'); sheet.focus({ preventScroll: true });
  const card = $('.c-hero', sheet); if (card) grow(card, from);
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { root: sheet, threshold: 0, rootMargin: '0px 0px -6% 0px' });
  setTimeout(() => $$('.reveal,.crop', sheet).forEach((el, i) => { el.style.transitionDelay = Math.min(i, 6) * 45 + 'ms'; io.observe(el); }), RM || !card ? 0 : 280);
}
function closeSheet() {
  if (!sheetOpen) return; sheetOpen = false; body.classList.remove('case-open'); sheet.classList.add('leaving');
  const card = $('.c-hero', sheet), d = sheet._p && ptEl(sheet._p), fin = () => { if (sheetOpen) return; sheet.classList.remove('on', 'leaving'); sheet.replaceChildren(); };
  const a2 = d && d.querySelector('.dot').getBoundingClientRect(), b = card && card.getBoundingClientRect();
  if (!RM && card && a2 && a2.width && b.bottom > 0 && !body.classList.contains('show-index')) card.animate([{ transform: 'none' }, { transform: `translate(${a2.left - b.left}px,${a2.top - b.top}px) scale(${a2.width / b.width},${a2.height / b.height})`, opacity: 0, filter: 'blur(4px)' }], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = fin;
  else setTimeout(fin, RM ? 0 : 320);
  lastFocus && lastFocus.focus({ preventScroll: true });
}
sheet.addEventListener('click', e => { if (e.target === sheet || e.target.classList.contains('c-top') || e.target.classList.contains('c-namewrap')) closeSheet(); });
veil.onclick = closeSheet;
addEventListener('keydown', e => { if (e.key === 'Escape') { if (sheetOpen) closeSheet(); else if (active) setFilter(null); else if (body.classList.contains('show-index')) toggleIndex(false); } });
const kick = p => `${S.quads[p.quad].name} · ${S.quads[p.quad].key}`;
const metaList = rows => h('dl', { class: 's-meta' }, rows.filter(r => r[1]).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]));
const videoFig = p => p.video ? h('figure', { class: 's-video reveal' }, Object.assign(h('video', { src: A(p.video), poster: p.img ? A(p.img) : null, muted: true, loop: true, playsinline: true, autoplay: !RM, controls: RM, preload: 'metadata', 'aria-label': p.vcap || p.title }), { muted: true, defaultMuted: true }), p.vcap ? h('figcaption', { class: 'mono dim' }, p.vcap) : null) : null;
function shortCase(c) {
  const im = f => h('img', { class: 'reveal', src: f, alt: '', loading: 'lazy' }), imgs = l => l && l.length ? h('div', { class: 'c-imgs n' + Math.min(l.length, 3) }, l.map(im)) : null;
  const R = typeof c.research === 'string' ? { t: c.research } : c.research, Q = typeof c.quote === 'string' ? { t: c.quote } : c.quote;
  return h('div', { class: 'short' },
    c.facts ? h('p', { class: 'c-facts reveal' }, c.facts) : null, c.note ? h('p', { class: 'c-note reveal' }, c.note) : null,
    c.q ? h('p', { class: 'c-q reveal' }, c.q) : null, c.problem ? h('p', { class: 'c-p reveal' }, c.problem) : null,
    c.numbers ? h('div', { class: 'c-nums reveal' }, c.numbers.map(([n, l]) => h('div', {}, h('b', {}, n), h('span', {}, l)))) : null,
    Q ? h('blockquote', { class: 'c-quote reveal' }, '“' + Q.t.replace(/^["“\s]+|["”\s]+$/g, '') + '”', Q.by ? h('cite', {}, '— ' + Q.by) : null) : null,
    R ? h('div', {}, h('p', { class: 'c-p reveal' }, R.t), imgs(R.imgs)) : null,
    (c.steps || []).map(s => h('section', { class: 'c-step' }, h('div', { class: 'c-sh reveal' }, h('span', { class: 'c-n' }, s.n), h('h3', {}, s.t)), h('p', { class: 'c-p reveal' }, s.d), imgs(s.imgs))),
    c.learned ? h('p', { class: 'c-learned reveal' }, h('span', {}, 'what she learned'), c.learned) : null,
    c.closing ? h('figure', { class: 'c-fig reveal' }, im(c.closing.img), c.closing.cap ? h('figcaption', {}, c.closing.cap) : null) : null);
}
const caseHTML = id => DATA.cases && DATA.cases[id] ? h('div', { class: 'prose reveal', html: DATA.cases[id].html }) : null;

function open(p, rect) {
  if (sheetOpen) $$('video', sheet).forEach(v => v.pause());
  curP = p; fromR = rect || srcRect(p);
  const K = kick(p), line = h('p', { class: 's-line reveal' }, p.line);
  const sc = p.case && DATA.short && DATA.short[p.case] ? shortCase(DATA.short[p.case]) : null;
  if (p.kind === 'vault' || p.kind === 'shipped') return openSheet(p.quad, K, p.title, sc || line, sc ? null : metaList([['where', p.org], ['when', p.year], ['tags', p.tags.join(' · ')]]), p.video ? h('p', { class: 'c-cap reveal' }, p.vcap) : null, diagram(p.id), sc ? null : p.kind === 'shipped' ? crops(p) : p.images ? h('div', { class: 's-imgs' }, p.images.slice(1).map(f => h('img', { class: 'reveal', src: A(f), alt: p.alt || '', loading: 'lazy' }))) : null);
  if (p.kind === 'archive') return ready.then(() => openArena(K));
  if (p.kind === 'films') return ready.then(() => openFilms(K));
  if (p.kind === 'paper') return openSheet('bl', K, p.title, line, h('img', { class: 'reveal', src: A(p.img), alt: p.alt, style: 'width:100%;margin-top:26px' }), h('p', { class: 'reveal', style: 'margin-top:22px' }, h('a', { href: p.href, class: 'serif', style: 'font-size:22px;font-style:italic;border-bottom:1px solid currentColor' }, 'read it, like a book →')));
  if (p.kind === 'room' && p.room === 'theatre') return openSheet('br', K, p.title, line, h('div', { class: 'gallery' }, S.theatre.map(([f, ar, c]) => h('figure', { class: 'reveal', style: ar > 1.8 ? 'grid-column:1/-1' : '' }, h('img', { src: A(f), alt: c || 'A photograph from one of her plays', loading: 'lazy' }), c ? h('figcaption', {}, c) : null))));
  if (p.kind === 'room') return openSheet('bl', K, p.title, line, h('p', { class: 'credit' }, 'visual notes, kept since college.'), h('div', { class: 'masonry' }, S.odds.map(f => h('div', { class: 'blk reveal' }, h('img', { src: A(f), alt: 'A visual note', loading: 'lazy' })))));
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
  openSheet('bl', K, 'visual research & archives', h('p', { class: 'credit reveal' }, 'An index of curated imagery, references, and design artifacts streamed from my public Are.na channels. All rights remain with the original creators.'), chans, grid, h('p', { class: 'mono', style: 'margin-top:20px' }, h('a', { href: S.person.arena, target: '_blank', rel: 'noopener', style: 'color:var(--ox)' }, 'are.na/harshita-shyale ↗')));
}
function openFilms(K) {
  const f = DATA.films || []; const stars = r => r ? '★'.repeat(Math.floor(r)) + (r % 1 ? '½' : '') : '';
  openSheet('bl', K, 'Films', h('p', { class: 's-line reveal' }, 'she got letterboxd.com/harshita — the very first Harshita there. this is what she’s been watching.'), h('div', { class: 'films' }, f.slice(0, 36).map(x => h('a', { class: 'film reveal', href: x.link, target: '_blank', rel: 'noopener' }, h('img', { src: x.local || x.poster, alt: `${x.title} poster`, loading: 'lazy' }), h('div', { class: 't' }, x.title, ' ', h('span', { class: 'dim' }, x.year || '')), h('div', { class: 'r' }, stars(+x.rating) || (x.watched ? 'watched ' + x.watched.slice(5).replace('-', '/') : ''))))));
}
function openClay(p, K, line) {
  const cs = h('div', { class: 'contact-sheet', 'aria-label': 'Drag across to turn the bowl' }, h('img', { src: A(p.images[0]), alt: p.alt }));
  const frames = p.images; cs.addEventListener('pointermove', e => { const r = cs.getBoundingClientRect(); const i = Math.min(frames.length - 1, Math.floor((e.clientX - r.left) / r.width * frames.length)); cs.firstChild.src = A(frames[i]); });
  openSheet('br', K, p.title, line, cs, h('p', { class: 'mono dim', style: 'margin-top:8px' }, 'move across the image to turn him around'), h('img', { class: 'reveal', src: A(p.sheet), alt: 'contact sheet', style: 'width:100%;margin-top:22px' }));
}

/* playground: the UI is the work */
function openPlayground(K, line) {
  const stage = h('div', { class: 'stage' }); ['make', 'gather', 'wonder', 'work', 'oxblood', 'cobalt', '1px', 'ease-out'].forEach((t, i) => { const c = h('span', { class: 'chip', style: `left:${10 + (i % 4) * 23}%;top:${20 + Math.floor(i / 4) * 45}%` }, t); drag(c, stage); stage.append(c); });
  const root = document.documentElement.style;
  const knob = (label, min, max, step, val, unit, fn) => { const o = h('output', {}, val + unit); const i = h('input', { type: 'range', min, max, step, value: val, oninput: e => { o.textContent = e.target.value + unit; fn(+e.target.value); } }); return h('label', { class: 'knob' }, label, i, o); };
  const theme = h('button', { class: 'mono', style: 'border-bottom:1px solid currentColor', onclick: () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? '' : 'dark'; } }, 'toggle light / dark');
  const code = h('div', { class: 'code', html: `.mark {\n  --spin: <span contenteditable="true" data-v="spin">60</span>s;\n  --size: <span contenteditable="true" data-v="size">68</span>px;\n}` });
  code.addEventListener('input', e => { const v = parseFloat(e.target.textContent); if (isNaN(v)) return; const m = $('.mark'); if (e.target.dataset.v === 'size' && m) { m.style.width = m.style.height = v + 'px'; m.style.margin = `${-v / 2}px 0 0 ${-v / 2}px`; } if (e.target.dataset.v === 'spin' && m) m.querySelector('svg').style.animationDuration = v + 's'; });
  openSheet('br', K, 'The playground', line,
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
const qOrder = { tr: 0, tl: 1, br: 2, bl: 3 };
function renderIndex() {
  const cols = [['title', 'title'], ['org', 'where'], ['year', 'year'], ['quad', 'quarter'], ['tags', 'tags']];
  const rows = S.points.filter(p => !active || p.tags.includes(active)).sort((a, b) => { const v = k => k === 'quad' ? qOrder[a.quad] - qOrder[b.quad] : String(a[k]).localeCompare(String(b[k])); return v(sortKey) * sortDir; });
  $('#index').replaceChildren(h('table', { class: 'itable' }, h('thead', {}, h('tr', {}, cols.map(([k, l]) => h('th', { class: k === sortKey ? 'sorted' : '', onclick: () => { sortDir = sortKey === k ? -sortDir : 1; sortKey = k; renderIndex(); } }, l + (k === sortKey ? (sortDir > 0 ? ' ↓' : ' ↑') : ''))))), h('tbody', {}, rows.map(p => h('tr', { class: 'row', tabindex: 0, onclick: e => open(p, e.currentTarget.getBoundingClientRect()), onkeydown: e => e.key === 'Enter' && open(p, e.currentTarget.getBoundingClientRect()) }, h('td', { class: 't' }, p.title), h('td', { class: 'm' }, p.org), h('td', { class: 'm' }, p.year), h('td', { class: 'm' }, S.quads[p.quad].name), h('td', { class: 'm' }, p.tags.join(', ')))))));
}
function toggleIndex(on) { body.classList.toggle('show-index', on); $('#indexBtn').classList.toggle('on', on); $('#indexBtn').textContent = on ? 'map' : 'index'; plate.classList.remove('on'); pill.classList.remove('on'); }
$('#indexBtn').onclick = () => toggleIndex(!body.classList.contains('show-index'));
$('#home').onclick = e => { e.preventDefault(); toggleIndex(false); closeSheet(); setFilter(null); };

/* boot */
plane.addEventListener('click', e => { if (!e.target.closest('.pt,.mark,button,a') && active) setFilter(null); });
buildPlane(); renderIndex();
let lastMobile = mobile(); addEventListener('resize', () => { if (mobile() !== lastMobile) { lastMobile = mobile(); buildPlane(); } else layout(); });
const intro = $('#intro'), arrive = d => { body.style.setProperty('--ad', d + 'ms'); body.classList.add('arriving'); setTimeout(() => body.classList.remove('arriving'), d + 2800); };
if (sessionStorage.getItem('seen') || RM) { intro.remove(); arrive(0); }
else { sessionStorage.setItem('seen', 1); body.classList.add('introing'); arrive(1700);
  setTimeout(() => { const p = $('p', intro), a = p.getBoundingClientRect(), b = $('#home').getBoundingClientRect(); p.style.transformOrigin = '0 0'; p.style.transform = `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${b.height / a.height})`; intro.classList.add('done'); }, 1150);
  setTimeout(() => { body.classList.remove('introing'); intro.remove(); }, 2200); }
ready.then(() => {});
})();
