(function () {
  'use strict';

  // ── Navbar scroll ──────────────────────────────────────────
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── Mobile nav toggle ──────────────────────────────────────
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');
  navToggle.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
    });
  });

  // ── Smooth scroll for anchor links ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = this.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var offset = 72;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  // ── Section fade-in on scroll ──────────────────────────────
  var sections = document.querySelectorAll('.section');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  sections.forEach(function (section) {
    if (!section.classList.contains('hero')) {
      observer.observe(section);
    }
  });

  // ── Contact form ───────────────────────────────────────────
  var form    = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.reset();
      success.classList.add('show');
      setTimeout(function () {
        success.classList.remove('show');
      }, 4000);
    });
  }
}());
