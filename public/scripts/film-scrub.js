// Scroll-scrubbed hero film. Scrolling plays pre-rendered frames forward and backward.
// Native scroll + requestAnimationFrame only; no libraries. Falls back to a static layout.
(function () {
  'use strict';
  var root = document.querySelector('[data-film]');
  if (!root) return;

  var poster = root.querySelector('.film__poster');
  var small = window.matchMedia('(max-width: 760px)').matches;
  // The inline head script adds html.film-live only when motion is allowed
  if (!document.documentElement.classList.contains('film-live')) {
    // Static final frame, chapters stacked as normal content
    var end = small ? root.dataset.posterEndMobile : root.dataset.posterEnd;
    if (poster && end) {
      var pic = poster.parentNode;
      if (pic.tagName === 'PICTURE') { var src = pic.querySelector('source'); if (src) src.srcset = end; }
      poster.src = end;
    }
    return;
  }

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
      canvas.width = Math.min(Math.round(cw * dpr), 1920);
      canvas.height = Math.round(canvas.width * ch / cw);
      dirty = true;
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 120); });

    function draw(i) {
      var img = frames[i];
      if (!img) { // nearest loaded frame
        for (var d = 1; d < N; d++) { img = frames[i - d] || frames[i + d]; if (img) break; }
      }
      if (!img) return;
      var s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      var w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }

    var target = 0, current = 0, dirty = true, shown = -1, lastChapter = -1;
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
        target = p * (N - 1);
        var c = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
        if (c !== lastChapter) {
          chapters.forEach(function (el, idx) { el.classList.toggle('is-active', idx === c); });
          lastChapter = c;
        }
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        dirty = false;
      }
      var diff = target - current;
      if (Math.abs(diff) > 0.01) {
        current += diff * (1 - Math.pow(0.001, dt / 1000)); // frame-rate independent ease
        dirty = dirty || Math.abs(target - current) > 0.01;
      } else { current = target; }
      var idx = Math.round(current);
      if (idx !== shown && root.classList.contains('film--ready')) { draw(idx); shown = idx; }
      requestAnimationFrame(tick);
    }

    size();
    // first frame right away (it matches the poster); the rest once the page is loaded and idle
    var first = new Image();
    first.onload = function () { frames[0] = first; root.classList.add('film--ready'); dirty = true; };
    first.src = url(0);
    next = 1;
    var start = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 400); })(pump, { timeout: 2500 }); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    requestAnimationFrame(tick);
  }
})();
