// Smooth Page Transitions
// View Transitions API with fallback for smooth page navigation
class PageTransitions {
  constructor() {
    this.supportsViewTransitions = typeof document.startViewTransition === 'function';
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    if (this.prefersReducedMotion) {
      return; // Skip transitions if user prefers reduced motion
    }

    // Intercept internal link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Only handle internal links
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        return; // External link
      }

      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return; // Skip anchors and special links
      }

      // Skip page transitions for blog pages - let them do full page loads
      // This prevents issues with scripts not loading properly
      if (href.includes('/blog') || href.includes('blog.html')) {
        return; // Let browser handle normally
      }

      // Check if it's an internal route
      if (href.startsWith('/') || href.startsWith('./') || !href.includes('://')) {
        e.preventDefault();
        this.navigate(href);
      }
    });
  }

  async navigate(url) {
    // Show loading indicator
    this.showLoading();

    try {
      // Fetch the new page
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load page');
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract new content
      const newContent = doc.querySelector('main') || doc.body;
      const currentContent = document.querySelector('main') || document.body;

      if (this.supportsViewTransitions) {
        // Use View Transitions API
        document.startViewTransition(() => {
          this.updateContent(currentContent, newContent, doc);
          window.history.pushState({}, '', url);
        });
      } else {
        // Fallback: simple fade
        this.fadeTransition(currentContent, newContent, url, doc);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to normal navigation
      window.location.href = url;
    } finally {
      this.hideLoading();
    }
  }

  updateContent(currentElement, newElement, newDoc) {
    console.log('[DEBUG] page-transitions: updateContent called', {
      hasCurrentElement: !!currentElement,
      hasNewElement: !!newElement,
      hasNewDoc: !!newDoc,
      url: window.location.pathname
    });
    
    // Load CSS files from the new page
    if (newDoc) {
      this.loadStylesheets(newDoc);
    }
    
    if (currentElement && newElement) {
      currentElement.innerHTML = newElement.innerHTML;
      
      // Extract and execute scripts from the new page
      if (newDoc) {
        console.log('[DEBUG] page-transitions: Executing scripts from new document');
        // Wait for all scripts to load before dispatching event
        this.executeScripts(newDoc).then(() => {
          // Dispatch event after scripts are loaded
          console.log('[DEBUG] page-transitions: All scripts loaded, dispatching pageTransitionComplete event');
          window.dispatchEvent(new CustomEvent('pageTransitionComplete', {
            detail: { url: window.location.pathname }
          }));
        }).catch(() => {
          // Even if some scripts fail, dispatch the event
          console.warn('[DEBUG] page-transitions: Some scripts failed, but dispatching event anyway');
          window.dispatchEvent(new CustomEvent('pageTransitionComplete', {
            detail: { url: window.location.pathname }
          }));
        });
      } else {
        console.warn('[DEBUG] page-transitions: No newDoc provided, cannot execute scripts');
        // Dispatch event anyway after a delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('pageTransitionComplete', {
            detail: { url: window.location.pathname }
          }));
        }, 100);
      }
    } else {
      // Full page replacement
      document.body.innerHTML = newElement.innerHTML;
      // Re-initialize scripts
      this.reinitializeScripts();
      // Dispatch event after a delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pageTransitionComplete', {
          detail: { url: window.location.pathname }
        }));
      }, 100);
    }
  }
  
  loadStylesheets(newDoc) {
    // Find all stylesheet links in the new document
    const stylesheets = newDoc.querySelectorAll('link[rel="stylesheet"]');
    
    console.log('[DEBUG] page-transitions: loadStylesheets called', {
      stylesheetCount: stylesheets.length,
      stylesheetHrefs: Array.from(stylesheets).map(s => s.href)
    });
    
    stylesheets.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Check if stylesheet is already loaded
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) {
        console.log('[DEBUG] page-transitions: Stylesheet already loaded', href);
        return;
      }
      
      // Create new link element
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = href;
      
      newLink.onload = () => {
        console.log('[DEBUG] page-transitions: Stylesheet loaded', href);
      };
      
      newLink.onerror = (err) => {
        console.error('[DEBUG] page-transitions: Stylesheet failed to load', href, err);
      };
      
      // Append to head
      document.head.appendChild(newLink);
      console.log('[DEBUG] page-transitions: Loading stylesheet', href);
    });
  }
  
  executeScripts(newDoc) {
    // Find all script tags in the new document (from body, not just main)
    const scripts = newDoc.querySelectorAll('body script, script');
    
    console.log('[DEBUG] page-transitions: executeScripts called', {
      scriptCount: scripts.length,
      scriptSources: Array.from(scripts).map(s => s.src || 'inline')
    });
    
    const scriptPromises = [];
    
    scripts.forEach((oldScript) => {
      // Skip if it's the page-transitions script itself (would cause infinite loop)
      if (oldScript.src && oldScript.src.includes('page-transitions.js')) {
        console.log('[DEBUG] page-transitions: Skipping page-transitions.js');
        return;
      }
      
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy content if inline script
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
        // Inline scripts execute immediately, no need to wait
        document.body.appendChild(newScript);
        console.log('[DEBUG] page-transitions: Inline script executed', {
          contentLength: oldScript.textContent.length
        });
        return;
      }
      
      // Handle src attribute (external scripts)
      if (oldScript.src) {
        // Force reload by adding a cache-busting parameter or removing defer
        const srcUrl = new URL(oldScript.src, window.location.href);
        // Remove defer attribute to force immediate execution
        newScript.removeAttribute('defer');
        newScript.src = srcUrl.href;
        
        console.log('[DEBUG] page-transitions: Loading script', {
          src: newScript.src,
          hasDefer: oldScript.hasAttribute('defer')
        });
        
        // Create a promise that resolves when the script loads
        const scriptPromise = new Promise((resolve, reject) => {
          newScript.onload = () => {
            console.log('[DEBUG] page-transitions: Script loaded', newScript.src);
            resolve(newScript.src);
          };
          newScript.onerror = (err) => {
            console.error('[DEBUG] page-transitions: Script failed to load', newScript.src, err);
            reject(err);
          };
        });
        
        scriptPromises.push(scriptPromise);
        
        // Remove existing script with same src to force re-execution
        const existingScript = document.querySelector(`script[src="${oldScript.src}"]`);
        if (existingScript) {
          console.log('[DEBUG] page-transitions: Removing existing script', oldScript.src);
          existingScript.remove();
        }
        
        // Append to body to execute
        document.body.appendChild(newScript);
        console.log('[DEBUG] page-transitions: Script appended to body', {
          src: newScript.src,
          isInline: false
        });
      }
    });
    
    // Return promise that resolves when all scripts are loaded
    return Promise.all(scriptPromises).catch(err => {
      console.error('[DEBUG] page-transitions: Some scripts failed to load', err);
    });
  }

  fadeTransition(currentElement, newElement, url, newDoc) {
    const body = document.body;
    body.style.opacity = '0';
    body.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
      this.updateContent(currentElement, newElement, newDoc);
      window.history.pushState({}, '', url);
      
      setTimeout(() => {
        body.style.opacity = '1';
      }, 50);
    }, 300);
  }

  reinitializeScripts() {
    // Re-run initialization functions
    if (typeof window.initMagneticButtons === 'function') {
      window.initMagneticButtons();
    }
    if (typeof window.initTableOfContents === 'function') {
      window.initTableOfContents();
    }
    if (typeof window.initShareButton === 'function') {
      // Share button will be re-initialized by post.js
    }
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('pageTransitionComplete'));
  }

  showLoading() {
    // Create or show loading indicator
    let loader = document.getElementById('page-transition-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'page-transition-loader';
      loader.className = 'page-transition-loader';
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
  }

  hideLoading() {
    const loader = document.getElementById('page-transition-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PageTransitions();
  });
} else {
  new PageTransitions();
}

