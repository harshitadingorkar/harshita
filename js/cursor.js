// The cursor: a drop of ink with a ring that trails it on a spring and stretches when you move
// fast. Over a point on the plot the ring is drawn to it and becomes that point's own shape:
// a bead for work, a hoop for collections, a triangle for making. Over the flower it becomes a
// flower; over the card it widens to say "drag". Mice and trackpads only; touch keeps its own.
(() => {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = i * Math.PI / 3 - Math.PI / 2, p = (r, d) => [(Math.cos(a + d) * r).toFixed(2), (Math.sin(a + d) * r).toFixed(2)].join(' ');
    return `M${p(3, -.5)} C${p(8, -.62)} ${p(14.5, -.4)} ${p(14.5, 0)} C${p(14.5, .4)} ${p(8, .62)} ${p(3, .5)}`;
  }).join(' ') + ' M2.6 0 A2.6 2.6 0 1 1 -2.6 0 A2.6 2.6 0 1 1 2.6 0';
  const root = document.createElement('div');
  root.id = 'cursor'; root.setAttribute('aria-hidden', 'true'); root.dataset.shape = 'ring';
  root.innerHTML = `<svg class="c-ring" viewBox="-24 -24 48 48"><circle class="c-s c-plain" r="11"/><circle class="c-s c-bead" r="12.5"/><circle class="c-s c-hoop" r="12.5"/><path class="c-s c-tri" d="M0 -12.5 L13.5 11 L-13.5 11 Z"/><path class="c-s c-flower" d="${petals}"/><ellipse class="c-s c-oval" rx="19" ry="10"/></svg><i class="c-dot"></i>`;
  document.body.append(root);
  const ring = root.firstElementChild, dot = root.lastElementChild;

  let mx = -100, my = -100, rx = -100, ry = -100, vx = 0, vy = 0, target = null, raf = 0, live = false;
  const SHAPES = { work: 'bead', collections: 'hoop', making: 'tri' };
  const read = el => {
    const pt = el.closest('.pt');
    if (pt) return { shape: SHAPES[pt.dataset.type] || 'hoop', el: pt.querySelector('.dot') || pt, ink: pt.dataset.pulse !== 'true' };
    const mark = el.closest('.mark');
    if (mark) return { shape: 'flower', el: mark.querySelector('svg') || mark };
    if (el.closest('#hello .cc, .chip, .contact-sheet')) return { shape: 'oval', paper: !!el.closest('#hello .cc') };
    if (el.closest('input, textarea, select, [contenteditable]')) return { shape: 'none' };
    if (el.closest('a, button, [role=button], label, summary, .itable tr.row')) return { shape: 'link' };
    return { shape: 'ring' };
  };
  const set = s => {
    if (root.dataset.shape !== s.shape) root.dataset.shape = s.shape;
    root.classList.toggle('paper', !!s.paper);
    root.classList.toggle('ink', !!s.ink);
    target = s.el || null;
  };
  const tick = () => {
    let tx = mx, ty = my;
    // drawn to the point: most of the way to its centre, a little toward the hand
    if (target && target.isConnected) { const b = target.getBoundingClientRect(); tx = b.left + b.width / 2 + (mx - b.left - b.width / 2) * .12; ty = b.top + b.height / 2 + (my - b.top - b.height / 2) * .12; }
    if (RM) { rx = tx; ry = ty; vx = vy = 0; }
    else { vx = (vx + (tx - rx) * .2) * .62; vy = (vy + (ty - ry) * .2) * .62; rx += vx; ry += vy; }
    const sp = Math.hypot(vx, vy), free = root.dataset.shape === 'ring' || root.dataset.shape === 'link';
    const st = free ? Math.min(.55, sp * .028) : 0, ang = Math.atan2(vy, vx) * 180 / Math.PI;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) rotate(${free ? ang : 0}deg) scale(${1 + st}, ${1 - st * .55})`;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    raf = Math.abs(tx - rx) + Math.abs(ty - ry) + sp > .1 ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') { if (live) { live = false; root.classList.add('off'); document.documentElement.classList.remove('has-cursor'); } return; }
    if (!live) { live = true; rx = mx = e.clientX; ry = my = e.clientY; root.classList.remove('off'); document.documentElement.classList.add('has-cursor'); }
    mx = e.clientX; my = e.clientY; root.classList.remove('gone');
    wake();
  }, { passive: true });
  addEventListener('pointerover', e => { if (e.pointerType === 'mouse') { set(read(e.target)); wake(); } }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => root.classList.add('gone'));
  addEventListener('blur', () => root.classList.add('gone'));
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') root.classList.add('down'); }, { passive: true });
  addEventListener('pointerup', () => root.classList.remove('down'), { passive: true });
  // things appear and vanish under a still pointer (a dialog opening, a list replacing the map)
  addEventListener('click', () => setTimeout(() => { const el = document.elementFromPoint(mx, my); if (el) { set(read(el)); wake(); } }, 40));
})();
