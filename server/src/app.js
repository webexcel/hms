const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { requestTimeout, sanitizeBody } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const reservationRoutes = require('./routes/reservations');
const billingRoutes = require('./routes/billing');
const restaurantRoutes = require('./routes/restaurant');
const laundryRoutes = require('./routes/laundry');
const housekeepingRoutes = require('./routes/housekeeping');
const staffRoutes = require('./routes/staff');
const inventoryRoutes = require('./routes/inventory');
const rateRoutes = require('./routes/rates');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const shiftHandoverRoutes = require('./routes/shiftHandover');
const userRoutes = require('./routes/users');
const channelRoutes = require('./routes/channels');
const webhookRoutes = require('./routes/webhooks');
const tenantRoutes = require('./routes/tenants');
const publicRoutes = require('./routes/public');
const expenseRoutes = require('./routes/expenses');

const app = express();

// Trust proxy (Apache/Nginx forwards X-Forwarded-For)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL, process.env.WEBSITE_URL].filter(Boolean).flatMap(u => u.split(',').map(s => s.trim())).filter(Boolean)
  : null; // Allow all origins in development

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // In development, allow all origins
    if (!allowedOrigins) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Signature'],
}));

// Global rate limiting (500 req / 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Higher rate limit for webhook endpoints (1000 req / 15 min)
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
});
app.use('/api/v1/webhooks', webhookLimiter);

// Capture raw body for webhook signature verification (before JSON parsing)
app.use('/api/v1/webhooks', express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));

// Body parsing (for all other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request ID — attach a unique ID to every request for log tracing
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// HTTP request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    // Skip noisy health check logs
    if (req.path === '/api/health') return;
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
    });
  });
  next();
});

// Request timeout (30 seconds)
app.use(requestTimeout(30000));

// Sanitize request bodies (skip webhook routes - they need raw payloads)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/webhooks')) return next();
  sanitizeBody(req, res, next);
});

// Public API (no auth required) — rate limited
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/v1/public', publicLimiter, publicRoutes);

// API Routes
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/guests', guestRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/laundry', laundryRoutes);
app.use('/api/v1/housekeeping', housekeepingRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/rates', rateRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/shift-handover', shiftHandoverRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/channels', channelRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Health check — lightweight liveness probe
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Deep health check — readiness probe (checks DB connectivity)
app.get('/api/health/ready', async (req, res) => {
  const checks = {};
  let healthy = true;

  // Check master DB
  try {
    const { getMasterSequelize } = require('./config/connectionManager');
    await getMasterSequelize().authenticate();
    checks.database = 'ok';
  } catch (err) {
    checks.database = err.message;
    healthy = false;
  }

  // Check Redis (optional — may not be configured)
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redis.connect();
    await redis.ping();
    checks.redis = 'ok';
    await redis.quit();
  } catch {
    checks.redis = 'unavailable';
  }

  const status = healthy ? 200 : 503;
  res.status(status).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    checks,
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
