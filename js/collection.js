const API = 'https://api.are.na/v3';
const CACHE_KEY = 'collection:v1';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wall = $('#wall'), field = $('#stamp-field'), sidebar = $('#sidebar');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const pageId = new URLSearchParams(location.search).get('c') || 'arena';
const pages = {
  arena: { title:'Collection', sub:'kept in curations on are.na', what:'Things I keep: images, references and small artifacts I come back to. Gathered on are.na, arranged here by curation. All rights remain with the original creators.' },
  films: { title:'Films', sub:'watched lately, rated honestly', what:'Everything I’ve watched lately, rated honestly. I was the first Harshita on Letterboxd, so the username is just harshita.' },
  clay: { title:'Clay', sub:'made slowly, by hand', what:'Things I make with my hands, and the pieces I keep for reference.', meditation:'Clay won’t be hurried. It dries when it dries, and it remembers every press of the thumb. Hand-building has no undo, only the next small decision. It’s the slowest thing I do, and the one that makes the rest make sense.', meditation2:'New pieces, and the ones that survive the kiln, go up on Instagram.' },
  odds: { title:'Odds & ends', sub:'patterns in the ordinary', what:'Photographs of patterns in the ordinary, and how we move through everyday spaces.' },
  theatre: { title:'Theatre', sub:'', what:'' }
};
/* Theatre: a wall of stills, one cluster per play. The panel tells the whole story once and only changes
   for the two that need more than a title: the play she co-wrote and directed, and the series she runs now. */
const T = 'assets/theatre/';
const THEATRE = {
  plays: [
    { slug:'trraammtobb', title:'TRRAAMMToBB', year:'2020', images:['poster','tr1','tr2','tr3','tr4','tr5','tr6'] },
    { slug:'scripts-and-sips', title:'Scripts & Sips', year:'Seattle, now', images:['sips1','sips-video','sips2','sips3'] },
    // plays with a single still share one shelf; each still keeps its own name
    { slug:'more', title:'More from the stage', images:[['mime','You’re All Mime · 2020'],['monkey','The Monkey’s Paw · 2019'],['lullaby','Searching for a Lullaby · 2021'],['banner','CARV · Bangalore']] }
  ],
  aspects:{ banner:2, poster:2.197, tr1:1.449, tr2:1.618, tr3:1.699, tr4:.887, tr5:1.321, tr6:.797, mime:1.501, monkey:1, lullaby:1.501, sips1:.912, 'sips-video':.5625, sips2:1.778, sips3:1.333 },
  intro:[
    ['Before design, there was theatre. I led ', ['CARV','http://carvenglish.wordpress.com/'], ', the theatre company at my college in Bangalore, acted in sold-out original plays, and co-wrote and directed ', ['TRRAAMMToBB','#trraammtobb'], ', which won Best Play and Best Director at IITM in 2020.'],
    ['In Seattle I started ', ['Scripts & Sips','#scripts-and-sips'], ', a casual line-reading series where anyone can pick up a script and read a part out loud.']
  ],
  trraammtobb:{ kicker:'co-written & directed · 2020', title:'The Reasonably Remarkable, Adequately Amusing, Marvelously Mundane Tale of Bryan the Bard', ask:'What happens to the characters in the stories we abandon?', body:'A playwright who never finishes a play is cornered by the characters he left behind. The only way out of their world is to help them find their purpose, and somewhere along the way he finds his.', award:'Best Play · Best Director · IITM 2020' },
  sips:{ logo:'sips1', kicker:'started in Seattle', title:'Scripts & Sips', body:'A casual line-reading series. No auditions and no experience needed: pick up a script, choose a part, and read it out loud with whoever showed up.', link:['Come read with us ↗','https://forms.gle/9Qm4NhswapDw7TTF7'] }
};
const pageCopy = pages[pageId] || pages.arena;
window.COLLECTION_PAGE_COPY=pageCopy;
window.COLLECTION_PAGE_ID=pageId;
document.body.classList.toggle('theatre-page', pageId === 'theatre');
if (pageId === 'theatre') { $('#theatre-panel').hidden = false; $('.intro-section').hidden = true; }
const mono = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase() : 'date unknown';
const dateValue = b => b.connected_at || b.created_at || '';
const relative = d => {
  if (!d) return 'recently';
  const days = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};
const seedFor = value => {
  let n = 2166136261;
  for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => {
    n += 0x6d2b79f5;
    let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
let allChannels = [], activeChannel = '', activeBlocks = [], stamps = [], stampPool = [];
let poolDims = null;
let offsetX = 0, offsetY = 0, velocityX = 0, velocityY = 0, raf = 0, updateRaf = 0, drag = null, dragged = false, hovering = false, suppressCardClick = false;
let lightboxState = null, lightboxAnimation = null, lastSync = 0, drawerStartY = null, filterToken = 0, turnaroundTimer = 0;

function normalizeBlock(block, channel) {
  const img = block.image || {};
  const small = img.small && img.small.src;
  const src = img.src || block.image_src || small || '';
  const type = String(block.type || '').toLowerCase();
  if (!(type === 'image' || ((type === 'link' || type === 'attachment') && src))) return null;
  const aspect = Number(img.aspect_ratio) || (Number(img.width) && Number(img.height) ? Number(img.width) / Number(img.height) : 1);
  return {
    id: String(block.id),
    title: block.title || '',
    type: block.type || 'Image',
    channel: channel.title,
    slug: channel.slug,
    description: channel.description || '',
    small: small || src,
    src,
    aspect,
    width: Number(img.width) || 0,
    height: Number(img.height) || 0,
    connected_at: block.connection && block.connection.connected_at || block.connected_at || '',
    created_at: block.created_at || '',
    block_url: `https://www.are.na/block/${block.id}`
  };
}
function normalizeApiChannel(channel, blocks) {
  const count = Number(channel.counts && channel.counts.blocks) || blocks.length;
  return { slug: channel.slug, title: channel.title, description: channel.description || '', count, blocks };
}
async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Are.na returned ${response.status}`);
  return response.json();
}
async function loadLive() {
  const first = await getJson(`${API}/users/harshita-shyale/contents?per=50&type=Channel`);
  const channels = (first.data || []).filter(c => !c.visibility || c.visibility === 'public');
  return Promise.all(channels.map(async channel => {
    let page = 1, blocks = [], more = true;
    while (more) {
      const payload = await getJson(`${API}/channels/${encodeURIComponent(channel.slug)}/contents?per=100&page=${page}`);
      for (const raw of payload.data || []) {
        const block = normalizeBlock(raw, channel);
        if (block) blocks.push(block);
      }
      more = !!(payload.meta && payload.meta.has_more_pages);
      page++;
    }
    return normalizeApiChannel(channel, blocks);
  }));
}
function normalizeFallback(raw) {
  const channels = Array.isArray(raw) ? raw : raw.channels || [];
  return channels.map(channel => ({
    slug: channel.slug, title: channel.title, description: channel.description || '', count: channel.count || channel.blocks.length,
    blocks: (channel.blocks || []).map(block => {
      const image = block.image || {};
      // the saved copy first: it loads anywhere, including places that can't reach Are.na
      const src = image.local || image.display || image.thumb || '';
      if (!src) return null;
      return {
        id: String(block.id), title: block.title || '', type: block.type || 'Image', channel: channel.title, slug: channel.slug,
        description: channel.description || '', small: image.local || image.thumb || src, src: image.local || image.display || src,
        aspect: Number(image.width) && Number(image.height) ? Number(image.width) / Number(image.height) : 1,
        width: Number(image.width) || 0, height: Number(image.height) || 0,
        connected_at: block.connected_at || '', created_at: block.created_at || '', block_url: block.block_url || `https://www.are.na/block/${block.id}`
      };
    }).filter(Boolean)
  }));
}
function writeCache(channels, timestamp = Date.now()) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp, channels })); } catch {}
}
function readCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cache && Array.isArray(cache.channels) ? cache : null;
  } catch { return null; }
}
async function fallbackData() {
  const response = await fetch('data/arena.json');
  if (!response.ok) throw new Error('Local Are.na fallback unavailable');
  return normalizeFallback(await response.json());
}
function blockTitle(block) {
  return block.title && !/\.(?:jpe?g|png|gifv?|webp|avif|heic|svg|tiff?|bmp|mp4|mov)(?:[?#].*)?$/i.test(block.title) ? block.title : '';
}
function buildStamp(block, index, copyX, copyY, dims) {
  const rand = seedFor(`${block.id}:${copyX}:${copyY}`);
  const w = 150 + rand() * 40, ar = Math.max(.45, Math.min(2.2, Number(block.aspect) || 1));
  const width = ar > 1 ? w : w * ar, height = ar > 1 ? w / ar : w;
  const cell = 280, cellY = 300, cols = dims.cols;
  const col = index % cols, row = Math.floor(index / cols);
  const jitterX = (rand() - .5) * 36, jitterY = (rand() - .5) * 36, tilt = (rand() - .5) * 5;
  const node = document.createElement('button');
  node.type = 'button'; node.className = 'stamp is-entering'; node.setAttribute('aria-label', `${block.channel}: ${blockTitle(block) || 'view collected image'}`);
  const frame = document.createElement('span'); frame.className = 'stamp-frame'; frame.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
  frame.addEventListener('animationend', () => node.classList.remove('is-entering'), { once: true });
  const art = document.createElement('span'); art.className = `stamp-art${block.turnaround?' turnaround-art':''}`; art.style.width = `${width}px`; art.style.height = `${height}px`;
  if (block.turnaround) art.style.backgroundImage = `url("${block.small}")`;
  else if (block.video) { const v = document.createElement('video'); Object.assign(v, { src: block.video, poster: block.small, muted: true, loop: true, playsInline: true, autoplay: !reducedMotion.matches, preload: 'metadata' }); v.setAttribute('aria-label', block.tag || block.title); art.append(v); }
  else { const img = document.createElement('img'); img.src = block.small; img.alt = blockTitle(block) || block.channel; img.loading = 'lazy'; img.decoding = 'async'; art.append(img); }
  frame.append(art);
  const tag = document.createElement('span'); tag.className = 'stamp-tag'; tag.textContent = block.tag || `${block.channel} · ${mono(dateValue(block))}`;
  frame.append(tag); node.append(frame);
  node.dataset.block = block.id;
  node._block = block;
  node._position = {
    x: col * cell + (cell - width) / 2 + jitterX + copyX * dims.tileW,
    y: row * cellY + (cellY - height) / 2 + jitterY + copyY * dims.tileH,
    copyX, copyY,
    width, height, tilt, arrival: Math.min(760, (index % 34) * 18 + Math.abs(copyX + copyY) * 35)
  };
  node.style.setProperty('--arrival', `${node._position.arrival}ms`);
  // each print breathes on its own rhythm, and leans a few pixels toward the pointer while it's over it
  art.style.setProperty('--breath', (5.4 + rand() * 2.4).toFixed(2) + 's'); art.style.setProperty('--breath-at', (-rand() * 6).toFixed(2) + 's');
  node.addEventListener('mousemove', e => { const r = node.getBoundingClientRect(); frame.style.setProperty('--hx', ((e.clientX - r.left) / r.width - .5) * 10 + 'px'); frame.style.setProperty('--hy', ((e.clientY - r.top) / r.height - .5) * 8 + 'px'); });
  node.addEventListener('mouseleave', () => { frame.style.removeProperty('--hx'); frame.style.removeProperty('--hy'); });
  node.addEventListener('mouseenter', () => {
    node.classList.add('is-hovered'); field.classList.add('is-hovering'); hovering = true;
    if(block.turnaround&&!reducedMotion.matches){let n=0;clearInterval(node._turn);node._turn=setInterval(()=>{art.style.backgroundPosition=`${n%2?100:0}% ${Math.floor(n/2)*50}%`;n=(n+1)%6;},180);}
  });
  node.addEventListener('mouseleave', () => {
    clearInterval(node._turn);if(block.turnaround)art.style.backgroundPosition='0 0';
    node.classList.remove('is-hovered'); hovering = field.querySelector('.stamp:hover') !== null;
    field.classList.toggle('is-hovering', hovering);
  });
  node.addEventListener('click', event => {
    if (suppressCardClick) { suppressCardClick = false; event.preventDefault(); return; }
    if (dragged) { event.preventDefault(); dragged = false; return; }
    openLightbox(block, node);
  });
  return node;
}
function makePool() {
  activeBlocks = activeChannel ? (allChannels.find(c => c.slug === activeChannel)?.blocks || []) : allChannels.flatMap(c => c.blocks);
  activeBlocks = activeBlocks.filter(block => block.small && block.src);
  field.classList.add('filtering');
  field.replaceChildren();
  stampPool = [];
  if (!activeBlocks.length) return;
  const n = activeBlocks.length, cols = n < 24 ? Math.min(n, Math.ceil(Math.sqrt(n * 1.6))) : Math.min(8, n), rows = Math.ceil(n / cols);
  const dims = poolDims = { cols, rows, tileW: cols * 280, tileH: rows * 300 };
  // A short collection is laid out once, honestly; only a long one wraps around into an endless wall.
  const few = activeBlocks.length < 24; poolDims.few = few;
  const copiesX = few ? 0 : Math.max(1, Math.ceil(window.innerWidth / dims.tileW));
  const copiesY = few ? 0 : Math.max(1, Math.ceil(window.innerHeight / dims.tileH));
  for (let cy = -copiesY; cy <= copiesY; cy++) for (let cx = -copiesX; cx <= copiesX; cx++) {
    for (let i = 0; i < (few ? activeBlocks.length : rows * cols); i++) {
      const block = activeBlocks[i % activeBlocks.length];
      const stamp = buildStamp(block, i, cx, cy, dims);
      field.append(stamp); stampPool.push(stamp);
    }
  }
  if (poolDims.few) { offsetX = (dims.tileW - wall.clientWidth) / 2; offsetY = (dims.tileH - wall.clientHeight) / 2; }
  positionPool();
  requestAnimationFrame(() => field.classList.remove('filtering'));
}
function positionPool() {
  if (!stampPool.length || !poolDims) return;
  const width = wall.clientWidth, height = wall.clientHeight;
  const { tileW, tileH } = poolDims;
  if (poolDims.few) {
    // laid out once: the wall pans only as far as its edges, plus a little air
    const mx = Math.max(0, (tileW - width) / 2) + 120, my = Math.max(0, (tileH - height) / 2) + 120, cx = (tileW - width) / 2, cy = (tileH - height) / 2;
    offsetX = Math.max(cx - mx, Math.min(cx + mx, offsetX)); offsetY = Math.max(cy - my, Math.min(cy + my, offsetY));
    for (const node of stampPool) { const p = node._position; node.style.transform = `translate3d(${p.x - offsetX}px,${p.y - offsetY}px,0)`; node.style.setProperty('--arrival', `${p.arrival}ms`); }
    return;
  }
  for (const node of stampPool) {
    const p = node._position;
    const baseX = p.x - p.copyX * tileW, baseY = p.y - p.copyY * tileH;
    const x = ((baseX - offsetX + tileW) % tileW + tileW) % tileW + p.copyX * tileW;
    const y = ((baseY - offsetY + tileH) % tileH + tileH) % tileH + p.copyY * tileH;
    node.style.transform = `translate3d(${x}px,${y}px,0)`;
    node.style.setProperty('--arrival', `${p.arrival}ms`);
  }
  field.style.setProperty('--field-width', `${width}px`);
  field.style.setProperty('--field-height', `${height}px`);
}
function schedulePosition() {
  if (updateRaf) return;
  updateRaf = requestAnimationFrame(() => { updateRaf = 0; positionPool(); });
}
window.addEventListener('resize', () => { if (activeBlocks.length) makePool(); else schedulePosition(); });
// The theatre panel: the whole story by default; the play's own page while it, or one of its stills, is in view.
function theatrePanel(slug) {
  const sec = $('#theatre-panel'); if (!sec) return;
  const el = (tag, cls, ...kids) => { const n = document.createElement(tag); if (cls) n.className = cls; n.append(...kids.filter(k => k != null)); return n; };
  const link = ([text, href]) => { const a = el('a', null, text); a.href = href; if (href.startsWith('#')) a.addEventListener('click', e => { e.preventDefault(); selectChannel(href.slice(1)); }); else { a.target = '_blank'; a.rel = 'noopener'; } return a; };
  const back = () => { const b = el('button', 'tp-back', '← all of it'); b.type = 'button'; b.addEventListener('click', () => selectChannel('')); return b; };
  let kids;
  if (slug === 'trraammtobb') { const d = THEATRE.trraammtobb; kids = [el('p', 'tp-kicker mono', d.kicker), el('h2', 'tp-title', d.title), el('p', 'tp-ask', d.ask), el('p', 'tp-body', d.body), el('p', 'tp-award mono', d.award), back()]; }
  else if (slug === 'scripts-and-sips') { const d = THEATRE.sips, img = el('img', 'tp-logo'); img.src = T + d.logo + '.jpg'; img.alt = 'The Scripts & Sips mark: a figure in blue ink reading aloud from a script.'; kids = [img, el('p', 'tp-kicker mono', d.kicker), el('h2', 'tp-title', d.title), el('p', 'tp-body', d.body), link(d.link), back()]; }
  else kids = [el('h2', null, 'What this is'), ...THEATRE.intro.map(parts => el('p', 'tp-body', ...parts.map(x => typeof x === 'string' ? x : link(x))))];
  sec.dataset.slug = slug || ''; sec.replaceChildren(...kids);
}
function renderSidebar() {
  const list = $('#channel-list'), lately = $('#lately');
  if (pageId === 'theatre') { theatrePanel(activeChannel === 'trraammtobb' || activeChannel === 'scripts-and-sips' ? activeChannel : ''); $('.curation-section h2').textContent = 'Plays'; $('.lately-section').hidden = true; }
  $('#clay-meditation').hidden = pageId !== 'clay';
  if(pageId==='clay'){const ps=$$('#clay-meditation p');if(ps[0])ps[0].textContent=pageCopy.meditation;if(ps[1])ps[1].textContent=pageCopy.meditation2;}
  list.replaceChildren(); lately.replaceChildren();
  $('#page-kicker').textContent=pageId==='arena'?"Harshita’s":"Harshita’s";
  $('#page-title').textContent=pageCopy.title;$('#page-sub').textContent=pageCopy.sub;$('#what-copy').textContent=pageCopy.what;document.title=`${pageCopy.title} — Harshita Shyale`;
  const everything = document.createElement('button');
  everything.type = 'button'; everything.className = `channel-row all-row${activeChannel ? '' : ' selected'}`;
  everything.innerHTML = `<span class="marker">${activeChannel ? '□' : '●'}</span><span class="channel-title">everything</span><span class="channel-count">${activeBlocks.length || allChannels.reduce((n,c)=>n+c.blocks.length,0)}</span>`;
  everything.addEventListener('click', () => selectChannel(''));
  list.append(everything);
  allChannels.forEach(channel => {
    const row = document.createElement('button'); row.type = 'button'; row.className = `channel-row${activeChannel === channel.slug ? ' selected' : ''}`;
    row.innerHTML = `<span class="marker">${activeChannel === channel.slug ? '●' : '□'}</span><span class="channel-title"></span><span class="channel-count mono"></span>`;
    $('.channel-title', row).textContent = channel.title; $('.channel-count', row).textContent = channel.blocks.length;
    row.addEventListener('click', () => selectChannel(channel.slug)); list.append(row);
    if (activeChannel === channel.slug && channel.description) {
      const desc = document.createElement('p'); desc.className = 'channel-description'; desc.textContent = channel.description; list.append(desc);
    }
  });
  const latest = allChannels.flatMap(c => c.blocks).sort((a,b) => new Date(dateValue(b)) - new Date(dateValue(a))).slice(0,5);
  latest.forEach(block => {
    const item = document.createElement('a'); item.className = 'recent-item'; item.href = block.block_url; item.target = '_blank'; item.rel = 'noopener';
    const img = document.createElement('img'); img.src = block.small; img.alt = ''; img.loading = 'lazy';
    const meta = document.createElement('span'); meta.className = 'recent-meta';
    const ch = document.createElement('span'); ch.className = 'recent-channel'; ch.textContent = block.channel;
    const dt = document.createElement('span'); dt.className = 'recent-date'; dt.textContent = relative(dateValue(block));
    meta.append(ch,dt); item.append(img,meta); lately.append(item);
  });
  const total = allChannels.reduce((n,c) => n + c.blocks.length, 0), footer=$('#side-footer'),credit=$('a',footer);
  if(pageId==='films'){credit.href='https://letterboxd.com/harshita/';credit.textContent='logged on letterboxd ↗';}
  else if(pageId==='clay'){credit.href='https://www.instagram.com/ashlime_soda/';credit.textContent='@ashlime_soda ↗';}
  else if(pageId==='odds'||pageId==='theatre'){credit.href='index.html';credit.textContent='back to the map ↗';}
  else{credit.href='https://www.are.na/harshita-shyale';credit.textContent='kept on are.na ↗';}
  let count = $('.count', footer); if (!count) { count = document.createElement('span'); count.className = 'count'; footer.append(count); }
  count.textContent = ` · ${total} ${pageId === 'theatre' ? 'stills' : 'images'}`;
  $('#wall-status').textContent = pageId === 'theatre' ? `${total} stills` : `${total} images · synced ${relative(lastSync)}`;
  const handle = $('#drawer-handle'); handle.innerHTML = `${pageId === 'theatre' ? `Theatre · ${allChannels.length} plays` : `Collection · ${allChannels.length} curations`} <span>${document.body.classList.contains('drawer-open') ? '▼' : '▲'}</span>`;
}
function selectChannel(slug) {
  if (activeChannel === slug) return;
  activeChannel = slug; renderSidebar();
  const token = ++filterToken;
  field.classList.add('filtering');
  setTimeout(() => { if (filterToken === token) makePool(); }, 180);
}
function closeDrawers() {
  document.body.classList.remove('drawer-open');
  $('#drawer-handle').setAttribute('aria-expanded','false');
  renderSidebar();
}
function lightboxBounds(block, from) {
  const wallRect = wall.getBoundingClientRect();
  const ar = Math.max(.45, Math.min(2.2, Number(block.aspect) || 1));
  const maxWidth = Math.min(wallRect.width * .7, 760), maxHeight = window.innerHeight * .7;
  let width = maxWidth, height = width / ar;
  if (height > maxHeight) { height = maxHeight; width = height * ar; }
  return { left: wallRect.left + (wallRect.width - width) / 2, top: (window.innerHeight - height) / 2, width, height };
}
function setLightbox(block, from, animate = true, stamp = null) {
  const wrap = $('#lightbox-image-wrap'), lb = $('#lightbox'), veil = $('#veil');
  clearInterval(turnaroundTimer);
  if (lightboxAnimation) { lightboxAnimation.cancel(); lightboxAnimation = null; }
  const previous = $('.lightbox-image', wrap);
  if (previous) previous.remove();
  lb.hidden = false; document.body.classList.add('lightbox-open');
  const img = document.createElement(block.turnaround?'div':block.video?'video':'img'); img.className = block.turnaround?'lightbox-image turnaround-large':'lightbox-image';
  if (block.video) Object.assign(img, { src: block.video, poster: block.small, controls: true, autoplay: true, loop: true, playsInline: true });
  if(block.turnaround){img.style.backgroundImage=`url("${block.src}")`;img.style.backgroundPosition='0 0';let n=0;if(!reducedMotion.matches)turnaroundTimer=setInterval(()=>{img.style.backgroundPosition=`${n%2?100:0}% ${Math.floor(n/2)*50}%`;n=(n+1)%6;},180);}
  else if(!block.video){img.src=block.src;img.alt=blockTitle(block)||block.channel;img.decoding='async';}
  wrap.append(img);
  const end = lightboxBounds(block, from);
  Object.assign(wrap.style,{left:`${end.left}px`,top:`${end.top}px`,width:`${end.width}px`,height:`${end.height}px`,transform:'none'});
  const title = blockTitle(block);
  const caption = $('#lightbox-caption'); caption.replaceChildren();
  const titleNode = document.createElement('span'); titleNode.className = 'lb-title'; titleNode.textContent = title;
  const details = document.createTextNode(block.rating!=null?`${block.year||''} · ${'★'.repeat(Math.floor(+block.rating))}${+block.rating%1?'½':''} · watched ${block.watched||''}`:`${block.channel} · added ${mono(dateValue(block))}`);
  const line = document.createElement('br'), link = document.createElement('a');
  link.href = block.link||block.block_url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = block.link?'view film ↗':'view on are.na ↗';
  if (pageId === 'theatre') { details.textContent = block.tag ? ' · ' + block.tag.split(' · ').slice(1).join(' · ') : ''; if (block.slug === 'trraammtobb' || block.slug === 'scripts-and-sips') theatrePanel(block.slug); }
  caption.append(titleNode, details);
  if(block.link||pageId==='arena'||block.slug==='ceramic-era') caption.append(line,link);
  if (animate && from) {
    lightboxAnimation = wrap.animate([
      { left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px` },
      { left:`${end.left}px`,top:`${end.top}px`,width:`${end.width}px`,height:`${end.height}px` }
    ],{duration:500,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  }
  lightboxState = { block, stamp, index: activeBlocks.findIndex(x => x.id === block.id) };
  veil.setAttribute('aria-hidden','false');
}
function openLightbox(block, stamp) {
  clearInterval(stamp?._turn);
  const image = $('.stamp-art', stamp), rect = image.getBoundingClientRect();
  setLightbox(block, rect, true, stamp);
}
function closeLightbox(animate = true) {
  if (!lightboxState) return;
  const state = lightboxState, wrap = $('#lightbox-image-wrap');
  if (lightboxAnimation) { lightboxAnimation.cancel(); lightboxAnimation = null; }
  const stamp = state.stamp, image = stamp && stamp.isConnected && $('.stamp-art', stamp);
  const end = image ? image.getBoundingClientRect() : null;
  if (animate && end) {
    const start = wrap.getBoundingClientRect();
    lightboxAnimation = wrap.animate([
      {left:`${start.left}px`,top:`${start.top}px`,width:`${start.width}px`,height:`${start.height}px`},
      {left:`${end.left}px`,top:`${end.top}px`,width:`${end.width}px`,height:`${end.height}px`}
    ],{duration:420,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    lightboxAnimation.onfinish=finish;
  } else finish();
  if (pageId === 'theatre') renderSidebar();
  function finish(){ if(lightboxState!==state)return;clearInterval(turnaroundTimer);if(lightboxAnimation){lightboxAnimation.cancel();lightboxAnimation=null;} $('#lightbox').hidden=true; document.body.classList.remove('lightbox-open'); $('#veil').setAttribute('aria-hidden','true'); lightboxState=null; }
}
function stepLightbox(step) {
  if (!lightboxState || !activeBlocks.length) return;
  const i = (lightboxState.index + step + activeBlocks.length) % activeBlocks.length;
  const stamp = stampPool.find(node => node._block.id === activeBlocks[i].id);
  setLightbox(activeBlocks[i], null, false, stamp);
}
function relativeTime(timestamp) {
  return relative(timestamp);
}
function render(channels, timestamp = Date.now()) {
  allChannels = channels.filter(c => pageId === 'films' || c.blocks.length);
  if(pageId==='arena') allChannels.sort((a,b)=>a.title.toLowerCase()==='visual note-taking'?1:b.title.toLowerCase()==='visual note-taking'?-1:b.blocks.length-a.blocks.length);
  lastSync = timestamp;
  if (activeChannel && !allChannels.some(c => c.slug === activeChannel)) activeChannel = '';
  makePool(); renderSidebar();
}
function localChannel(slug,title,items,description='') {
  const blocks=items.map((item,i)=>({
    id:String(item.id??`${slug}-${i}`),title:item.title||'',type:'Image',channel:title,slug,description,
    small:item.small,src:item.src||item.small,aspect:Number(item.aspect)||1,created_at:item.created_at||'',connected_at:item.connected_at||'',
    block_url:item.block_url||'#',tag:item.tag,video:item.video,rating:item.rating,year:item.year,watched:item.watched,link:item.link,turnaround:!!item.turnaround
  }));
  return {slug,title,description,count:blocks.length,blocks};
}
async function customPageChannels() {
  if(pageId==='films') {
    const raw=await fetch('data/films.json').then(r=>r.json()), films=raw.map((x,i)=>{
      const po=x.poster&&typeof x.poster==='object'?x.poster:{url:x.poster};
      return {id:`film-${i}`,title:x.filmTitle||x.title,year:x.filmYear||x.year,rating:x.memberRating??x.rating,watched:x.watchedDate||x.watched,link:x.link,small:po.local||po.url,src:po.local||po.url,aspect:2/3,created_at:x.watchedDate||x.watched};
    }).filter(x=>x.title&&x.small);
    const buckets=[['loved','loved',x=>+x.rating>=4.5],['liked','liked',x=>+x.rating>=3.5&&+x.rating<4.5],['fine','fine',x=>+x.rating>=2.5&&+x.rating<3.5],['not-for-me','not for me',x=>x.rating!=null&&+x.rating<=2],['unrated','unrated',x=>x.rating==null||(+x.rating>2&&+x.rating<2.5)]];
    const range={loved:'loved (4½–5★)',liked:'liked (3½–4★)',fine:'fine (2½–3★)','not-for-me':'not for me (≤2★)',unrated:'unrated'};
    return buckets.map(([slug,title,pred])=>localChannel(slug,range[slug],films.filter(pred)));
  }
  if(pageId==='theatre') return THEATRE.plays.map(play=>localChannel(play.slug,play.title,play.images.map(x=>{const [k,tag]=Array.isArray(x)?x:[x,`${play.title} · ${play.year}`];return {id:k,title:tag.split(' · ')[0],small:T+k+'.jpg',video:k==='sips-video'?T+k+'.mp4':null,aspect:THEATRE.aspects[k],tag};})));
  if(pageId==='odds') {
    const items=Array.from({length:13},(_,i)=>{const src=`assets/odds-${String(i+1).padStart(2,'0')}.jpg`;return {id:`odds-${i+1}`,small:src,aspect:1};});
    return [localChannel('odds-and-ends','odds & ends',items)];
  }
  if(pageId==='clay') {
    let source=readCache()?.channels;
    if(!source)try{source=await fallbackData();}catch{source=[];}
    const ceramic=source.find(c=>c.title.toLowerCase()==='ceramic era'||c.slug==='ceramic-era');
    const handmade=localChannel('my-pieces','my pieces',[
      {id:'wobblefoot',title:'Sir Wobblefoot',small:'assets/wobblefoot.jpg',aspect:.8},
      {id:'wobblefoot-01',title:'Sir Wobblefoot, side',small:'assets/wobblefoot-01.jpg',aspect:.8},
      {id:'wobblefoot-02',title:'Sir Wobblefoot · turnaround',small:'assets/wobblefoot-02.jpg',src:'assets/wobblefoot-sheet.jpg',aspect:(896/2)/(1195/3),turnaround:true}
    ]);
    return [handmade,...(ceramic?[ceramic]:[])];
  }
  return [];
}
// Theatre opens on the play she directed: the wall is panned so its company photo sits in the middle.
function landOn(blockId) {
  const node = stampPool.find(n => n._block.id === blockId && n._position.copyX === 0 && n._position.copyY === 0); if (!node) return;
  const p = node._position; offsetX = p.x + p.width / 2 - wall.clientWidth / 2; offsetY = p.y + p.height / 2 - wall.clientHeight / 2; positionPool();
}
async function boot() {
  if(pageId!=='arena') {
    try { const channels=await customPageChannels();render(channels,Date.now()); if(pageId==='theatre')landOn('poster'); }
    catch { render([],0); }
    if(pageId==='clay') {
      try { const fresh=await loadLive();writeCache(fresh);const ceramic=fresh.find(c=>c.title.toLowerCase()==='ceramic era'||c.slug==='ceramic-era'); if(ceramic){const own=allChannels.find(c=>c.slug==='my-pieces');render([own,ceramic].filter(Boolean),Date.now());} } catch {}
    }
    return;
  }
  const cached = readCache();
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) render(cached.channels, cached.timestamp);
  else {
    try { render(await fallbackData(), 0); }
    catch { render([], 0); }
  }
  try {
    const fresh = await loadLive(), previous = JSON.stringify(allChannels);
    lastSync = Date.now(); writeCache(fresh, lastSync);
    if (JSON.stringify(fresh) !== previous) render(fresh, lastSync);
    else { renderSidebar(); }
  } catch (error) {
    if (!allChannels.length) {
      try { render(await fallbackData(), 0); } catch {}
    }
  }
}
wall.addEventListener('pointerdown', event => {
  if (event.target.closest('.drawer-handle') || lightboxState) return;
  wall.setPointerCapture(event.pointerId); drag = {x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,time:performance.now(),stamp:event.target.closest('.stamp')};
  velocityX=velocityY=0;dragged=false;cancelAnimationFrame(raf);
});
wall.addEventListener('pointermove', event => {
  if (!drag) return;
  const dx=event.clientX-drag.lastX,dy=event.clientY-drag.lastY,now=performance.now(),dt=Math.max(1,now-drag.time);
  if (Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5)dragged=true;
  offsetX-=dx;offsetY-=dy;velocityX=-dx/dt*16;velocityY=-dy/dt*16;
  drag.lastX=event.clientX;drag.lastY=event.clientY;drag.time=now;schedulePosition();
});
const endPan=(event,canceled=false)=>{if(!drag)return;const clicked=drag.stamp&&!dragged&&!canceled;const stamp=drag.stamp;drag=null;if(clicked){suppressCardClick=true;openLightbox(stamp._block,stamp);setTimeout(()=>{suppressCardClick=false;},0);}if(matchMedia('(prefers-reduced-motion: reduce)').matches){setTimeout(()=>{dragged=false;},80);return;}const coast=()=>{offsetX+=velocityX;offsetY+=velocityY;velocityX*=.94;velocityY*=.94;positionPool();if(Math.abs(velocityX)+Math.abs(velocityY)>.2)raf=requestAnimationFrame(coast);};raf=requestAnimationFrame(coast);setTimeout(()=>{dragged=false;},80);};
wall.addEventListener('pointerup',event=>endPan(event));wall.addEventListener('pointercancel',event=>endPan(event,true));
wall.addEventListener('wheel',event=>{event.preventDefault();offsetX+=event.deltaX;offsetY+=event.deltaY;schedulePosition();},{passive:false});
const sidebarToggle=$('#sidebar-toggle');
const applySidebarState=()=>{const collapsed=localStorage.getItem('collection-sidebar-collapsed')==='1'&&innerWidth>760;document.body.classList.toggle('sidebar-collapsed',collapsed);sidebarToggle.textContent=collapsed?'›':'‹';sidebarToggle.setAttribute('aria-expanded',String(!collapsed));sidebarToggle.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');};
applySidebarState();
sidebarToggle.addEventListener('click',()=>{const collapsed=!document.body.classList.contains('sidebar-collapsed');localStorage.setItem('collection-sidebar-collapsed',collapsed?'1':'0');applySidebarState();});
window.addEventListener('pointermove',e=>{const mark=$('.side-mark');if(mark)mark.style.animationDuration=(120-Math.max(0,Math.min(1,e.clientY/innerHeight))*50)+'s';},{passive:true});
$('#veil').addEventListener('click',()=>closeLightbox(true));
$('#lightbox-close').addEventListener('click',()=>closeLightbox(true));
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&lightboxState)closeLightbox(true);
  else if(lightboxState&&event.key==='ArrowRight')stepLightbox(1);
  else if(lightboxState&&event.key==='ArrowLeft')stepLightbox(-1);
});
window.addEventListener('resize',()=>{applySidebarState();schedulePosition();});
$('#drawer-handle').addEventListener('click',()=>{
  const opened=document.body.classList.toggle('drawer-open');
  $('#drawer-handle').setAttribute('aria-expanded',String(opened));renderSidebar();
});
sidebar.addEventListener('pointerdown',event=>{if(window.innerWidth>760)return;drawerStartY=event.clientY;});
sidebar.addEventListener('pointerup',event=>{if(window.innerWidth>760||drawerStartY===null)return;const delta=event.clientY-drawerStartY;drawerStartY=null;if(delta<-35)document.body.classList.add('drawer-open');else if(delta>35)closeDrawers();renderSidebar();});
$('#back-map').addEventListener('click',event=>{
  event.preventDefault();document.body.classList.add('leaving-map');setTimeout(()=>location.href='index.html',350);
});
document.body.classList.add('is-ready');
boot();
