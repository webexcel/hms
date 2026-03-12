const inventorySync = require('../../inventorySync');
const { getAdapter } = require('../../channelManager');
const { OtaChannel, ChannelSyncLog } = require('../../../models');

/**
 * Process availability sync job.
 * Job data: { roomType, fromDate, toDate } or { full: true }
 */
module.exports = async function processAvailabilitySync(job) {
  const { roomType, fromDate, toDate, channelId } = job.data;

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
      const inventory = await inventorySync.getInventoryData(roomType, fromDate, toDate);
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
};
