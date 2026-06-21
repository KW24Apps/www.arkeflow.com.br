(function () {
  'use strict';

  // ── Proportional scale ───────────────────────────────────────
  var BASE_W = 1380;
  var BASE_H = 912;
  function rescale() {
    var s = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
    document.documentElement.style.setProperty('--scale', s);
  }
  rescale();
  window.addEventListener('resize', rescale, { passive: true });

  // ── Canvas: bubble system ────────────────────────────────────
  var canvas = document.getElementById('bg');
  var ctx    = canvas.getContext('2d');
  var W, H;

  var CYAN = [0, 200, 220];
  var MINT = [38, 255, 147];

  var SMALL_COUNT  = 20;
  var MEDIUM_COUNT = 22;
  var bubbles = [];

  function makeBubble(isSmall) {
    var isCyan = Math.random() < 0.7;
    var r = isSmall
      ? 2 + Math.random() * 3
      : 6 + Math.random() * 7;
    return {
      x:           Math.random() * W,
      y:           Math.random() * H,
      r:           r,
      vx:          (Math.random() - 0.5) * 0.28,
      vy:          (Math.random() - 0.5) * 0.24,
      color:       isCyan ? CYAN : MINT,
      phase:       Math.random() * Math.PI * 2,
      phaseSpd:    0.008 + Math.random() * 0.012,
      baseOpacity: 0.30 + Math.random() * 0.42,
      ttl:         2500 + Math.floor(Math.random() * 3501),
      popping:     false,
      popFrame:    0,
      popDuration: 0,
      particles:   []
    };
  }

  function buildBubbles() {
    bubbles = [];
    for (var i = 0; i < SMALL_COUNT; i++)  bubbles.push(makeBubble(true));
    for (var j = 0; j < MEDIUM_COUNT; j++) bubbles.push(makeBubble(false));
  }

  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildBubbles();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  function drawBubble(b, opacity) {
    var x = b.x, y = b.y, r = b.r;
    var rc = b.color[0], gc = b.color[1], bc = b.color[2];

    // 1. Outer glow
    var glowR = r * 5.5;
    var g1 = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g1.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.08).toFixed(4) + ')');
    g1.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.fill();

    // 2. Body fill
    var hx = x - r * 0.30, hy = y - r * 0.35;
    var g2 = ctx.createRadialGradient(hx, hy, 0, x, y, r);
    g2.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.13).toFixed(4) + ')');
    g2.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.03).toFixed(4) + ')');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();

    // 3. Rim stroke
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.70).toFixed(4) + ')';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // 4. Highlight — clipped to bubble arc
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    var hx2 = x - r * 0.33, hy2 = y - r * 0.33;
    var g3 = ctx.createRadialGradient(hx2, hy2, 0, hx2, hy2, r * 0.5);
    g3.addColorStop(0, 'rgba(255,255,255,' + (opacity * 0.58).toFixed(4) + ')');
    g3.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g3;
    ctx.fill();
    ctx.restore();
  }

  function startPop(b) {
    b.popping     = true;
    b.popFrame    = 0;
    b.popDuration = 45 + Math.floor(Math.random() * 30);
    var count = 4 + Math.floor(Math.random() * 6);
    b.particles = [];
    for (var i = 0; i < count; i++) {
      b.particles.push({
        angle:  Math.random() * Math.PI * 2,
        speed:  0.6 + Math.random() * 2.9,
        radius: 0.8 + Math.random() * Math.max(0, b.r * 0.28 - 0.8),
        delay:  Math.random() * 0.25,
        wobble: (Math.random() - 0.5) * 0.8,
        fade:   0.6 + Math.random() * 0.4
      });
    }
  }

  function resetBubble(b) {
    var isSmall = b.r <= 5;
    var nb = makeBubble(isSmall);
    b.x = nb.x; b.y = nb.y; b.r = nb.r;
    b.vx = nb.vx; b.vy = nb.vy;
    b.color = nb.color; b.phase = nb.phase;
    b.phaseSpd = nb.phaseSpd; b.baseOpacity = nb.baseOpacity;
    b.ttl = nb.ttl; b.popping = false; b.particles = [];
  }

  function drawPop(b) {
    var prog = b.popFrame / b.popDuration;
    b.popFrame++;
    var rc = b.color[0], gc = b.color[1], bc = b.color[2];

    for (var i = 0; i < b.particles.length; i++) {
      var p = b.particles[i];
      if (prog < p.delay) continue;
      var lp    = (prog - p.delay) / (1 - p.delay);
      if (lp > 1) lp = 1;
      var angle = p.angle + p.wobble * lp;
      var dist  = p.speed * lp * b.r * 2.5;
      var px    = b.x + Math.cos(angle) * dist;
      var py    = b.y + Math.sin(angle) * dist;
      var alpha = (1 - lp) * p.fade;

      var glowR = p.radius * 5;
      var grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      grd.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (alpha * 0.6).toFixed(4) + ')');
      grd.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + alpha.toFixed(4) + ')';
      ctx.fill();
    }

    if (b.popFrame >= b.popDuration) resetBubble(b);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Background depth — 1. linear gradient top→bottom
    var bgGrd = ctx.createLinearGradient(0, 0, 0, H);
    bgGrd.addColorStop(0,    'rgba(0,0,0,0.22)');
    bgGrd.addColorStop(0.45, 'rgba(0,0,0,0)');
    bgGrd.addColorStop(1,    'rgba(0,12,28,0.28)');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, W, H);

    // Background depth — 2. radial ambient glow
    var acx = W * 0.5, acy = H * 0.6, ambR = W * 0.5;
    var ambGrd = ctx.createRadialGradient(acx, acy, 0, acx, acy, ambR);
    ambGrd.addColorStop(0, 'rgba(0,40,60,0.10)');
    ambGrd.addColorStop(1, 'rgba(0,40,60,0)');
    ctx.fillStyle = ambGrd;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];

      if (b.popping) { drawPop(b); continue; }

      b.x += b.vx;
      b.y += b.vy;

      var margin = b.r * 6;
      if (b.x < -margin)         b.x = W + margin;
      else if (b.x > W + margin) b.x = -margin;
      if (b.y < -margin)         b.y = H + margin;
      else if (b.y > H + margin) b.y = -margin;

      b.phase += b.phaseSpd;
      var pulse   = 0.82 + 0.18 * Math.sin(b.phase);
      var opacity = b.baseOpacity * pulse;

      drawBubble(b, opacity);

      b.ttl--;
      if (b.ttl <= 0) startPop(b);
    }

    requestAnimationFrame(drawFrame);
  }
  requestAnimationFrame(drawFrame);

  canvas.addEventListener('mousemove', function (e) {
    if (expandedBlock) return;
    var cx = e.clientX, cy = e.clientY;
    var closest = null, closestDist = Infinity;
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      if (b.popping) continue;
      var dx = b.x - cx, dy = b.y - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.r * 2.5 && dist < closestDist) {
        closestDist = dist;
        closest = b;
      }
    }
    if (closest) startPop(closest);
  }, { passive: true });

  // ── Intro sequence ───────────────────────────────────────────
  var introEl     = document.getElementById('intro');
  var phraseA     = document.getElementById('intro-phrase-a');
  var phraseB     = document.getElementById('intro-phrase-b');
  var introLogoEl = document.getElementById('intro-logo');
  var skipBtn     = document.getElementById('skip-wrap');
  var navbarEl    = document.getElementById('navbar');
  var gridEl      = document.getElementById('grid');

  var P1 = 'Quando o negócio cresce, o <span style="color:#26FF93;font-weight:400">improviso</span> para de funcionar.';
  var P3 = 'Do processo ao software. <span style="color:#26FF93;font-weight:400">Construído</span> para o seu negócio.';

  var PHRASES = [
    { text: P1, color: '#ffffff', from: [ 65, -40], to: [-65,  40] },
    { text: P3, color: '#ffffff', from: [  0,  65], to: [  0, -65] }
  ];

  var TRANS_DUR       = 700;
  var HOLD_TIME       = 4000;
  var LOGO_ENTER_DUR  = 700;
  var LOGO_HOLD_FINAL = 2000;
  var EASE_PHRASE  = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  var EASE_LOGO_IN = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
  var EASE_LOGO_OUT= 'cubic-bezier(0.4, 0, 0.2, 1)';
  var EASE_BLOCK   = 'cubic-bezier(0.34, 1.2, 0.64, 1)';

  var skipped       = false;
  var introComplete = false;
  var skipResolvers = [];

  function safeWait(ms) {
    if (skipped) return Promise.resolve();
    return new Promise(function (resolve) {
      var tid = setTimeout(resolve, ms);
      skipResolvers.push(function () { clearTimeout(tid); resolve(); });
    });
  }

  function setPhraseState(el, tx, ty, opacity, animate) {
    el.style.transition = animate
      ? ('transform ' + TRANS_DUR + 'ms ' + EASE_PHRASE +
         ', opacity ' + TRANS_DUR + 'ms ' + EASE_PHRASE)
      : 'none';
    el.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
    el.style.opacity   = String(opacity);
  }

  function showPhrase(el, ph) {
    el.innerHTML = ph.text;
    el.style.color = ph.color;
    setPhraseState(el, ph.from[0], ph.from[1], 0, false);
    el.getBoundingClientRect(); // force reflow
    setPhraseState(el, 0, 0, 1, true);
  }

  function hidePhrase(el, ph) {
    setPhraseState(el, ph.to[0], ph.to[1], 0, true);
  }

  function getLogoSize() {
    return { w: introLogoEl.offsetWidth, h: introLogoEl.offsetHeight };
  }

  function triggerBlockExpansion() {
    var blks = document.querySelectorAll('.block');
    var skipR = document.getElementById('skip-btn').getBoundingClientRect();
    var skipCx = skipR.left + skipR.width  / 2;
    var skipCy = skipR.top  + skipR.height / 2;

    // Grid container: make visible immediately, no fade
    gridEl.style.transition = 'none';
    gridEl.style.opacity    = '1';

    // Collapse each block to skip-button position
    blks.forEach(function (b) {
      var r  = b.getBoundingClientRect();
      var dx = skipCx - (r.left + r.width  / 2);
      var dy = skipCy - (r.top  + r.height / 2);
      var sx = 9 / r.width;
      var sy = 9 / r.height;
      b.style.transition = 'none';
      b.style.transform  = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
      b.style.opacity    = '0';
    });

    // Fade out skip button (stop animation first so it doesn't override opacity)
    skipBtn.style.animation     = 'none';
    skipBtn.style.transition    = 'opacity 0.3s ease';
    skipBtn.style.opacity       = '0';
    skipBtn.style.pointerEvents = 'none';

    // Stagger blocks from top-left to bottom-right
    blks.forEach(function (b, i) {
      setTimeout(function () {
        b.style.transition = 'transform 750ms ' + EASE_BLOCK + ', opacity 750ms ease';
        b.style.transform  = 'translate(0,0) scale(1,1)';
        b.style.opacity    = '1';
      }, i * 55);
    });

    // Cleanup after last block settles
    var cleanupDelay = (blks.length - 1) * 55 + 750 + 60;
    setTimeout(function () {
      gridEl.style.transition = '';
      gridEl.style.opacity    = '';
      gridEl.classList.add('visible');
      blks.forEach(function (b) {
        b.style.transition = '';
        b.style.transform  = '';
        b.style.opacity    = '';
      });
      introLogoEl.style.transition = '';
      introLogoEl.style.zIndex     = '100';
    }, cleanupDelay);
  }

  function finishIntro() {
    // Hide phrases instantly
    [phraseA, phraseB].forEach(function (el) {
      el.style.transition = 'none';
      el.style.opacity    = '0';
    });

    // Logo snaps instantly to navbar position and stays (no handoff)
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var nbr = navbarEl.getBoundingClientRect();
    var exactScale = 20 / 52;
    var exactTx = (nbr.left + 20) - vw / 2;
    var exactTy = (nbr.top  + 14) - vh / 2;
    introLogoEl.style.transition = 'none';
    introLogoEl.style.transform  = 'translate(' + exactTx + 'px, ' + exactTy + 'px) scale(' + exactScale + ')';
    introLogoEl.style.opacity    = '1';
    introLogoEl.style.zIndex     = '100';
    introComplete = true;

    // Fade intro overlay
    introEl.classList.add('done');
    navbarEl.classList.add('visible');
    // Block expansion
    triggerBlockExpansion();
  }

  function repositionLogo() {
    if (!introComplete) return;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var nbr = navbarEl.getBoundingClientRect();
    var exactScale = 20 / 52;
    var exactTx = (nbr.left + 20) - vw / 2;
    var exactTy = (nbr.top  + 14) - vh / 2;
    introLogoEl.style.transition = 'none';
    introLogoEl.style.transform  = 'translate(' + exactTx + 'px, ' + exactTy + 'px) scale(' + exactScale + ')';
  }
  window.addEventListener('resize', repositionLogo, { passive: true });

  skipBtn.addEventListener('click', function () {
    if (skipped) return;
    skipped = true;
    skipResolvers.forEach(function (r) { r(); });
    skipResolvers = [];
    finishIntro();
  });

  async function runIntro() {
    // ── Initial logo: fade in, hold, fade out
    introLogoEl.style.transition = 'none';
    introLogoEl.style.opacity    = '0';
    introLogoEl.style.transform  = 'translate(-50%, -50%) scale(1)';
    introLogoEl.getBoundingClientRect(); // force reflow
    introLogoEl.style.transition = 'opacity 400ms ease';
    introLogoEl.style.opacity    = '1';
    await safeWait(1500);
    if (skipped) return;

    introLogoEl.style.transition = 'opacity 400ms ease';
    introLogoEl.style.opacity    = '0';
    await safeWait(400);
    if (skipped) return;

    // ── Phrases
    showPhrase(phraseA, PHRASES[0]);
    await safeWait(TRANS_DUR + HOLD_TIME);
    if (skipped) return;

    hidePhrase(phraseA, PHRASES[0]);
    showPhrase(phraseB, PHRASES[1]);
    await safeWait(TRANS_DUR + HOLD_TIME);
    if (skipped) return;

    // ── Logo emerges simultaneously with phrase 2 exiting
    hidePhrase(phraseB, PHRASES[1]);

    introLogoEl.style.transition = 'none';
    introLogoEl.style.opacity    = '0';
    introLogoEl.style.transform  = 'translate(-50%, -50%) scale(0.65)';
    introLogoEl.getBoundingClientRect();
    introLogoEl.style.transition = 'transform ' + LOGO_ENTER_DUR + 'ms ' + EASE_LOGO_IN + ', opacity ' + LOGO_ENTER_DUR + 'ms ease';
    introLogoEl.style.opacity    = '1';
    introLogoEl.style.transform  = 'translate(-50%, -50%) scale(1.0)';

    // ── Hold logo at center
    await safeWait(LOGO_ENTER_DUR + LOGO_HOLD_FINAL);
    if (skipped) return;

    // ── Logo slides to navbar position and stays permanently
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var nbr = navbarEl.getBoundingClientRect();
    var exactScale = 20 / 52;
    var exactTx = (nbr.left + 20) - vw / 2;
    var exactTy = (nbr.top  + 14) - vh / 2;
    introLogoEl.style.transition = 'transform 900ms ' + EASE_LOGO_OUT;
    introLogoEl.style.transform  = 'translate(' + exactTx + 'px,' + exactTy + 'px) scale(' + exactScale + ')';

    // On arrival: lock to navbar z-index; opacity stays 1 — no handoff
    function onLogoArrival(evt) {
      if (evt.propertyName !== 'transform') return;
      introLogoEl.removeEventListener('transitionend', onLogoArrival);
      if (skipped) return;
      introLogoEl.style.transition = '';
      introLogoEl.style.zIndex     = '100';
      navbarEl.classList.add('visible');
      introComplete = true;
    }
    introLogoEl.addEventListener('transitionend', onLogoArrival);

    // ── 150ms after logo starts moving: expand blocks
    await safeWait(150);
    if (skipped) return;

    introEl.classList.add('done');
    triggerBlockExpansion();
  }

  runIntro();

  // ── Block grid: expand/push 3D interaction ───────────────────
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  var blocks = document.querySelectorAll('.block');

  // CSS transition used during enter/leave (includes transform)
  var BASE_TRANS =
    'transform 0.38s cubic-bezier(0.15,0.85,0.3,1),' +
    'filter 0.35s ease, opacity 0.35s ease,' +
    'border-color 0.25s ease, box-shadow 0.25s ease';

  // CSS transition used during mousemove (transform updates instantly)
  var TILT_TRANS =
    'filter 0.35s ease, opacity 0.35s ease,' +
    'border-color 0.25s ease, box-shadow 0.25s ease';

  var activeBlock = null;
  var leaveTimer  = null;

  function activateBlock(el) {
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }

    activeBlock = el;
    var ar = parseInt(el.dataset.r, 10);
    var ac = parseInt(el.dataset.c, 10);
    var cx = ac === 0 ? 30 : ac === 2 ? -30 : 0;
    var cy = ar === 0 ? 25 : -25;

    blocks.forEach(function (b) {
      b.style.transition = BASE_TRANS;
      if (b === el) {
        b.classList.add('is-active');
        b.classList.remove('is-pushed');
        b.style.transform   = 'translateX(' + cx + 'px) translateY(' + cy + 'px) translateZ(50px) scale(1.16)';
        b.style.borderColor = 'rgba(38,255,147,0.25)';
        b.style.boxShadow   = '0 20px 60px rgba(0,0,0,0.55), inset 0 0 40px rgba(38,255,147,0.04)';
        b.style.filter      = 'brightness(1.1)';
        b.style.zIndex      = '10';
        b.style.opacity     = '1';
      } else {
        var br = parseInt(b.dataset.r, 10);
        var bc = parseInt(b.dataset.c, 10);
        var dx = (bc - ac) * 20;
        var dy = (br - ar) * 16;
        b.classList.add('is-pushed');
        b.classList.remove('is-active');
        b.style.transform   = 'translateX(' + dx + 'px) translateY(' + dy + 'px) translateZ(-65px) scale(0.85)';
        b.style.filter      = 'brightness(0.48) saturate(0.6)';
        b.style.opacity     = '0.65';
        b.style.borderColor = '';
        b.style.boxShadow   = '';
        b.style.zIndex      = '';
      }
    });
  }

  function resetAll() {
    activeBlock = null;

    blocks.forEach(function (b) {
      b.style.transition = BASE_TRANS;
      b.style.transform  = 'translateZ(0)';
      b.style.filter     = '';
      b.style.opacity    = '';
      b.style.borderColor = '';
      b.style.boxShadow  = '';
      b.style.zIndex     = '';
      b.classList.remove('is-active', 'is-pushed');
    });

  }

  // ── Block expand (click to center) ───────────────────────────
  var backdrop            = document.getElementById('expand-backdrop');
  var expandedBlock       = null;
  var expandedOrigin      = null;
  var closingFromPopstate = false;

  function expandBlock(el) {
    if (expandedBlock) return;

    // Remove hover styles, get natural (untransformed) rect
    el.style.transition  = 'none';
    el.style.transform   = '';
    el.style.filter      = '';
    el.style.opacity     = '';
    el.style.borderColor = '';
    el.style.boxShadow   = '';
    el.getBoundingClientRect(); // force reflow

    var rect = el.getBoundingClientRect();
    expandedOrigin = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

    // Fix at natural position — no visible jump
    el.style.position = 'fixed';
    el.style.top      = rect.top    + 'px';
    el.style.left     = rect.left   + 'px';
    el.style.width    = rect.width  + 'px';
    el.style.height   = rect.height + 'px';

    // Clear all hover/pushed state from every block
    activeBlock = null;
    blocks.forEach(function (b) {
      if (b === el) return;
      b.style.transition  = 'none';
      b.style.transform   = '';
      b.style.filter      = '';
      b.style.opacity     = '';
      b.style.borderColor = '';
      b.style.boxShadow   = '';
      b.style.zIndex      = '';
      b.classList.remove('is-active', 'is-pushed');
    });
    el.classList.remove('is-active', 'is-pushed');

    expandedBlock = el;
    history.pushState({ arkeExpanded: true }, '');
    gridEl.classList.add('is-expanded-open');

    // Next frame: CSS transition applies, animate block to center
    requestAnimationFrame(function () {
      var isMobile  = window.innerWidth <= 767;
      var viewportH = (window.visualViewport && window.visualViewport.height)
                      || window.innerHeight;
      var tw, th, expandTop, expandLeft;
      if (isMobile) {
        tw          = window.innerWidth  - 32;
        th          = viewportH - 80;
        expandTop   = 60;
        expandLeft  = 16;
      } else {
        var allBlocks  = gridEl.querySelectorAll('.block');
        var firstBlock = allBlocks[0].getBoundingClientRect();
        var lastBlock  = allBlocks[allBlocks.length - 1].getBoundingClientRect();
        var contentLeft   = firstBlock.left;
        var contentTop    = firstBlock.top;
        var contentWidth  = lastBlock.right  - firstBlock.left;
        var contentHeight = lastBlock.bottom - firstBlock.top;
        tw          = contentWidth  * 0.88;
        th          = Math.min(contentHeight * 0.75, tw * 0.52);
        expandLeft  = contentLeft + (contentWidth  - tw) / 2;
        expandTop   = contentTop  + (contentHeight - th) / 2;
      }
      el.classList.add('is-expanded');
      el.style.top    = expandTop  + 'px';
      el.style.left   = expandLeft + 'px';
      el.style.width  = tw + 'px';
      el.style.height = th + 'px';
      blocks.forEach(function (b) {
        if (b !== el) b.classList.add('is-receded');
      });

      var closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Fechar');
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeExpanded();
      });
      el.insertBefore(closeBtn, el.firstChild);

      if (el === arkBlock) {
        arkStopRotation();
        arkExpGoTo(arkCurrentSlide, true);
        var arkHeader = el.querySelector('.ark-exp-header');
        var headerH = arkHeader ? arkHeader.offsetHeight : 0;
        var midY = headerH + (th - headerH) / 2;
        if (arkExpPrev) { arkExpPrev.style.top = midY + 'px'; el.appendChild(arkExpPrev); }
        if (arkExpNext) { arkExpNext.style.top = midY + 'px'; el.appendChild(arkExpNext); }
      }
    });
  }

  function closeExpanded() {
    if (!expandedBlock) return;
    var el         = expandedBlock;
    var origin     = expandedOrigin;
    expandedBlock  = null;
    expandedOrigin = null;
    gridEl.classList.remove('is-expanded-open');

    var existingBtn = el.querySelector('.modal-close-btn');
    if (existingBtn) el.removeChild(existingBtn);

    if (el === arkBlock) {
      arkStartRotation();
      var body = el.querySelector('.ark-exp-body');
      if (body) {
        if (arkExpPrev) { arkExpPrev.style.top = ''; body.insertBefore(arkExpPrev, body.firstChild); }
        if (arkExpNext) { arkExpNext.style.top = ''; body.appendChild(arkExpNext); }
      }
    }

    if (!closingFromPopstate && history.state && history.state.arkeExpanded) {
      history.back();
    }

    // Animate back to natural grid position
    el.style.top    = origin.top    + 'px';
    el.style.left   = origin.left   + 'px';
    el.style.width  = origin.width  + 'px';
    el.style.height = origin.height + 'px';

    blocks.forEach(function (b) {
      if (b !== el) b.classList.remove('is-receded');
    });

    setTimeout(function () {
      el.classList.remove('is-expanded');
      el.style.position = '';
      el.style.top      = '';
      el.style.left     = '';
      el.style.width    = '';
      el.style.height   = '';
      el.style.zIndex   = '';
    }, 430);
  }

  backdrop.addEventListener('click', function (e) {
    if (expandedBlock && expandedBlock.contains(e.target)) return;
    closeExpanded();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeExpanded();
  });
  window.addEventListener('popstate', function () {
    if (expandedBlock) {
      closingFromPopstate = true;
      closeExpanded();
      closingFromPopstate = false;
    }
  });

  blocks.forEach(function (block) {

    block.addEventListener('mouseenter', function () {
      if (gridEl.classList.contains('is-expanded-open')) return;
      activateBlock(this);
    });

    block.addEventListener('mousemove', function (e) {
      if (isTouch) return;
      if (gridEl.classList.contains('is-expanded-open')) return;
      if (activeBlock !== this) return;
      var rect = this.getBoundingClientRect();
      var dx = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      var dy = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      var mc = parseInt(this.dataset.c, 10);
      var mr = parseInt(this.dataset.r, 10);
      var cx = mc === 0 ? 30 : mc === 2 ? -30 : 0;
      var cy = mr === 0 ? 25 : -25;
      this.style.transition = TILT_TRANS;
      this.style.transform  =
        'rotateX(' + (-dy * 6).toFixed(2) + 'deg)' +
        ' rotateY(' + (dx * 7).toFixed(2) + 'deg)' +
        ' translateX(' + cx + 'px) translateY(' + cy + 'px)' +
        ' translateZ(50px) scale(1.16)';
    });

    block.addEventListener('mouseleave', function () {
      if (gridEl.classList.contains('is-expanded-open')) return;
      if (activeBlock !== this) return;
      leaveTimer = setTimeout(resetAll, 12);
    });

    block.addEventListener('click', function () {
      if (gridEl.classList.contains('is-expanded-open')) return;
      if (this.classList.contains('is-active')) expandBlock(this);
    });

  });

  // ── ARK Softwares — rotating closed state + expanded carousel ─
  var arkBlock = document.querySelector('.block[data-r="0"][data-c="2"]');
  var arkCurrentSlide = 0;
  var arkRotateTimer = null;
  var arkExpCurrent = 0;
  var arkSlideEls, arkDotEls, arkExpTrack, arkExpPrev, arkExpNext, arkExpCounterEl, arkExpLogoEl;
  var ARK_TITLES = ['ARKEvest', 'PDV+', 'LinkSis'];
  var ARK_ACCENT_COLORS = ['rgba(212,160,23,0.7)', 'rgba(56,189,248,0.7)', 'rgba(251,147,53,0.7)'];
  var ARK_LOGOS = [
    '<span style="font-family:\'Montserrat\',sans-serif;font-weight:800">ARKE</span><span style="font-family:\'DM Serif Display\',serif;font-style:italic;color:#D4A017">vest</span>',
    '<span style="font-family:\'Inter\',sans-serif;font-weight:800;color:#38BDF8">PDV+</span>',
    '<img src="assets/img/linksis-logo.svg" style="height:3em;max-width:120px;object-fit:contain;width:auto;border-radius:4px;opacity:0.85;vertical-align:middle">'
  ];

  function arkShowSlide(idx, animate) {
    if (!arkBlock) return;
    arkCurrentSlide = idx;
    arkSlideEls.forEach(function (slide, i) {
      slide.style.transition = animate ? 'opacity 600ms ease' : 'none';
      slide.style.opacity    = (i === idx) ? '1' : '0';
    });
    arkDotEls.forEach(function (dot, i) {
      dot.classList.toggle('active', i === idx);
      dot.style.background = (i === idx) ? ARK_ACCENT_COLORS[idx] : '';
    });
  }

  function arkStopRotation() {
    if (arkRotateTimer) { clearInterval(arkRotateTimer); arkRotateTimer = null; }
  }

  function arkStartRotation() {
    if (!arkBlock) return;
    arkStopRotation();
    arkRotateTimer = setInterval(function () {
      arkShowSlide((arkCurrentSlide + 1) % arkSlideEls.length, true);
    }, 7000);
  }

  function arkExpGoTo(idx, instant) {
    if (!arkBlock) return;
    idx = ((idx % 3) + 3) % 3;
    arkExpCurrent = idx;
    if (arkExpTrack) {
      if (instant) { arkExpTrack.style.transition = 'none'; arkExpTrack.getBoundingClientRect(); }
      arkExpTrack.style.transform = 'translateX(-' + (idx * 100 / 3).toFixed(6) + '%)';
      if (instant) arkExpTrack.style.transition = '';
    }
    if (arkExpCounterEl) arkExpCounterEl.textContent = String(idx + 1);
    if (arkExpLogoEl) arkExpLogoEl.innerHTML = ARK_LOGOS[idx];
  }

  if (arkBlock) {
    arkSlideEls     = arkBlock.querySelectorAll('.ark-slide');
    arkDotEls       = arkBlock.querySelectorAll('.ark-dot');
    arkExpTrack     = arkBlock.querySelector('.ark-exp-track');
    arkExpPrev      = arkBlock.querySelector('.ark-exp-prev');
    arkExpNext      = arkBlock.querySelector('.ark-exp-next');
    arkExpCounterEl = arkBlock.querySelector('.ark-exp-current');
    arkExpLogoEl    = arkBlock.querySelector('.ark-exp-header-logo');

    arkDotEls.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        arkShowSlide(parseInt(this.dataset.dot, 10), true);
        arkStartRotation();
      });
    });

    if (arkExpPrev) arkExpPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      arkExpGoTo(arkExpCurrent - 1, false);
    });
    if (arkExpNext) arkExpNext.addEventListener('click', function (e) {
      e.stopPropagation();
      arkExpGoTo(arkExpCurrent + 1, false);
    });

    document.addEventListener('keydown', function (e) {
      if (!expandedBlock || expandedBlock !== arkBlock) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); arkExpGoTo(arkExpCurrent - 1, false); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); arkExpGoTo(arkExpCurrent + 1, false); }
    });

    arkExpGoTo(0, true);
    arkShowSlide(0, false);
    arkStartRotation();
  }

}());
