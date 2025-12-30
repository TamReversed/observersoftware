// FAQ Accordion for Contact Page
(function() {
    // Render FAQ items
    function renderFaqs(items) {
        const accordion = document.getElementById('faqAccordion');
        if (!accordion) return;

        accordion.innerHTML = '';

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'faq__empty';
            empty.textContent = 'No FAQs available.';
            accordion.appendChild(empty);
            return;
        }

        items.forEach((item, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq__item reveal';

            // Question button
            const question = document.createElement('button');
            question.className = 'faq__question';
            question.setAttribute('aria-expanded', 'false');
            question.setAttribute('aria-controls', `faq-answer-${index}`);

            const questionText = document.createElement('span');
            questionText.textContent = item.question || '';
            question.appendChild(questionText);

            // Chevron icon
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.setAttribute('fill', 'none');
            icon.setAttribute('stroke', 'currentColor');
            icon.setAttribute('stroke-width', '2');
            icon.classList.add('faq__icon');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M6 9l6 6 6-6');
            icon.appendChild(path);
            question.appendChild(icon);

            faqItem.appendChild(question);

            // Answer panel
            const answer = document.createElement('div');
            answer.className = 'faq__answer';
            answer.id = `faq-answer-${index}`;
            answer.setAttribute('role', 'region');
            answer.setAttribute('aria-labelledby', `faq-question-${index}`);

            const answerContent = document.createElement('div');
            answerContent.className = 'faq__answer-content';

            // Split answer into paragraphs
            const paragraphs = (item.answer || '').split('\n').filter(p => p.trim());
            paragraphs.forEach(p => {
                const para = document.createElement('p');
                para.textContent = p;
                answerContent.appendChild(para);
            });

            answer.appendChild(answerContent);
            faqItem.appendChild(answer);

            // Toggle handler
            question.addEventListener('click', () => {
                const isActive = faqItem.classList.contains('active');

                // Close all other items
                accordion.querySelectorAll('.faq__item.active').forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('active');
                        item.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current item
                faqItem.classList.toggle('active');
                question.setAttribute('aria-expanded', !isActive);
            });

            accordion.appendChild(faqItem);
        });

        // Re-trigger reveal animations
        if (typeof initRevealObserver === 'function') {
            initRevealObserver();
        }
    }

    // Fetch and render FAQs
    async function loadFaqs() {
        const accordion = document.getElementById('faqAccordion');
        if (!accordion) return;

        try {
            const res = await fetch('/api/faqs');
            if (res.ok) {
                const faqs = await res.json();
                renderFaqs(faqs);
            } else {
                renderFaqs([]);
            }
        } catch (e) {
            renderFaqs([]);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFaqs);
    } else {
        loadFaqs();
    }
})();
