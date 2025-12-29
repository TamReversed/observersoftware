// Blog page functionality

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

// Show initial loading state immediately
function showInitialLoading() {
    if (!postsGrid) {
        postsGrid = document.getElementById('postsGrid');
        if (!postsGrid) return;
    }

    // Clear any existing content first
    postsGrid.innerHTML = '';

    // Show skeletons immediately
    if (window.SkeletonUtils) {
        try {
            const skeletonHTML = window.SkeletonUtils.createSkeletonGrid('blog', 6);
            postsGrid.innerHTML = skeletonHTML;
        } catch (e) {
            console.error('Error creating skeleton grid:', e);
            postsGrid.innerHTML = '<div class="blog-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-tertiary);">Loading posts...</div>';
        }
    } else {
        postsGrid.innerHTML = '<div class="blog-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-tertiary);">Loading posts...</div>';
    }
}

// Load categories
async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        categories = await res.json();
        renderCategories();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// Render categories
function renderCategories() {
    if (!categoriesContainer) {
        categoriesContainer = document.getElementById('categoriesContainer');
        if (!categoriesContainer) return;
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
    if (!postsGrid) {
        postsGrid = document.getElementById('postsGrid');
        if (!postsGrid) return;
    }

    // Show skeletons while loading
    const hasSkeletons = postsGrid.querySelector('.skeleton-grid') || postsGrid.querySelector('.skeleton-post-card');
    if (!hasSkeletons) {
        if (window.SkeletonUtils) {
            postsGrid.innerHTML = window.SkeletonUtils.createSkeletonGrid('blog', 6);
        } else {
            postsGrid.innerHTML = '<div class="blog-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">Loading posts...</div>';
        }
    }

    const fetchStartTime = performance.now();

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 6
        });
        if (currentCategory) params.append('category', currentCategory);
        if (currentSearch) params.append('search', currentSearch);

        const apiUrl = `/api/posts?${params}`;
        const res = await fetch(apiUrl);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Ensure skeletons are visible for at least 300ms for better UX
        const minDisplayTime = 300;
        const elapsed = performance.now() - fetchStartTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // Remove skeletons
        if (window.SkeletonUtils) {
            const skeletons = postsGrid.querySelectorAll('.skeleton, .skeleton-grid, .skeleton-post-card');
            skeletons.forEach(skeleton => skeleton.remove());
        }

        renderPosts(data.posts);
        renderPagination(data.pagination);
    } catch (error) {
        console.error('Failed to load posts:', error);
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
    if (!postsGrid) return;

    if (!posts || posts.length === 0) {
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

    postsGrid.innerHTML = postsHTML;

    // Re-initialize magnetic buttons for new content
    if (typeof window.initMagneticButtons === 'function') {
        window.initMagneticButtons();
    }
}

// Render pagination
function renderPagination(paginationData) {
    if (!pagination) {
        pagination = document.getElementById('pagination');
        if (!pagination) return;
    }

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

// Search handler with debounce
function attachSearchHandler() {
    if (!searchInput) {
        searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
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
    if (!nav) {
        nav = document.getElementById('nav') || document.querySelector('.nav');
        if (!nav) return;
    }
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Initialize
let isInitializing = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

async function initialize() {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) return;

    // Prevent infinite retry loops
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.error('Blog initialization: Max attempts reached');
        return;
    }

    isInitializing = true;
    initializationAttempts++;

    // Re-query elements in case DOM was replaced by page transitions
    postsGrid = document.getElementById('postsGrid');
    categoriesContainer = document.getElementById('categoriesContainer');
    searchInput = document.getElementById('searchInput');
    pagination = document.getElementById('pagination');
    nav = document.getElementById('nav') || document.querySelector('.nav');

    if (!postsGrid) {
        isInitializing = false;
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(initialize, 200);
        }
        return;
    }

    // Reset attempts counter on success
    initializationAttempts = 0;

    showInitialLoading();
    attachSearchHandler();

    // Load categories and posts in parallel
    try {
        await Promise.all([
            loadCategories(),
            loadPosts()
        ]);
    } catch (error) {
        console.error('Blog initialization error:', error);
    } finally {
        isInitializing = false;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Listen for page transitions
window.addEventListener('pageTransitionComplete', (e) => {
    // Only initialize if we're on the blog page
    if (window.location.pathname.includes('/blog') || window.location.pathname === '/blog') {
        initializationAttempts = 0;
        setTimeout(() => {
            const checkPostsGrid = document.getElementById('postsGrid');
            if (checkPostsGrid) {
                initialize();
            } else {
                setTimeout(() => {
                    if (document.getElementById('postsGrid')) {
                        initialize();
                    }
                }, 300);
            }
        }, 150);
    }
});
