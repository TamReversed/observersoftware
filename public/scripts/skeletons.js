// Loading Skeletons
// Utility functions to create skeleton placeholders

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
        console.log('[DEBUG] skeletons.js file loaded', new Date().getTime());
        console.trace('[DEBUG] skeletons.js call stack');
    }
})();
// #endregion

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
    // Remove instantly for better performance
    skeletons.forEach(skeleton => skeleton.remove());
}

// Export functions
// #region agent log
if (isDevelopment()) {
    console.log('[DEBUG] skeletons.js creating SkeletonUtils', {readyState: document.readyState});
    debugLog('skeletons.js:80', 'Creating SkeletonUtils', {
        hasWindow: typeof window !== 'undefined',
        readyState: document.readyState
    });
}
// #endregion
window.SkeletonUtils = {
    createBlogPostSkeleton,
    createPostContentSkeleton,
    createWorkCardSkeleton,
    createSkeletonGrid,
    removeSkeletons
};
// #region agent log
if (isDevelopment()) {
    console.log('[DEBUG] SkeletonUtils assigned', {hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined', hasCreateGrid: typeof window.SkeletonUtils?.createSkeletonGrid === 'function'});
    debugLog('skeletons.js:87', 'SkeletonUtils assigned', {
        hasSkeletonUtils: typeof window.SkeletonUtils !== 'undefined',
        hasCreateGrid: typeof window.SkeletonUtils?.createSkeletonGrid === 'function'
    });
}
// #endregion

