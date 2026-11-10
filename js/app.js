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
window.PORTFOLIO_DATA = DATA;
window.PORTFOLIO_READY = ready;

/* ---------- chrome ---------- */

// The same few things sit in the top bar on the map and on the work, so nothing moves when you switch: my name and what I
// do (it reads product designer too, on a touch), the line about my work (it opens the about page), a line about the site,
// and email, CV and LinkedIn by the switch.
const contactLinks = () => { const m = h('button', { type: 'button', class: 'c-mail' }, 'Email');
  m.onclick = () => { const a = S.person.email, done = () => { m.textContent = 'Copied'; setTimeout(() => { m.textContent = 'Email'; }, 1600); }; navigator.clipboard ? navigator.clipboard.writeText(a).then(done, () => { location.href = 'mailto:' + a; }) : (location.href = 'mailto:' + a); };
  return h('p', { class: 'c-links' }, m, h('a', { href: S.person.resume, target: '_blank', rel: 'noopener' }, 'CV'), h('a', { href: S.person.linkedin, target: '_blank', rel: 'noopener' }, 'LinkedIn')); };
const introLines = () => [
  h('p', { class: 'i-do' }, h('button', { type: 'button', class: 'i-about', 'aria-label': S.person.now + ' About me', onclick: () => ready.then(openProfile) }, wisp(S.person.now), h('span', { class: 'wk-arrow', 'aria-hidden': 'true' }, h('i'), h('b')))),
  h('p', { class: 'i-index' }, S.person.index)];
$('#intro-lines').replaceChildren(...introLines());
$('#statement').replaceChildren(...introLines(), contactLinks());
$('#s-index').textContent = S.person.index;
$('.b-role').replaceChildren(h('span', {}, 'Design engineer'), h('span', { 'aria-hidden': 'true' }, 'Product designer'));
$('.b-menu').prepend(contactLinks());

const editorShortcut = $('#editor-shortcut');
const updateEditorShortcut = () => { let enabled = false; try { enabled = localStorage.getItem('site-editor') === '1'; } catch {} editorShortcut.hidden = !enabled; body.classList.toggle('editor-enabled', enabled); };
if (editorShortcut) { updateEditorShortcut(); editorShortcut.addEventListener('click', () => window.enterPortfolioEdit?.()); window.addEventListener('site-editor-enabled', updateEditorShortcut); }

/* a word that changes its clothes on hover: its own face at rest, Averia's italic when reached for, letter by letter */
const wearWord = w => h('span', { class: 'wear', 'aria-hidden': 'true' }, ['w-a', 'w-b'].map(k => h('span', { class: k }, [...w].map((c, i) => h('i', { style: '--i:' + i }, c)))));
/* ---------- filters (Ainsley-style word list) ---------- */
const fwrap = $('#filters'), legend = $('#type-legend'); let active = null;
const count = k => S.points.filter(p => p.tags.includes(k)).length;
const types = [['work','●'],['collections','◎'],['making','▲'],['writing','■']];
types.filter(([type]) => S.points.some(p => p.type === type)).forEach(([type, glyph]) => legend.append(h('button', { class:'legend-item', 'data-type':type, onmouseenter:()=>preview('type:'+type), onmouseleave:()=>preview(active), onfocus:()=>preview('type:'+type), onblur:()=>preview(active), onclick:()=>setFilter(active==='type:'+type?null:'type:'+type), 'aria-label':'Filter '+type }, h('i',{class:'type-glyph '+type},glyph), wearWord(type))));
function matches(p,k) { return k ? k.startsWith('type:') ? p.type===k.slice(5) : p.tags.includes(k) : true; }
function preview(k) { $$('.pt').forEach(e => { const on = matches(e._p,k); e.classList.toggle('match', !!k && on); e.classList.toggle('mute', !!k && !on); }); legend.classList.toggle('has-active',!!k&&k.startsWith('type:')); }
function setFilter(k) { active = k; fwrap.classList.toggle('has-active', !!k); $$('button[data-k]', fwrap).forEach(b => b.classList.toggle('on', b.dataset.k === k)); $$('[data-type]',legend).forEach(b=>b.classList.toggle('on',k==='type:'+b.dataset.type)); preview(k); renderIndex(); }

/* Sir Wobblefoot, printed small: a linocut of the bowl on its two feet. Ink is the block; the carved lines are paper. */
const POT = `<svg class="pot" viewBox="0 0 40 40" aria-hidden="true">
<path class="ink" d="M5.2 34.6 12.8 34.3M15.4 34.5 34.8 34.8" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
<path class="ink" fill="currentColor" d="M6.5 10.4C7 8.9 12 8.1 20 8.3 28.1 8.1 33.3 8.9 33.6 10.7 33.9 12.1 32.9 13.1 32.4 14.6 31.7 21.1 28 26.6 21.4 27.6L18.5 27.7C12 26.8 8.2 21.4 7.4 14.5 6.8 13 6.1 11.9 6.5 10.4Z"/>
<path class="ink" fill="currentColor" d="M12.4 25C12 28 11.3 30.1 9.1 31.3 8.3 31.8 8.6 32.7 9.6 32.7L15.7 32.6C16.5 32.6 16.7 31.8 16.2 31 15.6 29.5 15.8 27.6 16.3 26.3ZM23.7 26.3C24.2 27.8 24.3 29.7 23.8 31 23.4 31.8 23.6 32.7 24.5 32.7L30.5 32.6C31.4 32.6 31.6 31.7 30.8 31.2 28.7 30 28 28 27.6 25Z"/>
<g class="carve" fill="none" stroke-linecap="round">
<path d="M9.2 10.7C13.4 12.3 26.8 12.4 31 10.6" stroke-width="1.3"/>
<path d="M8.9 14C9.3 17.2 10.5 20.1 12.3 22.4" stroke-width="1.5"/>
<path d="M13.6 15.6C14.1 19 15.4 22.2 17.2 24.4" stroke-width=".9"/>
<path d="M18.4 16.2 18.9 21.6" stroke-width=".7"/>
<path d="M26.8 15.5C26.3 18.9 25 21.6 23.1 23.5" stroke-width=".9"/>
<path d="M30.4 15.2C30 17 29.3 18.6 28.4 20" stroke-width=".7"/>
<path d="M10.7 32.7 11 31.4M12.6 32.7 12.8 31.6M25.7 32.7 25.9 31.6M27.6 32.7 27.8 31.5" stroke-width=".55"/>
</g>
<g class="carve-fleck"><circle cx="22.6" cy="18.4" r=".45"/><circle cx="16" cy="13.8" r=".35"/><circle cx="28.4" cy="13.6" r=".4"/><circle cx="20.6" cy="24.9" r=".35"/><circle cx="11.8" cy="12.9" r=".3"/></g>
</svg>`;
/* Films: a reel, nothing more. */
const REEL = `<svg class="pot" viewBox="0 0 40 40" aria-hidden="true">
<circle class="ink" cx="20" cy="20" r="12.5" fill="currentColor"/>
<g class="carve-fleck"><circle cx="20" cy="13" r="2.9"/><circle cx="26.66" cy="17.84" r="2.9"/><circle cx="24.11" cy="25.66" r="2.9"/><circle cx="15.89" cy="25.66" r="2.9"/><circle cx="13.34" cy="17.84" r="2.9"/><circle cx="20" cy="20" r="1.1"/></g>
</svg>`;
const HOVER_ART = { clay: () => POT, films: () => REEL };
// the work that glows: shipped at Salesloft and GitHub, and the Sony capstone
const GLOW = ['influence', 'github', 'sony'];
/* ---------- plane ---------- */
function buildPlane() {
  plane.innerHTML = '';
  if (mobile()) return buildMobile();
  plane.append(h('div', { class: 'axis h' }), h('div', { class: 'axis v' }));
  // the same plate as the drawing on the work: ticks at the axis ends, a ring where they cross, and where
  plane.append(h('div', { class: 'm-plate', 'aria-hidden': 'true' }, ...['t', 'b', 'l', 'r'].map(k => h('i', { class: 'm-tick ' + k })), h('i', { class: 'm-hub' }), h('span', { class: 'm-where' }, 'San Francisco 37.77N 122.42W')));
  for (const [side, w] of [['top', 'work'], ['bottom', 'wonder'], ['left', 'gather'], ['right', 'make']]) plane.append(h('div', { class: 'alabel ' + side, tabindex: 0, 'aria-label': w }, wearWord(w)));
  for (const [q, d] of Object.entries(S.quads)) {
    const label=h('div', { class: 'qlabel q-' + q }, h('span',{class:'quad-name'},d.name),h('small',{},d.key));
    if(q==='tr'&&!sessionStorage.getItem('work-dot-hovered')) label.append(h('span',{class:'start-here'},'start with the work →'));
    plane.append(label);
  }
  S.points.forEach((p, i) => { const e = h('button', { style: '--i:' + i, class: 'pt' + (p.x > 0.55 || (p.x < 0 && p.x > -0.35) ? ' left' : ''), 'data-kind': p.kind, 'data-type':p.type, 'data-pulse':GLOW.includes(p.id)?'true':null, 'data-id': p.id, 'aria-label': `${p.title}, ${p.meta}` }, HOVER_ART[p.kind] ? h('span', { class: 'dotwrap' }, h('span', { class: 'dot' }), svgEl(HOVER_ART[p.kind]())) : h('span', { class: 'dot' }), h('span', { class: 'lbl' }, h('span',{class:'point-title'},p.title), p.type==='work'?h('em',{},p.sub||p.org):h('em', {}, p.year || ''))); e._p = p; bindPoint(e); plane.append(e); });
  layout(); preview(active);
}
function layout() {
  if (mobile()) return;
  // The map is the page: centred, its axes running nearly edge to edge, under a slim band.
  const W = innerWidth, H = innerHeight, band = $('#band').getBoundingClientRect().bottom;
  const cx = W / 2, cy = (band + H) / 2 - 10, sx = cx - Math.max(150, W * .14) - 60, sy = cy - band - 70;
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries({ '--cx': cx, '--cy': cy, '--mT': band + 24, '--bandH': band })) r.setProperty(k, Math.round(v) + 'px');
  $$('.pt').forEach(e => { e.style.left = (cx + e._p.x * sx) + 'px'; e.style.top = (cy - e._p.y * sy) + 'px'; e.style.setProperty('--d', Math.min(1, Math.hypot(e._p.x, e._p.y) / 1.2).toFixed(3)); });
}
function buildMobile() {
  for (const [q, d] of Object.entries(S.quads)) { const g = h('section', { class: 'mgroup' }, h('h2', {}, d.name, h('small', {}, d.key))); S.points.filter(p => p.quad === q).forEach(p => { const e = h('button', { class: 'pt', 'data-kind': p.kind, 'data-type':p.type, 'data-pulse':GLOW.includes(p.id)?'true':null, 'data-id': p.id }, HOVER_ART[p.kind] ? h('span', { class: 'dotwrap' }, h('span', { class: 'dot' }), svgEl(HOVER_ART[p.kind]())) : h('span', { class: 'dot' }), h('span', { class: 'lbl' }, h('span',{class:'point-title'},p.title), h('em', {}, p.type==='work'?p.org:p.meta))); e._p = p; bindPoint(e); g.append(e); }); plane.append(g); }
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
/* ---------- lamplight: the map is shapes until your hand comes near; names surface around it ---------- */
const lamp = matchMedia('(hover:hover) and (pointer:fine)').matches;
if (lamp) {
  body.classList.add('lamp'); let lampRaf = 0;
  const light = () => { lampRaf = 0; const pts = $$('#plane .pt'), near = pts.map(e => { const b = (e.querySelector('.dot') || e).getBoundingClientRect(); return Math.max(0, Math.min(1, 1 - (Math.hypot(b.left + b.width / 2 - mx, b.top + b.height / 2 - my) - 50) / 130)); }); pts.forEach((e, i) => e.style.setProperty('--near', near[i].toFixed(2))); };
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !lampRaf) lampRaf = requestAnimationFrame(light); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => $$('#plane .pt').forEach(e => e.style.setProperty('--near', 0)));
}
const mm = $('#minimap'); ['tl', 'tr', 'bl', 'br'].forEach(q => mm.append(h('button', { 'data-q': q, 'aria-label': S.quads[q].key + ': ' + S.quads[q].name, title: S.quads[q].name, onclick: () => { setFilter(null); const pts = S.points.filter(p => p.quad === q); $$('.pt').forEach(e => { const on = e._p.quad === q; e.classList.toggle('match', on); e.classList.toggle('mute', !on); }); clearTimeout(mm._t); mm._t = setTimeout(() => preview(active), 1600); } })));

/* grain: still in work, vibrating in wonder */
const gc = $('#grain'); let frames = [], fi = 0, lastG = 0;
(function makeGrain() { const c = document.createElement('canvas'), s = 180; c.width = c.height = s; const x = c.getContext('2d'); for (let f = 0; f < 6; f++) { const d = x.createImageData(s, s); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); frames.push(`url(${c.toDataURL()})`); } gc.style.backgroundImage = frames[0]; })();
function tickGrain(t) {
  if (!RM && !document.hidden) { const w = Math.max(0, (wonder - .5) * 2); const iv = w > .02 ? 260 - w * 210 : Infinity; if (t - lastG > iv) { lastG = t; fi = (fi + 1) % frames.length; gc.style.backgroundImage = frames[fi]; gc.style.backgroundPosition = `${Math.random() * 180 | 0}px ${Math.random() * 180 | 0}px`; } }
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
  if (p.id === 'theatre') return h('div', { class: 'flip', style: '--n:6' }, ['poster', 'tr2', 'sips1', 'mime', 'tr5', 'lullaby'].map((f, i) => h('img', { src: A('theatre/' + f + '.jpg'), alt: '', style: '--i:' + i })));
  if(p.id==='wobblefoot') return h('div',{class:'turnaround-preview',style:`background-image:url("${A('wobblefoot-sheet.jpg')}")`});
  if (p.img) return h('img', { src: A(p.img), alt: '' });
  return null;
}
// The picture's caption: what it is, who it was for and when, and its one line.
function plateCap(p) {
  const meta = p.type === 'work' ? [p.org, p.year, p.role] : [p.meta];
  return h('figcaption', { class: 'pcap' }, h('b', {}, p.title), h('span', { class: 'pm' }, meta.filter(Boolean).join(' · ')), h('span', { class: 'pl' }, p.line));
}
// Each hover gets its own figure. It waits for its picture to arrive, then drifts up from the dot you're on;
// the one before it fades on its own, so moving quickly between dots never swaps a picture mid-flight.
let figTok = 0;
function showPlate(p, e) {
  hidePlate(); const c = plateFor(p); if (!c) return null;
  const tok = ++figTok, fig = h('figure', { class: 'pfig' }, c, plateCap(p));
  plate.append(fig); plate.classList.add('on');
  const R = getComputedStyle(document.documentElement), cx = parseFloat(R.getPropertyValue('--cx')) || innerWidth / 2, cy = parseFloat(R.getPropertyValue('--cy')) || innerHeight / 2;
  const settle = () => { if (tok !== figTok) return; const d = e.querySelector('.dot').getBoundingClientRect(), W = fig.offsetWidth, H = fig.offsetHeight;
    fig.style.transformOrigin = `${d.left + d.width / 2 - (cx - W / 2)}px ${d.top + d.height / 2 - (cy - H / 2)}px`;
    requestAnimationFrame(() => { if (tok === figTok) fig.classList.add('in'); }); };
  const imgs = $$('img', fig); Promise.race([Promise.all(imgs.map(i => i.decode ? i.decode().catch(() => {}) : null)), new Promise(r => setTimeout(r, 600))]).then(settle);
  return c;
}
function hidePlate() {
  figTok++; plate.classList.remove('on');
  $$('.pfig:not(.out)', plate).forEach(f => { f.classList.add('out'); f.classList.remove('in'); setTimeout(() => f.remove(), 450); });
}
// While a picture shows, the axes stop at its edges instead of running across it.
function axesAround(box) {
  $$('.axis').forEach(a => {
    if (!box) { a.style.maskImage = a.style.webkitMaskImage = ''; return; }
    const r = a.getBoundingClientRect(), hz = a.classList.contains('h');
    const s = hz ? r.left : r.top, b0 = (hz ? box.left : box.top) - s - 14, b1 = (hz ? box.right : box.bottom) - s + 14;
    a.style.maskImage = a.style.webkitMaskImage = `linear-gradient(${hz ? 90 : 180}deg,#000 ${b0}px,transparent ${b0}px,transparent ${b1}px,#000 ${b1}px)`;
  });
}

function bindPoint(e) {
  const p = e._p;
  let turnTimer;
  const stopHint=()=>{if(p.type==='work'&&!sessionStorage.getItem('work-dot-hovered')){sessionStorage.setItem('work-dot-hovered','1');$('.start-here')?.remove();body.classList.add('work-pulse-stopped');}};
  e.addEventListener('mouseenter', () => { if (sheetOpen) return; window.portfolioSound?.pluck(p.x, p.y); if(p.id==='wobblefoot')e.classList.add('wobbling'); stopHint(); const c = showPlate(p, e); if(p.id==='wobblefoot'&&!RM&&c){let n=0;turnTimer=setInterval(()=>{c.style.backgroundPosition=`${n%2?100:0}% ${Math.floor(n/2)*50}%`;n=(n+1)%6;},520);} pill.innerHTML = `${p.title}<span class="k">${p.hint || p.org}</span>`; pill.classList.toggle('on', !c); });
  e.addEventListener('mouseleave', () => {clearInterval(turnTimer);e.classList.remove('wobbling');hidePlate(); pill.classList.remove('on'); });
  e.addEventListener('click', () => { stopHint(); const r = srcRect(p); ready.then(() => open(p, r)); });
}

/* ---------- sheet ---------- */
const sheet = $('#sheet'), veil = $('#veil'); let sheetOpen = false, lastFocus = null;
let curP = null, fromR = null;
const ptEl = p => $$('.pt').find(e => e._p === p);
function srcRect(p) { const m = $('.pfig.in', plate)?.firstElementChild; if (m) return m.getBoundingClientRect(); const d = ptEl(p); return d ? d.querySelector('.dot').getBoundingClientRect() : null; }
const thumbSrc = q => q.img ? A(q.img) : q.kind === 'archive' && DATA.arena ? (b => b && (b.image.local || b.image.thumb))(DATA.arena.channels.flatMap(c => c.blocks).find(b => b.image)) : q.kind === 'films' && DATA.films && DATA.films[0] ? DATA.films[0].local || DATA.films[0].poster : null;
function heroFor(p) {
  // a case with a still: the best frame of the film, and a click plays the film large
  if (p.still) return h('button', { type: 'button', class: 'hero-still', 'aria-label': 'Play the film', 'data-src': A(p.video), 'data-poster': A(p.still), onclick: e => enlarge(e.currentTarget, e.currentTarget.querySelector('img')) },
    h('img', { src: A(p.still), alt: p.vcap || p.title }), h('span', { class: 'hero-play' }, 'play the film'));
  if (p.youtube) return h('iframe', { class: 'yt', src: `https://www.youtube-nocookie.com/embed/${p.youtube}?rel=0&modestbranding=1`, title: p.title, loading: 'lazy', allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin' });
  if (p.id === 'wobblefoot') return h('div', { class: 'turn-hero', role: 'img', 'aria-label': p.alt || p.title, style: `background-image:url("${A(p.sheet)}")` });
  if (p.video) return Object.assign(h('video', { src: A(p.video), poster: p.img ? A(p.img) : null, muted: true, loop: true, playsinline: true, autoplay: !RM, controls: RM, 'aria-label': p.vcap || p.title }), { muted: true, defaultMuted: true });
  if (p.kind === 'films' || (p.kind === 'room' && p.room === 'odds')) return plateFor(p);
  return p.img ? h('img', { src: A(p.img), alt: p.alt || '' }) : null;
}
function dockFor(cur) {
  const cap=h('span',{class:'c-name'},''),sub=h('span',{class:'c-one-line'},'');
  const show=q=>{cap.classList.add('switching');sub.classList.add('switching');setTimeout(()=>{cap.textContent=q?`${q.org} — ${q.title}`:'';sub.textContent=q?.line||'';cap.classList.remove('switching');sub.classList.remove('switching');},160);};
  show(null);
  const items = S.points.filter(thumbSrc).sort((x, y) => (x.type==='work'?0:1)-(y.type==='work'?0:1) || qOrder[x.quad] - qOrder[y.quad]).map((q, i) => h('button', { class: q === cur ? 'on' : '', style: '--i:' + i, 'aria-label': q.title, onmouseenter: () => show(q), onmouseleave: () => show(null), onclick: e => { const r = e.currentTarget.getBoundingClientRect(); ready.then(() => open(q, r)); } }, h('img', { src: thumbSrc(q), alt: '' })));
  return [h('div', { class: 'c-dock', role: 'navigation', 'aria-label': 'Everything else' }, items), h('div',{class:'c-caption'},cap,sub)];
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
  hidePlate(); pill.classList.remove('on');
  if (!sheetOpen) lastFocus = document.activeElement;
  const p = curP, from = fromR, was = sheetOpen; curP = fromR = null;
  sheet.dataset.quad = quadKey || ''; sheet._p = p; sheet.classList.remove('leaving');
  const hero = p ? heroFor(p) : null, [dock, name] = dockFor(p);
  if (was) dock.classList.add('still');
  const work=p&&p.type==='work';
  const head=work?h('header',{class:'case-head'},h('p',{class:'mono'},`${p.org} · ${p.year} · ${p.role}`),h('h2',{class:'s-title'},p.title),h('p',{class:'case-line'},p.line)):null;
  sheet.replaceChildren(...[h('div', { class: 'c-top' }, h('button', { class: 'c-x', onclick: closeSheet, 'aria-label': 'Close' }, '×'), dock), h('div', { class: 'c-namewrap' }, name), head, hero ? h('div', { class: 'c-hero' + (hero.tagName === 'VIDEO' ? ' v' : '') }, hero) : null, p && p.credit ? h('p', { class: 'c-cap c-credit' }, p.credit) : null, h('div', { class: 'body' }, title&&!work ? [h('p', { class: 'c-kick c-in' }, kicker), h('h2', { class: 's-title c-in' }, title)] : null, ...content)].filter(Boolean));
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
function shortCase(c, point, kicker) {
  const im = f => h('img', { class: 'reveal', src: f, alt: '', loading: 'lazy' }), imgs = l => l && l.length ? h('div', { class: 'c-imgs n' + Math.min(l.length, 3) }, l.map(im)) : null;
  const R = typeof c.research === 'string' ? { t: c.research } : c.research, Q = typeof c.quote === 'string' ? { t: c.quote } : c.quote;
  const numbers = () => c.numbers ? h('div', { class: 'c-nums reveal' }, c.numbers.map(([n, l]) => h('div', {}, h('b', {}, n), h('span', {}, l)))) : null;
  const quote = () => Q ? h('blockquote', { class: 'c-quote reveal' }, '“' + Q.t.replace(/^["“\s]+|["”\s]+$/g, '') + '”', Q.by ? h('cite', {}, '— ' + Q.by) : null) : null;
  const research = () => R ? h('div', {}, h('p', { class: 'c-p reveal' }, R.t), imgs(R.imgs)) : null;
  const steps = prefix => (c.steps || []).map((s,i) => h('section', { class: 'c-step', id: prefix + s.n, 'data-step': s.n }, h('div', { class: 'c-sh reveal' }, h('span', { class: 'c-n' }, s.n), h('h3', { 'data-case-id': point?.case, 'data-case-path': `steps.${i}.t` }, s.t)), h('p', { class: 'c-p reveal', 'data-case-id': point?.case, 'data-case-path': `steps.${i}.d` }, s.d), imgs(s.imgs)));
  const learned = () => c.learned ? h('p', { class: 'c-learned reveal' }, h('span', {}, 'what it taught me'), h('span', { class:'learned-copy', 'data-case-id':point?.case, 'data-case-path':'learned' }, c.learned)) : null;
  const closing = () => c.closing ? h('figure', { class: 'c-fig reveal' }, im(c.closing.img), c.closing.cap ? h('figcaption', {}, c.closing.cap) : null) : null;
  const stackedContent = () => [
    c.facts ? h('p', { class: 'c-facts reveal' }, c.facts) : null,
    c.note ? h('p', { class: 'c-note reveal' }, c.note) : null,
    c.q ? h('p', { class: 'c-q reveal', 'data-case-id':point?.case, 'data-case-path':'q' }, c.q) : null,
    c.problem ? h('p', { class: 'c-p reveal', 'data-case-id':point?.case, 'data-case-path':'problem' }, c.problem) : null,
    numbers(), quote(), research(), ...steps('step-'), learned(), closing(),
  ].filter(Boolean);
  // every case reads the same way, GitHub included
  return h('div', { class: 'short' }, ...stackedContent());
}
const caseHTML = id => DATA.cases && DATA.cases[id] ? h('div', { class: 'prose reveal', html: DATA.cases[id].html }) : null;

function open(p, rect) {
  if (p.id === 'door') { body.classList.add('collection-leaving'); setTimeout(() => { location.href = 'now/'; }, 350); return; }
  if (p.type === 'collections' || p.id === 'theatre') {
    body.classList.add('collection-leaving');
    const url=p.id==='theatre'?'collection.html?c=theatre':p.id==='films'?'collection.html?c=films':p.id==='odds'?'collection.html?c=odds':'collection.html';
    setTimeout(() => { location.href = url; }, 350);
    return;
  }
  if (sheetOpen) $$('video', sheet).forEach(v => v.pause());
  curP = p; fromR = rect || srcRect(p);
  const K = kick(p), line = h('p', { class: 's-line reveal' }, p.line);
  const sc = p.case && DATA.short && DATA.short[p.case] ? shortCase(DATA.short[p.case], p, K) : null;
  if (p.study) return openStudy(p, K);
  // Sir Wobblefoot is only to be looked at: the turnaround, large, and nothing else
  if (p.id === 'wobblefoot') return openSheet(p.quad, null, null);
  if (p.brief) return openBrief(p, K);
  if (p.kind === 'vault' || p.kind === 'shipped') return openSheet(p.quad, K, p.title, sc || line, sc ? null : metaList([['where', p.org], ['when', p.year], ['tags', p.tags.join(' · ')]]), p.video ? h('p', { class: 'c-cap reveal' }, p.vcap) : null, diagram(p.id), sc ? null : p.kind === 'shipped' ? crops(p) : p.images ? h('div', { class: 's-imgs' }, p.images.slice(1).map(f => h('img', { class: 'reveal', src: A(f), alt: p.alt || '', loading: 'lazy' }))) : null);
  if (p.kind === 'films') return ready.then(() => openFilms(K));
  if (p.kind === 'paper') return openSheet('bl', K, p.title, line, h('p', { class: 'reveal', style: 'margin-top:22px' }, h('a', { href: p.href, class: 'serif', style: 'font-size:22px;font-style:italic;border-bottom:1px solid currentColor' }, 'read it, like a book →')));
  if (p.kind === 'room' && p.room === 'theatre') return openSheet('br', K, p.title, line, h('div', { class: 'gallery' }, S.theatre.map(([f, ar, c]) => h('figure', { class: 'reveal', style: ar > 1.8 ? 'grid-column:1/-1' : '' }, h('img', { src: A(f), alt: c || 'A photograph from one of her plays', loading: 'lazy' }), c ? h('figcaption', {}, c) : null))));
  if (p.kind === 'room') return openSheet('bl', K, p.title, line, h('p', { class: 'credit' }, 'visual notes, kept since college.'), h('div', { class: 'masonry' }, S.odds.map(f => h('div', { class: 'blk reveal' }, h('img', { src: A(f), alt: 'A visual note', loading: 'lazy' })))));
  if (p.kind === 'clay') return openClay(p, K, line);
  if (p.kind === 'toy') return openPlayground(K, line);
}


/* how to reach her: email, LinkedIn, Instagram, Substack, in a small popover; the one a visitor used last time comes first */
function contactMenu(label = 'Contact') {
  const contacts = [
    { id: 'email', label: 'Email', sub: S.person.email, href: 'mailto:' + S.person.email },
    { id: 'linkedin', label: 'LinkedIn', sub: 'send a message', href: S.person.linkedin },
    { id: 'instagram', label: 'Instagram', sub: '@' + S.person.instagram, href: 'https://ig.me/m/' + S.person.instagram },
    { id: 'substack', label: 'Substack', sub: '@' + S.person.substack, href: 'https://substack.com/@' + S.person.substack },
  ];
  let last = null; try { last = localStorage.getItem('contact-via'); } catch {}
  contacts.sort((a, b) => (b.id === last) - (a.id === last));
  const pick = (c, e) => {
    try { localStorage.setItem('contact-via', c.id); } catch {}
    if (c.id === 'email') { const sub = $('span', e.currentTarget); navigator.clipboard?.writeText(c.sub).then(() => { sub.textContent = 'copied · ' + c.sub; }).catch(() => {}); }
  };
  const menu = h('div', { class: 'pf-menu', role: 'menu', hidden: true }, contacts.map(c => h('a', { role: 'menuitem', href: c.href, target: c.id === 'email' ? null : '_blank', rel: 'noopener', onclick: e => pick(c, e) }, h('b', {}, c.label), h('span', {}, c.sub), c.id === last ? h('em', {}, 'last time') : null)));
  const contact = h('button', { type: 'button', class: 'pf-act', 'aria-haspopup': 'menu', 'aria-expanded': 'false', onclick: () => { const on = menu.hidden; menu.hidden = !on; contact.setAttribute('aria-expanded', String(on)); } }, label);
  return h('span', { class: 'pf-contact' }, contact, menu);
}
/* ---------- about: a read.cv page in the case sheet ----------
   Her lines, a strip of pictures, then work, client work and school as plain rows. The work strip stays on top,
   so from here a visitor is one click from any project. Contact lists the apps she answers on; the one a
   visitor used last time comes first. Every line can be rewritten in edit mode (data-edit paths into SITE). */
function openProfile() {
  const P = S.profile, ed = path => ({ 'data-edit': path });
  const contact = contactMenu();
  const cv = h('a', { class: 'pf-act', href: S.person.resume, target: '_blank', rel: 'noopener', hidden: true }, 'CV ↓');
  fetch(S.person.resume, { method: 'HEAD' }).then(r => { if (r.ok) cv.hidden = false; }).catch(() => {});
  // "agents" in the HPE line opens a short note on what those agents were
  const term = text => { const i = text.search(/\bagents\b/); return i < 0 ? [text] : [text.slice(0, i), h('span', { class: 'term', tabindex: 0 }, 'agents'), text.slice(i + 6)]; };
  // Rows read like rghv.ca: what and where on one line, when at the right edge, a line or two under it.
  // Hovering a row grows a fan of its pictures out of the title line, cut off halfway so it teases; hover the fan
  // to see it whole, click it to open the case.
  const pile = r => { if (!r.pile) return null; const q = r.point && S.points.find(x => x.id === r.point), imgs = r.pile.map((f, i) => h('img', { src: A(f), alt: '', loading: 'lazy', style: `--i:${i};--r:${((i * 37) % 11 - 5) * .9}deg` }));
    return q ? h('button', { type: 'button', class: 'pf-pile', 'aria-label': 'Open ' + q.title, onclick: () => open(q, null) }, imgs) : h('div', { class: 'pf-pile', 'aria-hidden': 'true' }, imgs); };
  const row = (r, path) => h('div', { class: 'pf-row' + (r.pile ? ' has-pile' : '') },
    h('div', { class: 'pf-line' },
      h('p', { class: 'pf-role' }, h('span', ed(path + '.role'), r.role), h('span', { class: 'pf-dot' }, ' · '),
        r.href ? h('a', { href: r.href, target: '_blank', rel: 'noopener' }, r.org)
          : r.point ? h('button', { type: 'button', class: 'pf-open', onclick: () => { const q = S.points.find(x => x.id === r.point); if (q) open(q, null); } }, r.org) : r.org,
        r.where ? h('span', { class: 'pf-where' }, r.where) : null),
      h('span', { class: 'pf-when' }, r.when)),
    pile(r),
    h('p', { class: 'pf-text', ...ed(path + '.text') }, ...term(r.text)),
    /\bagents\b/.test(r.text) ? h('p', { class: 'term-pop', role: 'note', ...ed('profile.agents') }, P.agents) : null);
  // Off-the-clock words that have a room on this site link to it; the rest stay plain.
  const ROOMS = [['pictures of silly things', 'collection.html?c=odds'], ['films', 'collection.html?c=films'], ['lists', 'collection.html'], ['The door’s open', 'now/']];
  const linkify = text => { let parts = [text]; for (const [w, href] of ROOMS) parts = parts.flatMap(x => { if (typeof x !== 'string') return [x]; const i = x.indexOf(w); return i < 0 ? [x] : [x.slice(0, i), h('a', { class: 'pf-room', href }, w), x.slice(i + w.length)]; }); return parts; };
  const sec = (label, kids) => h('section', { class: 'pf-sec reveal' }, h('h3', {}, label), kids);
  const elsewhere = [['LinkedIn', S.person.linkedin], ['Instagram', 'https://www.instagram.com/' + S.person.instagram + '/'], ['Substack', 'https://substack.com/@' + S.person.substack], ['Letterboxd', S.person.letterboxd], ['Are.na', S.person.arena]];
  openSheet(null, null, null, h('div', { class: 'pf' },
    h('header', { class: 'pf-head' },
      h('div', { class: 'pf-acts' }, cv, contact),
      h('figure', { class: 'pf-kid' }, ...(P.photos || []).map(([f, alt], i) => h('img', { class: 'pf-kid-back b' + i, src: A(f), alt, loading: 'lazy' })), h('img', { class: 'pf-kid-top', src: A(P.photo[0]), alt: P.photo[1] }), h('figcaption', ed('profile.photo.2'), P.photo[2])),
      h('p', { class: 'mono', ...ed('profile.kicker') }, P.kicker),
      h('h2', { class: 's-title' }, S.person.name),
      h('p', { class: 'case-line', ...ed('profile.lede') }, P.lede)),
    h('div', { class: 'pf-about reveal' }, P.about.map((t, i) => h('p', ed('profile.about.' + i), ...linkify(t)))),
    sec('Work', P.work.map((r, i) => row(r, 'profile.work.' + i))),
    sec('Client work, through UW', P.clients.map((r, i) => row(r, 'profile.clients.' + i))),
    sec('Education', P.education.map((r, i) => row(r, 'profile.education.' + i))),
    sec('Elsewhere', h('p', { class: 'pf-links' }, elsewhere.map(([t, u]) => h('a', { href: u, target: '_blank', rel: 'noopener' }, t + ' ↗'))))));
}
document.addEventListener('click', e => { $$('.pf-menu:not([hidden])', sheet).forEach(m => { if (!m.parentElement.contains(e.target)) { m.hidden = true; m.parentElement.querySelector('.pf-act')?.setAttribute('aria-expanded', 'false'); } }); });

/* a case study as a sneak peek, since it's under NDA: the team, the problem in two sentences, my part,
   three moments from the film, and a way to get in touch. The clips play only while they're on screen. */
// a clip, large: it grows from where it sits to fill most of the window; a click, Escape or the veil puts it back
function enlarge(v, origin = v) {
  const r = origin.getBoundingClientRect(), big = h('video', { src: v.currentSrc || v.src || v.dataset.src, poster: v.poster || v.dataset.poster, muted: true, loop: true, playsinline: true, autoplay: !RM, class: 'zoom-v' });
  const veil = h('div', { class: 'zoom', role: 'dialog', 'aria-modal': 'true', 'aria-label': v.getAttribute('aria-label') || 'Clip' }, big);
  document.body.append(veil); big.currentTime = v.currentTime || 0;
  const w = Math.min(innerWidth * .9, innerHeight * .86 * 16 / 9), hh = w * 9 / 16, L = (innerWidth - w) / 2, T = (innerHeight - hh) / 2;
  Object.assign(big.style, { left: L + 'px', top: T + 'px', width: w + 'px', height: hh + 'px' });
  const from = `translate(${r.left - L}px,${r.top - T}px) scale(${r.width / w})`;
  if (!RM) big.animate([{ transform: from, borderRadius: '24px' }, { transform: 'none', borderRadius: '12px' }], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
  requestAnimationFrame(() => veil.classList.add('on'));
  const close = () => { removeEventListener('keydown', esc, true); veil.classList.remove('on'); const a = RM ? null : big.animate([{ transform: 'none' }, { transform: from }], { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }); setTimeout(() => veil.remove(), RM ? 0 : 380); };
  const esc = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); } };
  veil.addEventListener('click', close); addEventListener('keydown', esc, true);
}
function openStudy(p, K) {
  const C = p.study, sec = (label, ...kids) => h('section', { class: 'cs-sec reveal' }, h('p', { class: 'cs-lab' }, label), ...kids);
  // each moment plays as it scrolls into view; clicking it opens it large
  const moments = C.moments.map(m => h('figure', { class: 'cs-moment reveal' },
    h('button', { type: 'button', class: 'cs-play', 'aria-label': 'Open ' + m.title + ' large', onclick: e => enlarge(e.currentTarget.querySelector('video')) },
      h('video', { src: A(m.video + '.mp4'), poster: A(m.video + '.jpg'), muted: true, loop: true, playsinline: true, preload: 'metadata', 'aria-label': m.title })),
    h('figcaption', {}, h('b', {}, m.title), h('span', { class: 'cs-what' }, m.solves))));
  openSheet(p.quad, K, p.title,
    h('dl', { class: 'cs-meta reveal' }, C.meta.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
    sec('the problem', h('h3', { class: 'cs-h' }, C.problem.title), ...C.problem.body.map(t => h('p', { class: 'cs-p' }, t))),
    sec('my part', h('p', { class: 'cs-p' }, C.part)),
    sec('a peek', h('div', { class: 'cs-moments peek' }, moments)),
    h('p', { class: 'nda cs-nda reveal' }, p.nda, ' ', contactMenu('Get in touch')));
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && !RM) v.play?.().catch(() => {}); else v.pause(); }), { root: sheet, threshold: .5 });
  $$('.cs-moment video', sheet).forEach(v => io.observe(v));
}
/* a brief: the first view and nothing deeper, a couple of paragraphs; "agents" explains itself on hover, as on the about page */
function openBrief(p, K) {
  const term = text => { const i = text.search(/\bagents\b/); return i < 0 ? [text] : [text.slice(0, i), h('span', { class: 'term', tabindex: 0 }, 'agents'), text.slice(i + 6)]; };
  openSheet(p.quad, K, p.title, h('div', { class: 'prose film-body brief reveal' }, p.brief.map(t => /\bagents\b/.test(t)
    ? h('div', { class: 'pf-what' }, h('p', {}, ...term(t)), h('p', { class: 'term-pop', role: 'note' }, S.profile.agents))
    : h('p', {}, t))), p.nda ? h('p', { class: 'nda reveal' }, p.nda, ' ', h('a', { href: `mailto:${S.person.email}?subject=${encodeURIComponent(p.title)}` }, S.person.email)) : null);
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

function openFilms(K) {
  const f = DATA.films || []; const stars = r => r ? '★'.repeat(Math.floor(r)) + (r % 1 ? '½' : '') : '';
  openSheet('bl', K, 'Films', h('p', { class: 's-line reveal' }, 'I got letterboxd.com/harshita, the very first Harshita there. this is what I’ve been watching.'), h('div', { class: 'films' }, f.slice(0, 36).map(x => h('a', { class: 'film reveal', href: x.link, target: '_blank', rel: 'noopener' }, h('img', { src: x.local || x.poster, alt: `${x.title} poster`, loading: 'lazy' }), h('div', { class: 't' }, x.title, ' ', h('span', { class: 'dim' }, x.year || '')), h('div', { class: 'r' }, stars(+x.rating) || (x.watched ? 'watched ' + x.watched.slice(5).replace('-', '/') : ''))))));
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

const svgEl = markup => { const t = document.createElement('div'); t.innerHTML = markup; return t.firstElementChild; };


// Two small drawn switches instead of words. Sound: a little speaker whose waves ripple out while it plays and fold
// into a sleeping z when it's quiet. Lights: a sun whose rays turn slowly; switched off, the rays draw in and a bite
// slides across to leave a moon with one star.
const NSI = 'http://www.w3.org/2000/svg';
const iconSvg = inner => { const s = document.createElementNS(NSI, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
const SOUND_ICON = '<path class="spk" d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path class="wv w1" d="M14 9.5q1.6 2.5 0 5"/><path class="wv w2" d="M16.6 7.6q3 4.4 0 8.8"/><path class="wv w3" d="M19.2 5.6q4.4 6.4 0 12.8"/><path class="zz" d="M15 8h3l-3 3.4h3M19 12.6h2.2l-2.2 2.6h2.2"/>';
const LIGHT_ICON = '<g class="rays">' + Array.from({ length: 8 }, (_, i) => `<line x1="12" y1="2.6" x2="12" y2="5" transform="rotate(${i * 45} 12 12)"/>`).join('') + '</g><mask id="bite"><rect width="24" height="24" fill="#fff"/><circle class="bite" cx="16" cy="9" r="5" fill="#000"/></mask><circle class="orbc" cx="12" cy="12" r="5" mask="url(#bite)"/><path class="star" d="M19 15.6l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"/>';
const soundBtn = $('#soundBtn');
if (soundBtn) {
  soundBtn.replaceChildren(iconSvg(SOUND_ICON)); soundBtn.classList.add('ico');
  const show = () => { const v = !!window.portfolioSound?.on(); soundBtn.setAttribute('aria-pressed', String(v)); soundBtn.setAttribute('aria-label', v ? 'Sound on' : 'Sound off'); soundBtn.title = v ? 'sound on' : 'sound off'; };
  // turning it on: the cone gives a thump, the waves draw out one by one, and a ring carries on past them
  show(); soundBtn.onclick = () => { window.portfolioSound?.set(!window.portfolioSound.on()); show(); soundBtn.classList.remove('ping'); void soundBtn.offsetWidth; soundBtn.classList.add('ping'); };
  soundBtn.addEventListener('animationend', e => { if (e.animationName === 'sb-ring') soundBtn.classList.remove('ping'); });
}

/* work: the page for someone who wants to hire her. Who she is in two lines, a living miniature of the map,
   then product design only, as large cards that open their cases, and an invitation to go play on the map. */
const qOrder = { tr: 0, tl: 1, br: 2, bl: 3 };
const WORK_ORDER = ['influence', 'github', 'sony', 'safe', 'hpe'];
function renderIndex() { const ix = $('#index'); if (!ix._built) buildIndex(ix); }
/* Kin: everything she keeps and makes, arranged by resemblance (after Charcuterie, David Aerne's visual Unicode explorer).
   One piece sits in the middle; around it, in rings, the 24 that look most like it, found with Apple's on-device image
   model (data/kin.json); only her own work and pictures, in one sheet (assets/kin.jpg, 8 across). Pick any of them and it moves to the middle, its own kin gather round, and you wander:
   from a deal map to a code review to a lamp someone saved on are.na. */
let KIN = null;
const kinLoad = () => KIN ? Promise.resolve(KIN) : fetch('data/kin.json').then(r => r.json()).then(d => (KIN = d));
// 25 slots in a 5×5 field: the middle, then the inner ring, then the outer ring, each ring walked clockwise from the top
const SLOTS = (() => { const s = []; for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) s.push([x, y, Math.max(Math.abs(x), Math.abs(y)), Math.atan2(x, -y)]); return s.sort((a, b) => a[2] - b[2] || ((a[3] + 7) % 7) - ((b[3] + 7) % 7)); })();
function kinField() {
  const field = h('div', { class: 'kin', role: 'group', 'aria-label': 'Everything I keep and make, arranged by resemblance' });
  const cap = h('div', { class: 'kin-cap', 'aria-live': 'polite' });
  const trail = h('p', { class: 'kin-trail' });
  const cells = new Map(); let center = 0, path = [], hover = null;
  const label = i => [KIN[i].t, KIN[i].s].join(' · ');
  const go = i => { const o = KIN[i].o || ''; if (o.startsWith('point:')) { const p = S.points.find(x => x.id === o.slice(6)); if (p) ready.then(() => open(p, null)); } else if (o.startsWith('page:')) { body.classList.add('collection-leaving'); setTimeout(() => { location.href = o.slice(5); }, 300); } };
  const caption = i => { const x = KIN[i], here = i === center;
    cap.replaceChildren(h('p', { class: 'kin-src' }, here ? x.s : 'looks like · ' + x.s), h('p', { class: 'kin-title' }, x.t),
      here ? h('button', { type: 'button', class: 'kin-open', onclick: () => go(i) }, KIN[i].o?.startsWith('point:') ? 'Open the case →' : 'Go there →') : h('p', { class: 'kin-hint' }, 'Pick it to wander from there.')); };
  const place = (el, k) => { const [x, y, ring] = SLOTS[k], sc = ring === 0 ? 1 : ring === 1 ? .84 : .6;
    el.style.transform = `translate(${x * 100}%,${y * 100}%) scale(${sc})`; el.style.setProperty('--ring', ring); el.dataset.ring = ring; };
  const render = (from) => {
    const order = [center, ...KIN[center].n.slice(0, 24)], keep = new Set(order);
    cells.forEach((el, i) => { if (!keep.has(i)) { cells.delete(i); el.classList.add('leaving'); setTimeout(() => el.remove(), RM ? 0 : 420); } });
    order.forEach((i, k) => {
      let el = cells.get(i);
      if (!el) {
        el = h('button', { type: 'button', class: 'kin-cell entering', 'aria-label': label(i), onclick: () => { if (i === center) go(i); else { path.push(center); center = i; render(el); } } },
          h('span', { class: 'kin-img', style: `--x:${i % 8};--y:${Math.floor(i / 8)}` }));
        el.addEventListener('pointerenter', () => { hover = i; caption(i); }); el.addEventListener('pointerleave', () => { if (hover === i) { hover = null; caption(center); } });
        el.addEventListener('focus', () => caption(i)); el.addEventListener('blur', () => caption(center));
        field.append(el); cells.set(i, el); place(el, k); el.style.transitionDelay = (RM ? 0 : 60 + SLOTS[k][2] * 70 + k * 6) + 'ms';
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entering')));
      } else { el.style.transitionDelay = (RM ? 0 : SLOTS[k][2] * 30) + 'ms'; place(el, k); }
      el.classList.toggle('here', k === 0); el.setAttribute('aria-current', k === 0 ? 'true' : 'false');
    });
    caption(center);
    trail.replaceChildren(...(path.length ? [h('span', {}, `${path.length} step${path.length > 1 ? 's' : ''} from where you started`), h('button', { type: 'button', onclick: () => { path = []; center = 0; render(); } }, 'start over')] : [h('span', {}, 'after Charcuterie by David Aerne')]));
  };
  kinLoad().then(() => render()).catch(() => field.replaceChildren(h('p', { class: 'kin-hint' }, 'The field didn’t load. The work is below.')));
  return h('div', { class: 'kin-wrap' }, field, h('div', { class: 'kin-side' }, h('p', { class: 'kin-lede' }, 'My work and pictures, arranged by how they look. Pick anything to wander from there.'), cap, trail));
}
/* Orbit: the hero. A wireframe sphere turning slowly, after an engineering diagram: the work travels on tilted
   orbits round a small "now" at the centre. Product work rides the near orbits, labelled; the rest of her life rides
   the outer one, quiet. The sphere leans toward the hand; touching a piece slows everything, darkens its orbit and
   draws a dotted line to the centre; clicking opens it. Drawn every frame from a little 3D model, then projected. */
// what each piece is about, so the drawing reads as the subjects I've worked in, not only project names
const TOPIC = { influence: 'Agentic AI', github: 'Dev tools research', sony: 'AI assistants', safe: 'Healthcare', hpe: 'ML observability',
  theatre: 'Theatre', wobblefoot: 'Ceramics', films: 'Film', arena: 'Collecting', door: 'Working in the open' };
function orbitHero() {
  const NS = 'http://www.w3.org/2000/svg', el = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
  const txt = (cls, x, y, s, a = {}) => { const e = el('text', { class: cls, x, y, ...a }); e.textContent = s; return e; };
  const S0 = 600, C = S0 / 2, R = 250;
  const svg = el('svg', { viewBox: `0 0 ${S0} ${S0}`, class: 'orb', role: 'img', 'aria-label': 'The subjects I work in, drawn as an orbit diagram: product work on the near orbits, the rest of me on the outer one. Work at the top, wonder at the bottom, gather on the left, make on the right.' });
  const plate = el('g', { class: 'orb-plate' }), g = el('g'), wire = el('g', { class: 'orb-wire' }), rings = el('g', { class: 'orb-rings' }), spokes = el('g', { class: 'orb-spokes' }), nodes = el('g', { class: 'orb-nodes' }), inner = el('g', { class: 'orb-inner' });
  // when a piece is touched and its orbit stills, the inside of that orbit opens like a window onto a picture of mine
  const defs = el('defs'), win = el('g', { class: 'orb-win' }), winImg = el('image', { x: 0, y: 0, width: S0, height: S0, preserveAspectRatio: 'xMidYMid slice' }); win.append(winImg);
  svg.append(defs, plate, el('circle', { class: 'orb-rim', cx: C, cy: C, r: R }), g); g.append(wire, win, inner, rings, spokes, nodes);
  // the plate: dotted cross and diagonals, ticks, the map's two axes named at the rim
  for (const [x1, y1, x2, y2] of [[C - R, C, C + R, C], [C, C - R, C, C + R]]) plate.append(el('line', { class: 'orb-dots', x1, y1, x2, y2 }));
  const d = R * Math.SQRT1_2; for (const [x1, y1, x2, y2] of [[C - d, C - d, C + d, C + d], [C + d, C - d, C - d, C + d]]) plate.append(el('line', { class: 'orb-dots faint', x1, y1, x2, y2 }));
  for (const [x1, y1, x2, y2] of [[C, C - R - 14, C, C - R + 2], [C, C + R - 2, C, C + R + 14], [C - R - 14, C, C - R + 2, C], [C + R - 2, C, C + R + 14, C]]) plate.append(el('line', { class: 'orb-tick', x1, y1, x2, y2 }));
  plate.append(txt('orb-axis', C + 8, C - R - 6, 'work'), txt('orb-axis', C + 8, C + R + 14, 'wonder'), txt('orb-axis', C - R - 8, C - 7, 'gather', { 'text-anchor': 'end' }), txt('orb-axis', C + R + 8, C - 7, 'make'));
  // a small flat system round the centre, like the plate's inner ellipses
  const flats = [[118, 22, .5], [62, 11, -.9]].map(([rx, ry, v]) => { inner.append(el('ellipse', { class: 'orb-flat', cx: C, cy: C, rx, ry })); return { rx, ry, v, dots: [0, Math.PI].map(ph => { const c = el('circle', { class: 'orb-fdot', r: 2.6 }); inner.append(c); return { c, ph }; }) }; });
  // the centre is me: it opens the about page
  const hub = el('g', { class: 'orb-hub', tabindex: 0, role: 'button', 'aria-label': 'About Harshita' });
  // at the very centre, me: a small round portrait, crossed by the plate's lines
  const face = el('clipPath', { id: 'orb-face' }); face.append(el('circle', { cx: C, cy: C, r: 21 })); defs.append(face);
  hub.append(el('circle', { class: 'orb-hit', cx: C, cy: C, r: 26 }), el('image', { class: 'orb-me', href: A('me.jpg') + '?h2', x: C - 21, y: C - 21, width: 42, height: 42, 'clip-path': 'url(#orb-face)' }), el('circle', { class: 'orb-core', cx: C, cy: C, r: 21 }), el('line', { x1: C - 30, y1: C, x2: C - 23, y2: C }), el('line', { x1: C + 23, y1: C, x2: C + 30, y2: C }), el('line', { x1: C, y1: C - 30, x2: C, y2: C - 23 }), el('line', { x1: C, y1: C + 23, x2: C, y2: C + 30 }));
  const hubL = txt('orb-hubl', C + 26, C + 34, 'me'); hub.append(hubL); g.append(hub);
  hub.addEventListener('pointerenter', () => { hubL.textContent = 'about me →'; svg.classList.add('on-hub'); });
  hub.addEventListener('pointerleave', () => { hubL.textContent = 'me'; svg.classList.remove('on-hub'); });
  hub.addEventListener('click', e => { e.stopPropagation(); ready.then(openProfile); });
  hub.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ready.then(openProfile); } });
  // orbits: radius, tilt about x, tilt about z, speed; nodes sit on them by phase
  const W = id => S.points.find(p => p.id === id);
  const ORB = [
    { r: 138, tx: .82, tz: -.3, v: .05, pts: [['influence', 0], ['github', 3.1]] },
    { r: 206, tx: 1.02, tz: .5, v: -.035, pts: [['sony', .8], ['hpe', 2.9], ['safe', 5.0]] },
    { r: 248, tx: .45, tz: -.95, v: .022, quiet: true, pts: [['theatre', .4], ['wobblefoot', 1.7], ['films', 2.9], ['arena', 4.1], ['door', 5.3]] },
  ];
  const rot = (x, y, z, ax, ay, az) => { let c = Math.cos(ax), s = Math.sin(ax); [y, z] = [y * c - z * s, y * s + z * c]; c = Math.cos(ay); s = Math.sin(ay); [x, z] = [x * c + z * s, -x * s + z * c]; c = Math.cos(az); s = Math.sin(az); [x, y] = [x * c - y * s, x * s + y * c]; return [x, y, z]; };
  const meridians = [0, 1, 2].map(() => { const p = el('path'); wire.append(p); return p; });
  const lats = [-.55, 0, .55].map(() => { const p = el('path'); wire.append(p); return p; });
  let focus = null;
  // on a phone nothing hovers, so the drawing shows itself: every few seconds it stills on the next piece and opens its window
  const tour = { stops: [], i: -1, timer: 0, stop() { clearInterval(this.timer); this.timer = 0; } };
  ORB.forEach((o, k) => { o.path = el('path', { class: 'orb-ring' + (o.quiet ? ' quiet' : '') }); rings.append(o.path);
    const cp = el('clipPath', { id: 'orb-clip-' + k }); o.clip = el('path'); cp.append(o.clip); defs.append(cp); o.clipId = 'orb-clip-' + k;
    // an arrowhead on each orbit, pointing the way it turns
    o.arrow = el('path', { class: 'orb-arrow', d: 'M0 -4 L7 0 L0 4 Z' }); rings.append(o.arrow);
    o.nodes = o.pts.map(([id, ph]) => { const p = W(id); if (!p) return null;
      const n = el('g', { class: 'orb-pt' + (o.quiet ? ' quiet' : '') + (GLOW.includes(id) ? ' glow' : ''), tabindex: 0, role: 'button', 'aria-label': (TOPIC[id] || '') + ': ' + p.title });
      n.append(el('circle', { class: 'orb-hit', r: 18 }), el('circle', { class: 'orb-dot', r: o.quiet ? 3.5 : 5 }));
      // two lines, like the plate's labels: the subject, and on touch the piece it came from
      const L = el('g', { class: 'orb-lblg' }); L.append(txt('orb-lbl', 0, 0, (TOPIC[id] || p.title).toUpperCase()), txt('orb-sub', 0, 12, p.title)); n.append(L);
      const sp = el('line', { class: 'orb-spoke' }); spokes.append(sp);
      const on = () => { if (focus && focus.n !== n) focus.off(); focus = { n, o, sp, off }; svg.classList.add('focus'); n.classList.add('on'); o.path.classList.add('on');
        winImg.setAttribute('href', A('whim/' + id + '.jpg')); win.setAttribute('clip-path', `url(#${o.clipId})`); win.classList.add('on'); };
      const off = () => { if (focus?.n === n) focus = null; svg.classList.remove('focus'); n.classList.remove('on'); o.path.classList.remove('on'); win.classList.remove('on'); };
      n.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { tour.stop(); on(); } });
      n.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') off(); });
      tour.stops.push({ on, off });
      n.addEventListener('click', e => { e.stopPropagation(); ready.then(() => open(p, n.getBoundingClientRect())); });
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); n.dispatchEvent(new MouseEvent('click')); } });
      nodes.append(n); return { n, L, ph, sp }; }).filter(Boolean); });
  let t = 0, last = 0, speed = 1, lean = [0, 0], want = [0, 0], raf = 0, seen = true;
  const ring = (rr, tx, tz, ay, steps = 96) => { let d = ''; for (let i = 0; i <= steps; i++) { const a = i / steps * Math.PI * 2; const [x, y] = rot(Math.cos(a) * rr, Math.sin(a) * rr, 0, tx + lean[1], ay, tz); d += (i ? 'L' : 'M') + (C + x).toFixed(1) + ' ' + (C + y).toFixed(1); } return d; };
  const frame = now => {
    raf = 0; const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    speed += ((focus ? .12 : 1) - speed) * .06; t += dt * speed * .6; lean[0] += (want[0] - lean[0]) * .05; lean[1] += (want[1] - lean[1]) * .05;
    const spin = t * .08 + lean[0];
    meridians.forEach((p, i) => p.setAttribute('d', ring(R, Math.PI / 2, 0, spin + i * Math.PI / 3)));
    lats.forEach((p, i) => { const y0 = [-.55, 0, .55][i] * R, rr = Math.sqrt(R * R - y0 * y0); let d = ''; for (let k = 0; k <= 72; k++) { const a = k / 72 * Math.PI * 2; let [x, y] = rot(Math.cos(a) * rr, y0, Math.sin(a) * rr, lean[1] * .6 - .32, 0, 0); d += (k ? 'L' : 'M') + (C + x).toFixed(1) + ' ' + (C + y).toFixed(1); } p.setAttribute('d', d); });
    flats.forEach(f => f.dots.forEach(q => { const a = q.ph + t * f.v; q.c.setAttribute('cx', (C + Math.cos(a) * f.rx).toFixed(1)); q.c.setAttribute('cy', (C + Math.sin(a) * f.ry).toFixed(1)); }));
    ORB.forEach(o => { const ay = spin * .4, pos = a => rot(Math.cos(a) * o.r, Math.sin(a) * o.r, 0, o.tx + lean[1], ay, o.tz);
      const rd = ring(o.r, o.tx, o.tz, ay); o.path.setAttribute('d', rd); if (focus?.o === o) o.clip.setAttribute('d', rd);
      const a0 = t * o.v * 6 + 1.6, [ax, ay2] = pos(a0), [bx, by] = pos(a0 + Math.sign(o.v) * .05);
      o.arrow.setAttribute('transform', `translate(${(C + ax).toFixed(1)} ${(C + ay2).toFixed(1)}) rotate(${(Math.atan2(by - ay2, bx - ax) * 180 / Math.PI).toFixed(1)})`);
      o.nodes.forEach(q => { const a = q.ph + t * o.v * 6; const [x, y, z] = pos(a);
        q.n.setAttribute('transform', `translate(${(C + x).toFixed(1)} ${(C + y).toFixed(1)})`); q.n.style.setProperty('--z', ((z / o.r + 1) / 2).toFixed(2));
        // labels lean outward, away from the centre, so they never pile up on the hub; near the rim they turn inward to stay on the page
        const edge = Math.abs(x) > R * .45, right = edge ? x < 0 : x >= 0, anchor = right ? 'start' : 'end';
        q.L.setAttribute('transform', `translate(${right ? 11 : -11} ${y < 0 ? -16 : 15})`); for (const c of q.L.children) c.setAttribute('text-anchor', anchor);
        q.n.classList.toggle('back', z < -o.r * .25);
        q.sp.setAttribute('x1', C); q.sp.setAttribute('y1', C); q.sp.setAttribute('x2', (C + x).toFixed(1)); q.sp.setAttribute('y2', (C + y).toFixed(1)); q.sp.classList.toggle('on', focus?.n === q.n); }); });
    if (seen && !document.hidden) raf = requestAnimationFrame(frame);
  };
  // anywhere else on the drawing: a note follows the hand, and a click goes to the map
  const hint = txt('orb-hint', 0, 0, 'explore the map →'); svg.append(hint);
  const pt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S0, (e.clientY - r.top) / r.height * S0, r]; };
  const free = e => !e.target.closest('.orb-pt,.orb-hub');
  svg.addEventListener('pointermove', e => { const [x, y, r] = pt(e); want = [((e.clientX - r.left) / r.width - .5) * .5, ((e.clientY - r.top) / r.height - .5) * .35];
    const inside = Math.hypot(x - C, y - C) < R + 10 && free(e); svg.classList.toggle('maphint', inside); if (inside) hint.setAttribute('transform', `translate(${(x + 14).toFixed(1)} ${(y + 22).toFixed(1)})`); }, { passive: true });
  svg.addEventListener('pointerleave', () => { want = [0, 0]; svg.classList.remove('maphint'); });
  svg.addEventListener('click', e => { const [x, y] = pt(e); if (free(e) && Math.hypot(x - C, y - C) < R + 10) toggleIndex(false); });
  // only turn while it's on screen
  new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && !raf) raf = requestAnimationFrame(frame); }).observe(svg);
  if (RM) { requestAnimationFrame(frame); seen = false; } else raf = requestAnimationFrame(frame);
  if (matchMedia('(hover: none)').matches && !RM) setTimeout(() => { tour.timer = setInterval(() => { if (document.hidden || !seen) return; const s = tour.stops; s[(tour.i + s.length) % s.length]?.off(); tour.i = (tour.i + 1) % s.length; s[tour.i].on(); }, 3600); }, 2400);
  // fetch the pictures ahead, so the window opens at once
  requestIdleCallback?.(() => Object.keys(TOPIC).forEach(id => { new Image().src = A('whim/' + id + '.jpg'); }));
  // one corner note: where
  svg.append(txt('orb-corner', S0 - 8, S0 - 10, 'San Francisco 37.77N 122.42W', { 'text-anchor': 'end' }));
  return svg;
}
// a line that changes face on a touch: each word lifts away as a soft wisp and settles back in Averia, one after another
function wisp(text) { return h('span', { class: 'wisp', 'aria-hidden': 'true' }, ...text.split(' ').flatMap((w, i, a) => [h('span', { class: 'wd', style: '--i:' + i }, h('span', { class: 'a' }, w), h('span', { class: 'b' }, w)), i < a.length - 1 ? ' ' : ''])); }
function buildIndex(ix) {
  ix._built = true;
  const P = S.profile, work = WORK_ORDER.map(id => S.points.find(p => p.id === id)).filter(Boolean);
  const card = (p, i) => { const src = p.still || p.img, r = h('button', { type: 'button', class: 'wk-card pt-row' + (i === 0 ? ' lead' : ''), onclick: e => ready.then(() => open(p, (e.currentTarget.querySelector('img') || e.currentTarget).getBoundingClientRect())) },
    h('span', { class: 'wk-img' }, src ? h('img', { src: A(src), alt: p.alt || p.title, loading: i < 2 ? 'eager' : 'lazy' }) : null),
    h('span', { class: 'wk-meta' }, [p.org, p.year].filter(Boolean).join(' · ')),
    h('span', { class: 'wk-title' }, p.title),
    h('span', { class: 'wk-line' }, p.card || p.line)); r._p = p; return r; };
  const toMap = label => h('button', { type: 'button', class: 'wk-tomap', onclick: () => { toggleIndex(false); ix.scrollTop = 0; } }, label);
  const out = (href, txt) => h('a', { href, target: '_blank', rel: 'noopener' }, txt);
  const lately = h('dl', { class: 'wk-lately' });
  // the first screen: the drawing alone in the middle; the line about my work at the foot (it opens the about page), and how to reach me beside it
  ix.replaceChildren(h('div', { class: 'wk' },
    h('section', { class: 'wk-stage' },
      h('figure', { class: 'wk-hero' }, orbitHero()),
      h('div', { class: 'wk-c bl' }, h('h1', { class: 'wk-lede' }, h('button', { type: 'button', class: 'wk-about', 'aria-label': S.person.now + ' About me', onclick: () => ready.then(openProfile) }, wisp(S.person.now), h('span', { class: 'wk-arrow', 'aria-hidden': 'true' }, h('i'), h('b')))),
        h('p', { class: 'wk-before' }, S.person.before)),
      h('div', { class: 'wk-c br' }, contactLinks())),
    h('section', { class: 'wk-sec' }, h('h2', { class: 'wk-lab' }, 'Selected work', h('span', {}, String(work.length).padStart(2, '0'))), h('div', { class: 'wk-grid' }, work.map(card))),
    h('section', { class: 'wk-sec wk-off' }, h('h2', { class: 'wk-lab' }, 'Off the clock'), lately,
      // the resemblance field (kinField) rests until there's more work to arrange
      h('p', { class: 'wk-offline' }, 'Theatre, films, clay, and collections of things worth keeping live on the map.', toMap('Go play →')))));
  // what I'm watching and keeping lately, from Letterboxd and Are.na
  const row = (k, ...v) => [h('dt', {}, k), h('dd', {}, ...v)];
  ready.then(() => {
    const films = (DATA.films || []).slice().sort((a, b) => (b.watched || '').localeCompare(a.watched || '')).slice(0, 3);
    const chans = (DATA.arena?.channels || []).map(c => ({ c, at: c.blocks.reduce((m, b) => (b.connected_at || '') > m ? b.connected_at : m, '') })).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 2);
    const list = (xs, f) => xs.flatMap((x, i) => [i ? (i === xs.length - 1 ? ' and ' : ', ') : '', f(x)]);
    lately.replaceChildren(
      ...(films.length ? row('Watching', ...list(films, f => out(f.link, f.title)), ', on ', out(S.person.letterboxd, 'Letterboxd'), '.') : []),
      ...(chans.length ? row('Keeping', ...list(chans, ({ c }) => out(c.url, c.title)), ', on ', out(S.person.arena, 'Are.na'), '.') : []));
  });
}
const views = $('#views');
// back from a wall the page may come out of the browser's cache mid-departure; clear the blur
addEventListener('pageshow', e => { if (e.persisted) body.classList.remove('collection-leaving'); });
/* the menu: the word you're on wears Averia, a soft inked italic. Hover lends it to another word,
   letter by letter, and it comes home when you leave. Every other link only fades. */
const menu = $('.b-menu');
$$('.mw', menu).forEach(b => { const w = b.textContent.trim(); b.setAttribute('aria-label', w); b.replaceChildren(...['a', 'b'].map(k => h('span', { class: 'mw-' + k, 'aria-hidden': 'true' }, [...w].map((c, i) => h('i', { style: '--i:' + i }, c))))); });
// The view toggle wears Averia on the side you're on, under a sliding pill; "about" borrows it only while hovered.
const wearCurrent = () => $$('button', views).forEach(x => x.classList.toggle('worn', x.classList.contains('on')));
const vpill = $('.vpill', views); let pillAt = null;
function placePill() {
  wearCurrent();
  const b = $('button.on', views); if (!b) return;
  const to = [b.offsetLeft, b.offsetWidth], from = pillAt; pillAt = to;
  vpill.style.transform = `translateX(${to[0]}px)`; vpill.style.width = to[1] + 'px';
  if (!from || RM || from[0] === to[0]) return;
  // The pill stretches across both words like a drop of ink, then lets go and settles with a little give.
  const l = Math.min(from[0], to[0]), w = Math.max(from[0] + from[1], to[0] + to[1]) - l, dir = Math.sign(to[0] - from[0]);
  vpill.animate([
    { transform: `translateX(${from[0]}px) scaleY(1)`, width: from[1] + 'px' },
    { transform: `translateX(${l}px) scaleY(.82)`, width: w + 'px', offset: .42 },
    { transform: `translateX(${to[0] + dir * 3}px) scaleY(1.06)`, width: (to[1] - 4) + 'px', offset: .74 },
    { transform: `translateX(${to[0]}px) scaleY(1)`, width: to[1] + 'px' }
  ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
const indexMotion = { timers: [], phase: null };
function cancelIndexMotion() {
  indexMotion.timers.forEach(timer => clearTimeout(timer)); indexMotion.timers = []; indexMotion.phase = null;
  body.classList.remove('index-crossfade', 'index-crossfade-entering', 'index-crossfade-leaving');
}
function crossfadeIndex(on) {
  renderIndex(); indexMotion.phase = on ? 'crossfade-in' : 'crossfade-out';
  body.classList.add('index-crossfade', on ? 'index-crossfade-entering' : 'index-crossfade-leaving');
  if (on) requestAnimationFrame(() => body.classList.add('show-index'));
  else body.classList.remove('show-index');
  indexMotion.timers.push(setTimeout(() => { body.classList.remove('index-crossfade', 'index-crossfade-entering', 'index-crossfade-leaving'); indexMotion.phase = on ? 'list' : null; }, 260));
}
function toggleIndex(on) {
  history.replaceState(null, '', on ? '#work' : location.pathname + location.search);
  const moving = !!indexMotion.phase;
  if (!moving && on === body.classList.contains('show-index')) return;
  cancelIndexMotion();
  $$('button', views).forEach(b => b.classList.toggle('on', (b.dataset.v === 'work') === on)); placePill();
  hidePlate(); pill.classList.remove('on');
  if (on) { body.classList.remove('show-index'); crossfadeIndex(true); }
  else if (body.classList.contains('show-index')) crossfadeIndex(false);
}
$$('button', views).forEach(b => b.onclick = () => { const list = b.dataset.v === 'work'; if (list !== body.classList.contains('show-index')) window.portfolioSound?.steps(!list); toggleIndex(list); });

/* ---------- lights out ---------- */
// The other theme spreads out from the switch as a widening circle; the sun folds its rays and takes a bite to become a moon.
const themeBtn = $('#themeBtn'), docEl = document.documentElement;
if (themeBtn) { themeBtn.replaceChildren(iconSvg(LIGHT_ICON)); themeBtn.classList.add('ico'); }
const markTheme = t => { themeBtn.setAttribute('aria-pressed', t === 'dark'); const l = t === 'dark' ? 'Lights off' : 'Lights on'; themeBtn.setAttribute('aria-label', l); themeBtn.title = l.toLowerCase(); };
if (themeBtn) {
  markTheme(docEl.dataset.theme);
  themeBtn.onclick = () => {
    const t = docEl.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => { docEl.classList.add('no-tx'); docEl.dataset.theme = t; markTheme(t); try { localStorage.setItem('theme', t); } catch {} setTimeout(() => docEl.classList.remove('no-tx'), 900); };
    window.portfolioSound?.dusk(t === 'dark');
    if (RM || !document.startViewTransition) return apply();
    const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => docEl.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 760, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  };
}
requestAnimationFrame(placePill); document.fonts && document.fonts.ready.then(placePill);
// Her name is the way to the card.
$('#home').onclick = e => { e.preventDefault(); ready.then(openProfile); };

/* boot */
plane.addEventListener('click', e => { if (!e.target.closest('.pt,.mark,button,a') && active) setFilter(null); });
buildPlane(); renderIndex(); document.fonts && document.fonts.ready.then(layout);
// people arrive on the map; the work has its own address, #work (harshitashyale.com/work for the CV)
// a piece can be linked to directly: #p-github opens it over the work
window.openPiece = id => { const p = S.points.find(x => x.id === id); if (p) ready.then(() => open(p, null)); };
const piece = location.hash.startsWith('#p-') ? location.hash.slice(3) : '';
const startOnWork = location.hash === '#work' || !!piece;
if (startOnWork) { $$('button', views).forEach(b => b.classList.toggle('on', b.dataset.v === 'work')); body.classList.add('show-index'); requestAnimationFrame(placePill); }
if (piece) window.openPiece(piece);
window.refreshPortfolio = () => { buildPlane(); renderIndex(); layout(); };
let lastMobile = mobile(); addEventListener('resize', () => { if (mobile() !== lastMobile) { lastMobile = mobile(); buildPlane(); $('#index')._built = false; renderIndex(); } else layout(); });
const intro = $('#intro');
let arrivalTimer = 0, introTimers = [], introActive = false;
const arrive = d => { clearTimeout(arrivalTimer); body.style.setProperty('--ad', d + 'ms'); body.classList.add('arriving'); arrivalTimer = setTimeout(() => body.classList.remove('arriving'), d + 2800); };
const unlistenIntro = () => { document.removeEventListener('click', skipIntro, true); document.removeEventListener('keydown', skipIntro, true); };
const skipIntro = e => {
  if (!introActive) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  introActive = false; introTimers.forEach(clearTimeout); clearTimeout(arrivalTimer); unlistenIntro();
  body.classList.remove('introing', 'arriving'); intro.remove();
};
if (sessionStorage.getItem('seen') || RM || startOnWork) { intro.remove(); if (!sessionStorage.getItem('seen')) { sessionStorage.setItem('seen', 1); arrive(0); } }
else {
  /* The opening: one line, set right where the axes cross. It gathers out of a soft blur, holds a breath,
     then parts from the middle outward like mist, and in the same breath the axes draw out from that point
     and the dots surface in a ripple, nearest first. One curve, one tempo, so it reads as a single gesture. */
  sessionStorage.setItem('seen', 1); body.classList.add('introing');
  const p = $('p', intro), words = p.textContent.trim().split(/\s+/), mid = (words.length - 1) / 2;
  const spans = words.map((word, i) => h('span', { class: 'intro-word', style: `--in:${i * 60}ms;--out:${Math.abs(i - mid) * 55}ms;--side:${Math.sign(i - mid)}` }, word));
  p.replaceChildren(...spans.flatMap((s, i) => i < spans.length - 1 ? [s, ' '] : [s]));
  intro.replaceChildren(h('div', { class: 'intro-inner' }, p));
  introActive = true; document.addEventListener('click', skipIntro, true); document.addEventListener('keydown', skipIntro, true);
  const part = 2300, gone = part + 1300;
  arrive(part + 120);
  introTimers.push(setTimeout(() => intro.classList.add('parting'), part));
  introTimers.push(setTimeout(() => { introActive = false; unlistenIntro(); body.classList.remove('introing'); intro.remove(); }, gone));
}
// the collection and films borrow their pictures from data that arrives a moment later
ready.then(() => { if (mobile()) { $('#index')._built = false; renderIndex(); } });
})();
