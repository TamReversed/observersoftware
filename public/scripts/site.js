// Observer site behaviour: navigation, work preview, contact form. No third-party code.
(function () {
  'use strict';

  // --- navigation
  var nav = document.getElementById('nav');
  var toggle = nav && nav.querySelector('.nav__toggle');
  var links = document.getElementById('nav-links');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
      if (e.key === 'Tab') {
        var items = [toggle].concat([].slice.call(links.querySelectorAll('a')));
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    window.matchMedia('(min-width: 761px)').addEventListener('change', function () { setOpen(false); });
  }
  if (nav && nav.classList.contains('nav--over')) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- selected work: preview image follows hover or focus
  var rows = document.querySelectorAll('.worklist__row');
  var frame = document.getElementById('work-frame-img');
  if (rows.length && frame) {
    var activate = function (row) {
      var src = row.getAttribute('data-image');
      rows.forEach(function (r) { r.classList.toggle('is-active', r === row); });
      if (src) frame.src = src;
    };
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () { activate(row); });
      row.addEventListener('focus', function () { activate(row); });
    });
  }

  // --- contact form
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('contact-status');
    var submit = document.getElementById('contact-submit');
    var say = function (msg, state) { status.textContent = msg; status.setAttribute('data-state', state || ''); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value.trim(), email: form.email.value.trim(),
        subject: form.subject.value.trim(), message: form.message.value.trim(), website: form.website.value
      };
      if (!data.name || !data.email || !data.message) { say('Please fill in your name, email and message.', 'error'); return; }
      submit.disabled = true;
      say('Sending...', '');
      fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) {
          if (res.status === 429) throw new Error('Too many messages. Please wait a few minutes and try again.');
          if (res.status === 400) return res.json().then(function (j) {
            throw new Error((j.errors && j.errors[0] && j.errors[0].msg) || j.error || 'Please check your details and try again.');
          });
          if (!res.ok) throw new Error('Something went wrong. Please try again.');
          form.reset();
          say('Thank you. Your message is on its way and we will reply soon.', 'ok');
        })
        .catch(function (err) { say(err.message || 'Something went wrong. Please try again.', 'error'); })
        .then(function () { submit.disabled = false; });
    });
  }

  // --- offline fallback
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
