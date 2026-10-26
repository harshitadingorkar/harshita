(() => {
  const markup = () => '<svg viewBox="0 0 100 100" class="ink chrysanthemum" aria-hidden="true"><image href="assets/mark-chry.svg" width="100" height="100"/></svg>';
  window.portfolioMark = { markup };

  fetch('assets/mark-chry.svg')
    .then(response => response.ok ? response.text() : Promise.reject())
    .then(source => {
      const root = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      const group = root.querySelector('g');
      if (!group) return;

      const hydrate = node => {
        const marks = node.matches?.('.chrysanthemum') ? [node] : [];
        marks.push(...node.querySelectorAll?.('.chrysanthemum:not([data-chrysanthemum-ready])') || []);
        marks.forEach(mark => {
          if (mark.hasAttribute('data-chrysanthemum-ready')) return;
          const art = group.cloneNode(true);
          art.setAttribute('fill', 'currentColor');
          art.setAttribute('filter', 'url(#chrysanthemum-inkf)');
          art.querySelectorAll('.pe').forEach(petal => {
            const i = Number(petal.style.getPropertyValue('--i'));
          petal.style.setProperty('--bloom-delay', `${(59 - i) * 14}ms`);
          petal.style.setProperty('--sway-duration', `${5.5 + (i % 5) * .4}s`);
          petal.style.setProperty('--sway-delay', `${-i * .37}s`);
          petal.addEventListener('animationend', event => {
            if (event.animationName === 'chrysanthemum-bloom') petal.classList.add('bloomed');
          });
          });
          mark.setAttribute('data-chrysanthemum-ready', '');
          mark.replaceChildren(art);
        });
      };

      hydrate(document);
      new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) hydrate(node);
      }))).observe(document.body, { childList: true, subtree: true });
    })
    .catch(() => {});
})();
