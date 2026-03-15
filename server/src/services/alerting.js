const { Op } = require('sequelize');
const dayjs = require('dayjs');
const notificationService = require('./notification');
const { getMasterTenant, getTenantModels } = require('../config/connectionManager');

/**
 * Check for sync failures and alert.
 * Iterates all active tenants.
 */
async function checkSyncFailures() {
  try {
    const Tenant = getMasterTenant();
    const tenants = await Tenant.findAll({ where: { is_active: true }, raw: true });

    for (const tenant of tenants) {
      try {
        const db = getTenantModels(tenant.db_name);
        const { ChannelSyncLog, OtaChannel } = db;

        const recentFailures = await ChannelSyncLog.findAll({
          where: {
            status: 'failed',
            created_at: { [Op.gte]: dayjs().subtract(1, 'hour').toDate() },
          },
          include: [{ model: OtaChannel, as: 'channel', attributes: ['name', 'code'] }],
        });

        if (recentFailures.length >= 5) {
          const channels = [...new Set(recentFailures.map((f) => f.channel?.name || 'Unknown'))];
          await notificationService.sendAlert({
            subject: `[${tenant.name}] ${recentFailures.length} Sync Failures in Last Hour`,
            message: `Channels affected: ${channels.join(', ')}. Check sync logs for details.`,
          });
        }
      } catch (err) {
        console.error(`Sync failure check error for tenant ${tenant.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Sync failure check error:', err.message);
  }
}

/**
 * Check for stale webhooks (received but not processed for >30 min).
 * Iterates all active tenants.
 */
async function checkStaleWebhooks() {
  try {
    const Tenant = getMasterTenant();
    const tenants = await Tenant.findAll({ where: { is_active: true }, raw: true });

    for (const tenant of tenants) {
      try {
        const db = getTenantModels(tenant.db_name);
        const { WebhookEvent } = db;

        const staleCount = await WebhookEvent.count({
          where: {
            status: { [Op.in]: ['received', 'processing'] },
            created_at: { [Op.lt]: dayjs().subtract(30, 'minute').toDate() },
          },
        });

        if (staleCount > 0) {
          await notificationService.sendAlert({
            subject: `[${tenant.name}] ${staleCount} Stale Webhook Events`,
            message: `There are ${staleCount} webhook events that haven't been processed in 30+ minutes.`,
          });
        }
      } catch (err) {
        console.error(`Stale webhook check error for tenant ${tenant.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Stale webhook check error:', err.message);
  }
}

module.exports = { checkSyncFailures, checkStaleWebhooks };
