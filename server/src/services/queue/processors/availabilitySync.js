const inventorySync = require('../../inventorySync');
const { getAdapter } = require('../../channelManager');
const { getTenantModels, getMasterTenant } = require('../../../config/connectionManager');
const logger = require('../../../utils/logger');

/**
 * Process availability sync job.
 * Job data: { roomType, fromDate, toDate, channelId, dbName }
 *
 * If dbName is provided, operates on that single tenant.
 * Otherwise iterates all active tenants.
 */
module.exports = async function processAvailabilitySync(job) {
  const { roomType, fromDate, toDate, channelId, dbName } = job.data;

  async function syncForTenant(db) {
    const { OtaChannel, ChannelSyncLog } = db;

    // Get target channels
    let channels;
    if (channelId) {
      const ch = await OtaChannel.findByPk(channelId);
      channels = ch ? [ch] : [];
    } else {
      channels = await OtaChannel.findAll({ where: { is_active: true } });
    }

    for (const channel of channels) {
      const syncConfig = channel.sync_config || {};
      if (!syncConfig.push_availability) continue;

      try {
        const adapter = getAdapter(channel.code);
        const inventory = await inventorySync.getInventoryData(db, roomType, fromDate, toDate);
        await adapter.pushAvailability(channel, inventory);

        await ChannelSyncLog.create({
          channel_id: channel.id,
          direction: 'outbound',
          operation: 'push_availability',
          request_payload: { roomType, fromDate, toDate, itemCount: inventory.length },
          status: 'success',
        });

        await channel.update({ last_sync_at: new Date() });
      } catch (err) {
        await ChannelSyncLog.create({
          channel_id: channel.id,
          direction: 'outbound',
          operation: 'push_availability',
          status: 'failed',
          error_message: err.message,
          retry_count: job.attemptsMade,
        });
        throw err; // Let Bull handle retries
      }
    }
  }

  if (dbName) {
    const db = getTenantModels(dbName);
    await syncForTenant(db);
  } else {
    // Iterate all tenants
    const Tenant = getMasterTenant();
    const tenants = await Tenant.findAll({ where: { is_active: true }, raw: true });
    for (const tenant of tenants) {
      try {
        const db = getTenantModels(tenant.db_name);
        await syncForTenant(db);
      } catch (err) {
        logger.error(`Availability sync failed for tenant ${tenant.name}:`, err.message);
      }
    }
  }
};
