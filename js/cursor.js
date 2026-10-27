// The cursor: one small ink dot, exactly under the hand. It grows a little over anything you can
// click and hides over text fields. Mice and trackpads only; touch keeps its own.
(() => {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const root = document.createElement('div');
  root.id = 'cursor'; root.setAttribute('aria-hidden', 'true'); root.dataset.shape = 'dot';
  root.innerHTML = '<i></i>';
  document.body.append(root);

  let live = false;
  const read = el => {
    if (el.closest('input, textarea, select, [contenteditable]')) return 'none';
    if (el.closest('a, button, [role=button], label, summary, .pt, .itable tr.row, #hello .cc, .chip, .contact-sheet')) return 'link';
    return 'dot';
  };
  const set = el => { const s = read(el); if (root.dataset.shape !== s) root.dataset.shape = s; root.classList.toggle('paper', !!el.closest('#hello .cc')); };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') { if (live) { live = false; root.classList.add('off'); document.documentElement.classList.remove('has-cursor'); } return; }
    if (!live) { live = true; root.classList.remove('off'); document.documentElement.classList.add('has-cursor'); }
    root.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    root.classList.remove('gone');
  }, { passive: true });
  addEventListener('pointerover', e => { if (e.pointerType === 'mouse') set(e.target); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => root.classList.add('gone'));
  addEventListener('blur', () => root.classList.add('gone'));
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') root.classList.add('down'); }, { passive: true });
  addEventListener('pointerup', () => root.classList.remove('down'), { passive: true });
  // things appear and vanish under a still pointer (a dialog opening, a list replacing the map)
  addEventListener('click', e => setTimeout(() => { const el = document.elementFromPoint(e.clientX, e.clientY); if (el) set(el); }, 40));
})();
