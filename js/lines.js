// The map's arrival. When the opening line parts ("a personal index of things kept and made"), its ink comes loose as
// fine specks that stream out from the words along the two axes. They gather tighter and tighter on the line, and
// then the specks give way to a clean ruled line. After the stippled playing cards on inspora.design; not dither:
// every speck is one grain of ink with a home. Without the opening (a later visit), the same happens from the origin.
(() => {
  const de = document.documentElement, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM || matchMedia('(max-width:760px)').matches) return;
  de.classList.add('specking');

  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const R = (a, b) => a + Math.random() * (b - a);
  const out5 = t => 1 - Math.pow(1 - t, 5), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let cv, cx, W, H, dpr, ink = [28, 32, 22], grains = [], t0 = 0, raf = 0;

  function readInk() {
    const c = getComputedStyle(document.body).getPropertyValue('--ink').trim(), m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) ink = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    else { const r = c.match(/\d+/g); if (r && r.length >= 3) ink = r.slice(0, 3).map(Number); }
  }
  function done() {
    de.classList.remove('specking');
    if (cv) { cv.style.opacity = '0'; setTimeout(() => cv.remove(), 700); }
  }
  // from: a box the ink starts in (the words), or the origin
  function begin(from) {
    const h = document.querySelector('#plane .axis.h'), v = document.querySelector('#plane .axis.v');
    if (!h?.offsetWidth || !v?.offsetHeight) return done();
    const ax = { x0: h.offsetLeft, x1: h.offsetLeft + h.offsetWidth, y: h.offsetTop + .5, vx: v.offsetLeft + .5, y0: v.offsetTop, y1: v.offsetTop + v.offsetHeight };
    const box = from || { left: ax.vx - 30, right: ax.vx + 30, top: ax.y - 14, bottom: ax.y + 14 }, bx = (box.left + box.right) / 2, by = (box.top + box.bottom) / 2;
    cv = document.createElement('canvas'); cv.id = 'specks'; cv.setAttribute('aria-hidden', 'true');
    document.getElementById('plane').prepend(cv); cx = cv.getContext('2d');
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readInk();
    // each grain leaves from a point in the words and lands on the line, the farther along the line the later it lands,
    // so the line seems to run outward from where the sentence parted; it arrives loose and draws in tight
    const add = (n, home, horiz) => { for (let i = 0; i < n; i++) {
      const t = Math.random(), [hx, hy] = home(t);
      const sx = horiz ? box.left + Math.random() * (box.right - box.left) : bx + gauss() * 10, sy = horiz ? by + gauss() * (box.bottom - box.top) * .3 : box.top + Math.random() * (box.bottom - box.top);
      const far = horiz ? Math.abs(hx - bx) / Math.max(1, ax.x1 - ax.x0) : Math.abs(hy - by) / Math.max(1, ax.y1 - ax.y0);
      grains.push({ h: horiz, sx, sy, hx, hy, loose: gauss() * R(2, 9), d: far * 900 + R(0, 220), dur: R(900, 1300), a: R(.4, .95) }); } };
    add((ax.x1 - ax.x0) * 2.2, t => [ax.x0 + t * (ax.x1 - ax.x0), ax.y], true);
    add((ax.y1 - ax.y0) * 2.2, t => [ax.vx, ax.y0 + t * (ax.y1 - ax.y0)], false);
    t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  const LV = 6;
  function frame(now) {
    const el = now - t0; let busy = false;
    cx.clearRect(0, 0, W, H);
    const s = dpr > 1.5 ? .75 : 1, paths = Array.from({ length: LV }, () => new Path2D());
    // the loose grain draws in onto the line during the last stretch, so the band ends a hair wide
    const tight = io(Math.min(1, Math.max(0, (el - 1500) / 700)));
    for (const g of grains) {
      if (el < g.d) { busy = true; continue; }
      const k = Math.min(1, (el - g.d) / g.dur), e = out5(k); if (k < 1) busy = true;
      const off = g.loose * (1 - tight) * (.4 + .6 * (1 - e)), x = g.sx + (g.hx - g.sx) * e, y = g.sy + (g.hy - g.sy) * e;
      paths[Math.min(LV - 1, (g.a * LV) | 0)].rect(g.h ? x : x + off, g.h ? y + off : y, s, s);
    }
    paths.forEach((p, i) => { cx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${((i + .5) / LV).toFixed(3)})`; cx.fill(p); });
    if (busy || el < 2200) raf = requestAnimationFrame(frame); else done();
  }

  function start() {
    const intro = document.getElementById('intro');
    if (intro && document.body.classList.contains('introing')) {
      // wait for the sentence to part, then let its ink run into the axes
      const words = () => intro.querySelector('p')?.getBoundingClientRect();
      const mo = new MutationObserver(() => { if (intro.classList.contains('parting')) { mo.disconnect(); begin(words()); } });
      mo.observe(intro, { attributes: true, attributeFilter: ['class'] });
      // skipped (a click): straight to the lines
      const gone = new MutationObserver(() => { if (!document.body.contains(intro)) { gone.disconnect(); mo.disconnect(); if (!cv) done(); } });
      gone.observe(document.body, { childList: true });
    } else if (document.body.classList.contains('show-index')) {
      // arriving straight on the work: the map is out of sight, so it simply has its lines
      done();
    } else begin(null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(start)); else requestAnimationFrame(start);
})();
