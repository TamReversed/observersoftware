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

  // --- logo intro in the home hero (first home view of a visit only). The mark draws itself, its coral line
  // fires, and the line hands off to the coral line of the opening image as the image fades in.
  // The inline head script adds html.intro-pending when it should play; anything that goes wrong simply
  // brings the opening image in as normal.
  var intro = document.querySelector('.film__intro');
  var film = intro && intro.closest('.film');
  var root = document.documentElement;
  if (intro && film && root.classList.contains('intro-pending')) {
    var HANDOFF_AT = 4.85;     // seconds: just after the coral line fires
    var small = window.matchMedia('(max-width: 760px)').matches;
    var ART = small ? { x: 0.709, y: 0.4989 } : { x: 0.771, y: 0.4821 }; // where the coral line starts in the opening image
    var VIDEO = { x: 0.686, y: 0.46 };                                   // the eye's right corner in the video at the hand-off
    var ended = false, v = null, guard;
    // line the video's coral line up with the one in the opening image
    var align = function () {
      var stage = film.querySelector('.film__stage'), poster = film.querySelector('.film__poster');
      if (!stage || !poster || !poster.naturalWidth) return;
      intro.style.setProperty('--intro-dx', '0px');
      intro.style.setProperty('--intro-dy', '0px');
      var sr = stage.getBoundingClientRect(), ir = intro.getBoundingClientRect();
      // both are drawn "cover": scaled to fill, centred, overflow cropped
      var artScale = Math.max(sr.width / poster.naturalWidth, sr.height / poster.naturalHeight);
      var artX = sr.width / 2 + (ART.x - 0.5) * poster.naturalWidth * artScale;
      var artY = sr.height / 2 + (ART.y - 0.5) * poster.naturalHeight * artScale;
      var vw = Math.max(ir.width, ir.height * 16 / 9), vh = vw * 9 / 16;
      var videoX = (ir.left - sr.left) + ir.width / 2 + (VIDEO.x - 0.5) * vw;
      var videoY = (ir.top - sr.top) + ir.height / 2 + (VIDEO.y - 0.5) * vh;
      intro.style.setProperty('--intro-dx', (artX - videoX).toFixed(1) + 'px');
      intro.style.setProperty('--intro-dy', (artY - videoY).toFixed(1) + 'px');
    };
    var handoff = function (fast) {
      if (ended) return; ended = true;
      clearTimeout(guard);
      window.removeEventListener('scroll', early);
      window.removeEventListener('resize', align);
      try { sessionStorage.setItem('observer-intro', '1'); } catch (e) {}
      film.classList.remove('film--intro-playing');
      film.classList.add('film--intro-handoff');
      root.classList.remove('intro-pending');           // the opening image fades in
      setTimeout(function () { if (v) { v.pause(); } intro.remove(); film.classList.remove('film--intro-handoff'); }, fast ? 900 : 2400);
    };
    var early = function () { if (window.scrollY > 40) handoff(true); }; // scrolling starts the film: step aside
    var play = function () {
      if (window.scrollY > 40) return handoff(true);
      v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'auto';
      v.src = intro.dataset.mp4;
      v.addEventListener('playing', function () { clearTimeout(guard); align(); film.classList.add('film--intro-playing'); }, { once: true });
      v.addEventListener('timeupdate', function () { if (v.currentTime >= HANDOFF_AT) handoff(false); });
      v.addEventListener('ended', function () { handoff(false); });
      v.addEventListener('error', function () { handoff(true); });
      window.addEventListener('scroll', early, { passive: true });
      window.addEventListener('resize', align);
      intro.appendChild(v);
      align();
      var start = function () {
        var p = v.play();
        if (p && p.catch) p.catch(function () {
          if (ended) return;
          if (document.hidden) { // opened in a background tab: play when the visitor arrives
            document.addEventListener('visibilitychange', function again() {
              if (document.hidden) return;
              document.removeEventListener('visibilitychange', again);
              if (!ended) start();
            });
          } else handoff(true); // autoplay blocked
        });
      };
      start();
      // never leave the hero dark: if the video has not started 3 s after load, show the image
      guard = setTimeout(function () { if (!document.hidden && !film.classList.contains('film--intro-playing')) handoff(true); }, 3000);
    };
    if (document.readyState === 'complete') play(); else window.addEventListener('load', play);
  } else if (intro) {
    intro.remove();
    root.classList.remove('intro-pending');
  }

  // --- offline fallback
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
