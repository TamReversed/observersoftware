// Runs before first paint: turns on the scroll-film layout only when the visitor allows motion
if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) document.documentElement.classList.add('film-live');
