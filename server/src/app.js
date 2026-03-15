const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const clsNamespace = require('./config/cls');
const { errorHandler } = require('./middleware/errorHandler');
const { requestTimeout, sanitizeBody } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const reservationRoutes = require('./routes/reservations');
const billingRoutes = require('./routes/billing');
const restaurantRoutes = require('./routes/restaurant');
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

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
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

// Request timeout (30 seconds)
app.use(requestTimeout(30000));

// Sanitize request bodies (skip webhook routes - they need raw payloads)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/webhooks')) return next();
  sanitizeBody(req, res, next);
});

// Bind CLS namespace to each request (required for tenant scoping)
app.use((req, res, next) => {
  clsNamespace.run(() => next());
});

// API Routes
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/guests', guestRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/housekeeping', housekeepingRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/rates', rateRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/shift-handover', shiftHandoverRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/channels', channelRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Health check with channel connectivity
app.get('/api/health', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString() };

  try {
    const { OtaChannel } = require('./models');
    const channels = await OtaChannel.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code', 'last_sync_at'],
      raw: true,
      _bypassTenant: true,
    });
    health.channels = channels.map((ch) => ({
      name: ch.name,
      code: ch.code,
      last_sync: ch.last_sync_at,
    }));
  } catch (e) {
    health.channels = [];
  }

  res.json(health);
});

// Error handler
app.use(errorHandler);

module.exports = app;
