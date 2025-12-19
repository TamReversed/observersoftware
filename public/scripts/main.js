// Navigation scroll effect
const nav = document.getElementById("nav");

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    nav?.classList.add("scrolled");
  } else {
    nav?.classList.remove("scrolled");
  }
});

// Scroll reveal
const prefersReducedMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let revealObserver = null;

function initRevealObserver() {
  if (prefersReducedMotion) {
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => el.classList.add("visible"));
    return;
  }

  if (!revealObserver) {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-reveal-index") || "0");
          const delay = Math.min(idx * 100, 500); // Cap delay at 500ms

          window.setTimeout(() => {
            entry.target.classList.add("visible");
          }, delay);

          revealObserver.unobserve(entry.target);
        }
      }
    }, observerOptions);
  }

  // Find new reveal elements that haven't been observed yet
  document.querySelectorAll(".reveal:not(.visible):not([data-reveal-observed])").forEach((el, index) => {
    el.setAttribute("data-reveal-index", String(index));
    el.setAttribute("data-reveal-observed", "true");
    revealObserver.observe(el);
  });
}

// Expose globally for dynamic content
window.initRevealObserver = initRevealObserver;

// Initial call
initRevealObserver();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (!href) return;

    // Avoid invalid selector for plain "#"
    if (href === "#") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

