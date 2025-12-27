// Blog page functionality

// Helper to check if we're in development mode
const isDevelopment = () => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};

// Helper for debug logging (only in development)
const debugLog = (location, message, data) => {
    if (!isDevelopment()) return;
    try {
        fetch('http://127.0.0.1:7242/ingest/29c99047-e168-4827-8051-3605d09418af', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location,
                message,
                data,
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'A'
            })
        }).catch(() => {});
    } catch (e) {
        // Silently fail in production
    }
};

// #region agent log
(function() {
    if (isDevelopment()) {
        console.log('[DEBUG] blog.js file loaded', new Date().getTime());
        console.trace('[DEBUG] blog.js call stack');
    }
})();
// #endregion

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// State
let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let categories = [];
let debounceTimer = null;

// Elements - query at module load (may be null if DOM not ready)
let postsGrid = document.getElementById('postsGrid');
let categoriesContainer = document.getElementById('categoriesContainer');
let searchInput = document.getElementById('searchInput');
let pagination = document.getElementById('pagination');
let nav = document.getElementById('nav') || document.querySelector('.nav');

// #region agent log
console.log('[DEBUG] blog.js starting', {
    readyState: document.readyState,
    hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined',
    hasPostsGrid: !!postsGrid,
    hasCategoriesContainer: !!categoriesContainer,
    hasSearchInput: !!searchInput,
    hasPagination: !!pagination,
    hasNav: !!nav,
    url: window.location.pathname
});
// #endregion

// Show initial loading state immediately
function showInitialLoading() {
    // #region agent log
    console.log('[DEBUG] showInitialLoading called', {
        hasPostsGrid: !!postsGrid,
        hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined',
        readyState: document.readyState,
        postsGridId: postsGrid?.id,
        postsGridHTML: postsGrid?.innerHTML?.substring(0, 100)
    });
    // #endregion
    
    if (!postsGrid) {
        console.error('[DEBUG] showInitialLoading: postsGrid is null! Re-querying...');
        postsGrid = document.getElementById('postsGrid');
        if (!postsGrid) {
            console.error('[DEBUG] showInitialLoading: postsGrid still null after re-query!', {
                allElements: Array.from(document.querySelectorAll('[id]')).map(el => el.id),
                bodyHTML: document.body.innerHTML.substring(0, 200)
            });
            return;
        }
        console.log('[DEBUG] showInitialLoading: postsGrid found after re-query');
    }
    
    // Clear any existing content first
    postsGrid.innerHTML = '';
    
    // Show skeletons immediately - don't wait
    if (window.SkeletonUtils) {
        // #region agent log
        if (isDevelopment()) {
            console.log('[DEBUG] SkeletonUtils available - creating grid');
            debugLog('blog.js:46', 'SkeletonUtils available - creating grid', {
                hasCreateGrid: typeof window.SkeletonUtils.createSkeletonGrid === 'function'
            });
        }
        // #endregion
        try {
            const skeletonHTML = window.SkeletonUtils.createSkeletonGrid('blog', 6);
            postsGrid.innerHTML = skeletonHTML;
            // #region agent log
            if (isDevelopment()) {
                console.log('[DEBUG] Skeleton grid created and inserted', {htmlLength: skeletonHTML.length, hasSkeletonGrid: postsGrid.querySelector('.skeleton-grid') !== null});
                debugLog('blog.js:50', 'Skeleton grid created and inserted', {
                    htmlLength: skeletonHTML.length,
                    hasSkeletonGrid: postsGrid.querySelector('.skeleton-grid') !== null
                });
            }
            // #endregion
        } catch (e) {
            // #region agent log
            if (isDevelopment()) {
                console.error('[DEBUG] Error creating skeleton grid', e);
                debugLog('blog.js:53', 'Error creating skeleton grid', {
                    error: e.message,
                    stack: e.stack
                });
            }
            // #endregion
            console.error('Error creating skeleton grid:', e);
            postsGrid.innerHTML = '<div class="blog-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-tertiary);">Loading posts...</div>';
        }
    } else {
        // #region agent log
        if (isDevelopment()) {
            console.log('[DEBUG] SkeletonUtils NOT available - using fallback');
            debugLog('blog.js:58', 'SkeletonUtils NOT available', {});
        }
        // #endregion
        // Fallback - show simple loading text
        postsGrid.innerHTML = '<div class="blog-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-tertiary);">Loading posts...</div>';
    }
}

// Load categories
async function loadCategories() {
    // #region agent log
    console.log('[DEBUG] loadCategories called', {hasCategoriesContainer: !!categoriesContainer});
    // #endregion
    
    try {
        const res = await fetch('/api/categories');
        // #region agent log
        console.log('[DEBUG] loadCategories fetch response', {status: res.status, ok: res.ok});
        // #endregion
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        categories = await res.json();
        // #region agent log
        console.log('[DEBUG] loadCategories data received', {categoryCount: categories?.length || 0, categories: categories});
        // #endregion
        
        renderCategories();
    } catch (error) {
        console.error('[DEBUG] Failed to load categories:', error);
    }
}

// Render categories
function renderCategories() {
    // #region agent log
    console.log('[DEBUG] renderCategories called', {
        hasCategoriesContainer: !!categoriesContainer,
        categoryCount: categories?.length || 0
    });
    // #endregion
    
    if (!categoriesContainer) {
        console.warn('[DEBUG] renderCategories: categoriesContainer is null! Re-querying...');
        categoriesContainer = document.getElementById('categoriesContainer');
        if (!categoriesContainer) {
            console.error('[DEBUG] renderCategories: categoriesContainer still null!');
            return;
        }
    }
    const allBtn = `<button class="blog-category ${!currentCategory ? 'active' : ''}" data-category="">All</button>`;
    const categoryBtns = categories.map(cat => 
        `<button class="blog-category ${currentCategory === cat.slug ? 'active' : ''}" data-category="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</button>`
    ).join('');
    categoriesContainer.innerHTML = allBtn + categoryBtns;

    // Add click handlers
    categoriesContainer.querySelectorAll('.blog-category').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            currentPage = 1;
            loadPosts();
            renderCategories();
        });
    });
}

// Load posts
async function loadPosts() {
    // #region agent log
    console.log('[DEBUG] loadPosts called', {
        hasPostsGrid: !!postsGrid,
        currentPage,
        currentCategory,
        currentSearch
    });
    // #endregion
    
    if (!postsGrid) {
        console.error('[DEBUG] loadPosts: postsGrid is null! Re-querying...');
        postsGrid = document.getElementById('postsGrid');
        if (!postsGrid) {
            console.error('[DEBUG] loadPosts: postsGrid still null! Cannot load posts.', {
                allElements: Array.from(document.querySelectorAll('[id]')).map(el => el.id),
                mainContent: document.querySelector('main')?.innerHTML?.substring(0, 300)
            });
            return;
        }
        console.log('[DEBUG] loadPosts: postsGrid found after re-query');
    }
    
    // Show skeletons while loading (only if not already showing)
    // This prevents duplicate skeleton creation if showInitialLoading already created them
    const hasSkeletons = postsGrid.querySelector('.skeleton-grid') || postsGrid.querySelector('.skeleton-post-card');
    if (!hasSkeletons) {
        if (window.SkeletonUtils) {
            postsGrid.innerHTML = window.SkeletonUtils.createSkeletonGrid('blog', 6);
        } else {
            postsGrid.innerHTML = '<div class="blog-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">Loading posts...</div>';
        }
    }

    // #region agent log
    const fetchStartTime = performance.now();
    console.log('[DEBUG] loadPosts fetch starting', {hasSkeletons: !!hasSkeletons, timestamp: fetchStartTime});
    // #endregion

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 6
        });
        if (currentCategory) params.append('category', currentCategory);
        if (currentSearch) params.append('search', currentSearch);

        const apiUrl = `/api/posts?${params}`;
        console.log('[DEBUG] loadPosts fetching', {apiUrl});
        
        const res = await fetch(apiUrl);
        
        // #region agent log
        console.log('[DEBUG] loadPosts fetch response', {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries())
        });
        // #endregion
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        // #region agent log
        console.log('[DEBUG] loadPosts data received', {
            hasPosts: !!data.posts,
            postCount: data.posts?.length || 0,
            hasPagination: !!data.pagination,
            pagination: data.pagination
        });
        // #endregion
        
        // #region agent log
        const fetchEndTime = performance.now();
        const fetchDuration = fetchEndTime - fetchStartTime;
        console.log('[DEBUG] loadPosts fetch completed', {duration: fetchDuration, postCount: data.posts?.length || 0});
        // #endregion
        
        // Ensure skeletons are visible for at least 300ms for better UX
        // This prevents the "flash" where content loads too fast
        const minDisplayTime = 300;
        const elapsed = fetchDuration;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);
        
        // #region agent log
        console.log('[DEBUG] loadPosts timing', {elapsed, remainingTime, willWait: remainingTime > 0});
        // #endregion
        
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Remove skeletons
        if (window.SkeletonUtils) {
            const skeletons = postsGrid.querySelectorAll('.skeleton, .skeleton-grid, .skeleton-post-card');
            skeletons.forEach(skeleton => skeleton.remove());
        }
        
        // #region agent log
        console.log('[DEBUG] loadPosts rendering', {skeletonCount: postsGrid.querySelectorAll('.skeleton, .skeleton-grid, .skeleton-post-card').length});
        // #endregion
        
        renderPosts(data.posts);
        renderPagination(data.pagination);
        
        // #region agent log
        console.log('[DEBUG] loadPosts completed successfully', {
            finalPostCount: data.posts?.length || 0,
            postsGridContent: postsGrid.innerHTML.substring(0, 200)
        });
        // #endregion
    } catch (error) {
        console.error('[DEBUG] Failed to load posts:', error, {
            errorMessage: error.message,
            errorStack: error.stack,
            apiUrl: `/api/posts?${new URLSearchParams({page: currentPage, limit: 6})}`
        });
        // Remove skeletons on error
        if (window.SkeletonUtils) {
            const skeletons = postsGrid.querySelectorAll('.skeleton, .skeleton-grid, .skeleton-post-card');
            skeletons.forEach(skeleton => skeleton.remove());
        }
        postsGrid.innerHTML = `
            <div class="blog-empty">
                <svg class="blog-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                </svg>
                <h3 class="blog-empty__title">Unable to load posts</h3>
                <p class="blog-empty__text">Please try again later.</p>
            </div>
        `;
    }
}

// Render posts
function renderPosts(posts) {
    // #region agent log
    console.log('[DEBUG] renderPosts called', {
        postCount: posts?.length || 0,
        hasPostsGrid: !!postsGrid,
        postsGridCurrentContent: postsGrid?.innerHTML?.substring(0, 100)
    });
    // #endregion
    
    if (!postsGrid) {
        console.error('[DEBUG] renderPosts: postsGrid is null!');
        return;
    }
    
    if (!posts || posts.length === 0) {
        // #region agent log
        console.log('[DEBUG] renderPosts: No posts to render, showing empty state');
        // #endregion
        postsGrid.innerHTML = `
            <div class="blog-empty" style="grid-column: 1 / -1;">
                <svg class="blog-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6M12 9v6"/>
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                <h3 class="blog-empty__title">No posts found</h3>
                <p class="blog-empty__text">${currentSearch ? 'Try a different search term.' : 'Check back soon for new content.'}</p>
            </div>
        `;
        return;
    }

    const postsHTML = posts.map(post => `
        <a href="/blog/${escapeHtml(post.slug)}" class="blog-post-card">
            <div class="blog-post-card__meta">
                <span class="blog-post-card__category">${escapeHtml(post.categoryName || 'Insights')}</span>
                <span class="blog-post-card__dot"></span>
                <span class="blog-post-card__date">${escapeHtml(formatDate(post.publishedAt))}</span>
            </div>
            <h2 class="blog-post-card__title">${escapeHtml(post.title)}</h2>
            <p class="blog-post-card__excerpt">${escapeHtml(post.excerpt)}</p>
            <div class="blog-post-card__footer">
                <span class="blog-post-card__read-time">${escapeHtml(String(post.readTime || 0))} min read</span>
                <svg class="blog-post-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>
        </a>
    `).join('');
    
    // #region agent log
    console.log('[DEBUG] renderPosts: Setting innerHTML', {htmlLength: postsHTML.length});
    // #endregion
    
    postsGrid.innerHTML = postsHTML;
    
    // #region agent log
    console.log('[DEBUG] renderPosts: innerHTML set', {
        postsGridChildren: postsGrid.children.length,
        firstChild: postsGrid.firstElementChild?.tagName
    });
    // #endregion

    // Re-initialize magnetic buttons for new content
    if (typeof window.initMagneticButtons === 'function') {
        window.initMagneticButtons();
    }
}

// Render pagination
function renderPagination(paginationData) {
    if (paginationData.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button class="blog-pagination__btn" ${!paginationData.hasPrev ? 'disabled' : ''} data-page="${currentPage - 1}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= paginationData.totalPages; i++) {
        if (
            i === 1 ||
            i === paginationData.totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            html += `
                <button class="blog-pagination__btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="color: var(--color-text-tertiary);">...</span>`;
        }
    }

    // Next button
    html += `
        <button class="blog-pagination__btn" ${!paginationData.hasNext ? 'disabled' : ''} data-page="${currentPage + 1}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
    `;

    pagination.innerHTML = html;

    // Add click handlers
    pagination.querySelectorAll('.blog-pagination__btn:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page, 10);
            loadPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// Search handler with debounce - will be attached in initialize()
function attachSearchHandler() {
    if (!searchInput) {
        console.warn('[DEBUG] attachSearchHandler: searchInput is null');
        return;
    }
    
    // Remove existing listener if any
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode?.replaceChild(newSearchInput, searchInput);
    searchInput = newSearchInput;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadPosts();
        }, 300);
    });
}

// Nav scroll effect
function handleScroll() {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Initialize - ensure DOM is ready
let isInitializing = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

async function initialize() {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
        console.log('[DEBUG] initialize: Already initializing, skipping...');
        return;
    }
    
    // Prevent infinite retry loops
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.error('[DEBUG] initialize: Max attempts reached, giving up');
        return;
    }
    
    isInitializing = true;
    initializationAttempts++;
    
    // #region agent log
    console.log('[DEBUG] ========== INITIALIZE CALLED ==========', {
        readyState: document.readyState,
        hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined',
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
        attempt: initializationAttempts
    });
    // #endregion
    
    // Re-query elements in case DOM was replaced by page transitions
    postsGrid = document.getElementById('postsGrid');
    categoriesContainer = document.getElementById('categoriesContainer');
    searchInput = document.getElementById('searchInput');
    pagination = document.getElementById('pagination');
    nav = document.getElementById('nav') || document.querySelector('.nav');
    
    // #region agent log
    console.log('[DEBUG] initialize: Elements re-queried', {
        hasPostsGrid: !!postsGrid,
        hasCategoriesContainer: !!categoriesContainer,
        hasSearchInput: !!searchInput,
        hasPagination: !!pagination,
        hasNav: !!nav,
        postsGridId: postsGrid?.id,
        allIds: Array.from(document.querySelectorAll('[id]')).map(el => el.id)
    });
    // #endregion
    
    if (!postsGrid) {
        console.error('[DEBUG] initialize: postsGrid not found!', {
            bodyHTML: document.body.innerHTML.substring(0, 500),
            mainHTML: document.querySelector('main')?.innerHTML?.substring(0, 500),
            attempt: initializationAttempts
        });
        
        isInitializing = false;
        
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            console.warn(`[DEBUG] initialize: Retrying in 200ms... (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`);
            setTimeout(initialize, 200);
        } else {
            console.error('[DEBUG] initialize: Max retry attempts reached, postsGrid never found');
        }
        return;
    }
    
    // Reset attempts counter on success
    initializationAttempts = 0;
    
    console.log('[DEBUG] initialize: Calling showInitialLoading...');
    showInitialLoading();
    
    // Attach event handlers
    attachSearchHandler();
    
    console.log('[DEBUG] initialize: Loading categories and posts in parallel...');
    // Load categories and posts in parallel for faster loading
    try {
        await Promise.all([
            loadCategories(),
            loadPosts()
        ]);
        console.log('[DEBUG] ========== INITIALIZE COMPLETED ==========');
    } catch (error) {
        console.error('[DEBUG] initialize: Error during parallel load', error);
    } finally {
        isInitializing = false;
    }
}

if (document.readyState === 'loading') {
    // #region agent log
    if (isDevelopment()) {
        console.log('[DEBUG] Waiting for DOMContentLoaded', {hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined'});
        debugLog('blog.js:277', 'Waiting for DOMContentLoaded', {
            hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined'
        });
    }
    // #endregion
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // #region agent log
    if (isDevelopment()) {
        console.log('[DEBUG] DOM already ready - calling initialize immediately', {hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined'});
        debugLog('blog.js:280', 'DOM already ready - calling initialize immediately', {
            hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined'
        });
    }
    // #endregion
    initialize();
}

// Listen for page transitions (when navigating via page-transitions.js)
window.addEventListener('pageTransitionComplete', (e) => {
    // #region agent log
    console.log('[DEBUG] pageTransitionComplete event received', {url: e.detail?.url, currentPath: window.location.pathname});
    // #endregion
    
    // Only initialize if we're on the blog page
    if (window.location.pathname.includes('/blog') || window.location.pathname === '/blog') {
        // Reset attempts counter for new page load
        initializationAttempts = 0;
        
        // Wait a bit longer to ensure DOM is fully updated and scripts are loaded
        setTimeout(() => {
            // Double-check that postsGrid exists before initializing
            const checkPostsGrid = document.getElementById('postsGrid');
            if (checkPostsGrid) {
                initialize();
            } else {
                console.warn('[DEBUG] pageTransitionComplete: postsGrid not found yet, waiting longer...');
                setTimeout(() => {
                    if (document.getElementById('postsGrid')) {
                        initialize();
                    } else {
                        console.error('[DEBUG] pageTransitionComplete: postsGrid still not found after delay');
                    }
                }, 300);
            }
        }, 150);
    }
});


