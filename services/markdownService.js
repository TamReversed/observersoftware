const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

// Configure marked to be safer
marked.setOptions({
  breaks: true,
  gfm: true
});

function renderMarkdown(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Render markdown to HTML
  const html = marked(content);
  
  // Sanitize HTML to prevent XSS
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  
  return sanitized;
}

module.exports = { renderMarkdown };
