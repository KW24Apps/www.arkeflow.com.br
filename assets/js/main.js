(function () {
  'use strict';

  // ── Canvas: firefly particles ────────────────────────────────
  var canvas = document.getElementById('bg');
  var ctx    = canvas.getContext('2d');
  var W, H;
  var particles = [];
  var CYAN  = [0, 200, 220];
  var MINT  = [38, 255, 147];
  var COUNT = 50;

  function buildParticles() {
    particles = [];
    for (var i = 0; i < COUNT; i++) {
      var isCyan = Math.random() < 0.7;
      particles.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     0.8 + Math.random() * 2.2,
        vx:    (Math.random() - 0.5) * 0.5,
        vy:    (Math.random() - 0.5) * 0.5,
        color: isCyan ? CYAN : MINT,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0007 + Math.random() * 0.0012
      });
    }
  }

  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildParticles();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  function drawParticles(ts) {
    ctx.clearRect(0, 0, W, H);
    for (var j = 0; j < particles.length; j++) {
      var p = particles[j];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20)       p.x = W + 20;
      else if (p.x > W + 20) p.x = -20;
      if (p.y < -20)       p.y = H + 20;
      else if (p.y > H + 20) p.y = -20;

      var pulse = 0.5 + 0.5 * Math.sin(p.phase + ts * p.speed);
      var alpha = 0.25 + pulse * 0.55;
      var r = p.color[0], g = p.color[1], b = p.color[2];
      var gR = p.r * 5;

      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gR);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, gR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + Math.min(1, alpha + 0.25).toFixed(3) + ')';
      ctx.fill();
    }
    requestAnimationFrame(drawParticles);
  }
  requestAnimationFrame(drawParticles);

  // ── Intro sequence (precise timestamp-based timing) ──────────
  var introEl  = document.getElementById('intro');
  var phraseEl = document.getElementById('intro-phrase');
  var navbarEl = document.getElementById('navbar');
  var gridEl   = document.getElementById('grid');

  var P1 = 'Quando o negócio cresce, o improviso para de funcionar.';
  var P2 = 'Processo dependente de pessoa. Decisão sem dado. Equipe sem visibilidade.';
  var P3 = 'A ARKEflow constrói a estrutura que o seu negócio precisa para escalar.';

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function enterPhrase(text, color) {
    phraseEl.textContent = text;
    phraseEl.style.color = color;
    phraseEl.classList.remove('entering', 'exiting');
    phraseEl.getBoundingClientRect(); // force reflow → reset to base state
    phraseEl.classList.add('entering');
  }

  function exitPhrase() {
    phraseEl.classList.remove('entering');
    phraseEl.classList.add('exiting');
  }

  async function runIntro() {
    await wait(400);            enterPhrase(P1, '#ffffff');
    await wait(2200 - 400);     exitPhrase();

    await wait(2750 - 2200);    enterPhrase(P2, '#00C8DC');
    await wait(4500 - 2750);    exitPhrase();

    await wait(5000 - 4500);    enterPhrase(P3, '#ffffff');
    await wait(6600 - 5000);    exitPhrase();

    await wait(7100 - 6600);    introEl.classList.add('done');
    await wait(7600 - 7100);
    navbarEl.classList.add('visible');
    gridEl.classList.add('visible');
  }

  runIntro();

  // ── Block grid: expand/push 3D interaction ───────────────────
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

  var activeBlock  = null;
  var leaveTimer   = null;
  var cleanupTimer = null;

  function activateBlock(el) {
    // Cancel any pending leave/cleanup timers
    if (leaveTimer)   { clearTimeout(leaveTimer);   leaveTimer   = null; }
    if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }

    activeBlock = el;
    var ar = parseInt(el.dataset.r, 10);
    var ac = parseInt(el.dataset.c, 10);
    var cx = ac === 0 ? 28 : ac === 2 ? -28 : 0;
    var cy = ar === 0 ? 22 : -22;

    blocks.forEach(function (b) {
      b.style.transition = BASE_TRANS;
      if (b === el) {
        b.classList.add('is-active');
        b.classList.remove('is-pushed');
        b.style.transform   = 'translateX(' + cx + 'px) translateY(' + cy + 'px) translateZ(50px) scale(1.16)';
        b.style.borderColor = 'rgba(0,200,220,0.32)';
        b.style.boxShadow   = '0 20px 60px rgba(0,0,0,0.55), inset 0 0 40px rgba(0,200,220,0.04)';
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

    // After transition settles, clear inline styles — BUT only if still no active block.
    // This prevents the cleanup from resetting pushed blocks when the user moves between blocks.
    cleanupTimer = setTimeout(function () {
      if (activeBlock === null) {
        blocks.forEach(function (b) {
          b.style.transition  = '';
          b.style.transform   = '';
        });
      }
      cleanupTimer = null;
    }, 420);
  }

  blocks.forEach(function (block) {

    block.addEventListener('mouseenter', function () {
      activateBlock(this);
    });

    block.addEventListener('mousemove', function (e) {
      if (activeBlock !== this) return;
      var rect = this.getBoundingClientRect();
      var dx = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      var dy = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      var mc = parseInt(this.dataset.c, 10);
      var mr = parseInt(this.dataset.r, 10);
      var cx = mc === 0 ? 28 : mc === 2 ? -28 : 0;
      var cy = mr === 0 ? 22 : -22;
      // Disable transform transition during live tracking
      this.style.transition = TILT_TRANS;
      this.style.transform  =
        'rotateX(' + (-dy * 6).toFixed(2) + 'deg)' +
        ' rotateY(' + (dx * 7).toFixed(2) + 'deg)' +
        ' translateX(' + cx + 'px) translateY(' + cy + 'px)' +
        ' translateZ(50px) scale(1.16)';
    });

    block.addEventListener('mouseleave', function () {
      if (activeBlock !== this) return;
      // Short debounce: if mouse enters another block within 12ms,
      // activateBlock cancels this timer and no reset happens.
      leaveTimer = setTimeout(resetAll, 12);
    });

  });

}());
