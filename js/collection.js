const API = 'https://api.are.na/v3';
const CACHE_KEY = 'collection:v1';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const $ = (s, r = document) => r.querySelector(s);
const wall = $('#wall'), field = $('#stamp-field'), sidebar = $('#sidebar');
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
let offsetX = 0, offsetY = 0, velocityX = 0, velocityY = 0, raf = 0, updateRaf = 0, drag = null, dragged = false, hovering = false, suppressCardClick = false;
let lightboxState = null, lightboxAnimation = null, lastSync = 0, drawerStartY = null, filterToken = 0;

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
      const src = image.display || image.thumb || image.local || '';
      if (!src) return null;
      return {
        id: String(block.id), title: block.title || '', type: block.type || 'Image', channel: channel.title, slug: channel.slug,
        description: channel.description || '', small: image.thumb || image.local || src, src: image.local || image.display || src,
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
  const art = document.createElement('span'); art.className = 'stamp-art'; art.style.width = `${width}px`; art.style.height = `${height}px`;
  const img = document.createElement('img'); img.src = block.small; img.alt = blockTitle(block) || block.channel; img.loading = 'lazy'; img.decoding = 'async';
  art.append(img); frame.append(art);
  const tag = document.createElement('span'); tag.className = 'stamp-tag'; tag.textContent = `${block.channel} · ${mono(dateValue(block))}`;
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
  node.addEventListener('mouseenter', () => {
    node.classList.add('is-hovered'); field.classList.add('is-hovering'); hovering = true;
  });
  node.addEventListener('mouseleave', () => {
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
  const cols = 8, rows = Math.ceil(activeBlocks.length / cols), dims = { cols, tileW: cols * 280, tileH: rows * 300 };
  for (let cy = -1; cy <= 1; cy++) for (let cx = -1; cx <= 1; cx++) {
    activeBlocks.forEach((block, i) => {
      const stamp = buildStamp(block, i, cx, cy, dims);
      field.append(stamp); stampPool.push(stamp);
    });
  }
  positionPool();
  requestAnimationFrame(() => field.classList.remove('filtering'));
}
function positionPool() {
  if (!stampPool.length) return;
  const width = wall.clientWidth, height = wall.clientHeight;
  const tileW = 2240, rows = Math.ceil(activeBlocks.length / 8), tileH = rows * 300;
  for (const node of stampPool) {
    const p = node._position;
    const baseX = p.x - p.copyX * tileW, baseY = p.y - p.copyY * tileH;
    const x = ((baseX - offsetX + tileW) % tileW + tileW) % tileW + (p.copyX - 1) * tileW;
    const y = ((baseY - offsetY + tileH) % tileH + tileH) % tileH + (p.copyY - 1) * tileH;
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
function renderSidebar() {
  const list = $('#channel-list'), lately = $('#lately');
  list.replaceChildren(); lately.replaceChildren();
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
  const total = allChannels.reduce((n,c) => n + c.blocks.length, 0);
  $('#side-footer').lastChild.textContent = ` · ${total} images`;
  $('#wall-status').textContent = `${total} images · synced ${relative(lastSync)}`;
  const handle = $('#drawer-handle'); handle.innerHTML = `Collection · ${allChannels.length} curations <span>${document.body.classList.contains('drawer-open') ? '▼' : '▲'}</span>`;
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
  if (lightboxAnimation) { lightboxAnimation.cancel(); lightboxAnimation = null; }
  const previous = $('.lightbox-image', wrap);
  if (previous) previous.remove();
  lb.hidden = false; document.body.classList.add('lightbox-open');
  const img = document.createElement('img'); img.className = 'lightbox-image'; img.src = block.src; img.alt = blockTitle(block) || block.channel;
  img.decoding = 'async'; wrap.append(img);
  const end = lightboxBounds(block, from);
  Object.assign(wrap.style,{left:`${end.left}px`,top:`${end.top}px`,width:`${end.width}px`,height:`${end.height}px`,transform:'none'});
  const title = blockTitle(block);
  const caption = $('#lightbox-caption'); caption.replaceChildren();
  const titleNode = document.createElement('span'); titleNode.className = 'lb-title'; titleNode.textContent = title;
  const details = document.createTextNode(`${block.channel} · added ${mono(dateValue(block))}`);
  const line = document.createElement('br'), link = document.createElement('a');
  link.href = block.block_url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'view source ↗';
  caption.append(titleNode, details, line, link);
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
  function finish(){ if(lightboxState!==state)return; if(lightboxAnimation){lightboxAnimation.cancel();lightboxAnimation=null;} $('#lightbox').hidden=true; document.body.classList.remove('lightbox-open'); $('#veil').setAttribute('aria-hidden','true'); lightboxState=null; }
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
  allChannels = channels.filter(c => c.blocks.length);
  lastSync = timestamp;
  if (activeChannel && !allChannels.some(c => c.slug === activeChannel)) activeChannel = '';
  makePool(); renderSidebar();
}
async function boot() {
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
$('#veil').addEventListener('click',()=>closeLightbox(true));
$('#lightbox-close').addEventListener('click',()=>closeLightbox(true));
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&lightboxState)closeLightbox(true);
  else if(lightboxState&&event.key==='ArrowRight')stepLightbox(1);
  else if(lightboxState&&event.key==='ArrowLeft')stepLightbox(-1);
});
window.addEventListener('resize',schedulePosition);
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
