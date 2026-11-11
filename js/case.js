// The case view, after inspora.design's detail page and the collection walls: the work large on the dark stage at the
// left, mounted like prints, with its words beneath each picture; a fixed paper panel on the right with the facts, the
// contents (marking where you are) and a way to reach me; the projects in a dock along the top.
// One file serves the site and the trial artifact. caseProjects() turns the site's own data into the view's shape.
(() => {
  const A = f => (window.CASE_ROOT || 'assets/') + f;

  function caseProjects(S, short) {
    const P = id => S.points.find(p => p.id === id), split = f => (f || '').split(' · ');
    const im = (f, alt) => ({ src: A(f.replace(/^assets\//, '')), alt: alt || '' });
    const fromShort = (p, c, facts) => {
      const secs = [{ id: 'overview', label: 'Overview', head: c.q, text: c.note ? [c.note] : [], nums: c.numbers, vis: [im(p.img, p.alt || p.title)] }];
      secs.push({ id: 'problem', label: 'The problem', text: [c.problem], quote: c.quote, vis: p.id === 'github' ? [im(p.images[1])] : [] });
      if (c.research) secs.push({ id: 'research', label: 'Research', text: [c.research.t], vis: (c.research.imgs || []).map(f => im(f)) });
      (c.steps || []).forEach(s => secs.push({ id: 'step-' + s.n, label: s.t, text: [s.d], vis: (s.imgs || []).map(f => im(f, s.t)) }));
      if (c.learned) secs.push({ id: 'learned', label: 'What it taught me', text: [c.learned], cap: c.closing && c.closing.cap, vis: c.closing && c.closing.img ? [im(c.closing.img, c.closing.cap)] : [] });
      return { facts, secs };
    };
    const out = [];
    for (const id of ['influence', 'github', 'sony', 'safe', 'hpe']) {
      const p = P(id); if (!p) continue;
      let v;
      if (id === 'influence') {
        const st = p.study, M = 'cases/salesloft/moments/';
        v = { facts: st.meta, secs: [
          { id: 'overview', label: 'Overview', head: st.problem.title + '.', text: [], vis: [im(p.img, 'The Influence Graph: the people in a deal, how each of them feels, who sways whom.')] },
          { id: 'problem', label: 'The problem', text: st.problem.body, vis: [im(M + '02-stances-shift.jpg', 'Stances shifting across a deal.')] },
          { id: 'part', label: 'My part', text: [st.part], vis: [im(M + '04-path-to-yes.jpg', 'The path to yes.')] },
          ...st.moments.map((m, i) => ({ id: 'moment-' + (i + 1), label: m.title, text: [m.solves], vis: [im(m.video + '.jpg', m.title)] })),
          { id: 'rest', label: 'The rest', text: [p.nda], vis: [] }] };
      } else if (id === 'github' || id === 'safe') {
        const c = short[id], f = split(c.facts);
        v = fromShort(p, c, [['Client', f[0]], ['When', f[1]], ['Role', f[2]], ['Team', f[3]]]);
      } else if (id === 'hpe') {
        v = { facts: [['Where', 'Hewlett Packard Enterprise'], ['When', '2021–23'], ['Role', 'Software designer, then UX engineer']], secs: [
          { id: 'overview', label: 'Overview', text: p.brief.slice(0, 1), vis: [im(p.img, p.alt)] },
          { id: 'models', label: 'Keeping models in check', text: p.brief.slice(1), vis: [im('hpe-01.jpg'), im('hpe-02.jpg')] },
          { id: 'rest', label: 'The rest', text: [p.nda], vis: [] }] };
      } else {
        v = { facts: [['Client', 'Sony'], ['When', p.year], ['Role', 'Product designer'], ['Kind', 'Capstone, via UW']], secs: [
          { id: 'overview', label: 'Overview', text: [p.card || p.line], vis: [im(p.img, p.alt)] },
          { id: 'assistant', label: 'The assistant', text: [], vis: [im('sony-01.jpg')] }] };
      }
      out.push({ id, title: p.title, org: p.org === 'Hewlett Packard Enterprise' ? 'HPE' : p.org, year: p.year, line: p.card || p.line, thumb: A(p.still || p.img), ...v, secs: v.secs.filter(s => s.vis.length || (s.text || []).some(Boolean)) });
    }
    return out;
  }

  const h = (t, a = {}, ...k) => { const e = document.createElement(t); for (const [x, v] of Object.entries(a)) { if (v == null || v === false) continue; if (x === 'class') e.className = v; else if (x.startsWith('on')) e[x] = v; else e.setAttribute(x, v === true ? '' : v); } e.append(...k.flat(Infinity).filter(z => z != null && z !== false)); return e; };
  const pad = n => String(n).padStart(2, '0');
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let root = null, PJ = [], cur = null, io = null, opts = {};

  function close() { if (!root || opts.embedded) return; root.classList.remove('on'); document.documentElement.classList.remove('cv-open'); setTimeout(() => { root.remove(); root = null; }, 300); opts.onClose && opts.onClose(); }
  function mark(id) {
    const i = cur.secs.findIndex(s => s.id === id);
    root.querySelectorAll('.cv-toc button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    const w = root.querySelector('.cv-where'); if (w) w.textContent = pad(i + 1) + ' / ' + pad(cur.secs.length);
  }
  function show(id, first) {
    const p = PJ.find(x => x.id === id) || PJ[0], i = PJ.indexOf(p);
    const prev = PJ[(i - 1 + PJ.length) % PJ.length], next = PJ[(i + 1) % PJ.length];
    cur = p; opts.onShow && opts.onShow(p.id);
    root.querySelectorAll('.cv-dock button').forEach(b => b.classList.toggle('on', b.dataset.id === p.id));
    const stage = root.querySelector('.cv-stage'), panel = root.querySelector('.cv-panel');
    const mail = h('button', { type: 'button', class: 'cv-cta', onclick: () => { const a = opts.email; if (!a) return; navigator.clipboard?.writeText(a).then(() => { mail.textContent = 'Copied ' + a; setTimeout(() => { mail.textContent = 'Ask me about this'; }, 1800); }, () => { location.href = 'mailto:' + a; }); } }, 'Ask me about this');
    panel.replaceChildren(
      h('div', { class: 'cv-top' }, opts.embedded ? h('span') : h('button', { type: 'button', class: 'cv-ico', 'aria-label': 'Close', onclick: close }, '×'), h('span', { class: 'cv-grow' }),
        h('button', { type: 'button', class: 'cv-ico', 'aria-label': 'Previous: ' + prev.title, title: prev.title, onclick: () => go(prev.id) }, '←'),
        h('button', { type: 'button', class: 'cv-ico', 'aria-label': 'Next: ' + next.title, title: next.title, onclick: () => go(next.id) }, '→')),
      h('div', { class: 'cv-head' }, h('p', { class: 'cv-meta' }, [p.org, p.year].filter(Boolean).join(' · ')), h('h2', {}, p.title), h('p', { class: 'cv-line' }, p.line)),
      h('dl', { class: 'cv-facts' }, (p.facts || []).filter(([, v]) => v).map(([k, v]) => [h('dt', {}, k), h('dd', {}, v[0].toUpperCase() + v.slice(1))])),
      h('div', { class: 'cv-contents' }, h('p', { class: 'cv-k' }, h('span', {}, 'Contents'), h('span', { class: 'cv-where' }, '')),
        h('ul', { class: 'cv-toc' }, p.secs.map((s, k) => h('li', {}, h('button', { type: 'button', 'data-id': s.id, onclick: () => { const t = stage.querySelector('#cv-' + s.id); stage.scrollTo({ top: t.offsetTop - 96, behavior: RM() ? 'auto' : 'smooth' }); } }, h('span', {}, pad(k + 1)), s.label))))),
      h('div', { class: 'cv-foot' }, mail, h('button', { type: 'button', class: 'cv-next', onclick: () => go(next.id) }, h('span', {}, 'Next'), next.title + ' →')));
    stage.replaceChildren(h('div', { class: 'cv-col' },
      ...p.secs.map((s, k) => h('section', { class: 'cv-sec' + (s.vis.length ? '' : ' words'), id: 'cv-' + s.id, 'aria-label': s.label },
        s.vis.length ? h('div', { class: 'cv-imgs n' + Math.min(s.vis.length, 3) }, s.vis.map(v => h('figure', { class: 'cv-print' }, h('img', { src: v.src, alt: v.alt || s.label, loading: k < 2 ? 'eager' : 'lazy' })))) : null,
        h('div', { class: 'cv-note' }, h('p', { class: 'cv-k' }, h('b', {}, pad(k + 1)), s.label),
          h('div', { class: 'cv-body' }, s.head ? h('h3', {}, s.head) : null, ...(s.text || []).filter(Boolean).map(t => h('p', {}, t)),
            s.quote ? h('blockquote', {}, '“' + String(s.quote.t || s.quote).replace(/^["“\s]+|["”\s]+$/g, '') + '”') : null,
            s.nums ? h('div', { class: 'cv-nums' }, s.nums.map(([n, l]) => h('div', {}, h('b', {}, n), h('span', {}, l)))) : null,
            s.cap ? h('p', { class: 'cv-cap' }, s.cap) : null)))),
      h('button', { type: 'button', class: 'cv-end', onclick: () => go(next.id) }, h('span', {}, 'Next'), next.title + ' →')));
    if (!first) stage.scrollTop = 0;
    mark(p.secs[0].id);
    io?.disconnect();
    io = new IntersectionObserver(es => { const e = es.find(x => x.isIntersecting); if (e) mark(e.target.id.slice(3)); }, { root: stage, rootMargin: '-40% 0px -55% 0px' });
    stage.querySelectorAll('.cv-sec').forEach(s => io.observe(s));
  }
  function go(id) { if (cur && cur.id === id) return; root.classList.add('swap'); setTimeout(() => { show(id); root.classList.remove('swap'); }, 220); }

  function open(projects, id, o = {}) {
    PJ = projects; opts = o;
    if (!root) {
      root = h('div', { class: 'cv' + (o.embedded ? ' embedded' : ''), role: o.embedded ? null : 'dialog', 'aria-modal': o.embedded ? null : 'true', 'aria-label': 'Case study' },
        h('nav', { class: 'cv-dock', 'aria-label': 'Projects' }, PJ.map(p => h('button', { type: 'button', 'data-id': p.id, 'aria-label': p.title, title: p.title, onclick: () => go(p.id) }, h('img', { src: p.thumb, alt: '' })))),
        h('main', { class: 'cv-stage', tabindex: -1 }), h('aside', { class: 'cv-panel', 'aria-label': 'About this project' }));
      document.body.append(root);
      root.addEventListener('keydown', e => { if (e.key === 'Escape') close(); if (e.target.closest('input,textarea')) return; if (e.key === 'ArrowRight') go(PJ[(PJ.indexOf(cur) + 1) % PJ.length].id); if (e.key === 'ArrowLeft') go(PJ[(PJ.indexOf(cur) - 1 + PJ.length) % PJ.length].id); });
      requestAnimationFrame(() => { root.classList.add('on'); if (!o.embedded) document.documentElement.classList.add('cv-open'); root.querySelector('.cv-stage').focus({ preventScroll: true }); });
    }
    cur = null; show(id, true);
  }
  window.CaseView = { open, close, caseProjects };
})();
