// Visit stats with Microsoft Clarity, on the live site only (not the Claude mirror or the github.io copy).
// Consent is set to denied before Clarity loads, so it runs without cookies and nobody is asked to accept any.
(() => {
  if (!/(^|\.)harshitashyale\.com$/.test(location.hostname)) return;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'z8k5l12icm');
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
})();
