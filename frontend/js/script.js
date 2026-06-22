/* ═══════════════════════════════════════
   ArGen - Animation Engine v3.0
   Particle Hero + GSAP + Lenis + Chatbot
   ═══════════════════════════════════════ */

// HTML escaping utility (defined globally for pages that don't load api.js)
if (typeof window.escapeHtml !== 'function') {
  window.escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
}

(function () {
  'use strict';

  /* ─────────────── VARIABLE DECLARATIONS (must be at top to avoid TDZ) ─────────────── */
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let particleCanvas, pCtx;
  let animFrameId;
  let hasInteracted = false;
  let rippleTarget = { x: 0, y: 0 };
  let rippleRadius = 0;
  let dpr = 1;
  let bootIdx = 0, progress = 0;

  /* ─────────────── CONSTANTS ─────────────── */
  const REPULSION_RADIUS = 150;
  const REPULSION_STRENGTH = 1.5;
  const COLORS = ['#4A6EE0', '#7C3AED', '#06B6D4', '#22C55E', '#FFFFFF'];

  /* ─────────────── BOOT SEQUENCE ─────────────── */
  const bootLines = [
    'Initializing ArGen Core...',
    'Calibrating AI Benchmarks...',
    'Syncing Neural Weights...',
    'Security Protocols Active.',
    'ArGen Engine Ready.',
    ''
  ];
  const loader = document.getElementById('loader');
  const loaderLines = document.getElementById('loaderLines');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');

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
  if (!loader || !loaderLines || !loaderFill || !loaderPct) {
    initAll();
  } else {
    setTimeout(bootTick, 400);
  }

  /* ─────────────── MAIN INIT ─────────────── */
  function initAll() {
    try {
      initParticles();
      initLenis();
      initNav();
      initAuthUI();
      initMobileMenu();
      initAccordions();
      initGSAP();
      initCounters();
      initAiBar();
    } catch (err) {
      console.error('ArGen Init Error:', err);
      // Fallback: Reveal all elements if GSAP fails
      document.querySelectorAll('.reveal').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
  }

  /* ═══════════════════════════════════════════
     PARTICLE GRID ENGINE
     - Pixels arranged evenly
     - Mouse repulsion
     - Ripple fade out on interaction
     ═══════════════════════════════════════════ */

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
      document.dispatchEvent(new Event('particlesFaded'));
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
  /* Removed initCursor */

  /* ─────────────── NAV ─────────────── */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.classList.add('nav-always-visible');
  }

  /* ─────────────── AUTH UI ─────────────── */
  function initAuthUI() {
    const token = localStorage.getItem('argen_token');
    const navLinks = document.querySelector('.nav-links');
    const mobileMenu = document.getElementById('mobileMenu');
    const navCta = document.querySelector('.nav-cta');
    
    if (!navLinks) return;

    if (token) {
      // User is logged in
      if (!document.getElementById('navDashboardLink')) {
        const dashLink = document.createElement('a');
        dashLink.href = '/dashboard';
        dashLink.className = 'nav-link';
        dashLink.id = 'navDashboardLink';
        dashLink.textContent = 'Dashboard';
        navLinks.appendChild(dashLink);
      }

      if (!document.getElementById('navIntegrationsLink')) {
        const intLink = document.createElement('a');
        intLink.href = '/integrations';
        intLink.className = 'nav-link';
        intLink.id = 'navIntegrationsLink';
        intLink.textContent = 'Integrations';
        navLinks.appendChild(intLink);
      }

      // Org switcher dropdown
      (async function initOrgSwitcher() {
        try {
          const res = await fetch('/api/auth/my-companies', {
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
          });
          if (!res.ok) return;
          const companies = await res.json();
          if (!Array.isArray(companies) || companies.length <= 1) return;
          const activeId = localStorage.getItem('active_company_id') || companies[0].companyId;
          const active = companies.find(c => c.companyId === activeId) || companies[0];
          if (!localStorage.getItem('active_company_id')) {
            localStorage.setItem('active_company_id', active.companyId);
          }
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:relative;display:inline-block;margin-left:12px;';
          wrapper.innerHTML = `
            <button id="orgSwitcherBtn" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:4px 12px;color:#fff;font-size:0.7rem;font-family:var(--font-mono);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;">
              <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
              ${active.name}
              <span style="font-size:0.5rem;opacity:0.5;">▼</span>
            </button>
            <div id="orgSwitcherDropdown" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:8px;min-width:180px;z-index:100;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.4);">
              ${companies.map(c => `
                <div class="org-switcher-item" data-id="${c.companyId}" style="padding:8px 14px;cursor:pointer;font-size:0.75rem;color:${c.companyId === active.companyId ? 'var(--accent)' : '#ccc'};border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:8px;transition:background 0.15s;">
                  <span style="width:6px;height:6px;border-radius:50%;background:${c.companyId === active.companyId ? 'var(--accent)' : 'rgba(255,255,255,0.15)'};display:inline-block;flex-shrink:0;"></span>
                  <span style="flex:1;">${c.name}</span>
                  <span style="font-size:0.6rem;opacity:0.4;text-transform:uppercase;">${c.role}</span>
                </div>
              `).join('')}
            </div>
          `;
          navLinks.appendChild(wrapper);

          // Toggle dropdown
          document.getElementById('orgSwitcherBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const dd = document.getElementById('orgSwitcherDropdown');
            dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
          });
          document.addEventListener('click', () => {
            document.getElementById('orgSwitcherDropdown').style.display = 'none';
          });

          // Switch company
          document.querySelectorAll('.org-switcher-item').forEach(el => {
            el.addEventListener('click', async () => {
              const companyId = el.dataset.id;
              if (companyId === activeId) return;
              try {
                await fetch('/api/auth/switch-company', {
                  method: 'POST',
                  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ companyId })
                });
                localStorage.setItem('active_company_id', companyId);
                localStorage.setItem('company_switched', 'true');
                window.location.reload();
              } catch (e) {
                console.error('Switch failed:', e);
              }
            });
          });
        } catch (e) { /* silently fail */ }
      })();

      if (navCta) {
        navCta.textContent = 'Dashboard →';
        navCta.href = '/dashboard';
      }

      if (mobileMenu && !document.getElementById('mobileDashboardLink')) {
        const mDashLink = document.createElement('a');
        mDashLink.href = '/dashboard';
        mDashLink.className = 'mm-link';
        mDashLink.id = 'mobileDashboardLink';
        mDashLink.textContent = '05 // Dashboard';
        const mLinks = mobileMenu.querySelector('.mm-links');
        if (mLinks) mLinks.appendChild(mDashLink);
      }
    } else {
      // User is not logged in
      if (!document.getElementById('navLoginLink')) {
        const loginLink = document.createElement('a');
        loginLink.href = '/login';
        loginLink.className = 'nav-link';
        loginLink.id = 'navLoginLink';
        loginLink.textContent = 'Login';
        navLinks.appendChild(loginLink);
      }
      
      if (mobileMenu && !document.getElementById('mobileLoginLink')) {
        const mLoginLink = document.createElement('a');
        mLoginLink.href = '/login';
        mLoginLink.className = 'mm-link';
        mLoginLink.id = 'mobileLoginLink';
        mLoginLink.textContent = '05 // Login';
        const mLinks = mobileMenu.querySelector('.mm-links');
        if (mLinks) mLinks.appendChild(mLoginLink);
      }
    }
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
    const heroTL = gsap.timeline({ paused: true });
    heroTL
      .to('.nav', { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' })
      .to('.hero .reveal', { y: 0, opacity: 1, duration: 1, stagger: 0.14, ease: 'power4.out' }, '<0.2')
      .to('.reveal-line', { y: '0%', duration: 0.9, stagger: 0.12, ease: 'power4.out' }, '<0.1')
      .to('.ai-bar-container', { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' }, '<0.2');

    const heroReveal = document.querySelectorAll('.hero .reveal');
    const heroLines = document.querySelectorAll('.reveal-line');
    
    if (heroReveal.length > 0 || heroLines.length > 0) {
      // Auto-play hero entrance regardless of interaction
      heroTL.play();
    } else {
      // If no hero, ensure nav and other basic elements show up
      gsap.to('.nav', { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' });
      gsap.to('.ai-bar-container', { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' });
    }

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
      const cards = grid.querySelectorAll('.reveal-card');
      if (cards.length > 0) {
        gsap.to(cards, {
          scrollTrigger: { trigger: grid, start: 'top 82%' },
          y: 0, opacity: 1, scale: 1, duration: 0.8,
          stagger: 0.12, ease: 'power4.out'
        });
      }
    });

    // ── HORIZONTAL SCROLL PIN (How It Works) ──
    const howTrack = document.getElementById('howTrack');
    if (howTrack) {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        // Desktop horizontal scroll animation
        const stepsCount = howTrack.querySelectorAll('.how-step').length;
        const scrollDist = howTrack.scrollWidth - window.innerWidth + 200;
        const mainAnim = gsap.to(howTrack, {
          x: -scrollDist,
          ease: 'none',
          scrollTrigger: {
            trigger: '.how-section',
            start: 'top top',
            end: '+=' + (scrollDist + 2000),
            pin: true,
            scrub: 1.5,
            anticipatePin: 1,
            snap: {
              snapTo: 1 / (stepsCount - 1),
              duration: { min: 0.2, max: 0.5 },
              ease: 'power1.inOut'
            }
          }
        });

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
      });

      mm.add("(max-width: 768px)", () => {
        // Mobile vertical animation (no horizontal pin)
        howTrack.querySelectorAll('.how-step').forEach(step => {
          gsap.from(step.querySelector('.step-num-big'), {
            x: -50, opacity: 0, duration: 0.8,
            scrollTrigger: {
              trigger: step,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          });
          gsap.from(step.querySelector('.step-content'), {
            y: 30, opacity: 0, duration: 0.8,
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          });
        });
      });
    }    // ── Pricing cards ──
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
     FLOATING AI BAR (API POWERED)
     ═══════════════════════════════════════════ */
  // NOTE: In production, do not expose API keys in client-side code.
  // Use a proxy server or edge function. 
  // You can change these environment variables in your hosting platform.
  const AI_CONFIG = {
    ENDPOINT: '/api/ai/ask',
    SYSTEM_PROMPT: `You are the ArGen Intelligence Agent. You are the digital interface for ArGen's proprietary evaluation engine. 
Answer concisely and with executive professionalism. 
ArGen evaluates real-world AI competency across teams via a 48-hour challenge workflow. 
Our engine analyzes outputs across 4 key dimensions: Clarity, Constraint Application, Critical Thinking, and Communication.
Pricing: Professional Pilot ($0 for 5 people), Enterprise Snapshot ($1,500 for up to 25 people), Intelligence SaaS ($199/mo). 
Always refer to the analysis as "ArGen Intelligence" or "Proprietary ArGen Analysis". Never mention 3rd party model names like Claude or GPT unless specifically asked about integrations.`
  };

  let chatHistory = [
    { role: 'system', content: AI_CONFIG.SYSTEM_PROMPT }
  ];

  function initAiBar() {
    const input = document.getElementById('aiBarInput');
    const submitBtn = document.getElementById('aiBarSubmit');
    const responsePanel = document.getElementById('aiBarResponse');
    const responseContent = document.getElementById('aiResponseContent');
    const closeBtn = document.getElementById('aiBarClose');
    const glassBar = document.querySelector('.ai-bar-glass');

    if (!input || !submitBtn || !responsePanel) return;

    async function askAI() {
      const text = input.value.trim();
      if (!text) return;
      
      // Show panel with loading state
      responsePanel.classList.add('show');
      responseContent.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
      input.value = '';

      // Append user message
      chatHistory.push({ role: 'user', content: text });

      try {
        const res = await fetch(AI_CONFIG.ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: chatHistory
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'API Error: ' + res.status);
        }
        
        const data = await res.json();
        const reply = data.reply;
        
        chatHistory.push({ role: 'assistant', content: reply });
        
        // Format response (escape HTML then apply markdown)
        const formatted = escapeHtml(reply)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        
        responseContent.innerHTML = formatted;

      } catch (err) {
        responseContent.innerHTML = `> CONNECTION_FAILED: ${escapeHtml(err.message)}`;
      }
    }

    submitBtn.addEventListener('click', askAI);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') askAI();
    });

    closeBtn.addEventListener('click', () => {
      responsePanel.classList.remove('show');
    });
  }

  /* ─────────────── COOKIE CONSENT BANNER ─────────────── */
  function initCookieConsent() {
    if (localStorage.getItem('argen_cookie_consent') === 'accepted') return;

    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
      background: rgba(10,10,10,0.98); backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 1rem 1.5rem; font-family: 'Inter', sans-serif; font-size: 0.8rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      flex-wrap: wrap; color: #ccc;
    `;
    banner.innerHTML = `
      <span style="flex:1;min-width:200px;">We use essential cookies for authentication and security. 
      <a href="/privacy" style="color:var(--accent,#00ff88);text-decoration:underline;">Learn more</a></span>
      <div style="display:flex;gap:0.75rem;flex-shrink:0;">
        <button id="cookieAccept" style="padding:8px 20px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#fff;cursor:pointer;font-size:0.75rem;">Accept</button>
        <button id="cookieDismiss" style="padding:8px 20px;border-radius:6px;border:none;background:var(--accent,#00ff88);color:#000;cursor:pointer;font-weight:600;font-size:0.75rem;">Got it</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', () => {
      localStorage.setItem('argen_cookie_consent', 'accepted');
      banner.remove();
    });
    document.getElementById('cookieDismiss').addEventListener('click', () => {
      localStorage.setItem('argen_cookie_consent', 'accepted');
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }

})();
