// Magnetic Buttons
// Subtle magnetic effect on hover for buttons and interactive elements
class MagneticButton {
  constructor(element) {
    this.element = element;
    this.bounds = null;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isHovering = false;
    this.rafId = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    if (this.prefersReducedMotion) {
      return; // Skip magnetic effect if user prefers reduced motion
    }

    this.element.classList.add('magnetic');
    
    this.element.addEventListener('mouseenter', () => {
      this.isHovering = true;
      this.updateBounds();
      this.animate();
    });

    this.element.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this.targetX = 0;
      this.targetY = 0;
      // Continue animation to reset position
      this.animate();
    });

    this.element.addEventListener('mousemove', (e) => {
      if (!this.isHovering) return;
      this.handleMouseMove(e);
    });
  }

  updateBounds() {
    this.bounds = this.element.getBoundingClientRect();
  }

  handleMouseMove(e) {
    if (!this.bounds) return;

    const centerX = this.bounds.left + this.bounds.width / 2;
    const centerY = this.bounds.top + this.bounds.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.max(this.bounds.width, this.bounds.height) / 2;
    const maxMove = 8; // Maximum movement in pixels

    if (distance < maxDistance * 1.5) {
      const strength = 1 - (distance / (maxDistance * 1.5));
      this.targetX = (dx / distance) * strength * maxMove;
      this.targetY = (dy / distance) * strength * maxMove;
    } else {
      this.targetX = 0;
      this.targetY = 0;
    }
  }

  animate() {
    if (!this.isHovering && Math.abs(this.x) < 0.1 && Math.abs(this.y) < 0.1) {
      // Reset position
      this.x = 0;
      this.y = 0;
      this.element.style.transform = '';
      return;
    }

    // Smooth interpolation
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;

    // Apply transform
    if (Math.abs(this.x) > 0.01 || Math.abs(this.y) > 0.01) {
      this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
      this.rafId = requestAnimationFrame(() => this.animate());
    } else {
      this.element.style.transform = '';
    }
  }
}

// Initialize magnetic buttons
function initMagneticButtons() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return; // Skip if user prefers reduced motion
  }

  // Target elements
  const selectors = [
    '.footer__email',
    '.nav__link',
    '.related-post-card',
    '.blog-post-card',
    '.project-card',
    '.capability--clickable',
    '.hero__cta'
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      new MagneticButton(element);
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMagneticButtons);
} else {
  initMagneticButtons();
}

// Re-initialize for dynamically loaded content
window.addEventListener('contentLoaded', initMagneticButtons);

// Export for manual initialization
window.initMagneticButtons = initMagneticButtons;

