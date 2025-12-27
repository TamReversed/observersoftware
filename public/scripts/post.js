// Post page functionality
// Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const postContent = document.getElementById('postContent');
const nav = document.getElementById('nav');

// Get slug from URL
function getSlug() {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1];
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

// Load post
async function loadPost() {
    const slug = getSlug();
    const postBody = document.getElementById('postBody');

    // Show skeleton for post content
    if (postBody && window.SkeletonUtils) {
        postBody.innerHTML = window.SkeletonUtils.createPostContentSkeleton();
    }

    try {
        const res = await fetch(`/api/posts/${slug}`);

        if (!res.ok) {
            throw new Error('Post not found');
        }

        const post = await res.json();
        renderPost(post);
    } catch (error) {
        console.error('Failed to load post:', error);
        // Remove skeleton on error
        if (postBody && window.SkeletonUtils) {
            window.SkeletonUtils.removeSkeletons(postBody);
        }
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'flex';
    }
}

// Render post
function renderPost(post) {
    // Update page title
    document.title = `${post.title} — Observer`;

    // Update meta with null checks
    const postCategory = document.getElementById('postCategory');
    const postDate = document.getElementById('postDate');
    const postReadTime = document.getElementById('postReadTime');
    const postTitle = document.getElementById('postTitle');
    const postExcerpt = document.getElementById('postExcerpt');
    const postBody = document.getElementById('postBody');
    
    if (postCategory) postCategory.textContent = post.categoryName || 'Insights';
    if (postDate) postDate.textContent = formatDate(post.publishedAt);
    if (postReadTime) postReadTime.textContent = `${post.readTime} min read`;
    if (postTitle) postTitle.textContent = post.title;
    if (postExcerpt) postExcerpt.textContent = post.excerpt;
    
    // Remove skeleton before rendering content
    if (postBody && window.SkeletonUtils) {
        window.SkeletonUtils.removeSkeletons(postBody);
    }
    
    if (postBody) postBody.innerHTML = post.htmlContent; // Safe - sanitized on backend

    // Render related posts
    if (post.relatedPosts && post.relatedPosts.length > 0) {
        renderRelatedPosts(post.relatedPosts);
    }

    // Show content
    if (loadingState) loadingState.style.display = 'none';
    if (postContent) postContent.style.display = 'block';

    // Initialize share button
    if (typeof window.initShareButton === 'function') {
        window.initShareButton({
            title: post.title,
            excerpt: post.excerpt,
            url: window.location.href
        });
    }

    // Initialize table of contents
    if (typeof window.initTableOfContents === 'function') {
        // Delay slightly to ensure content is rendered
        setTimeout(() => {
            window.initTableOfContents();
        }, 100);
    }

    // Initialize reading progress
    if (typeof ReadingProgress !== 'undefined') {
        // Reading progress will auto-initialize
    }
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Render related posts
function renderRelatedPosts(posts) {
    const relatedGrid = document.getElementById('relatedGrid');
    const relatedSection = document.getElementById('relatedPosts');
    
    if (!relatedGrid || !relatedSection) return;

    relatedGrid.innerHTML = posts.map(post => `
        <a href="/blog/${escapeHtml(post.slug)}" class="related-post-card">
            ${post.categoryName ? `<span class="related-post-card__category">${escapeHtml(post.categoryName)}</span>` : ''}
            <h3 class="related-post-card__title">${escapeHtml(post.title)}</h3>
            <p class="related-post-card__excerpt">${escapeHtml(post.excerpt || '')}</p>
            <p class="related-post-card__meta">${escapeHtml(String(post.readTime || 0))} min read</p>
        </a>
    `).join('');

    relatedSection.style.display = 'block';

    // Re-initialize magnetic buttons for related posts
    if (typeof window.initMagneticButtons === 'function') {
        window.initMagneticButtons();
    }
}

// Nav scroll effect
function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Initialize
loadPost();




