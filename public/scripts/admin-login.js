// Admin sign-in. Passkey and password sign-in logic is unchanged from the previous version;
// only the decorative animation was removed.
const { startAuthentication, startRegistration } = SimpleWebAuthnBrowser;

// Check if already authenticated
fetch('/api/auth/status')
  .then(res => res.json())
  .then(data => {
    if (data.authenticated) {
      window.location.href = '/admin';
    }
  });

const errorMessage = document.getElementById('errorMessage');
const passkeyButton = document.getElementById('passkeyButton');
const registerPasskeyButton = document.getElementById('registerPasskeyButton');
const passwordForm = document.getElementById('passwordForm');
const webauthnUsername = document.getElementById('webauthnUsername');
const passwordUsername = document.getElementById('passwordUsername');

// Check WebAuthn support
const isWebAuthnSupported = window.PublicKeyCredential !== undefined;

if (!isWebAuthnSupported) {
  passkeyButton.disabled = true;
  registerPasskeyButton.disabled = true;
  passkeyButton.textContent = 'Passkeys not supported in this browser';
  registerPasskeyButton.textContent = 'Passkeys not supported';
}

// Helper function to get CSRF token
async function getCsrfToken() {
  const res = await fetch('/api/auth/csrf-token');
  const data = await res.json();
  return data.csrfToken;
}

// Helper function to show error
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('visible');
}

// Helper function to clear error
function clearError() {
  errorMessage.classList.remove('visible');
}

// WebAuthn Authentication (Login)
passkeyButton.addEventListener('click', async () => {
  const username = webauthnUsername.value.trim();
  if (!username) {
    showError('Please enter your username');
    return;
  }

  clearError();
  passkeyButton.disabled = true;
  passkeyButton.querySelector('span').textContent = 'Authenticating...';

  try {
    const csrfToken = await getCsrfToken();

    // Start authentication
    const startRes = await fetch('/api/auth/webauthn/login/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ username, csrfToken })
    });

    if (!startRes.ok) {
      const error = await startRes.json();
      console.error('Authentication start error:', error);
      throw new Error(error.details || error.error || 'Failed to start authentication');
    }

    const options = await startRes.json();

    // Get assertion from authenticator (SimpleWebAuthn handles base64url conversion)
    const assertion = await startAuthentication(options);

    // Get a fresh CSRF token before finishing authentication
    // The session might have changed during the WebAuthn interaction
    const freshCsrfToken = await getCsrfToken();

    // SimpleWebAuthn returns the response in the correct format already
    // Finish authentication
    const finishRes = await fetch('/api/auth/webauthn/login/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': freshCsrfToken
      },
      body: JSON.stringify({ response: assertion, csrfToken: freshCsrfToken })
    });

    const result = await finishRes.json();

    if (finishRes.ok && result.success) {
      window.location.href = '/admin';
    } else {
      throw new Error(result.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
      showError('Passkey authentication was cancelled or not supported');
    } else {
      showError(error.message || 'Authentication failed. Please try again.');
    }
  } finally {
    passkeyButton.disabled = false;
    passkeyButton.querySelector('span').textContent = 'Sign in with Passkey';
  }
});

// WebAuthn Registration
registerPasskeyButton.addEventListener('click', async () => {
  const username = webauthnUsername.value.trim();
  if (!username) {
    showError('Please enter your username');
    return;
  }

  // Registering a passkey requires proving who you are with your password
  const registerPassword = document.getElementById('password').value;
  if (!registerPassword) {
    const legacy = document.querySelector('details');
    if (legacy) legacy.open = true;
    showError('Enter your password below, then select Register Passkey.');
    document.getElementById('password').focus();
    return;
  }

  clearError();
  registerPasskeyButton.disabled = true;
  registerPasskeyButton.textContent = 'Registering...';
  
  // Note: If Dashlane intercepts and you want to use QR code/phone instead,
  // you may need to temporarily disable Dashlane for this site or use an incognito window

  try {
    const csrfToken = await getCsrfToken();

    // Start registration
    const startRes = await fetch('/api/auth/webauthn/register/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ username, password: registerPassword, csrfToken })
    });

    if (!startRes.ok) {
      const error = await startRes.json();
      console.error('Registration start error:', error);
      throw new Error(error.error || error.details || 'Failed to start registration');
    }

    const options = await startRes.json();

    // Get credential from authenticator (SimpleWebAuthn handles base64url conversion)
    const credential = await startRegistration(options);

    // Get a fresh CSRF token before finishing registration
    // The session might have changed during the WebAuthn interaction
    const freshCsrfToken = await getCsrfToken();

    // SimpleWebAuthn returns the response in the correct format already
    // Finish registration
    const finishRes = await fetch('/api/auth/webauthn/register/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': freshCsrfToken
      },
      body: JSON.stringify({ response: credential, csrfToken: freshCsrfToken })
    });

    const result = await finishRes.json();

    if (finishRes.ok && result.success) {
      document.getElementById('password').value = '';
      showError('Passkey registered successfully! You can now sign in with your passkey.');
      registerPasskeyButton.textContent = 'Passkey Registered ✓';
      setTimeout(() => {
        registerPasskeyButton.textContent = 'Register Passkey';
        registerPasskeyButton.disabled = false;
      }, 3000);
    } else {
      console.error('Registration finish error details:', result);
      // Use user-friendly message if available, otherwise fall back to details/error
      const errorMessage = result.userMessage || result.details || result.error || 'Registration failed';
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
      showError('Passkey registration was cancelled or not supported');
    } else if (error.message && error.message.includes('user could not be verified')) {
      showError('Dashlane requires verification. Please unlock Dashlane or complete any verification prompts (PIN, fingerprint, face ID) when Dashlane asks, then try registering again.');
    } else if (error.message && error.message.includes('User verification was required')) {
      showError('Dashlane requires verification. Please unlock Dashlane or complete any verification prompts when asked, then try registering again.');
    } else {
      showError(error.message || 'Registration failed. Please try again.');
    }
    registerPasskeyButton.disabled = false;
    registerPasskeyButton.textContent = 'Register Passkey';
  }
});

// Password login (legacy fallback)
passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = passwordUsername.value;
  const password = document.getElementById('password').value;
  const passwordLoginButton = document.getElementById('passwordLoginButton');

  passwordLoginButton.disabled = true;
  passwordLoginButton.textContent = 'Signing in...';
  clearError();

  try {
    const csrfToken = await getCsrfToken();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ username, password, csrfToken })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      window.location.href = '/admin';
    } else {
      showError(data.error || 'Invalid credentials');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
  } finally {
    passwordLoginButton.disabled = false;
    passwordLoginButton.textContent = 'Sign In with Password';
  }
});

// Sync username fields
webauthnUsername.addEventListener('input', (e) => {
  passwordUsername.value = e.target.value;
});

passwordUsername.addEventListener('input', (e) => {
  webauthnUsername.value = e.target.value;
});
