// Products listing page - displays all published products with modal functionality
(function() {
    // Import modal functionality from home.js pattern
    const modal = document.getElementById('productModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalClose = document.getElementById('modalClose');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalFeatures = document.getElementById('modalFeatures');
    const modalFeaturesList = document.getElementById('modalFeaturesList');
    const modalScreenshots = document.getElementById('modalScreenshots');
    const modalFooter = document.getElementById('modalFooter');
    const modalCta = document.getElementById('modalCta');

    let lastFocusedElement = null;
    let currentProductIcon = null;
    let capabilitiesData = [];

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Render capabilities
    function renderCapabilities(items) {
        const grid = document.getElementById('capabilitiesGrid');
        if (!grid) return;

        capabilitiesData = items;
        grid.innerHTML = '';
        
        items.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'capability capability--clickable reveal';
            div.setAttribute('data-capability-id', item.id);
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');
            div.setAttribute('aria-label', `View details for ${item.title}`);

            // Create icon container
            const iconContainer = document.createElement('div');
            iconContainer.className = 'capability__icon-wrapper';
            
            // Use IconLibrary to render the icon
            if (typeof IconLibrary !== 'undefined') {
                iconContainer.innerHTML = IconLibrary.renderIcon(item.icon, 'capability__icon');
            } else {
                // Fallback if IconLibrary not loaded
                iconContainer.innerHTML = `<svg class="capability__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>`;
            }
            div.appendChild(iconContainer);

            const title = document.createElement('h3');
            title.className = 'capability__title';
            title.textContent = item.title || '';

            const desc = document.createElement('p');
            desc.className = 'capability__desc';
            desc.textContent = item.description || '';

            div.appendChild(title);
            div.appendChild(desc);

            // Add click handler
            div.addEventListener('click', () => openProductModal(item.id));
            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openProductModal(item.id);
                }
            });

            grid.appendChild(div);
        });

        // Initialize Lottie animations if any
        if (typeof IconLibrary !== 'undefined') {
            IconLibrary.initLottieIcons();
        }

        // Re-trigger reveal animations
        if (typeof initRevealObserver === 'function') {
            initRevealObserver();
        }
    }

    // Open product modal
    async function openProductModal(id) {
        if (!modal) return;

        lastFocusedElement = document.activeElement;

        // Find the product in cached data for initial icon
        const cachedProduct = capabilitiesData.find(c => c.id === id);
        currentProductIcon = cachedProduct?.icon || null;

        // Show modal with loading state
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Set initial icon from cached data
        if (modalIcon && currentProductIcon) {
            modalIcon.innerHTML = typeof IconLibrary !== 'undefined' 
                ? IconLibrary.renderIcon(currentProductIcon, 'modal-icon')
                : '';
            
            // Initialize Lottie for modal icon
            if (typeof IconLibrary !== 'undefined') {
                IconLibrary.initLottieIcons();
            }
        }

        try {
            // Fetch full capability data
            const res = await fetch(`/api/capabilities/${id}`);
            if (!res.ok) throw new Error('Failed to load product');
            
            const data = await res.json();
            renderModalContent(data);
        } catch (error) {
            console.error('Failed to load product:', error);
            // Use cached data as fallback
            if (cachedProduct) {
                renderModalContent(cachedProduct);
            }
        }

        // Focus trap
        setTimeout(() => {
            modalClose?.focus();
        }, 100);
    }

    // Render modal content
    function renderModalContent(data) {
        // Update icon if data has icon config
        if (modalIcon && data.icon) {
            currentProductIcon = data.icon;
            modalIcon.innerHTML = typeof IconLibrary !== 'undefined' 
                ? IconLibrary.renderIcon(data.icon, 'modal-icon')
                : '';
            
            // Initialize Lottie for modal icon
            if (typeof IconLibrary !== 'undefined') {
                IconLibrary.initLottieIcons();
            }
        }

        if (modalTitle) {
            modalTitle.textContent = data.title || '';
        }

        if (modalSubtitle) {
            modalSubtitle.textContent = data.description || '';
        }

        // Render HTML content (from markdown)
        if (modalDescription) {
            if (data.htmlContent) {
                modalDescription.innerHTML = data.htmlContent;
            } else if (data.longDescription) {
                modalDescription.textContent = data.longDescription;
            } else {
                modalDescription.innerHTML = '';
            }
        }

        // Render features
        if (modalFeatures && modalFeaturesList) {
            if (data.features && Array.isArray(data.features) && data.features.length > 0) {
                modalFeatures.style.display = 'block';
                modalFeaturesList.innerHTML = '';
                data.features.forEach(feature => {
                    const li = document.createElement('li');
                    li.textContent = feature;
                    modalFeaturesList.appendChild(li);
                });
            } else {
                modalFeatures.style.display = 'none';
            }
        }

        // Render screenshots carousel
        if (modalScreenshots) {
            if (data.screenshots && Array.isArray(data.screenshots) && data.screenshots.length > 0) {
                modalScreenshots.style.display = 'block';
                initCarousel(data.screenshots);
            } else {
                modalScreenshots.style.display = 'none';
                cleanupCarousel();
            }
        }

        // Render external link
        if (modalFooter && modalCta) {
            if (data.externalUrl) {
                modalFooter.style.display = 'flex';
                modalCta.href = data.externalUrl;
                modalCta.style.display = 'inline-flex';
            } else {
                modalFooter.style.display = 'none';
            }
        }
    }

    // Carousel functionality
    let currentScreenshotIndex = 0;
    let screenshotCarousel = null;
    let screenshotIndicators = null;
    let screenshotPrev = null;
    let screenshotNext = null;

    function initCarousel(screenshots) {
        cleanupCarousel();

        screenshotCarousel = document.getElementById('modalScreenshotsCarousel');
        screenshotIndicators = document.getElementById('modalScreenshotsIndicators');
        screenshotPrev = document.getElementById('modalScreenshotsPrev');
        screenshotNext = document.getElementById('modalScreenshotsNext');

        if (!screenshotCarousel) return;

        currentScreenshotIndex = 0;
        screenshotCarousel.innerHTML = '';

        screenshots.forEach((screenshot, index) => {
            const item = document.createElement('div');
            item.className = 'carousel-item';
            if (index === 0) item.classList.add('active');
            item.setAttribute('data-index', index);

            const img = document.createElement('img');
            img.src = screenshot;
            img.alt = `Screenshot ${index + 1}`;
            img.loading = 'lazy';

            item.appendChild(img);
            screenshotCarousel.appendChild(item);
        });

        // Create indicators
        if (screenshotIndicators) {
            screenshotIndicators.innerHTML = '';
            screenshots.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.className = 'carousel-indicator';
                if (index === 0) indicator.classList.add('active');
                indicator.setAttribute('aria-label', `Go to screenshot ${index + 1}`);
                indicator.addEventListener('click', () => goToScreenshot(index));
                screenshotIndicators.appendChild(indicator);
            });
        }

        // Navigation handlers
        if (screenshotPrev) {
            screenshotPrev.onclick = () => {
                const newIndex = currentScreenshotIndex > 0 
                    ? currentScreenshotIndex - 1 
                    : screenshots.length - 1;
                goToScreenshot(newIndex);
            };
        }

        if (screenshotNext) {
            screenshotNext.onclick = () => {
                const newIndex = currentScreenshotIndex < screenshots.length - 1 
                    ? currentScreenshotIndex + 1 
                    : 0;
                goToScreenshot(newIndex);
            };
        }

        updateCarousel();
    }

    function goToScreenshot(index) {
        const items = screenshotCarousel?.querySelectorAll('.carousel-item');
        const indicators = screenshotIndicators?.querySelectorAll('.carousel-indicator');
        
        if (!items || items.length === 0) return;

        currentScreenshotIndex = index;
        updateCarousel();
    }

    function updateCarousel() {
        const items = screenshotCarousel?.querySelectorAll('.carousel-item');
        const indicators = screenshotIndicators?.querySelectorAll('.carousel-indicator');
        
        if (!items) return;

        items.forEach((item, index) => {
            if (index === currentScreenshotIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (indicators) {
            indicators.forEach((indicator, index) => {
                if (index === currentScreenshotIndex) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
        }
    }

    function cleanupCarousel() {
        currentScreenshotIndex = 0;
        if (screenshotCarousel) screenshotCarousel.innerHTML = '';
        if (screenshotIndicators) screenshotIndicators.innerHTML = '';
        if (screenshotPrev) screenshotPrev.onclick = null;
        if (screenshotNext) screenshotNext.onclick = null;
    }

    // Close modal
    function closeProductModal() {
        if (!modal) return;

        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Cleanup screenshot carousel listeners
        cleanupCarousel();

        // Restore focus
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }

    // Modal event listeners
    if (modalClose) {
        modalClose.addEventListener('click', closeProductModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeProductModal);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') {
            closeProductModal();
        }
    });

    // Load capabilities
    async function loadCapabilities() {
        try {
            const response = await fetch('/api/capabilities');
            if (response.ok) {
                const capabilities = await response.json();
                renderCapabilities(capabilities);
            } else {
                throw new Error('Failed to load capabilities');
            }
        } catch (error) {
            console.error('Error loading capabilities:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCapabilities);
    } else {
        loadCapabilities();
    }
})();

