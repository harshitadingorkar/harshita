// The ledger: one line per thing in progress, newest first, grouped by month, filterable by kind of work.
// Entries live in data/door.json and are added from any chat with the "door" skill.
(() => {
  const $ = s => document.querySelector(s), h = (tag, cls, ...kids) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids.filter(k => k != null)); return e; };
  const day = d => new Date(d + 'T12:00');
  const fmt = (d, o) => day(d).toLocaleDateString('en-US', o).toLowerCase();
  let entries = [], kind = '';
  const render = () => {
    const rows = $('#rows'), list = entries.filter(e => !kind || e.type === kind);
    rows.replaceChildren(); $('#empty').hidden = list.length > 0;
    let month = '';
    list.forEach((e, i) => {
      const m = fmt(e.date, { month: 'long', year: 'numeric' });
      if (m !== month) { month = m; rows.append(h('li', 'month', m)); }
      const text = h('p', 'text', e.text);
      if (e.link) text.append(' ', Object.assign(h('a', null, '↗'), { href: e.link, target: '_blank', rel: 'noopener', ariaLabel: 'link' }));
      const row = h('li', 'row', h('time', 'when', fmt(e.date, { month: 'short', day: 'numeric' })), text, h('span', 'kind', e.type));
      row.querySelector('time').dateTime = e.date; row.style.setProperty('--i', i);
      rows.append(row);
    });
  };
  const filters = () => {
    const kinds = [...new Set(entries.map(e => e.type))].sort(), wrap = $('#filters');
    const chip = (k, label) => { const b = h('button', k === kind ? 'on' : '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(k === kind)); b.onclick = () => { kind = k; filters(); render(); }; return b; };
    wrap.replaceChildren(chip('', 'everything'), ...kinds.map(k => chip(k, k)));
  };
  fetch('../data/door.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
    entries = d.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (entries[0]) $('#updated').textContent = 'last opened ' + fmt(entries[0].date, { month: 'short', day: 'numeric', year: 'numeric' });
    filters(); render();
  }).catch(() => { $('#empty').hidden = false; $('#empty').textContent = 'The ledger didn’t load. Try again in a moment.'; });
})();
