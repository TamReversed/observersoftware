// Dynamic content loading for Work and Capabilities
(function() {
    // Fallback data in case API is unavailable
    const fallbackWork = [
        {
            industry: 'Healthcare',
            problem: 'Staff coordinated schedules outside the system to avoid conflicts',
            solution: 'Observer watched the handoffs, removed duplicate entry, and made constraints explicit. Coordination dropped from about 40 minutes a day to under 5.',
            tags: ['Scheduling', 'Fewer handoffs']
        },
        {
            industry: 'Logistics',
            problem: 'Managers chased updates across reports, radios, and the floor',
            solution: 'Observer removed the "where is the truth" loop by putting current state and exceptions on one live surface. Fewer checks, faster decisions.',
            tags: ['Visibility', 'Exceptions']
        },
        {
            industry: 'Professional Services',
            problem: 'Intake relied on retyping the same details in multiple places',
            solution: 'Observer removed repeated questions and collapsed handoffs into one guided flow. Onboarding time dropped by roughly 60%.',
            tags: ['Intake', 'One flow']
        },
        {
            industry: 'Education',
            problem: 'Compliance tracking lived in spreadsheets and last-minute reminders',
            solution: 'Observer replaced scattered lists with a single record of truth and clear status. Admin time shifted from chasing updates to handling exceptions.',
            tags: ['Compliance', 'Clear status']
        }
    ];

    const fallbackCapabilities = [
        {
            id: 'datadragon',
            title: 'DataDragon',
            description: 'Transform raw data into clear, actionable insights. Built for teams that need answers, not dashboards.',
            icon: { type: 'preset', preset: 'database' }
        },
        {
            id: 'tableflow',
            title: 'TableFlow',
            description: 'Streamline data entry and workflow automation. Reduce manual steps, increase clarity.',
            icon: { type: 'preset', preset: 'table' }
        }
    ];

    // Store capabilities data for modal use
    let capabilitiesData = [];

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Render work items
    function renderWork(items) {
        const grid = document.getElementById('workGrid');
        if (!grid) return;

        grid.innerHTML = '';
        items.forEach(item => {
            const article = document.createElement('article');
            article.className = 'project-card reveal';

            const industry = document.createElement('p');
            industry.className = 'project-card__industry';
            industry.textContent = item.industry || '';

            const problem = document.createElement('h3');
            problem.className = 'project-card__problem';
            problem.textContent = item.problem || '';

            const solution = document.createElement('p');
            solution.className = 'project-card__solution';
            solution.textContent = item.solution || '';

            article.appendChild(industry);
            article.appendChild(problem);
            article.appendChild(solution);

            if (item.tags && item.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'project-card__tags';
                item.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'project-card__tag';
                    span.textContent = tag;
                    tagsDiv.appendChild(span);
                });
                article.appendChild(tagsDiv);
            }

            grid.appendChild(article);
        });

        // Re-trigger reveal animations
        if (typeof initRevealObserver === 'function') {
            initRevealObserver();
        }
    }

    // Render capabilities
    function renderCapabilities(items) {
        const grid = document.getElementById('capabilitiesGrid');
        if (!grid) return;

        // Store for modal use
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

    // Modal elements
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
            if (data.features && data.features.length > 0) {
                modalFeaturesList.innerHTML = '';
                data.features.forEach(feature => {
                    const li = document.createElement('li');
                    li.textContent = feature;
                    modalFeaturesList.appendChild(li);
                });
                modalFeatures.style.display = 'block';
            } else {
                modalFeatures.style.display = 'none';
            }
        }

        // Render screenshots
        if (modalScreenshots) {
            if (data.screenshots && data.screenshots.length > 0) {
                modalScreenshots.innerHTML = '';
                data.screenshots.forEach(src => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = `${data.title} screenshot`;
                    img.className = 'product-modal__screenshot';
                    img.loading = 'lazy';
                    modalScreenshots.appendChild(img);
                });
                modalScreenshots.style.display = 'grid';
            } else {
                modalScreenshots.style.display = 'none';
            }
        }

        // Render external link
        if (modalFooter && modalCta) {
            if (data.externalUrl) {
                modalCta.href = data.externalUrl;
                modalFooter.classList.remove('product-modal__footer--hidden');
            } else {
                modalFooter.classList.add('product-modal__footer--hidden');
            }
        }
    }

    // Close product modal
    function closeProductModal() {
        if (!modal) return;

        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

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

    // Fetch and render content
    async function loadContent() {
        // Load work items
        try {
            const workRes = await fetch('/api/work');
            if (workRes.ok) {
                const work = await workRes.json();
                if (work.length > 0) {
                    renderWork(work);
                } else {
                    renderWork(fallbackWork);
                }
            } else {
                renderWork(fallbackWork);
            }
        } catch (e) {
            renderWork(fallbackWork);
        }

        // Load capabilities
        try {
            const capRes = await fetch('/api/capabilities');
            if (capRes.ok) {
                const capabilities = await capRes.json();
                if (capabilities.length > 0) {
                    renderCapabilities(capabilities);
                } else {
                    renderCapabilities(fallbackCapabilities);
                }
            } else {
                renderCapabilities(fallbackCapabilities);
            }
        } catch (e) {
            renderCapabilities(fallbackCapabilities);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadContent);
    } else {
        loadContent();
    }
})();
