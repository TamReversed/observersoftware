// Contact form submission handler
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const formMessage = document.getElementById('formMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    formMessage.style.display = 'none';
    
    // Get form data
    const formData = {
      name: document.getElementById('contactName').value.trim(),
      email: document.getElementById('contactEmail').value.trim(),
      subject: document.getElementById('contactSubject').value.trim(),
      message: document.getElementById('contactMessage').value.trim()
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
        formMessage.className = 'form-message form-message--success';
        formMessage.textContent = 'Message sent successfully! We\'ll get back to you soon.';
        formMessage.style.display = 'block';
        form.reset();
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // Error
        formMessage.className = 'form-message form-message--error';
        formMessage.textContent = data.error || 'Failed to send message. Please try again.';
        formMessage.style.display = 'block';
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      formMessage.className = 'form-message form-message--error';
      formMessage.textContent = 'Network error. Please check your connection and try again.';
      formMessage.style.display = 'block';
      
      // Scroll to message
      formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  });
})();

