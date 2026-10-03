function errorHandler(err, req, res, next) {
  // Log error details (but don't expose to client)
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  const status = err.status || err.statusCode || 500;
  
  // In production, use generic message for 500 errors
  let message = err.message || 'Internal server error';
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal server error';
  }

  // Pages get a real page; the API keeps getting JSON
  const wantsPage = !req.path.startsWith('/api') && req.accepts(['html', 'json']) === 'html';
  if (wantsPage && !res.headersSent) {
    try {
      const config = require('../config');
      res.locals.site = res.locals.site || {
        url: config.siteUrl, social: { linkedin: '', github: '' }, legal: {}, year: new Date().getFullYear(),
        content: require('../services/siteContentService').resolve({})
      };
      res.locals.path = res.locals.path || req.path;
      const serverFault = status >= 500;
      return res.status(status).render('error', {
        title: 'Something went wrong | Observer', description: 'This page could not be shown.',
        ogImage: '/assets/og/og-home.jpg', noindex: true,
        heading: serverFault ? 'Something went wrong.' : 'That address is not valid.',
        text: serverFault ? 'The problem is on our side. Please try again in a moment.' : 'Check the link and try again.'
      }, (renderError, html) => {
        if (renderError) return res.status(status).json({ error: message });
        res.send(html);
      });
    } catch (pageError) { /* fall through to the JSON answer */ }
  }

  const response = {
    error: message
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };




