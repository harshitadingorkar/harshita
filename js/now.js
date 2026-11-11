// Working with the door open, the now page: one line per thing in progress, newest first, grouped by month, with a tab
// for each kind of work. Entries live in data/door.json and are added from any chat with the "door" skill; watching and
// keeping fill themselves from the Letterboxd log and Are.na. Pictures sit in a small fan under a line, as on the about page.
(() => {
  const $ = s => document.querySelector(s), h = (tag, cls, ...kids) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids.filter(k => k != null)); return e; };
  const day = d => new Date(d + 'T12:00');
  const fmt = (d, o) => day(d).toLocaleDateString('en-US', o).toLowerCase();
  const SND = () => window.portfolioSound;
  const TAB = { film: 'watching' };
  let entries = [], kind = '';
  // the way home steps back when you came from the site, so the map is as you left it
  const home = document.querySelector('nav.top a');
  home && home.addEventListener('click', e => { try { if (new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch {} });
  // a small fan of pictures that peeks out from under the line; reach for it and it opens out so every picture is whole,
  // each one floating on the page at its own pace; pick one and it grows out of its place in the fan
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fan = pics => {
    const f = h('div', 'pile'); let rung = false;
    pics.slice(0, 4).forEach((m, j) => { const b = h('button', null, Object.assign(h('img'), { src: '../' + m.src, alt: m.alt, loading: 'lazy' })); b.type = 'button'; b.setAttribute('aria-label', 'Open picture' + (m.alt ? ': ' + m.alt : '')); b.style.cssText = `--i:${j};--r:${((j * 37) % 11 - 5) * .9}deg;--d:${(5.2 + (j * 1.7) % 2.4).toFixed(2)}s`; b.onclick = () => look(m, b.querySelector('img')); f.append(b); });
    // spread them as far as the column allows, so none is hidden behind another
    const spread = () => { const n = f.children.length, w = f.clientWidth; f.style.setProperty('--gap', (n > 1 ? Math.min(14, (w - n * 122) / (n - 1)) : 0) + 'px'); };
    f.addEventListener('mouseenter', () => { spread(); if (!rung) { rung = true; SND()?.flick(); } });
    f.addEventListener('focusin', spread);
    f.addEventListener('mouseleave', () => { rung = false; });
    return f;
  };
  // a short silent film under the line: plays on a loop while it's on screen, rests when it isn't
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { const v = x.target; if (x.isIntersecting && !RM) v.play().catch(() => {}); else v.pause(); }), { threshold: .4 }) : null;
  const reel = e => { const v = Object.assign(h('video'), { src: '../' + e.video, poster: e.poster ? '../' + e.poster : '', muted: true, loop: true, playsInline: true, preload: 'metadata', controls: RM });
    v.setAttribute('aria-label', e.alt || 'Short film'); io && io.observe(v); return h('div', 'reel', v); };
  const box = h('div', 'look'); box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); document.body.append(box);
  let back = null, from = null;
  // the open picture travels from the thumbnail to the middle of the page, and back again when you let it go
  const fly = (el, r, out) => { if (RM || !r) return Promise.resolve(); const e = el.getBoundingClientRect(), dx = r.left + r.width / 2 - (e.left + e.width / 2), dy = r.top + r.height / 2 - (e.top + e.height / 2), k = r.width / e.width;
    const a = [{ transform: `translate(${dx}px,${dy}px) scale(${k}) rotate(-3deg)` }, { transform: 'none' }]; return el.animate(out ? a.reverse() : a, { duration: out ? 380 : 620, easing: out ? 'cubic-bezier(.5,0,.75,0)' : 'cubic-bezier(.16,1.2,.3,1)', fill: 'both' }).finished; };
  const shut = () => { if (box.hidden || box.classList.contains('closing')) return; box.classList.add('closing'); box.classList.remove('on'); SND()?.pat();
    const fig = box.querySelector('figure'), r = from && from.isConnected ? from.getBoundingClientRect() : null;
    Promise.all([fly(fig, r, true), new Promise(t => setTimeout(t, 380))]).then(() => { box.hidden = true; box.classList.remove('closing'); }); back && back.focus(); };
  const look = (m, thumb) => { back = document.activeElement; from = thumb;
    const fig = h('figure', null, h('div', 'breathe', Object.assign(h('img'), { src: '../' + m.src, alt: m.alt }))); box.replaceChildren(fig, m.alt ? h('p', null, m.alt) : null);
    box.setAttribute('aria-label', m.alt || 'Picture'); box.hidden = false; box.classList.add('on'); SND()?.stamp(); box.tabIndex = -1; box.focus();
    const img = fig.querySelector('img'), go = () => fly(fig, thumb.getBoundingClientRect(), false);
    img.complete ? go() : img.addEventListener('load', go, { once: true }); };
  box.onclick = shut; addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
  const render = () => {
    const rows = $('#rows'), list = entries.filter(e => !kind || e.type === kind);
    rows.replaceChildren(); $('#empty').hidden = list.length > 0;
    let month = '';
    list.forEach((e, i) => {
      const m = fmt(e.date, { month: 'long', year: 'numeric' });
      if (m !== month) { month = m; rows.append(h('li', 'month', m)); }
      let text;
      if (e.films) { text = h('p', 'text', 'Last watched '); e.films.forEach((f, j) => text.append(Object.assign(h('a', null, f.filmTitle), { href: f.link, target: '_blank', rel: 'noopener' }), j < e.films.length - 2 ? ', ' : j === e.films.length - 2 ? ' and ' : '.')); }
      else if (e.chans) { text = h('p', 'text', 'Lately keeping things in '); e.chans.forEach((c, j) => text.append(Object.assign(h('a', null, c.title), { href: c.url, target: '_blank', rel: 'noopener' }), j < e.chans.length - 1 ? ' and ' : ' on Are.na.')); }
      else { text = h('p', 'text', e.text); if (e.link) text.append(' ', Object.assign(h('a', 'out', '↗'), { href: e.link, target: '_blank', rel: 'noopener', ariaLabel: 'link' }));
        // a line can carry a few named links: the prototype, the live site
        if (e.links) text.append(h('span', 'links', ...e.links.map(([label, url]) => Object.assign(h('a', null, label + ' ↗'), { href: url, target: '_blank', rel: 'noopener' })))); }
      const pics = e.pile || (e.img ? [e.img] : []).concat(e.more || []).map((src, j) => ({ src, alt: j ? '' : e.alt || '' }));
      const say = h('div', 'say', text, pics.length ? fan(pics) : null, e.video ? reel(e) : null);
      const row = h('li', 'row entry', h('time', 'when', fmt(e.date, { month: 'short', day: 'numeric' })), say, h('span', 'kind', TAB[e.type] || e.type));
      row.querySelector('time').dateTime = e.date; row.style.setProperty('--i', i);
      // a soft note as you read down the page, a little lower each line
      row.addEventListener('mouseenter', () => SND()?.pluck(i % 2 ? .3 : -.3, .9 - Math.min(i, 9) * .2));
      rows.append(row);
    });
  };
  const filters = () => {
    const kinds = [...new Set(entries.map(e => e.type))].sort((a, b) => (TAB[a] || a).localeCompare(TAB[b] || b)), wrap = $('#filters');
    const chip = (k, label) => { const b = h('button', k === kind ? 'on' : '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(k === kind)); b.onclick = () => { if (k !== kind) SND()?.pat(); kind = k; filters(); render(); }; return b; };
    wrap.replaceChildren(chip('', 'everything'), ...kinds.map(k => chip(k, TAB[k] || k)));
  };
  Promise.all([
    fetch('../data/door.json', { cache: 'no-cache' }).then(r => r.json()),
    fetch('../data/films.json').then(r => r.json()).catch(() => []),
    fetch('../data/arena.json').then(r => r.json()).catch(() => []),
  ]).then(([d, f, ar]) => {
    entries = d.slice();
    // what I've watched and kept lately, as one line each, dated by the newest of them
    const films = f.filter(x => x.watchedDate).sort((a, b) => b.watchedDate.localeCompare(a.watchedDate)).slice(0, 3);
    if (films.length) entries.push({ date: films[0].watchedDate, type: 'film', films, pile: films.map(x => ({ src: x.poster.local, alt: 'Poster for ' + x.filmTitle })) });
    const kept = ar.flatMap(c => c.blocks.filter(b => b.image && b.image.local).map(b => ({ date: (b.connected_at || b.created_at || '').slice(0, 10), src: b.image.local, alt: b.title && !/^[0-9A-F-]{20,}$/i.test(b.title) && !/\.(png|jpe?g|webp|gif|heic)$/i.test(b.title) ? b.title : '', ch: { slug: c.slug, title: c.title, url: c.url } }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    if (kept.length) entries.push({ date: kept[0].date, type: 'keeping', chans: [...new Map(kept.map(b => [b.ch.slug, b.ch])).values()].slice(0, 2), pile: kept.map(b => ({ src: b.src, alt: b.alt })) });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    const own = d.map(e => e.date).sort().reverse()[0];
    if (own) $('#updated').textContent = 'last opened ' + fmt(own, { month: 'short', day: 'numeric', year: 'numeric' });
    filters(); render();
    const sb = $('#soundBtn'), show = () => { const v = !!SND()?.on(); sb.setAttribute('aria-pressed', String(v)); sb.textContent = v ? 'sound on' : 'sound off'; };
    if (sb && SND()) { show(); sb.hidden = false; sb.onclick = () => { SND().set(!SND().on()); show(); }; }
  }).catch(() => { $('#empty').hidden = false; $('#empty').textContent = 'The page didn’t load. Try again in a moment.'; });
})();
