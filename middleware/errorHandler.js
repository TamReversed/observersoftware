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




