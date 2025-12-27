// Galaxy starfield background (from coming-soon page)
(function() {
  const canvas = document.getElementById('galaxy');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  const stars = [];
  const shootingStars = [];
  const numStars = 400;
  
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  
  resize();
  window.addEventListener('resize', resize);
  
  // Create stars
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      color: ['#ffffff', '#cce5ff', '#aaccff', '#fff4e6'][Math.floor(Math.random() * 4)]
    });
  }
  
  // Shooting star class
  class ShootingStar {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width * 1.5;
      this.y = Math.random() * height * 0.5;
      this.length = Math.random() * 80 + 40;
      this.speed = Math.random() * 15 + 10;
      this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
      this.opacity = 1;
      this.active = true;
    }
    
    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.opacity -= 0.015;
      
      if (this.opacity <= 0 || this.x > width + 100 || this.y > height + 100) {
        this.active = false;
      }
    }
    
    draw() {
      if (!this.active) return;
      
      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;
      
      const gradient = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, `rgba(255, 255, 255, ${this.opacity})`);
      
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Head glow
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.fill();
    }
  }
  
  // Spawn shooting stars occasionally
  setInterval(() => {
    if (Math.random() < 0.3) {
      const star = shootingStars.find(s => !s.active);
      if (star) {
        star.reset();
      } else if (shootingStars.length < 5) {
        shootingStars.push(new ShootingStar());
      }
    }
  }, 2000);
  
  let time = 0;
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    time += 0.016;
    
    // Draw stars with twinkling
    stars.forEach(star => {
      const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase) * 0.5 + 0.5;
      const alpha = 0.3 + twinkle * 0.7;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
      
      // Parse hex color
      if (star.color.startsWith('#')) {
        const hex = star.color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      
      ctx.fill();
      
      // Glow for larger stars
      if (star.size > 1.5) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        const glowAlpha = alpha * 0.15;
        if (star.color.startsWith('#')) {
          const hex = star.color.slice(1);
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${glowAlpha})`;
        }
        ctx.fill();
      }
    });
    
    // Update and draw shooting stars
    shootingStars.forEach(star => {
      star.update();
      star.draw();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Parallax on orbs
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / width - 0.5) * 2;
    const y = (e.clientY / height - 0.5) * 2;
    
    document.querySelectorAll('.orb').forEach((orb, i) => {
      const speed = (i + 1) * 15;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
})();

// Custom logo eye tracking - follows cursor anywhere on page
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.observer-logo-interactive');
  if (!logo) return;
  
  const eyeInner = logo.querySelector('.eye-inner');
  if (!eyeInner) return;
  
  const eyeCenterX = 99 + 5;
  const eyeCenterY = 95 + 10;
  const maxMove = 8;
  
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  
  function animate() {
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    eyeInner.setAttribute('transform', `translate(${99 + currentX}, ${95 + currentY})`);
    requestAnimationFrame(animate);
  }
  animate();
  
  // Track mouse anywhere on the page
  document.addEventListener('mousemove', (e) => {
    const rect = logo.getBoundingClientRect();
    const scaleX = 200 / rect.width;
    const scaleY = 250 / rect.height;
    
    // Calculate mouse position relative to the SVG
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    const dx = mouseX - eyeCenterX;
    const dy = mouseY - eyeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const moveDistance = Math.min(distance / 20, maxMove);
    targetX = Math.cos(angle) * moveDistance;
    targetY = Math.sin(angle) * moveDistance;
  });
  
  // Reset when mouse leaves page
  document.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });
});

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
      body: JSON.stringify({ username, csrfToken })
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
  </script>
