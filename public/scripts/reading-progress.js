// Reading Progress Indicator
// Thin progress bar at top of viewport showing reading progress
class ReadingProgress {
  constructor() {
    this.bar = null;
    this.progress = 0;
    this.currentProgress = 0;
    this.rafId = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    // Check if we're on a post page
    if (!document.getElementById('postContent')) {
      return;
    }

    // Create progress bar element
    this.bar = document.createElement('div');
    this.bar.className = 'reading-progress';
    this.bar.setAttribute('role', 'progressbar');
    this.bar.setAttribute('aria-label', 'Reading progress');
    this.bar.setAttribute('aria-valuemin', '0');
    this.bar.setAttribute('aria-valuemax', '100');
    this.bar.setAttribute('aria-valuenow', '0');
    document.body.appendChild(this.bar);

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.update();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial update
    this.update();
  }

  update() {
    if (!this.bar) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate progress
    const scrollableHeight = documentHeight - windowHeight;
    if (scrollableHeight <= 0) {
      this.progress = 0;
    } else {
      this.progress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
    }

    // Smooth interpolation
    if (this.prefersReducedMotion) {
      this.currentProgress = this.progress;
    } else {
      this.currentProgress += (this.progress - this.currentProgress) * 0.1;
    }

    // Update bar using CSS custom property
    const scale = this.currentProgress / 100;
    this.bar.style.setProperty('--progress-scale', scale);
    this.bar.setAttribute('aria-valuenow', Math.round(this.currentProgress));

    // Hide when at top (< 5% scrolled)
    if (this.currentProgress < 5) {
      this.bar.classList.add('reading-progress--hidden');
    } else {
      this.bar.classList.remove('reading-progress--hidden');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ReadingProgress();
  });
} else {
  new ReadingProgress();
}

