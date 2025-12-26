const { v4: uuidv4 } = require('uuid');

// Simple CSRF token generation and validation
// In production, consider using csrf package for more robust implementation

function generateCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = uuidv4();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function validateCsrfToken(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For multipart/form-data (file uploads), check header only
  // For JSON, check both header and body
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  const token = isMultipart 
    ? req.headers['x-csrf-token']
    : (req.headers['x-csrf-token'] || req.body?.csrfToken);
  const sessionToken = req.session.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

module.exports = {
  generateCsrfToken,
  validateCsrfToken
};

