// Sign in with the one-time code (username + the 6-digit code from Dashlane).
// Separate from admin-login.js so the passkey/password sign-in code stays untouched.
(function () {
  'use strict';
  var form = document.getElementById('codeForm');
  if (!form) return;
  var user = document.getElementById('codeUsername');
  var code = document.getElementById('totpCode');
  var btn = document.getElementById('codeLoginButton');
  var toggle = document.getElementById('recoveryToggle');
  var label = document.getElementById('totpLabel');
  var help = document.getElementById('totpHelp');
  var err = document.getElementById('errorMessage');
  var recovery = false;

  function show(msg) { err.textContent = msg; err.classList.add('visible'); }
  function clear() { err.classList.remove('visible'); }

  // keep the username in step with the other sign-in options
  var other = [document.getElementById('webauthnUsername'), document.getElementById('passwordUsername')];
  user.addEventListener('input', function () { other.forEach(function (o) { if (o) o.value = user.value; }); });

  toggle.addEventListener('click', function () {
    recovery = !recovery;
    code.value = '';
    if (recovery) {
      label.textContent = 'Recovery code';
      code.removeAttribute('inputmode'); code.removeAttribute('pattern'); code.setAttribute('maxlength', '11'); code.setAttribute('autocomplete', 'off');
      help.textContent = 'One of the recovery codes you saved when you set this up. Each works once.';
      toggle.textContent = 'Use the one-time code instead';
    } else {
      label.textContent = 'One-time code';
      code.setAttribute('inputmode', 'numeric'); code.setAttribute('pattern', '[0-9 ]*'); code.setAttribute('maxlength', '7'); code.setAttribute('autocomplete', 'one-time-code');
      help.textContent = 'The 6-digit code from Dashlane. It changes every 30 seconds.';
      toggle.textContent = 'Use a recovery code instead';
    }
    code.focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clear();
    if (!user.value.trim() || !code.value.trim()) { show('Enter your username and the code.'); return; }
    btn.disabled = true; btn.textContent = 'Signing in...';
    fetch('/api/auth/csrf-token', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (t) {
        return fetch('/api/auth/totp/login', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t.csrfToken },
          body: JSON.stringify({ username: user.value.trim(), code: code.value.trim(), csrfToken: t.csrfToken })
        });
      })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.success) { window.location.href = '/admin'; return; }
        show(res.j.error || 'That username or code is not right.');
        code.value = ''; code.focus();
      })
      .catch(function () { show('Connection error. Please try again.'); })
      .then(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
  });

  // a pasted or autofilled 6-digit code submits itself
  code.addEventListener('input', function () {
    if (!recovery && /^\d{3}\s?\d{3}$/.test(code.value.trim()) && user.value.trim()) form.requestSubmit();
  });

  if (!user.value) user.focus(); else code.focus();
})();
