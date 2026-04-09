const { validationResult } = require('express-validator');
const { ZodError } = require('zod');

// Legacy express-validator middleware (still used by some routes)
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validateBody(schema), controller)
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: (err.issues || err.errors || []).map(e => ({
            field: Array.isArray(e.path) ? e.path.join('.') : e.path,
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: (err.issues || err.errors || []).map(e => ({
            field: Array.isArray(e.path) ? e.path.join('.') : e.path,
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

module.exports = { validate, validateBody, validateQuery };
