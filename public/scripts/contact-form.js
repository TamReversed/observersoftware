// Contact form submission handler
(function() {
  let isInitialized = false;
  let formHandler = null;

  function initContactForm() {
    // Prevent duplicate initialization
    if (isInitialized) {
      return;
    }

    const form = document.getElementById('contactForm');
    if (!form) {
      // Retry if form not found (e.g., during page transitions)
      setTimeout(initContactForm, 100);
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
      setTimeout(initContactForm, 100);
      return;
    }

    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const formMessage = document.getElementById('formMessage');

    // Remove existing handler if any
    if (formHandler) {
      form.removeEventListener('submit', formHandler);
    }

    // Create new handler
    formHandler = async (e) => {
      e.preventDefault();
      
      // Disable submit button
      submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';
      if (formMessage) formMessage.style.display = 'none';
      
      // Get form data
      const formData = {
        name: document.getElementById('contactName')?.value.trim() || '',
        email: document.getElementById('contactEmail')?.value.trim() || '',
        subject: document.getElementById('contactSubject')?.value.trim() || '',
        message: document.getElementById('contactMessage')?.value.trim() || ''
      };
      
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Success
          if (formMessage) {
            formMessage.className = 'form-message form-message--success';
            formMessage.textContent = 'Message sent successfully! We\'ll get back to you soon.';
            formMessage.style.display = 'block';
            formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          form.reset();
        } else {
          // Error
          if (formMessage) {
            formMessage.className = 'form-message form-message--error';
            formMessage.textContent = data.error || 'Failed to send message. Please try again.';
            formMessage.style.display = 'block';
            formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        if (formMessage) {
          formMessage.className = 'form-message form-message--error';
          formMessage.textContent = 'Network error. Please check your connection and try again.';
          formMessage.style.display = 'block';
          formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    };

    form.addEventListener('submit', formHandler);
    isInitialized = true;
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    // Small delay to ensure DOM is ready
    setTimeout(initContactForm, 50);
  }

  // Re-initialize after page transitions (reset flag)
  window.addEventListener('pageTransitionComplete', () => {
    isInitialized = false;
    setTimeout(initContactForm, 100);
  });
})();

