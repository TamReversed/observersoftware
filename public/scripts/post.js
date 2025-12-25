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

    try {
        const res = await fetch(`/api/posts/${slug}`);

        if (!res.ok) {
            throw new Error('Post not found');
        }

        const post = await res.json();
        renderPost(post);
    } catch (error) {
        console.error('Failed to load post:', error);
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
    }
}

// Render post
function renderPost(post) {
    // Update page title
    document.title = `${post.title} — Observer`;

    // Update meta
    document.getElementById('postCategory').textContent = post.categoryName || 'Insights';
    document.getElementById('postDate').textContent = formatDate(post.publishedAt);
    document.getElementById('postReadTime').textContent = `${post.readTime} min read`;

    // Update content
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postExcerpt').textContent = post.excerpt;
    document.getElementById('postBody').innerHTML = post.htmlContent;

    // Render related posts
    if (post.relatedPosts && post.relatedPosts.length > 0) {
        renderRelatedPosts(post.relatedPosts);
    }

    // Show content
    loadingState.style.display = 'none';
    postContent.style.display = 'block';
}

// Render related posts
function renderRelatedPosts(posts) {
    const relatedGrid = document.getElementById('relatedGrid');
    const relatedSection = document.getElementById('relatedPosts');

    relatedGrid.innerHTML = posts.map(post => `
        <a href="/blog/${post.slug}" class="related-post-card">
            <h3 class="related-post-card__title">${post.title}</h3>
            <p class="related-post-card__meta">${post.readTime} min read</p>
        </a>
    `).join('');

    relatedSection.style.display = 'block';
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

// Initialize
loadPost();



