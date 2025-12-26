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

// Elements
const postsGrid = document.getElementById('postsGrid');
const categoriesContainer = document.getElementById('categoriesContainer');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');
const nav = document.getElementById('nav');

// Load categories
async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        categories = await res.json();
        renderCategories();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// Render categories
function renderCategories() {
    if (!categoriesContainer) return;
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
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 6
        });
        if (currentCategory) params.append('category', currentCategory);
        if (currentSearch) params.append('search', currentSearch);

        const res = await fetch(`/api/posts?${params}`);
        const data = await res.json();
        renderPosts(data.posts);
        renderPagination(data.pagination);
    } catch (error) {
        console.error('Failed to load posts:', error);
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
    if (posts.length === 0) {
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

    postsGrid.innerHTML = posts.map(post => `
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

// Search handler with debounce
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        loadPosts();
    }, 300);
});

// Nav scroll effect
function handleScroll() {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Initialize
loadCategories();
loadPosts();

