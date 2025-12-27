// Interactive Observer Logo
// Initializes eye-following animation for multicolor interactive logos
(function() {
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initInteractiveLogo(svgElement) {
  if (!svgElement) return;
  
  const eyeInner = svgElement.querySelector('.eye-inner');
  if (!eyeInner) return;
  
  // Eye center in SVG coordinates (accounting for the transform translate(5, 10))
  const eyeCenterX = 99 + 5;
  const eyeCenterY = 95 + 10;
  const maxMove = 8;
  
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  
  function animate() {
    // Normal eye following
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    eyeInner.setAttribute('transform', `translate(${99 + currentX}, ${95 + currentY})`);
    requestAnimationFrame(animate);
  }
  animate();
  
  // Check if this is the hero logo (inside .hero__mark)
  const heroMark = svgElement.closest('.hero__mark');
  const heroSection = svgElement.closest('.hero');
  const isHeroLogo = !!heroMark;
  
  // For hero logo, track mouse across entire hero section
  // For nav logo, track mouse only within the nav logo container
  const container = isHeroLogo ? heroSection : (svgElement.closest('.nav__logo') || svgElement.parentElement);
  
  function handleMouseMove(e) {
    
    const rect = svgElement.getBoundingClientRect();
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
  }
  
  function handleMouseLeave() {
    // Only reset if leaving the container (for nav) or leaving hero section (for hero logo)
    if (!isHeroLogo) {
      targetX = 0;
      targetY = 0;
    }
  }
  
  // For hero logo, also reset when leaving the hero section
  function handleHeroMouseLeave() {
    targetX = 0;
    targetY = 0;
  }
  
  if (isHeroLogo && heroSection) {
    heroSection.addEventListener('mouseleave', handleHeroMouseLeave);
  }
  
  container.addEventListener('mousemove', handleMouseMove);
  if (!isHeroLogo) {
    container.addEventListener('mouseleave', handleMouseLeave);
  }
  
  // Cleanup function (optional, for dynamic removal)
  return () => {
    container.removeEventListener('mousemove', handleMouseMove);
    if (!isHeroLogo) {
      container.removeEventListener('mouseleave', handleMouseLeave);
    }
    if (isHeroLogo && heroSection) {
      heroSection.removeEventListener('mouseleave', handleHeroMouseLeave);
    }
  };
}

// Initialize all interactive logos on page load
function initializeLogos() {
  const logos = document.querySelectorAll('.observer-logo-interactive');
  logos.forEach((logo) => {
    initInteractiveLogo(logo);
  });
}

// Try multiple initialization methods to ensure it works
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLogos);
} else {
  // DOM is already loaded
  initializeLogos();
}

// Also try after a short delay in case scripts load out of order
setTimeout(initializeLogos, 100);

// Export for manual initialization if needed
window.initInteractiveLogo = initInteractiveLogo;

// Easter Egg: Click logo 5-7 times to access admin panel
(function() {
  // Only on public pages (not admin pages)
  if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/observe')) {
    return;
  }

  let clickCount = 0;
  let clickTimer = null;
  const REQUIRED_CLICKS = 6; // 5-7 range, using 6 as middle
  const CLICK_TIMEOUT = 3000; // 3 seconds

  function handleLogoClick(e) {
    // Only trigger on actual logo SVG clicks, not parent links
    if (e.target.closest('a')) {
      const logo = e.target.closest('a').querySelector('.observer-logo-interactive');
      if (!logo || !logo.contains(e.target)) {
        return;
      }
    }

    clickCount++;
    
    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    // Visual feedback - subtle pulse on logo
    const logo = e.target.closest('.observer-logo-interactive') || 
                 document.querySelector('.observer-logo-interactive');
    if (logo) {
      logo.style.transition = 'filter 0.3s ease, transform 0.3s ease';
      logo.style.filter = 'brightness(1.3) drop-shadow(0 0 10px rgba(124, 155, 221, 0.6))';
      logo.style.transform = 'scale(1.05)';
      
      setTimeout(() => {
        logo.style.filter = '';
        logo.style.transform = '';
      }, 300);
    }

    // Check if we've reached the required clicks
    if (clickCount >= REQUIRED_CLICKS) {
      // Navigate to admin panel
      window.location.href = '/observe';
      return;
    }

    // Reset counter after timeout
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, CLICK_TIMEOUT);
  }

  // Add click listeners to all logos
  document.addEventListener('click', (e) => {
    if (e.target.closest('.observer-logo-interactive') || 
        e.target.closest('.nav__logo')?.querySelector('.observer-logo-interactive') ||
        e.target.closest('.hero__logo')?.querySelector('.observer-logo-interactive')) {
      handleLogoClick(e);
    }
  });
})();

})(); // Close IIFE
