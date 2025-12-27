// Work listing page - displays all published work items
(function() {
    // Fallback data in case API is unavailable
    const fallbackWork = [
        {
            industry: 'Enterprise Technology',
            problem: 'Complex platform implementations required coordination across multiple teams, tools, and timelines',
            solution: 'Observer designed unified architecture patterns that reduced handoffs between teams by 70%. Clear interfaces and shared standards eliminated the coordination overhead that slowed delivery.',
            tags: ['Architecture', 'Coordination']
        },
        {
            industry: 'Platform Operations',
            problem: 'Large-scale platform rollouts suffered from unclear priorities and competing stakeholder needs',
            solution: 'Observer established program governance that made priorities explicit and visible. Teams stopped guessing what to build next, and delivery velocity increased by 40% while reducing rework.',
            tags: ['Program Management', 'Priorities']
        },
        {
            industry: 'Product Strategy',
            problem: 'Platform features were built based on assumptions rather than actual user workflows',
            solution: 'Observer introduced product management practices that connected feature decisions to real usage patterns. The team shifted from building what seemed right to building what users actually needed, reducing unused features by 60%.',
            tags: ['Product Management', 'User Needs']
        },
        {
            industry: 'Client Delivery',
            problem: 'Agile projects struggled with unclear requirements and shifting priorities mid-sprint',
            solution: 'Observer implemented structured engagement practices that made requirements explicit before work began. Teams stopped mid-sprint pivots, and delivery predictability improved from 60% to 90% on-time completion.',
            tags: ['Agile Delivery', 'Requirements']
        }
    ];

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
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

        // Re-initialize magnetic buttons for new content
        if (typeof window.initMagneticButtons === 'function') {
            window.initMagneticButtons();
        }
    }

    // Load work items
    async function loadWork() {
        const grid = document.getElementById('workGrid');
        if (!grid) return;

        // Show skeletons while loading
        if (window.SkeletonUtils) {
            grid.innerHTML = window.SkeletonUtils.createSkeletonGrid('work', 6);
        } else {
            grid.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading work...</div>';
        }

        try {
            const response = await fetch('/api/work');
            if (response.ok) {
                const work = await response.json();
                
                // Remove skeletons
                if (window.SkeletonUtils) {
                    window.SkeletonUtils.removeSkeletons(grid);
                }
                
                renderWork(work);
            } else {
                throw new Error('Failed to load work');
            }
        } catch (error) {
            console.error('Error loading work:', error);
            // Remove skeletons on error
            if (window.SkeletonUtils) {
                window.SkeletonUtils.removeSkeletons(grid);
            }
            renderWork(fallbackWork);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadWork);
    } else {
        loadWork();
    }
})();

