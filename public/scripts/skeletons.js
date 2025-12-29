// Loading Skeletons
// Utility functions to create skeleton placeholders

function createBlogPostSkeleton() {
    return `
        <div class="skeleton-post-card skeleton">
            <div class="skeleton skeleton-badge"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line skeleton-line--short"></div>
            <div class="skeleton skeleton-meta"></div>
        </div>
    `;
}

function createPostContentSkeleton() {
    return `
        <div class="skeleton-post-content">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-meta" style="width: 40%; margin-bottom: var(--space-lg);"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line skeleton-line--medium"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line skeleton-line--short"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line skeleton-line--medium"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-image" style="margin-top: var(--space-lg);"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line skeleton-line--short"></div>
        </div>
    `;
}

function createWorkCardSkeleton() {
    return `
        <div class="skeleton-work-card skeleton">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line skeleton-line--short"></div>
            <div style="margin-top: var(--space-sm);">
                <div class="skeleton skeleton-tag"></div>
                <div class="skeleton skeleton-tag"></div>
                <div class="skeleton skeleton-tag"></div>
            </div>
        </div>
    `;
}

function createSkeletonGrid(type, count = 6) {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
        if (type === 'blog') {
            skeletons.push(createBlogPostSkeleton());
        } else if (type === 'work') {
            skeletons.push(createWorkCardSkeleton());
        }
    }

    const gridClass = type === 'blog' ? 'skeleton-grid--blog' : 'skeleton-grid--work';
    return `<div class="skeleton-grid ${gridClass}" style="display: grid; gap: var(--space-lg); width: 100%;">${skeletons.join('')}</div>`;
}

function removeSkeletons(container) {
    if (!container) return;
    const skeletons = container.querySelectorAll('.skeleton, .skeleton-grid, .skeleton-post-card, .skeleton-work-card, .skeleton-post-content');
    skeletons.forEach(skeleton => skeleton.remove());
}

// Export functions
window.SkeletonUtils = {
    createBlogPostSkeleton,
    createPostContentSkeleton,
    createWorkCardSkeleton,
    createSkeletonGrid,
    removeSkeletons
};
