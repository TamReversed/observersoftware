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
    // Without off-thread image decoding the film would stutter or run out of memory: use the static layout.
    if (typeof createImageBitmap !== 'function') { root.classList.add('film--static'); return; }

    var mobile = window.matchMedia('(max-width: 760px)').matches;
    var tpl = mobile ? m.mobile : m.desktop;
    var N = m.count;
    // MEMORY: the downloaded files are kept only as small compressed blobs (about 37 MB for all 220 frames).
    // A decoded 3840 px frame is about 33 MB, so only a few frames around the current position are ever decoded.
    var blobs = new Array(N);
    var bitmaps = {}, making = {};
    var art = null, artBlob = null, artMaking = false; // hero image shown first, dissolves into the film as you scroll
    var srcW = 0, srcH = 0;
    // Timings come from the manifest so they always match how the frames were cut (scripts/build-film-frames.py)
    var HOLD_FROM = m.holdFrom || 0.9;      // scroll fraction where the last frame is held
    var OUTRO_START = m.outroStart || 0.9;  // where the film starts dissolving into the page
    var STARTS = m.chapters || [0, 0.25, 0.5, 0.75]; // scroll fraction where each headline begins
    var FADE_END = 0.2; // fraction of the scroll over which the hero image fades out
    var BACK = 2, AHEAD = 4; // decoded window around the current frame
    var url = function (i) { return tpl.replace('{n}', String(i + 1).padStart(m.pad || 3, '0')) + (m.v ? '?v=' + m.v : ''); };
    var fetchBlob = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.blob(); }); };

    // decode at the size the canvas needs (never larger than the file), off the main thread
    function decode(blob, wantW) {
      return createImageBitmap(blob, { resizeWidth: wantW, resizeQuality: 'medium' })
        .catch(function () { return createImageBitmap(blob); }); // browsers without resize options
    }
    function wantWidth(aspect) { return Math.max(64, Math.round(Math.max(canvas.width, canvas.height * aspect))); }

    // load order: first, last, every 10th, then the rest; a few at a time
    var order = [N - 1], seen = { 0: 1 }; // index 0 is loaded separately
    seen[N - 1] = 1;
    for (var s = 10; s < N; s += 10) if (!seen[s]) { order.push(s); seen[s] = 1; }
    // Data Saver or a slow connection (or a phone): fetch every other frame; the blend between neighbours fills the gaps
    var conn = navigator.connection || {};
    var lean = mobile || conn.saveData || /(^|-)(slow-)?2g|3g/.test(conn.effectiveType || '');
    for (var k = 0; k < N; k++) if (!seen[k] && (!lean || k % 2 === 0)) order.push(k);
    var next = 0, active = 0;
    function pump() {
      while (active < 4 && next < order.length) {
        (function (i) {
          active++;
          fetchBlob(url(i)).then(function (b) { blobs[i] = b; dirty = true; }).catch(function () {}).then(function () { active--; pump(); });
        })(order[next++]);
      }
    }

    var cw = 0, ch = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = canvas.clientWidth; ch = canvas.clientHeight;
      canvas.width = Math.min(Math.round(cw * dpr), 3840); // the frames are 3840 px wide: more would only be upscaling
      canvas.height = Math.round(canvas.width * ch / cw);
      dirty = true;
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { dropBitmaps(); size(); warmAt = -1; }, 120); });

    var lastWarm = 0, warmAt = -1;
    function closeBitmap(b) { try { b.close(); } catch (e) {} }
    function dropBitmaps() { Object.keys(bitmaps).forEach(function (k) { closeBitmap(bitmaps[k]); }); bitmaps = {}; making = {}; if (art) { closeBitmap(art); art = null; } }
    function evict(center) {
      Object.keys(bitmaps).forEach(function (k) {
        if (+k < center - BACK - 1 || +k > center + AHEAD + 1) { closeBitmap(bitmaps[k]); delete bitmaps[k]; }
      });
    }
    function warm(center) {
      if (!srcW) return;
      var lo = Math.max(0, center - BACK), hi = Math.min(N - 1, center + AHEAD);
      var w = Math.min(srcW, wantWidth(srcW / srcH));
      for (var i = lo; i <= hi; i++) {
        if (!blobs[i] || bitmaps[i] || making[i]) continue;
        (function (idx) {
          making[idx] = 1;
          decode(blobs[idx], w).then(function (b) {
            if (!making[idx]) { closeBitmap(b); return; } // dropped by a resize meanwhile
            delete making[idx];
            bitmaps[idx] = b;
            evict(warmAt < 0 ? idx : warmAt); // old frames are released only once newer ones are ready
            if (idx === 0) ready();
            shown = -1; // redraw with the better frame
          }).catch(function () { delete making[idx]; });
        })(i);
      }
    }
    // the hero image is only needed while it is visible
    function makeArt() {
      if (art || artMaking || !artBlob) return;
      artMaking = true;
      decode(artBlob, Math.min(4096, wantWidth(16 / 9))).then(function (b) { artMaking = false; art = b; shown = -1; ready(); }).catch(function () { artMaking = false; ready(); });
    }

    function cover(img, alpha) {
      var s = Math.max(canvas.width / img.width, canvas.height / img.height);
      var w = img.width * s, h = img.height * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      ctx.globalAlpha = 1;
    }

    function nearest(i) { // any decoded frame, closest first, so there is never a blank canvas
      for (var d = 0; d < N; d++) { if (bitmaps[i - d]) return bitmaps[i - d]; if (bitmaps[i + d]) return bitmaps[i + d]; }
      return null;
    }

    // pos is fractional: draw the frame before it, then the next decoded frame at partial opacity,
    // so slow scrolling glides between frames instead of stepping
    function draw(pos, fade) {
      var i = Math.floor(pos), base = -1, j;
      for (var d = 0; d <= 4 && base < 0; d++) if (bitmaps[i - d]) base = i - d;
      var img = base >= 0 ? bitmaps[base] : nearest(i);
      if (img) cover(img, 1);
      if (img && base >= 0) {
        var nx = -1;
        for (j = base + 1; j <= base + 4 && nx < 0; j++) if (bitmaps[j]) nx = j;
        if (nx >= 0) {
          var t = Math.min(1, Math.max(0, (pos - base) / (nx - base)));
          if (t > 0.03) cover(bitmaps[nx], t);
        }
      }
      if (fade > 0) { if (art) cover(art, fade); else makeArt(); }
      else if (art) { closeBitmap(art); art = null; }
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
      var wf = Math.floor(current);
      if (isReady && (wf !== warmAt || now - lastWarm > 400)) { warmAt = wf; lastWarm = now; warm(wf); }
      if (isReady && (q !== shown || fade !== shownFade)) { draw(q / 12, fade); shown = q; shownFade = fade; }
      requestAnimationFrame(tick);
    }

    size();
    // first frame and hero image right away (the first frame matches the poster); the rest once the page is loaded and idle
    var isReady = false, pending = 2;
    function ready() { if (isReady) return; if (--pending > 0) return; isReady = true; root.classList.add('film--ready'); dirty = true; }
    fetchBlob(url(0)).then(function (b) {
      blobs[0] = b;
      return createImageBitmap(b).then(function (probe) { srcW = probe.width; srcH = probe.height; closeBitmap(probe); warmAt = 0; warm(0); });
    }).catch(function () { root.classList.add('film--static'); });
    fetchBlob(small ? root.dataset.artMobile : root.dataset.art).then(function (b) { artBlob = b; makeArt(); }).catch(function () { ready(); }); // no art: the film simply starts at its first frame
    next = 0;
    var start = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 400); })(pump, { timeout: 2500 }); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    requestAnimationFrame(tick);
  }
})();
