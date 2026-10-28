// Shared behaviour for the homepage and case study pages.
// Every block checks that its elements exist, so pages can omit any section.

(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── LANGUAGE (remembered across pages) ──────────────────
  let storedLang = 'en';
  try { storedLang = localStorage.getItem('lang') === 'zh' ? 'zh' : 'en'; } catch (e) {}
  let currentLang = 'en';

  function applyLang(lang, animate) {
    currentLang = lang;
    const en = document.getElementById('btnEn');
    const zh = document.getElementById('btnZh');
    if (en) en.classList.toggle('active', lang === 'en');
    if (zh) zh.classList.toggle('active', lang === 'zh');
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    const swap = () => {
      $$('[data-en]').forEach(el => {
        const val = el.getAttribute('data-' + lang);
        if (val !== null) el.innerHTML = val;
      });
    };
    if (!animate) { swap(); return; }
    const fadeable = $$('.lang-fade');
    fadeable.forEach(el => el.classList.add('fading'));
    setTimeout(() => { swap(); fadeable.forEach(el => el.classList.remove('fading')); }, 250);
  }

  window.setLang = function (lang) {
    if (lang === currentLang) return;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    applyLang(lang, true);
  };

  // ── CUSTOM CURSOR ───────────────────────────────────────
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  if (cursor && ring) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
    $$('a, button, .case-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.style.width = '56px'; ring.style.height = '56px';
        cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
      });
      el.addEventListener('mouseleave', () => {
        ring.style.width = '36px'; ring.style.height = '36px';
        cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });

    let trailT = 0;
    document.addEventListener('mousemove', e => {
      if (Date.now() - trailT < 32) return;
      trailT = Date.now();
      const d = document.createElement('div');
      d.className = 'trail-dot';
      d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 720);
    });
  }

  // ── SCROLL PROGRESS + HERO PARALLAX ─────────────────────
  const progressBar = document.getElementById('scrollProgress');
  const heroSection = document.getElementById('hero');
  const heroName = $('.hero-name');
  const heroTag = $('.hero-tag');
  const heroNick = $('.hero-nickname');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && max > 0) progressBar.style.width = (window.scrollY / max * 100) + '%';
    if (heroSection && heroName && heroTag && heroNick) {
      const y = window.scrollY, vh = window.innerHeight;
      if (y < vh * 1.2) {
        heroName.style.transform = `translateY(${y * 0.22}px)`;
        heroTag.style.transform = `translateY(${y * 0.12}px)`;
        heroNick.style.transform = `translateY(${y * 0.18}px)`;
        heroSection.style.opacity = Math.max(0, 1 - (y / vh) * 1.4);
      }
    }
  }, { passive: true });

  // ── NAV SCROLL ──────────────────────────────────────────
  const nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── GA4: contact and case clicks ────────────────────────
  $$('[data-cta], .contact-link').forEach(el => {
    el.addEventListener('click', () => {
      const cta = el.getAttribute('data-cta') || (el.href && el.href.startsWith('mailto:') ? 'contact_email' : 'contact_linkedin');
      try { if (typeof gtag === 'function') gtag('event', 'cta_click', { cta: cta, lang: currentLang, page: location.pathname }); } catch (e) {}
    });
  });

  // ── DIRECTIONAL CARD ENTRANCE ───────────────────────────
  $$('.cases .case-card').forEach((card, i) => {
    card.style.setProperty('--slide-dir', i % 2 === 0 ? '80px' : '-80px');
    card.style.setProperty('--slide-rot', i % 2 === 0 ? '2deg' : '-2deg');
    card.classList.add('slide-init');
    card.style.transitionDelay = (i * 100) + 'ms';
  });

  // ── COUNT-UP ────────────────────────────────────────────
  function animateCount(el) {
    const target = parseInt(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = prefix + Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  const heroStats = $('.hero-stats');
  if (heroStats) {
    const statsObs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          heroStats.classList.add('stats-go');
          heroStats.querySelectorAll('[data-count]').forEach(animateCount);
          statsObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    statsObs.observe(heroStats);
  }

  const countObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); countObs.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  $$('.case-card [data-count], .case-hero [data-count]').forEach(el => countObs.observe(el));

  // ── STACK ITEMS POP ─────────────────────────────────────
  const stackGrid = $('.stack-grid');
  if (stackGrid) {
    const stackObs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.stack-item').forEach((item, i) => setTimeout(() => item.classList.add('pop'), i * 35));
          stackObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    stackObs.observe(stackGrid);
  }

  // ── MAGNETIC CONTACT BUTTONS ────────────────────────────
  $$('.contact-link').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.28}px,${(e.clientY - (r.top + r.height / 2)) * 0.28}px) scale(1.04)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  // ── CARD 3D TILT ────────────────────────────────────────
  $$('.case-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      if (!card.classList.contains('visible')) return;
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      card.style.transform = `perspective(1400px) rotateY(${dx * 4}deg) rotateX(${-dy * 2}deg) translateY(-4px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  // ── TYPING EFFECT (homepage tagline, English only) ──────
  const tagline = $('.hero-tagline');
  if (tagline && storedLang !== 'en') tagline.style.opacity = '1';
  if (tagline && storedLang === 'en') {
    const html = tagline.getAttribute('data-en') || tagline.innerHTML;
    const segs = [];
    for (let i = 0, bold = false; i < html.length;) {
      if (html.startsWith('<strong>', i)) { bold = true; i += 8; }
      else if (html.startsWith('</strong>', i)) { bold = false; i += 9; }
      else { segs.push({ ch: html[i], bold }); i++; }
    }
    const build = (n) => {
      let h = '', inB = false;
      for (let i = 0; i < Math.min(n, segs.length); i++) {
        const { ch, bold } = segs[i];
        if (bold && !inB) { h += '<strong>'; inB = true; }
        if (!bold && inB) { h += '</strong>'; inB = false; }
        h += ch === '&' ? '&amp;' : ch;
      }
      return inB ? h + '</strong>' : h;
    };
    tagline.innerHTML = '';
    tagline.style.opacity = '1';
    setTimeout(() => {
      let idx = 0;
      (function type() {
        if (currentLang !== 'en') return;
        tagline.innerHTML = build(idx) + (idx <= segs.length ? '<span class="type-cursor">|</span>' : '');
        idx++;
        if (idx <= segs.length) setTimeout(type, idx < 8 ? 50 : 16);
        else setTimeout(() => { if (currentLang === 'en') tagline.innerHTML = build(segs.length); }, 900);
      })();
    }, 980);
  }

  // ── REVEAL ON SCROLL ────────────────────────────────────
  const masterObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); masterObs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .slide-init, .section-title, .section-label, .contact-headline').forEach(el => masterObs.observe(el));

  // Apply the remembered language last, after all elements are set up.
  if (storedLang === 'zh') applyLang('zh', false);
})();
