const Bull = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const defaultOpts = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
};

// Queue definitions
const availabilitySyncQueue = new Bull('availability-sync', defaultOpts);
const rateSyncQueue = new Bull('rate-sync', defaultOpts);
const bookingNotificationQueue = new Bull('booking-notification', defaultOpts);
const webhookProcessQueue = new Bull('ota-webhook-process', defaultOpts);

// Error handlers
const queues = [availabilitySyncQueue, rateSyncQueue, bookingNotificationQueue, webhookProcessQueue];
queues.forEach((q) => {
  q.on('error', (err) => console.error(`Queue ${q.name} error:`, err.message));
  q.on('failed', (job, err) => console.error(`Job ${job.id} in ${q.name} failed:`, err.message));
});

/**
 * Initialize all queue processors.
 */
function initQueues() {
  try {
    const availabilityProcessor = require('./processors/availabilitySync');
    const rateSyncProcessor = require('./processors/rateSync');
    const bookingNotifProcessor = require('./processors/bookingNotification');
    const webhookProcessor = require('./processors/webhookProcessor');

    availabilitySyncQueue.process(5, availabilityProcessor);
    rateSyncQueue.process(3, rateSyncProcessor);
    bookingNotificationQueue.process(5, bookingNotifProcessor);
    webhookProcessQueue.process(3, webhookProcessor);

    console.log('Job queues initialized.');
  } catch (err) {
    console.warn('Queue initialization skipped (Redis may not be available):', err.message);
  }
}

module.exports = {
  availabilitySyncQueue,
  rateSyncQueue,
  bookingNotificationQueue,
  webhookProcessQueue,
  initQueues,
};
