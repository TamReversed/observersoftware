// Galaxy starfield background (exact copy from coming-soon page)
(function() {
  function initGalaxy() {
    const canvas = document.getElementById('galaxy');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
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
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalaxy);
  } else {
    initGalaxy();
  }
})();

// Custom logo eye tracking - follows cursor anywhere on page
function initEyeTracking() {
  const logo = document.querySelector('.observer-logo-interactive');
  if (!logo) {
    // Retry if logo not loaded yet
    setTimeout(initEyeTracking, 100);
    return;
  }
  
  const eyeInner = logo.querySelector('.eye-inner');
  if (!eyeInner) {
    // Retry if eye element not found yet
    setTimeout(initEyeTracking, 100);
    return;
  }
  
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
    if (!rect.width || !rect.height) return; // Logo not rendered yet
    
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
}

// Initialize eye tracking when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEyeTracking);
} else {
  initEyeTracking();
}

const { startAuthentication, startRegistration } = SimpleWebAuthnBrowser;

// Easter Egg: Pleiades constellation drag-and-drop to reveal login form
(function() {
  // Wait for DOM to be ready
  function initPleiadesEasterEgg() {
    // Check if form was already revealed (persist in sessionStorage)
    const wasRevealed = sessionStorage.getItem('loginFormRevealed') === 'true';
    
    const loginCard = document.getElementById('loginCard');
    const loginTitle = document.getElementById('loginTitle');
    const loginSubtitle = document.getElementById('loginSubtitle');
    const constellationCanvas = document.getElementById('pleiades-constellation');
    const logo = document.querySelector('.observer-logo-interactive');
    
    if (!loginCard || !loginTitle || !loginSubtitle || !constellationCanvas || !logo) {
      // Elements not ready yet, try again
      setTimeout(initPleiadesEasterEgg, 100);
      return;
    }
    
    if (wasRevealed) {
      // Form was already revealed, show it immediately and hide constellation
      constellationCanvas.style.display = 'none';
      loginCard.style.display = 'block';
      setTimeout(() => {
        loginCard.classList.add('revealed');
        loginTitle.textContent = 'Admin Login';
        loginTitle.classList.remove('observing');
        loginSubtitle.textContent = 'Sign in to manage your content';
        loginSubtitle.style.opacity = '1';
      }, 50);
      return;
    }
    
    // Function to reveal login form
    function revealLoginForm() {
      // Store in sessionStorage
      sessionStorage.setItem('loginFormRevealed', 'true');
      
      // Hide constellation
      constellationCanvas.style.display = 'none';
      
      // Show and animate the login form
      loginCard.style.display = 'block';
      setTimeout(() => {
        loginCard.classList.add('revealed');
        
        // Update title and subtitle
        loginTitle.textContent = 'Admin Login';
        loginTitle.classList.remove('observing');
        loginSubtitle.textContent = 'Sign in to manage your content';
        loginSubtitle.style.opacity = '1';
      }, 50);
    }
    
    // Pleiades constellation setup
    const ctx = constellationCanvas.getContext('2d');
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    
    // Pleiades star positions (relative to initial position)
    // Pattern: 7 stars in a recognizable cluster - made MUCH larger and brighter
    const pleiadesStars = [
      { x: 0, y: 0, size: 8 },      // Center star (much larger)
      { x: -25, y: -18, size: 7 },  // Top-left
      { x: 25, y: -15, size: 7 },   // Top-right
      { x: -30, y: 15, size: 6 },   // Bottom-left
      { x: 30, y: 18, size: 6 },    // Bottom-right
      { x: -12, y: 25, size: 6 },   // Lower-left
      { x: 18, y: 30, size: 6 }    // Lower-right
    ];
    
    // Initial position (upper-right area) - must be declared before functions
    let constellationX = canvasWidth * 0.75;
    let constellationY = canvasHeight * 0.25;
    
    // Drag state - must be declared before functions
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let isOverLogo = false;
    let time = 0;
    
    function resizeCanvas() {
      canvasWidth = constellationCanvas.width = window.innerWidth;
      canvasHeight = constellationCanvas.height = window.innerHeight;
      // Update constellation position on resize
      constellationX = canvasWidth * 0.75;
      constellationY = canvasHeight * 0.25;
      // Ensure canvas is visible
      constellationCanvas.style.display = 'block';
      drawConstellation();
    }
    
    // Initialize canvas immediately
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Force initial draw
    setTimeout(() => {
      drawConstellation();
    }, 100);
    
    // Logo bounds for collision detection (in canvas coordinates)
    function getLogoBounds() {
      const rect = logo.getBoundingClientRect();
      const canvasRect = constellationCanvas.getBoundingClientRect();
      return {
        centerX: (rect.left - canvasRect.left) + rect.width / 2,
        centerY: (rect.top - canvasRect.top) + rect.height / 2,
        radius: Math.max(rect.width, rect.height) / 2 + 120 // 120px threshold for easier drop
      };
    }
    
    // Draw constellation
    function drawConstellation() {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      const logoBounds = getLogoBounds();
      const distanceToLogo = Math.sqrt(
        Math.pow(constellationX - logoBounds.centerX, 2) + 
        Math.pow(constellationY - logoBounds.centerY, 2)
      );
      
      isOverLogo = distanceToLogo < logoBounds.radius;
      
      // Draw connecting lines
      ctx.strokeStyle = isOverLogo 
        ? 'rgba(124, 155, 221, 0.6)' 
        : 'rgba(124, 155, 221, 0.3)';
      ctx.lineWidth = 1;
      
      // Connect nearby stars
      for (let i = 0; i < pleiadesStars.length; i++) {
        for (let j = i + 1; j < pleiadesStars.length; j++) {
          const dist = Math.sqrt(
            Math.pow(pleiadesStars[i].x - pleiadesStars[j].x, 2) + 
            Math.pow(pleiadesStars[i].y - pleiadesStars[j].y, 2)
          );
          if (dist < 25) {
            ctx.beginPath();
            ctx.moveTo(
              constellationX + pleiadesStars[i].x, 
              constellationY + pleiadesStars[i].y
            );
            ctx.lineTo(
              constellationX + pleiadesStars[j].x, 
              constellationY + pleiadesStars[j].y
            );
            ctx.stroke();
          }
        }
      }
      
      // Draw stars with twinkling - made MUCH more visible and brighter
      pleiadesStars.forEach((star, index) => {
        const twinkle = Math.sin(time * 2 + index) * 0.2 + 0.8;
        const alpha = 1.0; // Always fully opaque
        const size = star.size * (isOverLogo ? 1.3 : 1.0); // Larger base size
        
        // Large outer glow - very bright
        const outerGradient = ctx.createRadialGradient(
          constellationX + star.x, 
          constellationY + star.y, 
          0,
          constellationX + star.x, 
          constellationY + star.y, 
          size * 12
        );
        outerGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.6})`);
        outerGradient.addColorStop(0.4, `rgba(200, 220, 255, ${alpha * 0.4})`);
        outerGradient.addColorStop(0.7, `rgba(150, 180, 255, ${alpha * 0.2})`);
        outerGradient.addColorStop(1, 'rgba(124, 155, 221, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(
          constellationX + star.x, 
          constellationY + star.y, 
          size * 12, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        // Medium glow
        const mediumGradient = ctx.createRadialGradient(
          constellationX + star.x, 
          constellationY + star.y, 
          0,
          constellationX + star.x, 
          constellationY + star.y, 
          size * 6
        );
        mediumGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
        mediumGradient.addColorStop(0.5, `rgba(200, 220, 255, ${alpha * 0.5})`);
        mediumGradient.addColorStop(1, 'rgba(150, 180, 255, 0)');
        
        ctx.fillStyle = mediumGradient;
        ctx.beginPath();
        ctx.arc(
          constellationX + star.x, 
          constellationY + star.y, 
          size * 6, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        // Star core - very bright
        ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        ctx.beginPath();
        ctx.arc(
          constellationX + star.x, 
          constellationY + star.y, 
          size * 1.5, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        // Bright center point
        ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        ctx.beginPath();
        ctx.arc(
          constellationX + star.x, 
          constellationY + star.y, 
          size * 0.8, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      });
      
      // Visual feedback when over logo
      if (isOverLogo) {
        logo.style.filter = 'brightness(1.3) drop-shadow(0 0 20px rgba(124, 155, 221, 0.8))';
        logo.style.transition = 'filter 0.3s ease';
        constellationCanvas.style.cursor = 'grabbing';
      } else {
        logo.style.filter = '';
        constellationCanvas.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    }
    
    // Animation loop
    function animate() {
      time += 0.016;
      drawConstellation();
      requestAnimationFrame(animate);
    }
    animate();
    
    // Drag handlers
    function getMousePos(e) {
      return {
        x: e.clientX || (e.touches && e.touches[0].clientX),
        y: e.clientY || (e.touches && e.touches[0].clientY)
      };
    }
    
    function handleStart(e) {
      const pos = getMousePos(e);
      if (!pos.x || !pos.y) return;
      
      const rect = constellationCanvas.getBoundingClientRect();
      
      // Check if click is within constellation bounds
      const clickX = pos.x - rect.left;
      const clickY = pos.y - rect.top;
      const distToCenter = Math.sqrt(
        Math.pow(clickX - constellationX, 2) + 
        Math.pow(clickY - constellationY, 2)
      );
      
      if (distToCenter < 60) { // Click within 60px of constellation center
        isDragging = true;
        dragOffsetX = clickX - constellationX;
        dragOffsetY = clickY - constellationY;
        constellationCanvas.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
      }
    }
    
    function handleMove(e) {
      if (!isDragging) return;
      
      const pos = getMousePos(e);
      if (!pos.x || !pos.y) return;
      
      const rect = constellationCanvas.getBoundingClientRect();
      constellationX = pos.x - rect.left - dragOffsetX;
      constellationY = pos.y - rect.top - dragOffsetY;
      
      // Constrain to canvas bounds
      constellationX = Math.max(30, Math.min(canvasWidth - 30, constellationX));
      constellationY = Math.max(30, Math.min(canvasHeight - 30, constellationY));
      
      // Check if dropped on logo
      const logoBounds = getLogoBounds();
      const distance = Math.sqrt(
        Math.pow(constellationX - logoBounds.centerX, 2) + 
        Math.pow(constellationY - logoBounds.centerY, 2)
      );
      
      if (distance < logoBounds.radius) {
        revealLoginForm();
        isDragging = false;
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
    
    function handleEnd(e) {
      if (isDragging) {
        isDragging = false;
        constellationCanvas.style.cursor = 'grab';
      }
    }
    
    // Mouse events
    constellationCanvas.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    // Touch events
    constellationCanvas.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPleiadesEasterEgg);
  } else {
    initPleiadesEasterEgg();
  }
})();

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
