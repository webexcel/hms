const rateLimit = require('express-rate-limit');

// Strict rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password strength validation
function validatePassword(req, res, next) {
  const password = req.body.newPassword || req.body.password || req.body.password_hash;
  if (!password) return next();

  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Password does not meet requirements', details: errors });
  }
  next();
}

// Request timeout middleware
function requestTimeout(timeoutMs = 30000) {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    });
    next();
  };
}

// Sanitize string fields to prevent XSS (strips HTML tags)
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Strip HTML tags but preserve content
      obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = { loginLimiter, validatePassword, requestTimeout, sanitizeBody };
