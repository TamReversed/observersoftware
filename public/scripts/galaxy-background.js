// Galaxy starfield background (calmer alternative to mesh-background)
(function() {
  let canvas, ctx;
  let width, height;
  let stars = [];
  let shootingStars = [];
  let animationId;
  let time = 0;
  const numStars = 400;
  
  function init() {
    canvas = document.getElementById('galaxy');
    if (!canvas) {
      // Retry if canvas not found (e.g., during page transitions)
      setTimeout(init, 100);
      return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Ensure canvas is ready
    if (window.innerWidth === 0 || window.innerHeight === 0) {
      setTimeout(init, 100);
      return;
    }
    
    resize();
    createStars();
    startAnimation();
    startShootingStars();
  }
  
  function resize() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  
  function createStars() {
    stars = [];
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
  }
  
  function startAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    time = 0;
    animate();
  }
  
  window.addEventListener('resize', () => {
    resize();
    // Recreate stars on resize to fill new dimensions
    createStars();
  });
  
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
  let shootingStarInterval;
  function startShootingStars() {
    if (shootingStarInterval) clearInterval(shootingStarInterval);
    shootingStarInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        const star = shootingStars.find(s => !s.active);
        if (star) {
          star.reset();
        } else if (shootingStars.length < 5) {
          shootingStars.push(new ShootingStar());
        }
      }
    }, 2000);
  }
  
  function animate() {
    if (!ctx || !canvas) return;
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
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Re-initialize after page transitions
  window.addEventListener('pageTransitionComplete', () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (shootingStarInterval) {
      clearInterval(shootingStarInterval);
    }
    shootingStars = [];
    init();
  });
  
  // Parallax on orbs
  document.addEventListener('mousemove', (e) => {
    if (!width || !height) return;
    const x = (e.clientX / width - 0.5) * 2;
    const y = (e.clientY / height - 0.5) * 2;
    
    document.querySelectorAll('.orb').forEach((orb, i) => {
      const speed = (i + 1) * 15;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
})();

