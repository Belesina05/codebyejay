
'use strict';

/* ==========================================
   CODEBYEJAY - PORTFOLIO JAVASCRIPT
========================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ========================================
     ROTATING HERO ROLES
  ======================================== */

  const roles = [
    'IT Programmer',
    'Web Developer',
    'Systems Developer',
    'Full-Stack Developer',
    'IT Solutions Builder'
  ];

  const roleElement = document.getElementById('typed-role');

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (roleElement && !reducedMotion) {
    let roleIndex = 0;

    window.setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleElement.textContent = roles[roleIndex];
    }, 2600);
  }

  /* ========================================
     MOBILE NAVIGATION
  ======================================== */

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  function closeMenu() {
    if (!navLinks || !menuToggle) return;

    navLinks.classList.remove('open');

    menuToggle.setAttribute(
      'aria-expanded',
      'false'
    );

    menuToggle.setAttribute(
      'aria-label',
      'Open navigation'
    );
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {

      const isOpen = navLinks.classList.toggle('open');

      menuToggle.setAttribute(
        'aria-expanded',
        String(isOpen)
      );

      menuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation' : 'Open navigation'
      );
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  /* ========================================
     DARK / LIGHT MODE
  ======================================== */

  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = document.querySelector('.theme-icon');

  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem('portfolio-theme');
  } catch (error) {
    savedTheme = null;
  }

  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }

  function updateThemeIcon() {
    const isLight = document.body.classList.contains('light');

    if (themeIcon) {
      themeIcon.textContent = isLight ? '☾' : '☼';
    }

    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        isLight ? 'Switch to dark theme' : 'Switch to light theme'
      );
    }
  }

  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {

      document.body.classList.toggle('light');

      try {
        localStorage.setItem(
          'portfolio-theme',
          document.body.classList.contains('light')
            ? 'light'
            : 'dark'
        );
      } catch (error) {
        // Continue even when storage is disabled.
      }

      updateThemeIcon();
    });
  }

  /* ========================================
     PROJECT FILTERS
  ======================================== */

  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(button => {

    button.addEventListener('click', () => {

      const filter = button.dataset.filter;

      filterButtons.forEach(item => {
        const selected = item === button;

        item.classList.toggle('active', selected);

        item.setAttribute(
          'aria-pressed',
          String(selected)
        );
      });

      projectCards.forEach(card => {
        const category = card.dataset.category;

        const show =
          filter === 'all' ||
          category === filter;

        card.hidden = !show;
      });
    });
  });

  /* ========================================
     SCROLL REVEAL ANIMATION
  ======================================== */

  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reducedMotion) {

    const revealObserver = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }

        });

      },
      {
        threshold: 0.08
      }
    );

    revealElements.forEach(element => {
      revealObserver.observe(element);
    });

    /* ======================================
       ACTIVE NAVIGATION ON SCROLL
    ====================================== */

    const sections = document.querySelectorAll(
      'main section[id]'
    );

    const navObserver = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (!entry.isIntersecting) return;

          document.querySelectorAll('.nav-link').forEach(link => {

            const target = link.getAttribute('href');

            link.classList.toggle(
              'active',
              target === '#' + entry.target.id
            );

          });

        });

      },
      {
        rootMargin: '-25% 0px -65% 0px'
      }
    );

    sections.forEach(section => {
      navObserver.observe(section);
    });

  } else {

    revealElements.forEach(element => {
      element.classList.add('visible');
    });

  }

  /* ========================================
     CONTACT FORM
  ======================================== */

  const contactForm = document.getElementById('contact-form');

  // IMPORTANT:
  // Replace this with your actual email before publishing.
  const CONTACT_EMAIL = '';

  if (contactForm) {

    contactForm.addEventListener('submit', event => {

      event.preventDefault();

      if (!contactForm.reportValidity()) {
        return;
      }

      const status = document.getElementById('form-status');

      if (!CONTACT_EMAIL) {
        if (status) {
          status.textContent =
            'Contact email is not configured yet. Please set CONTACT_EMAIL in script.js.';
        }
        return;
      }

      const formData = new FormData(contactForm);

      const name = String(
        formData.get('name') || ''
      ).trim();

      const email = String(
        formData.get('email') || ''
      ).trim();

      const subject = String(
        formData.get('subject') || ''
      ).trim();

      const message = String(
        formData.get('message') || ''
      ).trim();

      const body =
        `From: ${name}\n` +
        `Email: ${email}\n\n` +
        `${message}`;

      const mailto =
        `mailto:${CONTACT_EMAIL}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      if (status) {
        status.textContent =
          'Opening your email application. Please review and send your message.';
      }

      window.location.href = mailto;
    });

  }

  /* ========================================
     CURRENT YEAR
  ======================================== */

  const yearElement = document.getElementById('year');

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

});
