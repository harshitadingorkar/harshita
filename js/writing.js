// Visitor comments on a writing post, through giscus (GitHub Discussions, one thread per post).
// Until data/writing-config.json has a categoryId, nothing loads and the page keeps its email link.
(() => {
  const host = document.getElementById('giscus');
  if (!host) return;
  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  fetch('../../data/writing-config.json', { cache: 'no-cache' }).then(r => r.json()).then(c => {
    const g = c.giscus;
    if (!g || !g.repoId || !g.categoryId) return;
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js'; s.async = true; s.crossOrigin = 'anonymous';
    Object.entries({ repo: g.repo, 'repo-id': g.repoId, category: g.category, 'category-id': g.categoryId, mapping: 'pathname', strict: '1',
      'reactions-enabled': '1', 'emit-metadata': '0', 'input-position': 'top', theme: theme(), lang: 'en', loading: 'lazy' })
      .forEach(([k, v]) => s.setAttribute('data-' + k, v));
    host.append(s);
    const fb = document.getElementById('talk-fallback'); if (fb) fb.hidden = true;
    // follow the site's light/dark switch
    new MutationObserver(() => { const f = document.querySelector('iframe.giscus-frame'); f && f.contentWindow.postMessage({ giscus: { setConfig: { theme: theme() } } }, 'https://giscus.app'); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }).catch(() => {});
})();
