// Table of Contents
// Auto-generate TOC from post headings with active section highlighting
class TableOfContents {
  constructor(contentElement) {
    this.content = contentElement;
    this.headings = [];
    this.toc = null;
    this.activeSection = null;
    this.observer = null;
    this.init();
  }

  init() {
    if (!this.content) return;

    this.headings = this.findHeadings();
    if (this.headings.length === 0) return;

    this.generateTOC();
    this.addIdsToHeadings();
    this.highlightActive();
  }

  findHeadings() {
    const headings = [];
    const headingElements = this.content.querySelectorAll('h2, h3');

    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent.trim();
      const id = heading.id || `heading-${index}`;

      headings.push({
        element: heading,
        level,
        text,
        id
      });
    });

    return headings;
  }

  addIdsToHeadings() {
    this.headings.forEach(heading => {
      if (!heading.element.id) {
        heading.element.id = heading.id;
      }
    });
  }

  generateTOC() {
    // Create TOC container
    this.toc = document.createElement('div');
    this.toc.className = 'toc';
    this.toc.setAttribute('role', 'navigation');
    this.toc.setAttribute('aria-label', 'Table of contents');

    const tocTitle = document.createElement('h3');
    tocTitle.className = 'toc__title';
    tocTitle.textContent = 'Contents';
    this.toc.appendChild(tocTitle);

    const tocList = document.createElement('ul');
    tocList.className = 'toc__list';

    let currentH2 = null;
    this.headings.forEach((heading, index) => {
      if (heading.level === 2) {
        // H2 - main item
        const li = document.createElement('li');
        li.className = 'toc__item toc__item--h2';
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.className = 'toc__link';
        a.textContent = heading.text;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          this.scrollToHeading(heading.element);
        });
        li.appendChild(a);
        tocList.appendChild(li);
        currentH2 = li;
      } else if (heading.level === 3 && currentH2) {
        // H3 - nested under previous H2
        let nestedList = currentH2.querySelector('ul');
        if (!nestedList) {
          nestedList = document.createElement('ul');
          nestedList.className = 'toc__sublist';
          currentH2.appendChild(nestedList);
        }
        const li = document.createElement('li');
        li.className = 'toc__item toc__item--h3';
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.className = 'toc__link';
        a.textContent = heading.text;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          this.scrollToHeading(heading.element);
        });
        li.appendChild(a);
        nestedList.appendChild(li);
      }
    });

    this.toc.appendChild(tocList);

    // Insert TOC after post hero or in sidebar
    const postContentInner = document.querySelector('.post-content__inner');
    if (postContentInner) {
      // Desktop: insert as first child (will be positioned with CSS)
      postContentInner.insertBefore(this.toc, postContentInner.firstChild);
    }
  }

  scrollToHeading(heading) {
    const nav = document.querySelector('.nav');
    const navHeight = nav ? nav.offsetHeight : 0;
    const offset = 100; // Additional offset

    const headingTop = heading.getBoundingClientRect().top + window.pageYOffset;
    const targetPosition = headingTop - navHeight - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Update URL without triggering scroll
    history.pushState(null, '', `#${heading.id}`);
  }

  highlightActive() {
    if (this.headings.length === 0) return;

    // Use Intersection Observer to detect active section
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const headingId = entry.target.id;
          this.setActiveSection(headingId);
        }
      });
    }, options);

    // Observe all headings
    this.headings.forEach(heading => {
      this.observer.observe(heading.element);
    });

    // Set initial active section
    const firstHeading = this.headings[0];
    if (firstHeading) {
      this.setActiveSection(firstHeading.id);
    }
  }

  setActiveSection(headingId) {
    if (this.activeSection === headingId) return;

    // Remove active class from all links
    if (this.toc) {
      this.toc.querySelectorAll('.toc__link--active').forEach(link => {
        link.classList.remove('toc__link--active');
      });

      // Add active class to current link
      const activeLink = this.toc.querySelector(`a[href="#${headingId}"]`);
      if (activeLink) {
        activeLink.classList.add('toc__link--active');
        // Scroll TOC to show active item (if needed)
        activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    this.activeSection = headingId;
  }
}

// Initialize TOC when post content is loaded
window.initTableOfContents = function() {
  const postBody = document.getElementById('postBody');
  if (postBody) {
    new TableOfContents(postBody);
  }
};

