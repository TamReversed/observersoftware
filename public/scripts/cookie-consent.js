// Cookie Consent Banner
// Shows a non-intrusive banner on first visit to inform users about essential cookies

(function() {
  const CONSENT_KEY = 'observer_cookie_consent';
  const CONSENT_VERSION = '1'; // Increment if policy changes significantly

  function hasConsent() {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) return false;
      const data = JSON.parse(consent);
      return data.version === CONSENT_VERSION;
    } catch {
      return false;
    }
  }

  function setConsent() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        timestamp: Date.now()
      }));
    } catch {
      // localStorage not available, consent will be asked again
    }
  }

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'cookie-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cookie-consent__content">
        <div class="cookie-consent__text">
          <p>We use <strong>essential cookies only</strong> to keep you logged in and protect against security threats. No tracking or analytics.</p>
          <a href="/terms#cookies" class="cookie-consent__link">Learn more</a>
        </div>
        <button class="cookie-consent__accept" id="acceptCookies">Got it</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .cookie-consent {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(14, 16, 23, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid rgba(124, 155, 221, 0.2);
        padding: 1rem 1.5rem;
        z-index: 10000;
        transform: translateY(100%);
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      }
      .cookie-consent.visible {
        transform: translateY(0);
        opacity: 1;
      }
      .cookie-consent__content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        flex-wrap: wrap;
      }
      .cookie-consent__text {
        flex: 1;
        min-width: 280px;
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .cookie-consent__text p {
        margin: 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .cookie-consent__text strong {
        color: #fff;
      }
      .cookie-consent__link {
        color: rgba(124, 155, 221, 0.9);
        font-size: 0.85rem;
        text-decoration: none;
        white-space: nowrap;
      }
      .cookie-consent__link:hover {
        color: #a3b8e8;
        text-decoration: underline;
      }
      .cookie-consent__accept {
        background: linear-gradient(135deg, #7c9bdd 0%, #a3b8e8 100%);
        color: #0e1017;
        border: none;
        padding: 0.65rem 1.5rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        white-space: nowrap;
      }
      .cookie-consent__accept:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(124, 155, 221, 0.3);
      }
      .cookie-consent__accept:active {
        transform: translateY(0);
      }
      @media (max-width: 600px) {
        .cookie-consent {
          padding: 1rem;
        }
        .cookie-consent__content {
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
        }
        .cookie-consent__text {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .cookie-consent__accept {
          width: 100%;
          padding: 0.75rem;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Show with animation after a brief delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add('visible');
      });
    });

    // Handle accept button
    document.getElementById('acceptCookies').addEventListener('click', () => {
      setConsent();
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 400);
    });
  }

  // Initialize when DOM is ready
  function init() {
    if (!hasConsent()) {
      // Small delay to let the page render first
      setTimeout(createBanner, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
