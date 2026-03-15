require('dotenv').config();
const app = require('./app');
const { getMasterSequelize, getMasterTenant, getTenantModels, closeAllConnections } = require('./config/connectionManager');

const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

async function start() {
  try {
    // 1. Connect and sync master database
    const masterSeq = getMasterSequelize();
    await masterSeq.authenticate();
    console.log('Master database connected.');
    await masterSeq.sync({ alter: isDev });
    console.log('Master database synced.');

    // 2. Sync all active tenant databases
    const Tenant = getMasterTenant();
    const tenants = await Tenant.findAll({ where: { is_active: true } });
    console.log(`Found ${tenants.length} active tenant(s).`);

    for (const t of tenants) {
      try {
        const models = getTenantModels(t.db_name);
        await models.sequelize.authenticate();
        await models.sequelize.sync({ alter: isDev });
        console.log(`  ✓ ${t.name} (${t.db_name}) synced.`);
      } catch (err) {
        console.error(`  ✗ ${t.name} (${t.db_name}) failed:`, err.message);
      }
    }

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Initialize job queues (gracefully handles missing Redis)
      try {
        const { initQueues } = require('./services/queue');
        initQueues();
      } catch (err) {
        console.warn('Job queues not started (Redis may not be configured):', err.message);
      }

      // Start scheduled jobs
      try {
        const { startScheduler } = require('./services/scheduler');
        startScheduler();
      } catch (err) {
        console.warn('Scheduler not started:', err.message);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Shutting down...');
      await closeAllConnections();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
