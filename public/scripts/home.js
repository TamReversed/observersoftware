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

        // Re-initialize magnetic buttons for new content
        if (typeof window.initMagneticButtons === 'function') {
            window.initMagneticButtons();
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

        // Render screenshots carousel
        if (modalScreenshots) {
            const carousel = document.getElementById('modalScreenshotsCarousel');
            const indicators = document.getElementById('modalScreenshotsIndicators');
            const prevBtn = document.getElementById('modalScreenshotsPrev');
            const nextBtn = document.getElementById('modalScreenshotsNext');
            
            if (data.screenshots && data.screenshots.length > 0) {
                // Clear previous content
                if (carousel) carousel.innerHTML = '';
                if (indicators) indicators.innerHTML = '';
                
                // Create carousel items - wrap each image in a container
                data.screenshots.forEach((src, index) => {
                    const item = document.createElement('div');
                    item.className = 'product-modal__screenshot-item';
                    item.style.minWidth = '100%';
                    item.style.width = '100%';
                    item.style.flexShrink = '0';
                    
                    const img = document.createElement('img');
                    // Normalize src path
                    let imageSrc = src;
                    if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://') && !imageSrc.startsWith('/')) {
                        imageSrc = '/' + imageSrc;
                    }
                    img.src = imageSrc;
                    img.alt = `${data.title} screenshot ${index + 1}`;
                    img.className = 'product-modal__screenshot';
                    img.loading = 'lazy';
                    
                    // Handle image load errors
                    img.onerror = function() {
                        console.error('Failed to load screenshot:', src, 'Attempted URL:', this.src);
                        // Show error overlay
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'screenshot-error';
                        errorMsg.textContent = `Image failed to load`;
                        errorMsg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 1rem; text-align: center; color: var(--color-text-secondary); background: rgba(0,0,0,0.7); border-radius: 4px; font-size: 0.875rem; z-index: 10; white-space: nowrap;';
                        this.parentElement.style.position = 'relative';
                        // Remove any existing error message
                        const existingError = this.parentElement.querySelector('.screenshot-error');
                        if (existingError) existingError.remove();
                        this.parentElement.appendChild(errorMsg);
                    };
                    
                    item.appendChild(img);
                    if (carousel) carousel.appendChild(item);
                    
                    // Create indicator
                    if (indicators) {
                        const indicator = document.createElement('button');
                        indicator.className = 'product-modal__screenshots-indicator';
                        indicator.setAttribute('aria-label', `Go to screenshot ${index + 1}`);
                        indicator.setAttribute('data-index', index);
                        if (index === 0) indicator.classList.add('active');
                        indicators.appendChild(indicator);
                    }
                });
                
                modalScreenshots.style.display = 'block';
                
                // Initialize carousel state
                let currentIndex = 0;
                
                // Navigation function
                const goToScreenshot = (index) => {
                    if (!carousel || index < 0 || index >= data.screenshots.length) return;
                    
                    currentIndex = index;
                    carousel.style.transform = `translateX(-${index * 100}%)`;
                    
                    // Update indicators
                    if (indicators) {
                        indicators.querySelectorAll('.product-modal__screenshots-indicator').forEach((ind, i) => {
                            ind.classList.toggle('active', i === index);
                        });
                    }
                    
                    // Update nav buttons (allow wrapping)
                    if (prevBtn) prevBtn.disabled = false;
                    if (nextBtn) nextBtn.disabled = false;
                };
                
                // Initialize to first screenshot
                goToScreenshot(0);
                
                // Attach indicator click handlers
                if (indicators) {
                    indicators.querySelectorAll('.product-modal__screenshots-indicator').forEach((indicator, index) => {
                        indicator.addEventListener('click', () => goToScreenshot(index));
                    });
                }
                
                // Attach navigation handlers (with wrapping)
                if (prevBtn) {
                    prevBtn.onclick = () => {
                        const newIndex = currentIndex > 0 ? currentIndex - 1 : data.screenshots.length - 1;
                        goToScreenshot(newIndex);
                    };
                }
                
                if (nextBtn) {
                    nextBtn.onclick = () => {
                        const newIndex = currentIndex < data.screenshots.length - 1 ? currentIndex + 1 : 0;
                        goToScreenshot(newIndex);
                    };
                }
                
                // Keyboard navigation (with wrapping)
                const handleKeyNav = (e) => {
                    if (modal?.getAttribute('aria-hidden') === 'false') {
                        if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const newIndex = currentIndex > 0 ? currentIndex - 1 : data.screenshots.length - 1;
                            goToScreenshot(newIndex);
                        } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            const newIndex = currentIndex < data.screenshots.length - 1 ? currentIndex + 1 : 0;
                            goToScreenshot(newIndex);
                        }
                    }
                };
                
                document.addEventListener('keydown', handleKeyNav);
                
                // Store cleanup function
                modal._screenshotCleanup = () => {
                    document.removeEventListener('keydown', handleKeyNav);
                };
                
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

        // Cleanup screenshot carousel listeners
        if (modal._screenshotCleanup) {
            modal._screenshotCleanup();
            delete modal._screenshotCleanup;
        }

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
        const workGrid = document.getElementById('workGrid');
        const capabilitiesGrid = document.getElementById('capabilitiesGrid');

        // Show skeletons for work
        if (workGrid && window.SkeletonUtils) {
            workGrid.innerHTML = window.SkeletonUtils.createSkeletonGrid('work', 4);
        }

        // Load work items (limited to 4 on main page)
        try {
            const workRes = await fetch('/api/work');
            if (workRes.ok) {
                const work = await workRes.json();
                if (work.length > 0) {
                    // Limit to first 4 items on main page
                    const limitedWork = work.slice(0, 4);
                    // Remove skeletons
                    if (workGrid && window.SkeletonUtils) {
                        window.SkeletonUtils.removeSkeletons(workGrid);
                    }
                    renderWork(limitedWork);
                } else {
                    if (workGrid && window.SkeletonUtils) {
                        window.SkeletonUtils.removeSkeletons(workGrid);
                    }
                    renderWork(fallbackWork.slice(0, 4));
                }
            } else {
                if (workGrid && window.SkeletonUtils) {
                    window.SkeletonUtils.removeSkeletons(workGrid);
                }
                renderWork(fallbackWork.slice(0, 4));
            }
        } catch (e) {
            if (workGrid && window.SkeletonUtils) {
                window.SkeletonUtils.removeSkeletons(workGrid);
            }
            renderWork(fallbackWork.slice(0, 4));
        }

        // Show skeletons for capabilities
        if (capabilitiesGrid && window.SkeletonUtils) {
            capabilitiesGrid.innerHTML = window.SkeletonUtils.createSkeletonGrid('work', 4);
        }

        // Load capabilities (limited to 4 on main page)
        try {
            const capRes = await fetch('/api/capabilities');
            if (capRes.ok) {
                const capabilities = await capRes.json();
                if (capabilities.length > 0) {
                    // Limit to first 4 items on main page
                    const limitedCapabilities = capabilities.slice(0, 4);
                    // Remove skeletons
                    if (capabilitiesGrid && window.SkeletonUtils) {
                        window.SkeletonUtils.removeSkeletons(capabilitiesGrid);
                    }
                    renderCapabilities(limitedCapabilities);
                } else {
                    if (capabilitiesGrid && window.SkeletonUtils) {
                        window.SkeletonUtils.removeSkeletons(capabilitiesGrid);
                    }
                    renderCapabilities(fallbackCapabilities.slice(0, 4));
                }
            } else {
                if (capabilitiesGrid && window.SkeletonUtils) {
                    window.SkeletonUtils.removeSkeletons(capabilitiesGrid);
                }
                renderCapabilities(fallbackCapabilities.slice(0, 4));
            }
        } catch (e) {
            if (capabilitiesGrid && window.SkeletonUtils) {
                window.SkeletonUtils.removeSkeletons(capabilitiesGrid);
            }
            renderCapabilities(fallbackCapabilities.slice(0, 4));
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadContent);
    } else {
        loadContent();
    }
})();
