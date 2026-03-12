require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synced.');

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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
