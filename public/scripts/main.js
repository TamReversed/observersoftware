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

if (prefersReducedMotion) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
} else {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const idx = Number(entry.target.getAttribute("data-reveal-index") || "0");
        const delay = idx * 100;

        window.setTimeout(() => {
          entry.target.classList.add("visible");
        }, delay);

        observer.unobserve(entry.target);
      }
    }
  }, observerOptions);

  document.querySelectorAll(".reveal").forEach((el, index) => {
    el.setAttribute("data-reveal-index", String(index));
    observer.observe(el);
  });
}

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

