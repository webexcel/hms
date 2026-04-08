require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { getMasterSequelize, getMasterTenant, getTenantModels, closeAllConnections } = require('./config/connectionManager');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';

// In production, never auto-alter schema. Use migrations instead.
const syncOptions = isDev ? { alter: true } : { alter: false };

async function start() {
  try {
    logger.info(`Starting server in ${NODE_ENV} mode...`);

    // 1. Connect and sync master database
    const masterSeq = getMasterSequelize();
    await masterSeq.authenticate();
    logger.info('Master database connected.');
    await masterSeq.sync(syncOptions);
    logger.info('Master database synced.');

    // 2. Sync all active tenant databases
    const Tenant = getMasterTenant();
    const tenants = await Tenant.findAll({ where: { is_active: true } });
    logger.info(`Found ${tenants.length} active tenant(s).`);

    for (const t of tenants) {
      try {
        const models = getTenantModels(t.db_name);
        await models.sequelize.authenticate();
        await models.sequelize.sync(syncOptions);
        logger.info(`  ✓ ${t.name} (${t.db_name}) synced.`);
      } catch (err) {
        logger.error(`  ✗ ${t.name} (${t.db_name}) failed: ${err.message}`);
      }
    }

    // 3. Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${NODE_ENV}]`);

      // Initialize job queues (gracefully handles missing Redis)
      try {
        const { initQueues } = require('./services/queue');
        initQueues();
      } catch (err) {
        logger.warn(`Job queues not started (Redis may not be configured): ${err.message}`);
      }

      // Start scheduled jobs
      try {
        const { startScheduler } = require('./services/scheduler');
        startScheduler();
      } catch (err) {
        logger.warn(`Scheduler not started: ${err.message}`);
      }
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Stop accepting new connections
      server.close(() => {
        logger.info('HTTP server closed.');
      });

      // Close DB connections
      await closeAllConnections();

      // Force exit after 10s if cleanup hangs
      const forceTimer = setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
      forceTimer.unref();

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Catch unhandled errors so the process doesn't crash silently
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', { reason: String(reason) });
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
      shutdown('uncaughtException');
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

start();
