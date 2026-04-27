/* ═══════════════════════════════════════
   ArGen — Animation Engine v3.0
   Particle Hero + GSAP + Lenis + Chatbot
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────── BOOT SEQUENCE ─────────────── */
  const bootLines = [
    '> ARGEN_SYS v3.1.0 initializing...',
    '> Loading particle engine...',
    '> Connecting to Claude API... ✓',
    '> Challenge bank loaded [5/5]',
    '> Scoring rubric: 4 dimensions × 25pts',
    '> Benchmark data: 12 teams indexed',
    '> Wave formation module ready.',
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
    progress += (100 - progress) * 0.12 + Math.random() * 4;
    if (progress > 99) progress = 100;
    loaderFill.style.width = progress + '%';
    loaderPct.textContent = Math.floor(progress) + '%';

    if (progress >= 100 && bootIdx >= bootLines.length) {
      setTimeout(() => {
        loader.classList.add('done');
        setTimeout(initAll, 500);
      }, 350);
      return;
    }
    setTimeout(bootTick, 100 + Math.random() * 160);
  }
  setTimeout(bootTick, 400);

  /* ─────────────── MAIN INIT ─────────────── */
  function initAll() {
    initParticles();
    initLenis();
    initCursor();
    initNav();
    initMobileMenu();
    initAccordions();
    initGSAP();
    initCounters();
    initAiBar();
  }

  /* ═══════════════════════════════════════════
     PARTICLE GRID ENGINE
     - Pixels arranged evenly
     - Mouse repulsion
     - Ripple fade out on interaction
     ═══════════════════════════════════════════ */
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let particleCanvas, pCtx;
  const REPULSION_RADIUS = 150;
  const REPULSION_STRENGTH = 1.5;
  const COLORS = ['#4A6EE0', '#7C3AED', '#06B6D4', '#22C55E', '#FFFFFF'];
  let animFrameId;
  let hasInteracted = false;
  let rippleTarget = { x: 0, y: 0 };
  let rippleRadius = 0;
  let dpr = 1;

  function initParticles() {
    particleCanvas = document.getElementById('particleCanvas');
    if (!particleCanvas) return;
    pCtx = particleCanvas.getContext('2d');
    resizeCanvas();
    spawnGrid();

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
      if (hasInteracted) return;
      mouse.x = e.clientX * dpr;
      mouse.y = e.clientY * dpr;
    });
    
    // Interaction trigger (click or scroll)
    const triggerRipple = (e) => {
      if (hasInteracted) return;
      hasInteracted = true;
      
      // Determine ripple center
      if (e && e.clientX) {
        rippleTarget.x = e.clientX * dpr;
        rippleTarget.y = e.clientY * dpr;
      } else {
        rippleTarget.x = particleCanvas.width / 2;
        rippleTarget.y = particleCanvas.height / 2;
      }
      
      // Make canvas background transparent
      particleCanvas.style.background = 'transparent';
      
      // Push particles outward aggressively
      particles.forEach(p => {
        const dx = p.x - rippleTarget.x;
        const dy = p.y - rippleTarget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const force = 3000 / (dist + 50);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      });
    };

    document.addEventListener('click', triggerRipple);
    document.addEventListener('wheel', triggerRipple, { once: true });
    document.addEventListener('touchstart', triggerRipple, { once: true });

    window.addEventListener('resize', () => {
      resizeCanvas();
      spawnGrid();
    });

    // Start render loop
    renderParticles();
  }

  function resizeCanvas() {
    if (!particleCanvas) return;
    dpr = window.devicePixelRatio || 1;
    particleCanvas.width = window.innerWidth * dpr;
    particleCanvas.height = window.innerHeight * dpr;
    particleCanvas.style.width = window.innerWidth + 'px';
    particleCanvas.style.height = window.innerHeight + 'px';
  }

  function spawnGrid() {
    particles = [];
    const spacing = 35 * dpr;
    const cols = Math.ceil(particleCanvas.width / spacing);
    const rows = Math.ceil(particleCanvas.height / spacing);
    
    const offsetX = (particleCanvas.width - cols * spacing) / 2;
    const offsetY = (particleCanvas.height - rows * spacing) / 2;

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        particles.push({
          baseX: offsetX + i * spacing,
          baseY: offsetY + j * spacing,
          x: offsetX + i * spacing,
          y: offsetY + j * spacing,
          vx: 0,
          vy: 0,
          size: 2 * dpr,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: 0.3 + Math.random() * 0.7,
          faded: false
        });
      }
    }
  }

  function renderParticles() {
    if (!pCtx) return;
    const W = particleCanvas.width;
    const H = particleCanvas.height;

    pCtx.clearRect(0, 0, W, H);
    
    // Expand ripple
    if (hasInteracted) {
      rippleRadius += 40 * dpr;
    }

    let allFaded = true;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.faded) continue;
      
      allFaded = false;

      // Cursor repulsion
      if (!hasInteracted) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulseR = REPULSION_RADIUS * dpr;
        
        if (dist < repulseR && dist > 0) {
          const force = ((repulseR - dist) / repulseR) * REPULSION_STRENGTH;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Return to base
        const springX = (p.baseX - p.x) * 0.05;
        const springY = (p.baseY - p.y) * 0.05;
        p.vx += springX;
        p.vy += springY;
      }
      
      // Ripple logic
      if (hasInteracted) {
        const dx = p.x - rippleTarget.x;
        const dy = p.y - rippleTarget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < rippleRadius) {
          p.opacity -= 0.04;
          if (p.opacity <= 0) p.faded = true;
        }
      }

      // Damping
      p.vx *= 0.9;
      p.vy *= 0.9;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Draw
      if (p.opacity > 0) {
        pCtx.globalAlpha = Math.max(0, p.opacity);
        pCtx.fillStyle = p.color;
        pCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    pCtx.globalAlpha = 1;
    
    if (hasInteracted && allFaded) {
      particleCanvas.style.display = 'none';
      return; // Stop animation loop once everything is faded
    }
    
    animFrameId = requestAnimationFrame(renderParticles);
  }

  /* ─────────────── LENIS ─────────────── */
  let lenis;
  function initLenis() {
    lenis = new Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.85 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ─────────────── CURSOR ─────────────── */
  function initCursor() {
    const dot = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring || 'ontouchstart' in window) return;

    document.addEventListener('mousemove', (e) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'power2.out' });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.25, ease: 'power2.out' });
    });

    const hovers = document.querySelectorAll('a, button, .acc-trigger, .card, .price-card, .chat-toggle, .chat-sug');
    hovers.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ─────────────── NAV ─────────────── */
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

  /* ─────────────── MOBILE MENU ─────────────── */
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

  /* ─────────────── ACCORDIONS ─────────────── */
  function initAccordions() {
    document.querySelectorAll('.acc-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.parentElement;
        const wasOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  /* ─────────────── COUNTERS ─────────────── */
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: target, duration: 1.8, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.floor(this.targets()[0].val); }
          });
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     GSAP MASTER ANIMATIONS
     ═══════════════════════════════════════════ */
  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // ── Hero entrance ──
    const heroTL = gsap.timeline({ delay: 0.15 });
    heroTL
      .to('.hero .reveal', { y: 0, opacity: 1, duration: 1, stagger: 0.14, ease: 'power4.out' })
      .to('.reveal-line', { y: '0%', duration: 0.9, stagger: 0.12, ease: 'power4.out' }, '<0.1');

    // ── Generic scroll reveals ──
    gsap.utils.toArray('.reveal').forEach(el => {
      if (el.closest('.hero') || el.closest('.section-green')) return;
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        y: 0, opacity: 1, duration: 0.9, ease: 'power4.out'
      });
    });

    // ── Card staggers ──
    document.querySelectorAll('.card-grid').forEach(grid => {
      gsap.to(grid.querySelectorAll('.reveal-card'), {
        scrollTrigger: { trigger: grid, start: 'top 82%' },
        y: 0, opacity: 1, scale: 1, duration: 0.8,
        stagger: 0.12, ease: 'power4.out'
      });
    });

    // ── HORIZONTAL SCROLL PIN (How It Works) ──
    const howTrack = document.getElementById('howTrack');
    if (howTrack) {
      const scrollDist = howTrack.scrollWidth - window.innerWidth;
      const mainAnim = gsap.to(howTrack, {
        x: -scrollDist,
        ease: 'none',
        scrollTrigger: {
          trigger: '.how-section',
          start: 'top top',
          end: '+=' + (scrollDist + 1000),
          pin: true,
          scrub: 1.5,
          anticipatePin: 1,
        }
      });

      // Animate each step
      howTrack.querySelectorAll('.how-step').forEach(step => {
        gsap.from(step.querySelector('.step-num-big'), {
          x: 100, opacity: 0, duration: 0.7,
          scrollTrigger: {
            trigger: step,
            containerAnimation: mainAnim,
            start: 'left 85%',
            toggleActions: 'play none none none'
          }
        });
        gsap.from(step.querySelector('.step-content'), {
          y: 50, opacity: 0, duration: 0.8,
          scrollTrigger: {
            trigger: step,
            containerAnimation: mainAnim,
            start: 'left 75%',
            toggleActions: 'play none none none'
          }
        });
      });
    }

    // ── Pricing cards ──
    gsap.set('.price-card', { y: 60, opacity: 0, scale: 0.96 });
    gsap.to('.price-card', {
      scrollTrigger: { trigger: '.pricing-grid', start: 'top 82%' },
      y: 0, opacity: 1, scale: 1, duration: 0.7,
      stagger: 0.1, ease: 'power4.out'
    });

    // ── Proof number ──
    gsap.from('.proof-num', {
      scrollTrigger: { trigger: '.proof-stat', start: 'top 85%' },
      scale: 0.4, opacity: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)'
    });

    // ── CTA section ──
    gsap.utils.toArray('.section-green .reveal').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: '.section-green', start: 'top 75%' },
        y: 50, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power4.out'
      });
    });

    // ── Section tags parallax ──
    gsap.utils.toArray('.section-tag').forEach(tag => {
      gsap.to(tag, {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: { trigger: tag, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // ── Section H2 clip-path reveal ──
    document.querySelectorAll('.section').forEach(sec => {
      const h2 = sec.querySelector('.section-h2');
      if (!h2) return;
      gsap.from(h2, {
        scrollTrigger: { trigger: h2, start: 'top 87%' },
        clipPath: 'inset(0 100% 0 0)',
        duration: 1, ease: 'power4.inOut'
      });
    });

    // ── Score bar fill on scroll ──
    document.querySelectorAll('.score-fill').forEach(bar => {
      ScrollTrigger.create({
        trigger: bar,
        start: 'top 90%',
        once: true,
        onEnter: () => bar.classList.add('active')
      });
    });
  }

  /* ═══════════════════════════════════════════
     FLOATING AI BAR (FAQ POWERED)
     ═══════════════════════════════════════════ */
  const FAQ_DB = {
    'how long': 'Evaluations take **48 hours** from submission to report delivery. Most teams complete challenges within 24 hours of receiving them.',
    'how does': 'Your team completes 5 real business challenges. Claude scores each response across 4 dimensions. You get a detailed report in 48 hours.',
    'pricing': 'We offer 4 tiers:<br>→ **Free Pilot**: ₹0 (5 people)<br>→ **Team Snapshot**: ₹24,999 (25 people)<br>→ **Team Intelligence**: ₹12,999/mo<br>→ **Enterprise**: Custom',
    'cost': 'Free Pilot is completely free — 5 people, full report, no commitment. Paid plans start at ₹24,999.',
    'what is argen': 'ArGen measures how well your team actually uses AI tools. We evaluate real work output across 4 dimensions: Clarity, Constraint Application, Critical Thinking, and Communication.',
    'reliable': 'Yes. Claude\'s scoring shows 94% correlation with expert human evaluators. Every dimension has clear criteria, and we provide justification for each score.',
    'refund': 'If the report doesn\'t deliver actionable insights, we refund 100%. No questions asked.',
    'customize': 'Enterprise and Team Intelligence plans include custom challenge creation tailored to your industry and roles.',
    'free pilot': 'Yes! Run a free 5-person evaluation. No credit card needed. Full scored report in 48 hours.',
    'dimensions': 'We score on 4 dimensions (0-25 each):<br>1. **Clarity** — Structure and actionability<br>2. **Constraint Application** — Following the brief<br>3. **Critical Thinking** — Original analysis<br>4. **Communication** — Audience-appropriate delivery',
    'challenges': 'We test 5 areas: Strategy, Data Analysis, Communication, Creative Problem Solving, and Technical Execution. Each uses real-world scenarios.',
    'hello': 'Hey! 👋 I\'m the ArGen AI. Ask me anything about how we evaluate AI performance.',
    'hi': 'Hey! 👋 I\'m the ArGen AI. Ask me anything about how we evaluate AI performance.',
    'default': 'Great question! For detailed info, check out our How It Works section or start a free pilot to see it in action. Can I help with pricing or the evaluation process?'
  };

  function initAiBar() {
    const input = document.getElementById('aiBarInput');
    const submitBtn = document.getElementById('aiBarSubmit');
    const responsePanel = document.getElementById('aiBarResponse');
    const responseContent = document.getElementById('aiResponseContent');
    const closeBtn = document.getElementById('aiBarClose');
    
    if (!input || !submitBtn || !responsePanel) return;

    function matchFAQ(query) {
      const q = query.toLowerCase();
      for (const [key, val] of Object.entries(FAQ_DB)) {
        if (key === 'default') continue;
        if (q.includes(key)) return val;
      }
      return FAQ_DB['default'];
    }

    function askAI() {
      const text = input.value.trim();
      if (!text) return;
      
      // Show panel with loading state
      responsePanel.classList.add('show');
      responseContent.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
      input.value = '';

      // Simulate AI reasoning delay
      setTimeout(() => {
        const answer = matchFAQ(text);
        const formatted = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        responseContent.innerHTML = formatted;
      }, 800 + Math.random() * 600);
    }

    submitBtn.addEventListener('click', askAI);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') askAI();
    });

    closeBtn.addEventListener('click', () => {
      responsePanel.classList.remove('show');
    });
  }

})();
