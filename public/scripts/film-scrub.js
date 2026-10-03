// Scroll-scrubbed hero film. Scrolling plays pre-rendered frames forward and backward.
// Native scroll + requestAnimationFrame only; no libraries. Falls back to a static layout.
(function () {
  'use strict';
  var root = document.querySelector('[data-film]');
  if (!root) return;

  var small = window.matchMedia('(max-width: 760px)').matches;
  // The inline head script adds html.film-live only when motion is allowed.
  // Otherwise the static layout keeps the hero art as its image and chapters stack as normal content.
  if (!document.documentElement.classList.contains('film-live')) return;

  var canvas = root.querySelector('.film__canvas');
  var chapters = [].slice.call(root.querySelectorAll('.film__chapter'));
  var bar = root.querySelector('.film__progress i');
  var ctx = canvas.getContext('2d', { alpha: false });

  fetch(root.dataset.manifest).then(function (r) { return r.json(); }).then(init).catch(function () { root.classList.add('film--static'); });

  function init(m) {
    var mobile = window.matchMedia('(max-width: 760px)').matches;
    var tpl = mobile ? m.mobile : m.desktop;
    var N = m.count;
    var frames = new Array(N);
    var art = null; // hero image shown first, dissolves into the film as you scroll
    // Timings come from the manifest so they always match how the frames were cut (scripts/build-film-frames.py)
    var HOLD_FROM = m.holdFrom || 0.9;      // scroll fraction where the last frame is held
    var OUTRO_START = m.outroStart || 0.9;  // where the film starts dissolving into the page
    var STARTS = m.chapters || [0, 0.25, 0.5, 0.75]; // scroll fraction where each headline begins
    var FADE_END = 0.2; // fraction of the scroll over which the hero image fades out
    var url = function (i) { return tpl.replace('{n}', String(i + 1).padStart(m.pad || 3, '0')) + (m.v ? '?v=' + m.v : ''); };

    // load order: first, last, every 10th, then the rest; a few at a time
    var order = [0, N - 1], seen = { 0: 1 }; // index 0 is loaded separately
    seen[N - 1] = 1;
    for (var s = 10; s < N; s += 10) if (!seen[s]) { order.push(s); seen[s] = 1; }
    for (var k = 0; k < N; k++) if (!seen[k]) order.push(k);
    var next = 0, active = 0;
    function pump() {
      while (active < 4 && next < order.length) {
        (function (i) {
          active++;
          var img = new Image();
          img.onload = function () { frames[i] = img; active--; if (i === 0) root.classList.add('film--ready'); dirty = true; pump(); };
          img.onerror = function () { active--; pump(); };
          img.src = url(i);
        })(order[next++]);
      }
    }

    var cw = 0, ch = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = canvas.clientWidth; ch = canvas.clientHeight;
      canvas.width = Math.min(Math.round(cw * dpr), 2880);
      canvas.height = Math.round(canvas.width * ch / cw);
      dirty = true;
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 120); });

    function cover(img, alpha) {
      var s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      var w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      ctx.globalAlpha = 1;
    }

    function nearest(i) {
      if (frames[i]) return frames[i];
      for (var d = 1; d < N; d++) { var f = frames[i - d] || frames[i + d]; if (f) return f; }
      return null;
    }

    // pos is fractional: draw the frame before it, then the frame after it at partial opacity,
    // so slow scrolling glides between frames instead of stepping
    function draw(pos, fade) {
      var i = Math.floor(pos), a = pos - i;
      var img = nearest(i);
      if (img) cover(img, 1);
      if (a > 0.03 && i + 1 < N) { var nx = frames[i + 1]; if (nx) cover(nx, a); }
      if (art && fade > 0) cover(art, fade);
    }

    var target = 0, current = 0, dirty = true, shown = -1, shownFade = -1, lastChapter = -1, fade = 1, outro = -1;
    function progress() {
      var range = root.offsetHeight - window.innerHeight;
      var y = root.getBoundingClientRect().top + window.scrollY;
      return Math.min(1, Math.max(0, (window.scrollY - y) / Math.max(1, range)));
    }
    window.addEventListener('scroll', function () { dirty = true; }, { passive: true });

    var last = performance.now();
    function tick(now) {
      var dt = Math.min(64, now - last); last = now;
      if (dirty) {
        var p = progress();
        target = Math.min(1, p / HOLD_FROM) * (N - 1);
        var f = Math.max(0, 1 - p / FADE_END);
        fade = Math.round(f * f * (3 - 2 * f) * 100) / 100; // smoothstep, 1% steps
        var c = 0;
        for (var ci = 0; ci < chapters.length; ci++) if (p >= (STARTS[ci] || 0)) c = ci;
        if (c !== lastChapter) {
          chapters.forEach(function (el, idx) { el.classList.toggle('is-active', idx === c); });
          lastChapter = c;
        }
        var o = Math.min(1, Math.max(0, (p - OUTRO_START) / (1 - OUTRO_START)));
        o = Math.round(o * o * (3 - 2 * o) * 100) / 100; // smoothstep
        if (o !== outro) { outro = o; root.style.setProperty('--outro', o); }
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        dirty = false;
      }
      var diff = target - current;
      if (Math.abs(diff) > 0.01) {
        current += diff * (1 - Math.pow(0.001, dt / 1000)); // frame-rate independent ease
        dirty = dirty || Math.abs(target - current) > 0.01;
      } else { current = target; }
      var q = Math.round(current * 12); // redraw only when the position moves by 1/12 of a frame
      if ((q !== shown || fade !== shownFade) && root.classList.contains('film--ready')) { draw(q / 12, fade); shown = q; shownFade = fade; }
      requestAnimationFrame(tick);
    }

    size();
    // first frame right away (it matches the poster); the rest once the page is loaded and idle
    var first = new Image();
    var pending = 2;
    var ready = function () { if (--pending === 0) { root.classList.add('film--ready'); dirty = true; } };
    first.onload = function () { frames[0] = first; ready(); };
    first.src = url(0);
    var artImg = new Image();
    artImg.onload = function () { art = artImg; ready(); };
    artImg.onerror = function () { ready(); }; // no art: the film simply starts at its first frame
    artImg.src = small ? root.dataset.artMobile : root.dataset.art;
    next = 1;
    var start = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 400); })(pump, { timeout: 2500 }); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    requestAnimationFrame(tick);
  }
})();
