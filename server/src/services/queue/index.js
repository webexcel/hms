const Bull = require('bull');
const net = require('net');
const logger = require('../../utils/logger');

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

let availabilitySyncQueue = null;
let rateSyncQueue = null;
let bookingNotificationQueue = null;
let webhookProcessQueue = null;
let redisAvailable = false;

function checkRedis() {
  return new Promise((resolve) => {
    const socket = net.createConnection(redisConfig.port, redisConfig.host);
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

function createQueues() {
  availabilitySyncQueue = new Bull('availability-sync', defaultOpts);
  rateSyncQueue = new Bull('rate-sync', defaultOpts);
  bookingNotificationQueue = new Bull('booking-notification', defaultOpts);
  webhookProcessQueue = new Bull('ota-webhook-process', defaultOpts);

  const queues = [availabilitySyncQueue, rateSyncQueue, bookingNotificationQueue, webhookProcessQueue];
  queues.forEach((q) => {
    q.on('error', (err) => logger.error(`Queue ${q.name} error:`, err.message));
    q.on('failed', (job, err) => logger.error(`Job ${job.id} in ${q.name} failed:`, err.message));
  });
}

/**
 * Initialize all queue processors.
 */
async function initQueues() {
  try {
    redisAvailable = await checkRedis();
    if (!redisAvailable) {
      logger.warn('Redis not available — job queues disabled. Core features still work.');
      return;
    }

    createQueues();

    const availabilityProcessor = require('./processors/availabilitySync');
    const rateSyncProcessor = require('./processors/rateSync');
    const bookingNotifProcessor = require('./processors/bookingNotification');
    const webhookProcessor = require('./processors/webhookProcessor');

    availabilitySyncQueue.process(5, availabilityProcessor);
    rateSyncQueue.process(3, rateSyncProcessor);
    bookingNotificationQueue.process(5, bookingNotifProcessor);
    webhookProcessQueue.process(3, webhookProcessor);

    logger.info('Job queues initialized.');
  } catch (err) {
    logger.warn('Queue initialization skipped (Redis may not be available):', err.message);
  }
}

// No-op wrapper that safely adds jobs only when Redis is available
function safeAdd(queue) {
  return async (...args) => {
    if (!queue) return null;
    return queue.add(...args);
  };
}

module.exports = {
  get availabilitySyncQueue() { return availabilitySyncQueue; },
  get rateSyncQueue() { return rateSyncQueue; },
  get bookingNotificationQueue() { return bookingNotificationQueue; },
  get webhookProcessQueue() { return webhookProcessQueue; },
  get redisAvailable() { return redisAvailable; },
  initQueues,
};
