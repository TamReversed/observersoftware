// Share Functionality
// Modern Web Share API with fallbacks for social sharing
class ShareButton {
  constructor(postData) {
    this.postData = postData;
    this.button = null;
    this.menu = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    // Find or create share button container
    const heroMeta = document.querySelector('.post-hero__meta');
    if (!heroMeta) return;

    // Create share button
    this.button = document.createElement('button');
    this.button.className = 'share-button';
    this.button.setAttribute('aria-label', 'Share this post');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      <span>Share</span>
    `;

    // Create share menu
    this.menu = document.createElement('div');
    this.menu.className = 'share-menu';
    this.menu.setAttribute('role', 'menu');
    this.menu.innerHTML = this.buildMenuHTML();

    // Insert after meta
    heroMeta.parentNode.insertBefore(this.button, heroMeta.nextSibling);
    heroMeta.parentNode.insertBefore(this.menu, this.button.nextSibling);

    // Event listeners
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    document.addEventListener('click', (e) => {
      if (!this.button.contains(e.target) && !this.menu.contains(e.target)) {
        this.close();
      }
    });

    // Keyboard support
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  buildMenuHTML() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.postData.title);
    const text = encodeURIComponent(this.postData.excerpt || this.postData.title);

    return `
      <button class="share-menu__item" data-action="twitter" role="menuitem">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
        </svg>
        <span>Twitter</span>
      </button>
      <button class="share-menu__item" data-action="linkedin" role="menuitem">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
        <span>LinkedIn</span>
      </button>
      <button class="share-menu__item" data-action="facebook" role="menuitem">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>
        <span>Facebook</span>
      </button>
      <button class="share-menu__item" data-action="copy" role="menuitem">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        <span>Copy Link</span>
      </button>
      <button class="share-menu__item" data-action="email" role="menuitem">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span>Email</span>
      </button>
    `;

    // Add click handlers to menu items
    setTimeout(() => {
      this.menu.querySelectorAll('.share-menu__item').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = item.dataset.action;
          this.handleShare(action);
        });
      });
    }, 0);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.menu.classList.add('share-menu--open');
    this.button.setAttribute('aria-expanded', 'true');
    this.isOpen = true;
  }

  close() {
    this.menu.classList.remove('share-menu--open');
    this.button.setAttribute('aria-expanded', 'false');
    this.isOpen = false;
  }

  async handleShare(action) {
    const url = window.location.href;
    const title = this.postData.title;
    const text = this.postData.excerpt || this.postData.title;

    switch (action) {
      case 'twitter': {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        this.close();
        break;
      }
      case 'linkedin': {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedinUrl, '_blank', 'width=550,height=420');
        this.close();
        break;
      }
      case 'facebook': {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
        this.close();
        break;
      }
      case 'copy': {
        try {
          await navigator.clipboard.writeText(url);
          this.showToast('Link copied to clipboard!');
          this.close();
        } catch (err) {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = url;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            this.showToast('Link copied to clipboard!');
            this.close();
          } catch (e) {
            this.showToast('Failed to copy link');
          }
          document.body.removeChild(textarea);
        }
        break;
      }
      case 'email': {
        const subject = encodeURIComponent(`Check out: ${title}`);
        const body = encodeURIComponent(`${text}\n\n${url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        this.close();
        break;
      }
      default:
        // Try native Web Share API
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text,
              url
            });
            this.close();
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Error sharing:', err);
            }
          }
        }
    }
  }

  showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.share-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add('share-toast--visible');
    }, 10);

    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('share-toast--visible');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  }
}

// Initialize share button when post data is available
window.initShareButton = function(postData) {
  new ShareButton(postData);
};

