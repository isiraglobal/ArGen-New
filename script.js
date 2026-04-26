/* ═══════════════════════════════════════
   ArGen — Animation Engine
   GSAP ScrollTrigger + Lenis + Terminal FX
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  // ─── BOOT SEQUENCE ───
  const bootLines = [
    '> ARGEN_SYS v2.4.1 initializing...',
    '> Loading evaluation engine...',
    '> Connecting to Claude API... ✓',
    '> Challenge bank loaded [5/5]',
    '> Scoring rubric: 4 dimensions × 25pts',
    '> Benchmark data: 12 teams indexed',
    '> System ready.',
    '> _'
  ];

  const loader = document.getElementById('loader');
  const loaderLines = document.getElementById('loaderLines');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');
  let bootIdx = 0, progress = 0;

  function bootTick() {
    if (bootIdx < bootLines.length) {
      const line = document.createElement('div');
      line.className = 'loader-line';
      line.textContent = bootLines[bootIdx];
      loaderLines.appendChild(line);
      requestAnimationFrame(() => line.classList.add('show'));
      bootIdx++;
    }
    progress += (100 - progress) * 0.15 + Math.random() * 5;
    if (progress > 99) progress = 100;
    loaderFill.style.width = progress + '%';
    loaderPct.textContent = Math.floor(progress) + '%';

    if (progress >= 100 && bootIdx >= bootLines.length) {
      setTimeout(() => {
        loader.classList.add('done');
        setTimeout(initAll, 500);
      }, 300);
      return;
    }
    setTimeout(bootTick, 120 + Math.random() * 180);
  }
  setTimeout(bootTick, 400);

  // ─── MAIN INIT ───
  function initAll() {
    initLenis();
    initCursor();
    initNav();
    initMobileMenu();
    initAccordions();
    initGSAP();
    initCounters();
  }

  // ─── LENIS ───
  let lenis;
  function initLenis() {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ─── CUSTOM CURSOR ───
  function initCursor() {
    const dot = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring || 'ontouchstart' in window) return;

    document.addEventListener('mousemove', (e) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out' });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.3, ease: 'power2.out' });
    });

    const hovers = document.querySelectorAll('a, button, .acc-trigger, .card, .price-card');
    hovers.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // ─── NAV HIDE/SHOW ───
  function initNav() {
    const nav = document.getElementById('nav');
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 80);
      nav.classList.toggle('hide-nav', y > lastY && y > 400);
      lastY = y;
    });
  }

  // ─── MOBILE MENU ───
  function initMobileMenu() {
    const burger = document.getElementById('burger');
    const menu = document.getElementById('mobileMenu');
    if (!burger || !menu) return;
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      menu.classList.toggle('open');
      if (menu.classList.contains('open') && lenis) lenis.stop();
      else if (lenis) lenis.start();
    });
    menu.querySelectorAll('.mm-link').forEach(l => {
      l.addEventListener('click', () => {
        burger.classList.remove('active');
        menu.classList.remove('open');
        if (lenis) lenis.start();
      });
    });
  }

  // ─── ACCORDIONS ───
  function initAccordions() {
    document.querySelectorAll('.acc-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.parentElement;
        const wasOpen = item.classList.contains('open');
        // Close siblings
        item.parentElement.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  // ─── NUMBER COUNTERS ───
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: target, duration: 1.5, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.floor(this.targets()[0].val); }
          });
        }
      });
    });
  }

  // ─── GSAP MASTER ───
  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // --- Hero entrance (immediate) ---
    const heroTL = gsap.timeline({ delay: 0.1 });
    heroTL
      .to('.hero .reveal', { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power4.out' })
      .to('.reveal-line', { y: '0%', duration: 0.8, stagger: 0.1, ease: 'power4.out' }, '<0.1');

    // --- Generic reveals ---
    gsap.utils.toArray('.reveal').forEach(el => {
      if (el.closest('.hero')) return; // skip hero, handled above
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        y: 0, opacity: 1, duration: 0.8, ease: 'power4.out'
      });
    });

    // --- Card staggers ---
    document.querySelectorAll('.card-grid').forEach(grid => {
      gsap.to(grid.querySelectorAll('.reveal-card'), {
        scrollTrigger: { trigger: grid, start: 'top 80%' },
        y: 0, opacity: 1, scale: 1, duration: 0.7,
        stagger: 0.1, ease: 'power4.out'
      });
    });

    // --- HORIZONTAL SCROLL PIN (How It Works) ---
    const howTrack = document.getElementById('howTrack');
    if (howTrack) {
      const steps = howTrack.querySelectorAll('.how-step');
      const scrollDist = howTrack.scrollWidth - window.innerWidth;

      gsap.to(howTrack, {
        x: -scrollDist,
        ease: 'none',
        scrollTrigger: {
          trigger: '.how-section',
          start: 'top top',
          end: '+=' + (scrollDist + 800),
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
        }
      });

      // Animate each step as it enters viewport
      steps.forEach((step, i) => {
        gsap.from(step.querySelector('.step-num-big'), {
          x: 80, opacity: 0, duration: 0.6,
          scrollTrigger: {
            trigger: step,
            containerAnimation: gsap.to(howTrack, { x: -scrollDist, ease: 'none' }),
            start: 'left 80%',
            toggleActions: 'play none none none'
          }
        });
        gsap.from(step.querySelector('.step-content'), {
          y: 40, opacity: 0, duration: 0.7,
          scrollTrigger: {
            trigger: step,
            containerAnimation: gsap.to(howTrack, { x: -scrollDist, ease: 'none' }),
            start: 'left 70%',
            toggleActions: 'play none none none'
          }
        });
      });
    }

    // --- Pricing cards stagger ---
    gsap.to('.price-card', {
      scrollTrigger: { trigger: '.pricing-grid', start: 'top 80%' },
      y: 0, opacity: 1, scale: 1, duration: 0.6,
      stagger: 0.08, ease: 'power4.out'
    });
    // Set initial state
    gsap.set('.price-card', { y: 50, opacity: 0, scale: 0.97 });

    // --- Proof number ---
    gsap.from('.proof-num', {
      scrollTrigger: { trigger: '.proof-stat', start: 'top 85%' },
      scale: 0.5, opacity: 0, duration: 1, ease: 'elastic.out(1, 0.5)'
    });

    // --- CTA section ---
    gsap.from('.section-green .reveal', {
      scrollTrigger: { trigger: '.section-green', start: 'top 75%' },
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power4.out'
    });

    // --- Parallax subtle ---
    gsap.utils.toArray('.section-tag').forEach(tag => {
      gsap.to(tag, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: { trigger: tag, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // --- Section divider lines ---
    document.querySelectorAll('.section').forEach(sec => {
      const border = sec.querySelector('.section-h2');
      if (!border) return;
      gsap.from(border, {
        scrollTrigger: { trigger: border, start: 'top 85%' },
        clipPath: 'inset(0 100% 0 0)',
        duration: 0.8,
        ease: 'power4.inOut'
      });
    });
  }
})();
