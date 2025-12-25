const { marked } = require('marked');

function renderMarkdown(content) {
  return marked(content);
}

module.exports = { renderMarkdown };



