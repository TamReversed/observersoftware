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
    var fallback = frame.getAttribute('data-fallback') || '';
    var swap; // pending cross-fade
    var activate = function (row) {
      var src = row.getAttribute('data-image') || fallback; // rows without art show a neutral plate, never the previous row's image
      rows.forEach(function (r) { r.classList.toggle('is-active', r === row); });
      if (!src || frame.getAttribute('src') === src) return;
      clearTimeout(swap);
      frame.style.opacity = '0';
      swap = setTimeout(function () {
        frame.onload = frame.onerror = function () { frame.style.opacity = ''; };
        frame.src = src;
      }, 160);
    };
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () { activate(row); });
      row.addEventListener('focus', function () { activate(row); });
    });
  }

  // --- contact form: messages sit next to the fields they belong to, so they are always on screen
  var form = document.getElementById('contact-form');
  if (form) {
    var submit = document.getElementById('contact-submit');
    var formError = document.getElementById('contact-error');
    var success = document.getElementById('contact-success');
    var names = ['name', 'email', 'subject', 'message'];

    function fieldError(name, msg) {
      var el = form.elements[name], p = document.getElementById('c-' + name + '-error');
      if (!el || !p) return;
      if (msg) { p.textContent = msg; p.hidden = false; el.setAttribute('aria-invalid', 'true'); }
      else { p.textContent = ''; p.hidden = true; el.removeAttribute('aria-invalid'); }
    }
    function showFormError(msg) {
      formError.textContent = msg || '';
      formError.hidden = !msg;
      if (msg) formError.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    function validate() {
      var errs = {};
      if (!form.name.value.trim()) errs.name = 'Enter your name.';
      var em = form.email.value.trim();
      if (!em) errs.email = 'Enter your email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errs.email = 'Enter a valid email address, like name@company.com.';
      if (!form.message.value.trim()) errs.message = 'Write a short message.';
      return errs;
    }
    function focusFirst(errs) {
      for (var i = 0; i < names.length; i++) {
        if (errs[names[i]]) { form.elements[names[i]].focus(); return; }
      }
    }

    // clear a field's message as soon as it is fixed
    names.forEach(function (n) {
      form.elements[n].addEventListener('input', function () {
        if (form.elements[n].getAttribute('aria-invalid') === 'true' && !validate()[n]) fieldError(n, '');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showFormError('');
      var errs = validate();
      names.forEach(function (n) { fieldError(n, errs[n] || ''); });
      if (Object.keys(errs).length) { focusFirst(errs); return; }

      var data = {
        name: form.name.value.trim(), email: form.email.value.trim(),
        subject: form.subject.value.trim(), message: form.message.value.trim(), website: form.website.value
      };
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) {
          if (res.status === 429) throw { form: 'Too many messages in a short time. Please wait a few minutes and try again.' };
          if (res.status === 400) return res.json().then(function (j) {
            var server = {};
            (j.errors || []).forEach(function (er) { if (er.path && !server[er.path]) server[er.path] = er.msg; });
            if (Object.keys(server).length) throw { fields: server };
            throw { form: j.error || 'Please check your details and try again.' };
          });
          if (!res.ok) throw { form: 'Something went wrong on our side. Please try again in a moment.' };
          form.reset();
          form.hidden = true;
          success.hidden = false;
          success.focus();
          success.scrollIntoView({ block: 'center', behavior: 'smooth' });
        })
        .catch(function (err) {
          if (err && err.fields) {
            names.forEach(function (n) { fieldError(n, err.fields[n] || ''); });
            focusFirst(err.fields);
          } else {
            showFormError((err && err.form) || 'Could not send your message. Check your connection and try again.');
          }
        })
        .then(function () { submit.disabled = false; submit.removeAttribute('aria-busy'); });
    });

    document.getElementById('contact-again').addEventListener('click', function () {
      success.hidden = true;
      form.hidden = false;
      form.name.focus();
    });
  }

  // --- logo intro in the home hero: plays once per visit, silently, then leaves a faint trace of the mark.
  // No video for reduced motion (the film layout is off), Data Saver, or a repeat view in the same session.
  var intro = document.querySelector('.film__intro');
  var film = intro && intro.closest('.film');
  if (intro && film && document.documentElement.classList.contains('film-live')) {
    var seen = false;
    try { seen = sessionStorage.getItem('observer-intro') === '1'; } catch (e) {}
    var saver = (navigator.connection || {}).saveData;
    var settle = function () { film.classList.remove('film--intro-playing'); film.classList.add('film--intro-done'); };
    var trace = function () { // the still final frame, barely visible
      var im = new Image(); im.alt = ''; im.onload = function () { intro.appendChild(im); settle(); }; im.src = intro.dataset.end;
    };
    var away = function () { film.classList.toggle('film--intro-away', window.scrollY > window.innerHeight * 0.3); };
    window.addEventListener('scroll', away, { passive: true });
    if (seen || saver || window.scrollY > 40) trace();
    else {
      var play = function () {
        var v = document.createElement('video');
        v.muted = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'auto';
        v.src = intro.dataset.mp4;
        var done = false;
        var finish = function () { if (done) return; done = true; window.removeEventListener('scroll', early); settle(); try { sessionStorage.setItem('observer-intro', '1'); } catch (e) {} };
        var early = function () { if (window.scrollY > 40) { v.pause(); finish(); } }; // scrolling starts the film: step aside
        v.addEventListener('playing', function () { film.classList.add('film--intro-playing'); }, { once: true });
        v.addEventListener('ended', finish);
        v.addEventListener('error', function () { if (!done) { done = true; v.remove(); trace(); } });
        window.addEventListener('scroll', early, { passive: true });
        intro.appendChild(v);
        var start = function () {
          var p = v.play();
          if (p && p.catch) p.catch(function () {
            if (done) return;
            if (document.hidden) { // opened in a background tab: play when the visitor arrives
              document.addEventListener('visibilitychange', function again() {
                if (document.hidden) return;
                document.removeEventListener('visibilitychange', again);
                if (!done) start();
              });
            } else { done = true; v.remove(); trace(); } // autoplay blocked: show the still trace
          });
        };
        start();
      };
      if (document.readyState === 'complete') play(); else window.addEventListener('load', play);
    }
  }

  // --- offline fallback
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
