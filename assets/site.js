// Language toggle (remembered across pages) and click tracking.
(function () {
  let current = 'en';

  function apply(lang) {
    current = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    document.querySelectorAll('[data-en]').forEach(el => {
      const val = el.getAttribute('data-' + lang);
      if (val !== null) el.innerHTML = val;
    });
    const en = document.getElementById('btnEn');
    const zh = document.getElementById('btnZh');
    if (en) { en.classList.toggle('active', lang === 'en'); en.setAttribute('aria-pressed', lang === 'en'); }
    if (zh) { zh.classList.toggle('active', lang === 'zh'); zh.setAttribute('aria-pressed', lang === 'zh'); }
  }

  window.setLang = function (lang) {
    if (lang === current) return;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    apply(lang);
  };

  let stored = 'en';
  try { stored = localStorage.getItem('lang') === 'zh' ? 'zh' : 'en'; } catch (e) {}
  if (stored === 'zh') apply('zh');

  document.querySelectorAll('[data-cta]').forEach(el => {
    el.addEventListener('click', () => {
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'cta_click', { cta: el.getAttribute('data-cta'), lang: current, page: location.pathname });
        }
      } catch (e) {}
    });
  });
})();
