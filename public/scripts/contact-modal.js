/**
 * Contact Modal Handler
 * Opens and closes the contact form modal
 */

(function() {
    'use strict';

    const contactModal = document.getElementById('contactModal');
    const contactBtn = document.getElementById('contactBtn');
    const contactModalBackdrop = document.getElementById('contactModalBackdrop');
    const contactModalClose = document.getElementById('contactModalClose');

    if (!contactModal || !contactBtn) {
        return; // Exit if elements don't exist
    }

    function openContactModal() {
        contactModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Reinitialize the form embed when modal opens
        if (typeof initEmbed === 'function') {
            initEmbed('reach-out-to-me-hva5m4', { autoResize: true });
        }
    }

    function closeContactModal() {
        contactModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Open modal
    contactBtn.addEventListener('click', openContactModal);

    // Close modal
    if (contactModalClose) {
        contactModalClose.addEventListener('click', closeContactModal);
    }

    if (contactModalBackdrop) {
        contactModalBackdrop.addEventListener('click', closeContactModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && contactModal.getAttribute('aria-hidden') === 'false') {
            closeContactModal();
        }
    });
})();

