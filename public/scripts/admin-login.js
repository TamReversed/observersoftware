// Admin sign in: one form, three ways in (password, one-time code, passkey).
// Talks to the same /api/auth endpoints as before; only the page around them changed.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('signinForm'), user = $('username'), pass = $('password'), code = $('totpCode');
  var err = $('errorMessage'), submit = $('submitBtn');
  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  var KEY = 'observer-signin-method';
  var method = 'password', recovery = false, passkeyOk = true, failures = 0, busy = false;

  $('hereHost').textContent = location.host;

  // ---- already signed in? go straight to the dashboard
  fetch('/api/auth/status', { credentials: 'same-origin' }).then(function (r) { return r.json(); })
    .then(function (d) { if (d.authenticated) location.replace('/admin'); }).catch(function () {});

  // ---- messages
  function show(msg) { err.textContent = msg; err.classList.add('visible'); }
  function clear() { err.classList.remove('visible'); err.textContent = ''; }

  // ---- method tabs
  function setMethod(m, focus) {
    method = m; clear();
    tabs.forEach(function (t) {
      var on = t.dataset.method === m;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $('panel-' + t.dataset.method).hidden = !on;
    });
    submit.textContent = m === 'passkey' ? 'Sign in with passkey' : 'Sign in';
    submit.disabled = (m === 'passkey' && !passkeyOk);
    try { localStorage.setItem(KEY, m); } catch (e) { /* private mode */ }
    if (focus !== false) (!user.value ? user : (m === 'password' ? pass : m === 'code' ? code : submit)).focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { setMethod(t.dataset.method); });
    t.addEventListener('keydown', function (e) {   // arrow keys move between tabs
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      e.preventDefault(); var t2 = tabs[(n + tabs.length) % tabs.length]; setMethod(t2.dataset.method, false); t2.focus();
    });
  });
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  var wanted = new URLSearchParams(location.search).get('method') || saved;
  setMethod(['password', 'code', 'passkey'].indexOf(wanted) >= 0 ? wanted : 'password', true);

  // ---- show / hide password
  $('showPassword').addEventListener('click', function () {
    var show = pass.type === 'password'; pass.type = show ? 'text' : 'password';
    this.textContent = show ? 'Hide' : 'Show'; this.setAttribute('aria-pressed', String(show)); pass.focus();
  });

  // ---- recovery code toggle
  $('recoveryToggle').addEventListener('click', function () {
    recovery = !recovery; code.value = '';
    if (recovery) {
      $('totpLabel').textContent = 'Recovery code';
      code.removeAttribute('inputmode'); code.removeAttribute('pattern'); code.maxLength = 11; code.autocomplete = 'off';
      $('totpHelp').textContent = 'One of the recovery codes you saved when you set this up. Each works once.';
      this.textContent = 'Use the one-time code instead';
    } else {
      $('totpLabel').textContent = 'One-time code';
      code.setAttribute('inputmode', 'numeric'); code.pattern = '[0-9 ]*'; code.maxLength = 7; code.autocomplete = 'one-time-code';
      $('totpHelp').textContent = 'The 6-digit code from Dashlane. It changes every 30 seconds.';
      this.textContent = 'Use a recovery code instead';
    }
    code.focus();
  });
  // a pasted or autofilled 6-digit code signs in by itself
  code.addEventListener('input', function () {
    if (!recovery && /^\d{3}\s?\d{3}$/.test(code.value.trim()) && user.value.trim() && !busy) form.requestSubmit();
  });

  // ---- passkeys only work on the address they were created for: say so before it fails mysteriously
  var hasPasskeyApi = !!(window.PublicKeyCredential && window.SimpleWebAuthnBrowser);
  function noPasskey(msg) { passkeyOk = false; var n = $('passkeyNotice'); n.textContent = msg; n.hidden = false; if (method === 'passkey') submit.disabled = true; }
  if (!hasPasskeyApi) noPasskey('This browser cannot use passkeys here. Use your password or a one-time code.');
  else fetch('/api/auth/signin-config').then(function (r) { return r.json(); }).then(function (c) {
    var host = location.hostname, rp = c.passkeyRpId || '';
    var hostOk = host === rp || host.endsWith('.' + rp);
    var originOk = (c.passkeyOrigins || []).indexOf(location.origin) >= 0;
    if (!hostOk || !originOk) noPasskey('Passkeys on this site are tied to ' + (c.passkeyOrigins || [rp])[0] + ', but you are on ' + location.origin + '. Use that address for passkeys, or sign in with your password or a one-time code.');
  }).catch(function () {});

  // ---- talking to the server (fetches its own CSRF token, and retries once if the token went stale)
  function post(path, body) {
    function once() {
      return fetch('/api/auth/csrf-token', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (t) {
        var b = {}; for (var k in body) b[k] = body[k]; b.csrfToken = t.csrfToken;
        return fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrfToken }, body: JSON.stringify(b) });
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); });
    }
    return once().then(function (r) { return r.status === 403 && /csrf/i.test(r.j.error || '') ? once() : r; });
  }

  // After a successful sign-in, make sure the browser really kept the session (cookies blocked is a classic cause).
  function finish() {
    fetch('/api/auth/status', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.authenticated) { location.href = '/admin'; return; }
      show('You were signed in, but your browser did not keep the session. Make sure cookies are allowed for this site (and that this is not a private window with cookies blocked), then try again.');
      busy = false; submit.disabled = false; submit.textContent = method === 'passkey' ? 'Sign in with passkey' : 'Sign in';
    }).catch(function () { location.href = '/admin'; });
  }

  function failMessage(r, fallback) {
    if (r.status === 429) return (r.j && r.j.error) || 'Too many tries. Please wait a few minutes.';
    if (r.status >= 500) return 'The server had a problem. Please try again in a moment.';
    return fallback;
  }

  // ---- the three ways in
  function withPassword() {
    if (!pass.value) { show('Enter your password.'); pass.focus(); return Promise.resolve(false); }
    return post('/api/auth/login', { username: user.value.trim(), password: pass.value }).then(function (r) {
      if (r.ok && r.j.success) { finish(); return true; }
      failures++;
      var msg = failMessage(r, "That username or password isn't right.");
      if (r.status === 401 && failures >= 2) msg += ' If this account uses one-time codes, use the One-time code tab. Forgot it? Open "Can\'t sign in?" below.';
      show(msg); pass.select(); return false;
    });
  }
  function withCode() {
    if (!code.value.trim()) { show(recovery ? 'Enter a recovery code.' : 'Enter the 6-digit code.'); code.focus(); return Promise.resolve(false); }
    return post('/api/auth/totp/login', { username: user.value.trim(), code: code.value.trim() }).then(function (r) {
      if (r.ok && r.j.success) { finish(); return true; }
      show(failMessage(r, "That username or code isn't right. Codes change every 30 seconds, so type the one showing now.")); code.value = ''; code.focus(); return false;
    });
  }
  function withPasskey() {
    var sw = window.SimpleWebAuthnBrowser;
    return post('/api/auth/webauthn/login/start', { username: user.value.trim() }).then(function (s) {
      if (!s.ok) throw { msg: failMessage(s, s.j.error === 'No passkey registered for this user' ? 'No passkey is set up for that username. Use your password, or add a passkey after signing in.' : "Couldn't start passkey sign-in.") };
      return sw.startAuthentication(s.j);
    }).then(function (assertion) {
      return post('/api/auth/webauthn/login/finish', { response: assertion });
    }).then(function (f) {
      if (f.ok && f.j.success) { finish(); return true; }
      throw { msg: failMessage(f, f.j.error || 'Passkey sign-in failed.') };
    }).catch(function (e) {
      if (e && e.msg) show(e.msg);
      else if (e && (e.name === 'NotAllowedError' || e.name === 'NotSupportedError')) show('Passkey sign-in was cancelled or is not available on this device.');
      else show('Passkey sign-in failed. Try your password instead.');
      return false;
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    clear();
    if (!user.value.trim()) { show('Enter your username.'); user.focus(); return; }
    busy = true; submit.disabled = true; var label = submit.textContent; submit.textContent = 'Signing in...';
    var run = method === 'password' ? withPassword() : method === 'code' ? withCode() : withPasskey();
    run.then(function (ok) {
      if (ok) return;                       // finish() takes over
      busy = false; submit.disabled = (method === 'passkey' && !passkeyOk); submit.textContent = label;
    }).catch(function () {
      show('Could not reach the server. Check your connection and try again.');
      busy = false; submit.disabled = false; submit.textContent = label;
    });
  });
})();
