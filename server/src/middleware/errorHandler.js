const logger = require('../utils/logger');
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

function errorHandler(err, req, res, _next) {
  // Structured logging — full stack in dev, sanitized in production
  logger.error(err.message, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    name: err.name,
    ...(isDev && { stack: err.stack }),
  });

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate Entry',
      details: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  if (err.unrecoverable) {
    return res.status(400).json({
      error: err.message || 'OTA API Error',
      unrecoverable: true,
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 && !isDev ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
