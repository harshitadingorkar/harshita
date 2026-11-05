// The door: what I'm on right now, one section per verb (making, designing, writing…), newest section first.
// The page is read as a version: every day something was added is a version, and the date in the intro rewinds to it.
// Entries live in data/door.json and are added from any chat with the "door" skill; watching and keeping fill themselves
// from the Letterboxd log and Are.na. Pictures sit in a small fan under each line, as on the about page, and rise when you reach for them.
(() => {
  const $ = s => document.querySelector(s), h = (tag, cls, ...kids) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids.filter(k => k != null)); return e; };
  const day = d => new Date(d + 'T12:00');
  const fmt = (d, o) => day(d).toLocaleDateString('en-US', o);
  const SND = () => window.portfolioSound;
  const VERB = { keeping: 'Keeping', making: 'Making', design: 'Designing', writing: 'Writing', reading: 'Reading', film: 'Watching', music: 'Listening', theatre: 'Rehearsing', research: 'Researching' };
  let entries = [], films = [], kept = [], versions = [], at = '';
  // the way home steps back when you came from the site, so the map is as you left it
  const home = document.querySelector('nav.top a');
  home && home.addEventListener('click', e => { try { if (new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch {} });

  const version = () => {
    const pick = $('#versions'), btn = $('#version');
    btn.textContent = fmt(at, { month: 'long', day: 'numeric', year: 'numeric' });
    pick.replaceChildren(...versions.map(v => { const b = h('button', v === at ? 'on' : '', fmt(v, { month: 'short', day: 'numeric' }) + (v === versions[0] ? ', today’s' : '')); b.type = 'button'; b.setAttribute('aria-pressed', String(v === at)); b.onclick = () => { at = v; history.replaceState(null, '', v === versions[0] ? location.pathname : '#' + v); version(); render(); }; return b; }));
  };
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
    const now = entries.filter(e => e.date <= at), groups = new Map();
    now.forEach(e => { const k = e.type || 'making'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); });
    const watched = films.filter(f => f.watchedDate <= at).slice(0, 3);
    if (watched.length && !groups.has('film')) groups.set('film', [{ date: watched[0].watchedDate, films: watched, pile: watched.map(f => ({ src: f.poster.local, alt: 'Poster for ' + f.filmTitle })) }]);
    const keptNow = kept.filter(b => b.date <= at).slice(0, 5);
    if (keptNow.length) { const chans = [...new Map(keptNow.map(b => [b.ch.slug, b.ch])).values()].slice(0, 2); groups.set('keeping', [{ date: keptNow[0].date, chans, pile: keptNow.map(b => ({ src: b.src, alt: b.alt })) }]); }
    const order = [...groups.entries()].sort((a, b) => b[1][0].date.localeCompare(a[1][0].date));
    $('#sections').replaceChildren(...order.map(([k, list], i) => h('section', 'verb',
      h('h2', null, VERB[k] || k[0].toUpperCase() + k.slice(1)),
      h('div', 'says', ...list.map(e => {
        let text;
        if (e.films) { text = h('p', 'text', 'Last watched '); e.films.forEach((f, j) => text.append(Object.assign(h('a', null, f.filmTitle), { href: f.link, target: '_blank', rel: 'noopener' }), j < e.films.length - 2 ? ', ' : j === e.films.length - 2 ? ' and ' : '.')); }
        else if (e.chans) { text = h('p', 'text', 'Lately keeping things in '); e.chans.forEach((c, j) => text.append(Object.assign(h('a', null, c.title), { href: c.url, target: '_blank', rel: 'noopener' }), j < e.chans.length - 1 ? ' and ' : ' on Are.na.')); }
        else { text = h('p', 'text', e.text); if (e.link) text.append(' ', Object.assign(h('a', 'out', '↗'), { href: e.link, target: '_blank', rel: 'noopener', ariaLabel: 'link' })); }
        const t = h('time', 'when', fmt(e.date, { month: 'short', day: 'numeric' })); t.dateTime = e.date;
        const pics = e.pile || (e.img ? [e.img] : []).concat(e.more || []).map((src, j) => ({ src, alt: j ? '' : e.alt || '' }));
        const row = h('div', 'entry' + (pics.length ? ' has-pile' : ''), t, text, pics.length ? fan(pics) : null);
        row.addEventListener('mouseenter', () => SND()?.pluck(.6 - (row.parentElement.children.length > 1 ? [...row.parentElement.children].indexOf(row) * .4 : 0), .9 - i * .35));
        return row;
      }))
    )));
    $('#sections').querySelectorAll('.verb').forEach((s, i) => s.style.setProperty('--i', i));
    $('#empty').hidden = order.length > 0;
  };

  Promise.all([
    fetch('../data/door.json', { cache: 'no-cache' }).then(r => r.json()),
    fetch('../data/films.json').then(r => r.json()).catch(() => []),
    fetch('../data/arena.json').then(r => r.json()).catch(() => []),
  ]).then(([d, f, ar]) => {
    kept = ar.flatMap(c => c.blocks.filter(b => b.image && b.image.local).map(b => ({ date: (b.connected_at || b.created_at || '').slice(0, 10), src: b.image.local, alt: b.title && !/^[0-9A-F-]{20,}$/i.test(b.title) && !/\.(png|jpe?g|webp|gif|heic)$/i.test(b.title) ? b.title : '', ch: { slug: c.slug, title: c.title, url: c.url } }))).sort((a, b) => b.date.localeCompare(a.date));
    entries = d.slice().sort((a, b) => b.date.localeCompare(a.date));
    films = f.filter(x => x.watchedDate).sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
    versions = [...new Set(entries.map(e => e.date))];
    const want = location.hash.slice(1);
    at = versions.includes(want) ? want : versions[0];
    if (versions[0]) $('#updated').textContent = 'last opened ' + fmt(versions[0], { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
    $('#version').onclick = () => { const open = $('#versions').hidden; $('#versions').hidden = !open; $('#version').setAttribute('aria-expanded', String(open)); };
    version(); render();
    const sb = $('#soundBtn'), show = () => { const v = !!SND()?.on(); sb.setAttribute('aria-pressed', String(v)); sb.textContent = v ? 'sound on' : 'sound off'; };
    if (sb && SND()) { show(); sb.hidden = false; sb.onclick = () => { SND().set(!SND().on()); show(); }; }
  }).catch(() => { $('#empty').hidden = false; $('#empty').textContent = 'The page didn’t load. Try again in a moment.'; });
})();
