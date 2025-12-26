const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

// Common validation rules
const titleValidation = body('title')
  .trim()
  .notEmpty().withMessage('Title is required')
  .isLength({ max: 200 }).withMessage('Title must be less than 200 characters');

const descriptionValidation = body('description')
  .trim()
  .notEmpty().withMessage('Description is required')
  .isLength({ max: 500 }).withMessage('Description must be less than 500 characters');

const contentValidation = body('content')
  .trim()
  .notEmpty().withMessage('Content is required')
  .isLength({ max: 50000 }).withMessage('Content must be less than 50000 characters');

const longDescriptionValidation = body('longDescription')
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ max: 10000 }).withMessage('Long description must be less than 10000 characters');

const urlValidation = body('externalUrl')
  .optional({ checkFalsy: true })
  .trim()
  .custom((value) => {
    if (!value || value === '') {
      return true; // Allow empty strings
    }
    // Validate URL format
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('External URL must use HTTP or HTTPS protocol');
      }
      if (value.length > 500) {
        throw new Error('URL must be less than 500 characters');
      }
      return true;
    } catch (e) {
      if (e instanceof TypeError) {
        throw new Error('External URL must be a valid HTTP/HTTPS URL');
      }
      throw e;
    }
  });

const arrayValidation = (field, maxItems = 50) => 
  body(field)
    .optional()
    .isArray().withMessage(`${field} must be an array`)
    .custom((value) => {
      if (value.length > maxItems) {
        throw new Error(`${field} must have no more than ${maxItems} items`);
      }
      return true;
    });

const stringArrayValidation = (field, maxLength = 100, maxItems = 50) =>
  body(`${field}.*`)
    .optional()
    .trim()
    .isLength({ max: maxLength }).withMessage(`Each ${field} item must be less than ${maxLength} characters`);

// Post validation
const validatePost = [
  titleValidation,
  descriptionValidation.optional(),
  contentValidation,
  body('category').optional().trim().isLength({ max: 50 }),
  body('published').optional().isBoolean(),
  handleValidationErrors
];

// Capability validation
const validateCapability = [
  titleValidation,
  descriptionValidation,
  longDescriptionValidation,
  urlValidation,
  arrayValidation('features', 20),
  stringArrayValidation('features', 100, 20),
  arrayValidation('screenshots', 10),
  body('screenshots.*')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === '') {
        return true; // Allow empty strings
      }
      // Validate URL format (allow relative URLs)
      if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
        return value.length <= 500;
      }
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Screenshot URL must use HTTP or HTTPS protocol');
        }
        if (value.length > 500) {
          throw new Error('Screenshot URL must be less than 500 characters');
        }
        return true;
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('Screenshot URL must be a valid URL or relative path');
        }
        throw e;
      }
    }),
  body('order').optional().isInt({ min: 0 }),
  body('published').optional().isBoolean(),
  handleValidationErrors
];

// Work validation
const validateWork = [
  body('industry')
    .trim()
    .notEmpty().withMessage('Industry is required')
    .isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
  body('problem')
    .trim()
    .notEmpty().withMessage('Problem is required')
    .isLength({ max: 500 }).withMessage('Problem must be less than 500 characters'),
  body('solution')
    .trim()
    .notEmpty().withMessage('Solution is required')
    .isLength({ max: 1000 }).withMessage('Solution must be less than 1000 characters'),
  arrayValidation('tags', 10),
  stringArrayValidation('tags', 50, 10),
  body('date').optional().trim().isLength({ max: 20 }),
  body('order').optional().isInt({ min: 0 }),
  body('published').optional().isBoolean(),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 1, max: 50 }).withMessage('Username must be between 1 and 50 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 1, max: 200 }).withMessage('Password must be between 1 and 200 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .trim()
    .notEmpty().withMessage('ID is required')
    .isLength({ max: 100 }).withMessage('ID must be less than 100 characters'),
  handleValidationErrors
];

// Slug parameter validation
const validateSlug = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
    .isLength({ max: 200 }).withMessage('Slug must be less than 200 characters'),
  handleValidationErrors
];

module.exports = {
  validatePost,
  validateCapability,
  validateWork,
  validateLogin,
  validateId,
  validateSlug,
  handleValidationErrors
};

