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
$('#tagline').textContent = S.person.line;
$('#mailLink').href = 'mailto:' + S.person.email;
const time = tz => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).toLowerCase();
const weatherKey = 'seattle-weather', weatherCache = (() => { try { const x = JSON.parse(sessionStorage.getItem(weatherKey)); return x && Date.now() - x.at < 1800000 ? x : null; } catch { return null; } })();
const wx = { 0:'clear',1:'mostly clear',2:'partly cloudy',3:'overcast',45:'fog',48:'fog',51:'drizzle',53:'drizzle',55:'drizzle',56:'drizzle',57:'drizzle',61:'rain',63:'rain',65:'rain',66:'rain',67:'rain',71:'snow',73:'snow',75:'snow',77:'snow',80:'showers',81:'showers',82:'showers',85:'snow',86:'snow',95:'thunder',96:'thunder',99:'thunder' };
let weather = weatherCache && weatherCache.weather;
const clock = () => { const condition = weather ? `, ${weather.temp}° ${weather.text}` : ''; $('#clock-time').innerHTML = `seattle <b>${time('America/Los_Angeles')}${condition}</b> · you, <b>${time()}</b>`; };
clock(); setInterval(clock, 15000);
if (!weatherCache) fetch('https://api.open-meteo.com/v1/forecast?latitude=47.61&longitude=-122.33&current=temperature_2m,weather_code&temperature_unit=fahrenheit').then(r => r.ok ? r.json() : Promise.reject()).then(d => { const c = d.current; weather = { temp: Math.round(c.temperature_2m), text: wx[c.weather_code] || 'overcast' }; sessionStorage.setItem(weatherKey, JSON.stringify({ at: Date.now(), weather })); clock(); }).catch(() => {});
const editorShortcut = $('#editor-shortcut');
const updateEditorShortcut = () => { let enabled = false; try { enabled = localStorage.getItem('site-editor') === '1'; } catch {} editorShortcut.hidden = !enabled; body.classList.toggle('editor-enabled', enabled); };
if (editorShortcut) { updateEditorShortcut(); editorShortcut.addEventListener('click', () => window.enterPortfolioEdit?.()); window.addEventListener('site-editor-enabled', updateEditorShortcut); }

/* ---------- filters (Ainsley-style word list) ---------- */
const fwrap = $('#filters'), legend = $('#type-legend'); let active = null;
const count = k => S.points.filter(p => p.tags.includes(k)).length;
const types = [['work','●'],['collections','◎'],['making','▲'],['writing','■']];
types.filter(([type]) => S.points.some(p => p.type === type)).forEach(([type, glyph]) => legend.append(h('button', { class:'legend-item', 'data-type':type, onmouseenter:()=>preview('type:'+type), onmouseleave:()=>preview(active), onfocus:()=>preview('type:'+type), onblur:()=>preview(active), onclick:()=>setFilter(active==='type:'+type?null:'type:'+type), 'aria-label':'Filter '+type }, h('i',{class:'type-glyph '+type},glyph), ' '+type)));
S.filters.filter(([k]) => count(k) > 0).forEach(([k, label]) => fwrap.append(h('button', { 'data-k': k, onmouseenter: () => preview(k), onmouseleave: () => preview(active), onfocus: () => preview(k), onblur: () => preview(active), onclick: () => setFilter(active === k ? null : k) }, label, h('sup', {}, String(count(k))))));
fwrap.append(h('button', { class: 'clear', onclick: () => setFilter(null) }, 'show everything'));
function matches(p,k) { return k ? k.startsWith('type:') ? p.type===k.slice(5) : p.tags.includes(k) : true; }
function preview(k) { $$('.pt').forEach(e => { const on = matches(e._p,k); e.classList.toggle('match', !!k && on); e.classList.toggle('mute', !!k && !on); }); legend.classList.toggle('has-active',!!k&&k.startsWith('type:')); }
function setFilter(k) { active = k; fwrap.classList.toggle('has-active', !!k); $$('button[data-k]', fwrap).forEach(b => b.classList.toggle('on', b.dataset.k === k)); $$('[data-type]',legend).forEach(b=>b.classList.toggle('on',k==='type:'+b.dataset.type)); preview(k); renderIndex(); }

/* ---------- plane ---------- */
const MARK = window.portfolioMark.markup();
function buildPlane() {
  plane.innerHTML = '';
  if (mobile()) return buildMobile();
  plane.append(h('div', { class: 'axis h' }), h('div', { class: 'axis v' }), h('div', { class: 'ticks', id: 'ticks' }));
  for (const [side, w] of [['top', 'work'], ['bottom', 'wonder'], ['left', 'gather'], ['right', 'make']]) plane.append(h('div', { class: 'alabel ' + side, tabindex: 0 }, w, h('small', {}, S.axes[w].gloss)));
  for (const [q, d] of Object.entries(S.quads)) {
    const label=h('div', { class: 'qlabel q-' + q }, h('span',{class:'quad-name'},d.name),h('small',{},d.key));
    if(q==='tr'&&!sessionStorage.getItem('work-dot-hovered')) label.append(h('span',{class:'start-here'},'start with the work →'));
    plane.append(label);
  }
  const mark = h('button', { class: 'mark', 'aria-label': 'A note from Harshita', html: MARK + '<span class="hint"><span class="hint-default">(hello)</span><span class="hint-hover">(who’s plotting this?)</span></span>', onclick: e => openAbout(e.currentTarget) });
  plane.append(mark);
  S.points.forEach((p, i) => { const e = h('button', { style: '--i:' + i, class: 'pt' + (p.x > 0.55 || (p.x < 0 && p.x > -0.35) ? ' left' : ''), 'data-kind': p.kind, 'data-type':p.type, 'data-pulse':p.type==='work'&&p.quad==='tr'?'true':null, 'data-id': p.id, 'aria-label': `${p.title}, ${p.meta}` }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, h('span',{class:'point-title'},p.title), p.type==='work'?h('em',{},p.org):h('em', {}, p.year || ''))); e._p = p; bindPoint(e); plane.append(e); });
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
  plane.append(h('button', { class: 'mark', 'aria-label': 'A note from Harshita', html: MARK + '<span class="hint"><span class="hint-default">(hello)</span><span class="hint-hover">(who’s plotting this?)</span></span>', onclick: e => openAbout(e.currentTarget) }));
  for (const [q, d] of Object.entries(S.quads)) { const g = h('section', { class: 'mgroup' }, h('h2', {}, d.name, h('small', {}, d.key))); S.points.filter(p => p.quad === q).forEach(p => { const e = h('button', { class: 'pt', 'data-kind': p.kind, 'data-type':p.type, 'data-id': p.id }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, h('span',{class:'point-title'},p.title), h('em', {}, p.type==='work'?p.org:p.meta))); e._p = p; bindPoint(e); g.append(e); }); plane.append(g); }
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
  if(p.id==='wobblefoot') return h('div',{class:'turnaround-preview',style:`background-image:url("${A('wobblefoot-sheet.jpg')}")`});
  if (p.img) return h('img', { src: A(p.img), alt: '' });
  return null;
}
function bindPoint(e) {
  const p = e._p;
  let turnTimer;
  const stopHint=()=>{if(p.type==='work'&&!sessionStorage.getItem('work-dot-hovered')){sessionStorage.setItem('work-dot-hovered','1');$('.start-here')?.remove();body.classList.add('work-pulse-stopped');}};
  e.addEventListener('mouseenter', () => { if (sheetOpen) return; if(p.id==='wobblefoot')e.classList.add('wobbling'); stopHint(); const c = plateFor(p); plate.replaceChildren(...(c ? [c] : [])); if(p.id==='wobblefoot'&&!RM){let n=0;turnTimer=setInterval(()=>{if(c)c.style.backgroundPosition=`${n%2?100:0}% ${Math.floor(n/2)*50}%`;n=(n+1)%6;},180);} requestAnimationFrame(() => plate.classList.toggle('on', !!c && !sheetOpen)); pill.innerHTML = `${p.title}<span class="k">${p.org}</span>`; pill.classList.add('on'); });
  e.addEventListener('mouseleave', () => {clearInterval(turnTimer);e.classList.remove('wobbling');plate.classList.remove('on'); pill.classList.remove('on'); });
  e.addEventListener('click', () => { stopHint(); const r = srcRect(p); ready.then(() => open(p, r)); });
}

/* ---------- sheet ---------- */
const sheet = $('#sheet'), veil = $('#veil'); let sheetOpen = false, lastFocus = null;
let curP = null, fromR = null;
const ptEl = p => $$('.pt').find(e => e._p === p);
function srcRect(p) { const m = plate.classList.contains('on') && plate.firstElementChild; if (m) return m.getBoundingClientRect(); const d = ptEl(p); return d ? d.querySelector('.dot').getBoundingClientRect() : null; }
const thumbSrc = q => q.img ? A(q.img) : q.kind === 'archive' && DATA.arena ? (b => b && (b.image.local || b.image.thumb))(DATA.arena.channels.flatMap(c => c.blocks).find(b => b.image)) : q.kind === 'films' && DATA.films && DATA.films[0] ? DATA.films[0].local || DATA.films[0].poster : null;
function heroFor(p) {
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
  plate.classList.remove('on'); pill.classList.remove('on');
  if (!sheetOpen) lastFocus = document.activeElement;
  const p = curP, from = fromR, was = sheetOpen; curP = fromR = null;
  sheet.dataset.quad = quadKey || ''; sheet._p = p; sheet.classList.remove('leaving');
  const hero = p ? heroFor(p) : null, [dock, name] = dockFor(p);
  if (was) dock.classList.add('still');
  const work=p&&p.type==='work';
  const head=work?h('header',{class:'case-head'},h('p',{class:'mono'},`${p.org} · ${p.year} · ${p.role}`),h('h2',{class:'s-title'},p.title),h('p',{class:'case-line'},p.line)):null;
  sheet.replaceChildren(...[h('div', { class: 'c-top' }, h('button', { class: 'c-x', onclick: closeSheet, 'aria-label': 'Close' }, '×'), dock), h('div', { class: 'c-namewrap' }, name), head, hero ? h('div', { class: 'c-hero' + (hero.tagName === 'VIDEO' ? ' v' : '') }, hero) : null, h('div', { class: 'body' }, title&&!work ? [h('p', { class: 'c-kick c-in' }, kicker), h('h2', { class: 's-title c-in' }, title)] : null, ...content)].filter(Boolean));
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
    numbers(), quote(), research(), ...steps('github-stacked-step-'), learned(), closing(),
  ].filter(Boolean);
  if (!point || point.case !== 'github') return h('div', { class: 'short' }, ...stackedContent());

  const initialLayout = mobile() ? 'stacked' : 'side-by-side';
  const root = h('div', { class: 'short github-case', 'data-layout': initialLayout });
  const sideButton = h('button', { class: 'side-by-side', 'aria-pressed': String(initialLayout === 'side-by-side') }, 'side-by-side');
  const stackedButton = h('button', { class: 'stacked', 'aria-pressed': String(initialLayout === 'stacked') }, 'stacked');
  const layoutSwitch = h('div', { class: 'github-layout-switch mono' }, h('span', {}, 'layout: '), sideButton, ' / ', stackedButton);
  const tocLinks = new Map();
  const toc = h('nav', { class: 'github-toc', 'aria-label': 'Case study sections' },
    h('p', { class: 'mono' }, 'in this study'),
    (c.steps || []).map(s => {
      const link = h('button', { type: 'button', onclick: () => {
        const target = $(`#github-step-${s.n}`, root), box = target.getBoundingClientRect(), sheetBox = sheet.getBoundingClientRect();
        sheet.scrollTo({ top: sheet.scrollTop + box.top - sheetBox.top - 96, behavior: RM ? 'auto' : 'smooth' });
      } }, h('span', { class: 'mono' }, s.n), ' ' + s.t);
      tocLinks.set(s.n, link); return link;
    }));
  const side = h('aside', { class: 'github-side' },
    h('p', { class: 'c-kick' }, kicker), h('h2', { class: 's-title' }, point.title),
    c.facts ? h('p', { class: 'c-facts reveal' }, c.facts) : null,
    c.q ? h('p', { class: 'c-q reveal' }, c.q) : null,
    numbers(), toc);
  const story = h('div', { class: 'github-story' },
    c.problem ? h('p', { class: 'c-p reveal' }, c.problem) : null,
    quote(), research(), ...steps('github-step-'), learned(), closing());
  const layout = h('div', { class: 'github-layout', 'data-layout': initialLayout }, side, story);
  const stacked = h('div', { class: 'github-stacked' },
    h('p', { class: 'c-kick c-in' }, kicker), h('h2', { class: 's-title c-in' }, point.title),
    ...stackedContent());
  const setLayout = value => {
    if (mobile() && value === 'side-by-side') value = 'stacked';
    root.dataset.layout = value; layout.dataset.layout = value;
    sideButton.classList.toggle('on', value === 'side-by-side'); sideButton.setAttribute('aria-pressed', String(value === 'side-by-side'));
    stackedButton.classList.toggle('on', value === 'stacked'); stackedButton.setAttribute('aria-pressed', String(value === 'stacked'));
  };
  sideButton.onclick = () => setLayout('side-by-side'); stackedButton.onclick = () => setLayout('stacked');
  root.append(layoutSwitch, layout, stacked); setLayout(initialLayout);

  const sideSteps = $$('.c-step[data-step]', story);
  const setActive = n => tocLinks.forEach((link, key) => link.classList.toggle('active', key === n));
  setActive(c.steps && c.steps[0] ? c.steps[0].n : '');
  if ('IntersectionObserver' in window) requestAnimationFrame(() => {
    if (!story.isConnected) return;
    const updateActive = () => {
      const top = sheet.getBoundingClientRect().top + 110;
      const inView = sideSteps.filter(step => { const rect = step.getBoundingClientRect(); return rect.top <= top && rect.bottom > top; });
      const activeStep = inView[inView.length - 1] || sideSteps.find(step => step.getBoundingClientRect().bottom > top);
      if (activeStep) setActive(activeStep.dataset.step);
    };
    if (sheet._scrollSpyCleanup) sheet._scrollSpyCleanup();
    const observer = new IntersectionObserver(updateActive, { root: sheet, rootMargin: '-90px 0px -62% 0px', threshold: 0 });
    sideSteps.forEach(step => observer.observe(step));
    sheet.addEventListener('scroll', updateActive, { passive: true });
    sheet._scrollSpyCleanup = () => { observer.disconnect(); sheet.removeEventListener('scroll', updateActive); };
    updateActive();
  });
  return root;
}
const caseHTML = id => DATA.cases && DATA.cases[id] ? h('div', { class: 'prose reveal', html: DATA.cases[id].html }) : null;

function open(p, rect) {
  if (p.type === 'collections' || p.kind === 'clay') {
    body.classList.add('collection-leaving');
    const url=p.kind==='clay'?'collection.html?c=clay':p.id==='films'?'collection.html?c=films':p.id==='odds'?'collection.html?c=odds':'collection.html';
    setTimeout(() => { location.href = url; }, 350);
    return;
  }
  if (sheetOpen) $$('video', sheet).forEach(v => v.pause());
  curP = p; fromR = rect || srcRect(p);
  const K = kick(p), line = h('p', { class: 's-line reveal' }, p.line);
  const sc = p.case && DATA.short && DATA.short[p.case] ? shortCase(DATA.short[p.case], p, K) : null;
  if (p.case === 'github' && sc) {
    openSheet(p.quad, K, '', sc);
    $('.body', sheet).classList.add('wide');
    return;
  }
  if (p.kind === 'vault' || p.kind === 'shipped') return openSheet(p.quad, K, p.title, sc || line, sc ? null : metaList([['where', p.org], ['when', p.year], ['tags', p.tags.join(' · ')]]), p.video ? h('p', { class: 'c-cap reveal' }, p.vcap) : null, diagram(p.id), sc ? null : p.kind === 'shipped' ? crops(p) : p.images ? h('div', { class: 's-imgs' }, p.images.slice(1).map(f => h('img', { class: 'reveal', src: A(f), alt: p.alt || '', loading: 'lazy' }))) : null);
  if (p.kind === 'films') return ready.then(() => openFilms(K));
  if (p.kind === 'paper') return openSheet('bl', K, p.title, line, h('p', { class: 'reveal', style: 'margin-top:22px' }, h('a', { href: p.href, class: 'serif', style: 'font-size:22px;font-style:italic;border-bottom:1px solid currentColor' }, 'read it, like a book →')));
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

/* about — the note at the origin: a long-star card that grows out of the mark */
const SHAPE = { p: 40, q: 24 };
const star = (p, q) => `polygon(${q}px ${p}px,50% 0,calc(100% - ${q}px) ${p}px,100% 50%,calc(100% - ${q}px) calc(100% - ${p}px),50% 100%,${q}px calc(100% - ${p}px),0 50%)`;
let helloOpen = false, helloFrom = null;
const helloRoot = h('div', { id: 'hello', hidden: true });
document.body.append(helloRoot);
function openAbout(fromEl) {
  if (helloOpen) return;
  if (sheetOpen) closeSheet();
  helloOpen = true;
  const name = S.person.name || 'Harshita Shyale', sp = name.indexOf(' ');
  const first = sp > 0 ? name.slice(0, sp) : name, last = sp > 0 ? name.slice(sp + 1) : '';
  const room = id => S.points.find(p => p.id === id);
  const go = id => () => { const p = room(id); closeAbout(true); if (p) setTimeout(() => open(p, null), 260); };
  const frames = [0, 1.5, 8, 9.5].map((inset, k) => h('i', { class: 'f' + (k + 1), style: `inset:${inset}px;clip-path:${star(Math.max(0, SHAPE.p - inset * .9), Math.max(0, SHAPE.q - inset * .6))}` }));
  const exp = S.experience || [];
  const card = h('div', { class: 'h-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hname' }, frames,
    h('div', { class: 'hb', style: `padding:${SHAPE.p + 28}px ${SHAPE.q + 34}px ${SHAPE.p + 16}px` },
      h('span', { class: 'cameo h-in', style: '--i:0' }, h('img', { src: A('note-cameo.jpg'), alt: 'Harshita, smiling, holding a bunch of yellow flowers.' })),
      h('p', { class: 'where h-in', style: '--i:1' }, '(0, 0) — the origin'),
      h('h2', { class: 'hname h-in', id: 'hname', style: '--i:1', 'data-about-field': 'name', 'aria-label': name },
        h('span', { class: 'ini' }, first.charAt(0)), first.slice(1), last ? ' ' : '', last ? h('span', { class: 'ini' }, last.charAt(0)) : null, last.slice(1)),
      h('i', { class: 'fleuron h-in', style: '--i:2', html: MARK }),
      h('p', { class: 'p1 about-line h-in', style: '--i:3', 'data-about-field': 'line' }, S.about[0]),
      S.about.slice(1).map((text, k) => h('p', { class: 'p2 about-small h-in', style: '--i:' + (4 + k), 'data-about-field': 'small' }, text)),
      exp.length ? h('p', { class: 'facts h-in', style: '--i:6' }, `now ${exp[0][0]} · before ${exp.slice(1).map(e => e[0].replace('Hewlett Packard Enterprise', 'HPE')).join(', ')} · M.S. HCDE, UW`) : null,
      h('p', { class: 'links h-in', style: '--i:7' },
        room('theatre') ? h('button', { type: 'button', onclick: go('theatre') }, 'theatre') : null,
        room('odds') ? h('button', { type: 'button', onclick: go('odds') }, 'odds & ends') : null,
        h('a', { href: S.person.resume, target: '_blank', rel: 'noopener' }, 'résumé ↗'),
        h('a', { href: S.person.linkedin, target: '_blank', rel: 'noopener' }, 'linkedin ↗'),
        h('a', { href: 'https://www.instagram.com/ashlime_soda/', target: '_blank', rel: 'noopener' }, 'instagram ↗')),
      h('p', { class: 'mail h-in', style: '--i:8' }, h('a', { href: 'mailto:' + S.person.email }, S.person.email)),
      h('button', { type: 'button', class: 'h-x h-in', style: '--i:8', onclick: () => closeAbout() }, '(close)')));
  helloRoot.replaceChildren(h('div', { class: 'h-veil', onclick: () => closeAbout() }), card);
  helloRoot.hidden = false; void helloRoot.offsetWidth; helloRoot.classList.add('on');
  body.classList.add('hello-open');
  // Grow out of whatever was clicked (the mark, or the about button) and settle with a little overshoot.
  helloFrom = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
  const b = card.getBoundingClientRect(), f = helloFrom;
  if (!RM) card.animate(f && f.width ? [
    { transform: `translate(${f.left + f.width / 2 - (b.left + b.width / 2)}px,${f.top + f.height / 2 - (b.top + b.height / 2)}px) scale(.08) rotate(-8deg)`, opacity: 0, filter: 'blur(6px)' },
    { opacity: 1, offset: .35 },
    { transform: 'none', opacity: 1, filter: 'blur(0)' }
  ] : [{ transform: 'scale(.95)', opacity: 0, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 780, easing: 'cubic-bezier(.34,1.18,.64,1)' });
  setTimeout(() => $('.h-x', card)?.focus({ preventScroll: true }), 80);
}
function closeAbout(quick) {
  if (!helloOpen) return;
  helloOpen = false;
  const card = $('.h-card', helloRoot), f = helloFrom;
  helloRoot.classList.remove('on'); body.classList.remove('hello-open');
  const done = () => { helloRoot.hidden = true; helloRoot.replaceChildren(); };
  if (RM || !card) return done();
  const b = card.getBoundingClientRect();
  card.animate([{ transform: 'none', opacity: 1 }, f && f.width && !quick
    ? { transform: `translate(${f.left + f.width / 2 - (b.left + b.width / 2)}px,${f.top + f.height / 2 - (b.top + b.height / 2)}px) scale(.08) rotate(6deg)`, opacity: 0, filter: 'blur(4px)' }
    : { transform: 'scale(.97)', opacity: 0, filter: 'blur(4px)' }], { duration: quick ? 220 : 460, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = done;
  $('.mark')?.focus({ preventScroll: true });
}
addEventListener('keydown', e => { if (e.key === 'Escape' && helloOpen) { e.stopImmediatePropagation(); closeAbout(); } }, true);
$('#aboutBtn').onclick = e => openAbout(e.currentTarget);

/* list: andrew trousdale's index card, toggled like dmcg */
const qOrder = { tr: 0, tl: 1, br: 2, bl: 3 };
const SEC = [['work','work (start here)'],['collections','collections'],['making','making'],['writing','writing']].filter(([type]) => S.points.some(p => p.type === type));
const typeGlyph = type => h('i',{class:'g type-shape '+type,'data-type':type,'aria-hidden':'true'});
function renderIndex() { const ix = $('#index'); if (!ix._built) buildIndex(ix); $$('.pt-row', ix).forEach(r => r.classList.toggle('mute', !!active && !matches(r._p,active))); }
function buildIndex(ix) {
  ix._built = true;
  const stage = h('div', { class: 'istage', 'aria-hidden': 'true' },h('p',{class:'stage-empty'},'hover a line to see it'));
  let stageToken=0;
  const show = p => { if (stage._p === p) return; stage._p = p; $('.stage-empty',stage)?.remove(); const token=++stageToken,c=plateFor(p),caption=h('figcaption',{},h('b',{},`${p.org} — ${p.title}`),h('span',{'data-point-id':p.id,'data-point-field':'line'},p.line)); const f=c?h('figure',{class:'ifig'},c,caption):null;if(!f)return;stage.append(f);const imgs=$$('img',f);Promise.all(imgs.map(img=>img.decode?.().catch(()=>{}))).then(()=>{if(token!==stageToken)return;requestAnimationFrame(()=>f.classList.add('on'));setTimeout(()=>{if(token===stageToken)$$('.ifig',stage).filter(x=>x!==f).forEach(x=>x.remove());},460);}); };
  const acc = (key, label, type, rows, count, open) => { const sec = h('section', { class: 'iacc' + (open ? ' open' : '') }); const head = h('button', { class: 'ihead', 'aria-expanded': String(!!open), onclick: () => { const o = !sec.classList.contains('open'); sec.classList.toggle('open', o); head.setAttribute('aria-expanded', String(o)); } }, type?typeGlyph(type):h('i',{class:'g dash'}), h('span', { class: 'il' }, label), count != null ? h('sup', {}, String(count)) : null, h('span', { class: 'plus', 'aria-hidden': 'true' }, '+')); sec.append(head, h('div', { class: 'icontent' }, h('div', {}, rows))); return sec; };
  const card = h('div', { class: 'icard' },
    h('div', { class: 'ihd' }, h('i', { class: 'fl', html: MARK }), h('span', {}, 'index')),
    h('ol', { class: 'ibio' }, S.bio.map((t, n) => h('li', {}, h('span', { class: 'n' }, `[${String(n + 1).padStart(2, '0')}]`), h('span', { html: t })))),
    SEC.map(([type,label], si) => { const pts = S.points.filter(p => p.type === type); return acc(type, label, type, pts.map((p, n) => { const r = h('button', { class: 'irow pt-row', style: '--i:' + n, onmouseenter: () => show(p), onfocus: () => show(p), onclick: e => { const im = $('.ifig.on img, .ifig.on .tiles', stage); open(p, (stage._p === p && im ? im : e.currentTarget).getBoundingClientRect()); } }, typeGlyph(type), h('span', { class: 'rt' }, p.title), h('span', { class: 'rs' }, [p.org, p.year].filter(Boolean).join(' · ')),h('span',{class:'row-arrow','aria-hidden':'true'},'→')); r._p = p; return r; }), pts.length, si===0); }),
    acc('exp', 'experience', null, S.experience.map(([org, role, year], n) => h('div', { class: 'irow', style: '--i:' + n }, h('i',{class:'g dash'}),h('span', { class: 'rt' }, org), h('span', { class: 'rs' }, role+' · '+year)))),
    acc('contact', 'contact', null, [[S.person.email, 'mailto:' + S.person.email, 'email'], ['linkedin ↗', S.person.linkedin, 'linkedin.com/in/harshita-shyale'], ['résumé ↗', S.person.resume, 'pdf'], ['instagram ↗', 'https://www.instagram.com/ashlime_soda/', '@ashlime_soda']].map(([t, u, s], n) => h('a', { class: 'irow', style: '--i:' + n, href: u, target: u.startsWith('mailto') ? null : '_blank', rel: 'noopener' }, h('i', { class: 'g dash' }), h('span', { class: 'rt' }, t), h('span', { class: 'rs' }, s)))));
  ix.replaceChildren(stage, card);
}
const views = $('#views'), vpill = $('.vpill', views);
function placePill() { const b = $('button.on', views); if (!b) return; vpill.style.transform = `translateX(${b.offsetLeft}px)`; vpill.style.width = b.offsetWidth + 'px'; }
const indexMotion = { animations: [], clones: [], timers: [], phase: null, token: 0 };
const indexGlyph = row => {
  const section = row.closest('.iacc');
  return section && section.classList.contains('open') ? $('.g', row) : $('.ihead .g', section);
};
function cancelIndexMotion() {
  indexMotion.token++;
  indexMotion.animations.forEach(animation => { try { animation.cancel(); } catch {} });
  indexMotion.clones.forEach(clone => clone.remove());
  indexMotion.timers.forEach(timer => clearTimeout(timer));
  indexMotion.animations = []; indexMotion.clones = []; indexMotion.timers = []; indexMotion.phase = null;
  body.classList.remove('index-entering', 'index-leaving', 'index-labels-in', 'index-crossfade', 'index-crossfade-entering', 'index-crossfade-leaving');
  $$('.glyph-landed,.map-dot-landed').forEach(el => el.classList.remove('glyph-landed', 'map-dot-landed'));
  const card = $('.icard', $('#index')); if (card) card.style.clipPath = '';
}
function readIndexRects(ix) {
  const rows = new Map($$('.pt-row', ix).map(row => [row._p, { row, glyph: indexGlyph(row) }]));
  const entries = $$('.pt').map(point => {
    const source = point.querySelector('.dot').getBoundingClientRect(), target = rows.get(point._p);
    return target && target.glyph ? { point, row: target.row, glyph: target.glyph, source, target: target.glyph.getBoundingClientRect() } : null;
  }).filter(Boolean);
  [...$$('.pt .lbl'), ...$$('.axis,.alabel,.qlabel,.mark'), ...$$('.irow,.ihead .g,.icard,.ifig', ix)].forEach(el => el.getBoundingClientRect());
  return entries;
}
function flyDots(entries, reverse, token) {
  const ordered = [...entries].sort((a, b) => (reverse ? a.target.top - b.target.top : a.target.top - b.target.top) || a.target.left - b.target.left);
  const duration = reverse ? 420 : 420;
  ordered.forEach((entry, order) => {
    const from = reverse ? entry.target : entry.source, to = reverse ? entry.source : entry.target;
    const dx = to.left + to.width / 2 - from.left - from.width / 2, dy = to.top + to.height / 2 - from.top - from.height / 2;
    const clone = h('i', { class: 'flydot', style: `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px` });
    body.append(clone); indexMotion.clones.push(clone);
    const animation = clone.animate([
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
      { transform: `translate3d(${dx * .5}px,${dy * .5 - 40}px,0) scale(1.3)`, opacity: 1, offset: .5 },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(.8)`, opacity: 0 }
    ], { duration, delay: order * 26, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' });
    indexMotion.animations.push(animation);
    animation.onfinish = () => {
      if (indexMotion.token !== token) return;
      clone.remove();
      if (reverse) entry.point.querySelector('.dot').classList.add('map-dot-landed');
      else entry.glyph.classList.add('glyph-landed');
    };
  });
  return ordered.length ? (ordered.length - 1) * 26 + duration : 0;
}
function flyToList() {
  if (RM || mobile()) return;
  const ix = $('#index'); renderIndex();
  const entries = readIndexRects(ix), token = ++indexMotion.token;
  indexMotion.phase = 'in';
  plate.classList.remove('on'); pill.classList.remove('on');
  body.classList.add('show-index', 'index-entering');
  const card = $('.icard', ix);
  if (card) {
    const animation = card.animate([{ clipPath: 'inset(0 0 100% 0 round 6px)' }, { clipPath: 'inset(0 round 6px)' }], { duration: 600, delay: 120, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'both' });
    indexMotion.animations.push(animation);
  }
  const fig = $('.ifig', ix);
  if (fig) {
    fig.classList.remove('on');
    indexMotion.timers.push(setTimeout(() => { if (indexMotion.token === token) fig.classList.add('on'); }, 450));
  }
  const landing = flyDots(entries, false, token);
  indexMotion.timers.push(setTimeout(() => { if (indexMotion.token === token) { body.classList.remove('index-entering'); indexMotion.phase = 'list'; } }, landing + 180));
}
function flyToMap() {
  if (RM || mobile()) return;
  const ix = $('#index'), entries = readIndexRects(ix), token = ++indexMotion.token;
  indexMotion.phase = 'out'; body.classList.add('index-leaving');
  const card = $('.icard', ix);
  if (card) {
    const animation = card.animate([{ clipPath: 'inset(0 round 6px)' }, { clipPath: 'inset(0 0 100% 0 round 6px)' }], { duration: 450, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'both' });
    indexMotion.animations.push(animation);
  }
  const landing = flyDots(entries, true, token);
  indexMotion.timers.push(setTimeout(() => { if (indexMotion.token === token) body.classList.add('index-labels-in'); }, landing + 20));
  indexMotion.timers.push(setTimeout(() => {
    if (indexMotion.token !== token) return;
    body.classList.remove('show-index', 'index-leaving', 'index-labels-in'); indexMotion.phase = null;
  }, landing + 260));
}
function crossfadeIndex(on) {
  renderIndex(); indexMotion.phase = on ? 'crossfade-in' : 'crossfade-out';
  body.classList.add('index-crossfade', on ? 'index-crossfade-entering' : 'index-crossfade-leaving');
  if (on) requestAnimationFrame(() => body.classList.add('show-index'));
  else body.classList.remove('show-index');
  indexMotion.timers.push(setTimeout(() => { body.classList.remove('index-crossfade', 'index-crossfade-entering', 'index-crossfade-leaving'); indexMotion.phase = on ? 'list' : null; }, 260));
}
function toggleIndex(on) {
  const moving = !!indexMotion.phase;
  if (!moving && on === body.classList.contains('show-index')) return;
  cancelIndexMotion();
  $$('button', views).forEach(b => b.classList.toggle('on', (b.dataset.v === 'list') === on)); placePill();
  plate.classList.remove('on'); pill.classList.remove('on');
  if (on) {
    body.classList.remove('show-index');
    if (RM || mobile()) crossfadeIndex(true);
    else flyToList();
  } else if (body.classList.contains('show-index')) {
    if (RM || mobile()) crossfadeIndex(false);
    else flyToMap();
  }
}
$$('button', views).forEach(b => b.onclick = () => toggleIndex(b.dataset.v === 'list'));
requestAnimationFrame(placePill); document.fonts && document.fonts.ready.then(placePill);
$('#home').onclick = e => { e.preventDefault(); toggleIndex(false); closeSheet(); setFilter(null); };

/* boot */
plane.addEventListener('click', e => { if (!e.target.closest('.pt,.mark,button,a') && active) setFilter(null); });
buildPlane(); renderIndex();
window.refreshPortfolio = () => { buildPlane(); renderIndex(); layout(); };
let lastMobile = mobile(); addEventListener('resize', () => { if (mobile() !== lastMobile) { lastMobile = mobile(); buildPlane(); } else layout(); });
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
if (sessionStorage.getItem('seen') || RM) { intro.remove(); arrive(0); }
else {
  sessionStorage.setItem('seen', 1); body.classList.add('introing');
  const p = $('p', intro), words = p.textContent.trim().split(/\s+/);
  p.replaceChildren(...words.map((word, i) => h('span', { class: 'intro-word', style: `--word-delay:${i * 70}ms` }, word + (i < words.length - 1 ? ' ' : ''))));
  intro.replaceChildren(h('div', { class: 'intro-inner' }, h('span', { class: 'intro-mark', html: MARK }), p));
  introActive = true; document.addEventListener('click', skipIntro, true); document.addEventListener('keydown', skipIntro, true);
  const flightStart = 1100, flightDuration = 900;
  arrive(650);
  introTimers.push(setTimeout(() => {
    const flip = (element, target, scaleFromHeight = false) => {
      const from = element.getBoundingClientRect(), to = target.getBoundingClientRect();
      const scale = scaleFromHeight ? to.height / from.height : to.width / from.width;
      element.style.transformOrigin = '0 0';
      element.style.transition = 'none';
      element.style.transform = 'none';
      element.getBoundingClientRect();
      element.style.transition = `transform ${flightDuration}ms var(--e-dm)`;
      element.style.transform = `translate(${to.left - from.left}px,${to.top - from.top}px) scale(${scale})`;
    };
    flip(p, $('#home'), true);
    flip($('.intro-mark', intro), $('.mark'), false);
    intro.classList.add('done');
  }, flightStart));
  introTimers.push(setTimeout(() => {
    introActive = false; unlistenIntro(); body.classList.remove('introing'); intro.remove();
  }, flightStart + flightDuration));
}
ready.then(() => {});
})();
