const { getAdapter } = require('../../channelManager');
const { OtaChannel, ChannelRateMapping, RatePlan, ChannelSyncLog } = require('../../../models');

/**
 * Process rate sync job.
 * Job data: { ratePlanId }
 */
module.exports = async function processRateSync(job) {
  const { ratePlanId } = job.data;

  const mappings = await ChannelRateMapping.findAll({
    where: { rate_plan_id: ratePlanId, is_active: true },
    include: [
      { model: OtaChannel, as: 'channel', where: { is_active: true } },
      { model: RatePlan, as: 'ratePlan' },
    ],
  });

  for (const mapping of mappings) {
    const channel = mapping.channel;
    const syncConfig = channel.sync_config || {};
    if (!syncConfig.push_rates) continue;

    try {
      const adapter = getAdapter(channel.code);
      const ratePlan = mapping.ratePlan;

      // Apply markup
      let rate = parseFloat(ratePlan.base_rate);
      if (mapping.markup_type === 'percentage') {
        rate += rate * (parseFloat(mapping.markup_value) / 100);
      } else {
        rate += parseFloat(mapping.markup_value);
      }

      await adapter.pushRates(channel, {
        ota_room_code: mapping.ota_room_code,
        ota_rate_code: mapping.ota_rate_code,
        base_rate: parseFloat(rate.toFixed(2)),
        weekend_rate: ratePlan.weekend_rate
          ? parseFloat((parseFloat(ratePlan.weekend_rate) + (mapping.markup_type === 'percentage'
              ? parseFloat(ratePlan.weekend_rate) * (parseFloat(mapping.markup_value) / 100)
              : parseFloat(mapping.markup_value))).toFixed(2))
          : null,
        meal_plan: ratePlan.meal_plan,
        cancellation_policy: ratePlan.cancellation_policy,
      });

      await ChannelSyncLog.create({
        channel_id: channel.id,
        direction: 'outbound',
        operation: 'push_rates',
        request_payload: { ratePlanId, rate, ota_room_code: mapping.ota_room_code },
        status: 'success',
      });
    } catch (err) {
      await ChannelSyncLog.create({
        channel_id: channel.id,
        direction: 'outbound',
        operation: 'push_rates',
        status: 'failed',
        error_message: err.message,
        retry_count: job.attemptsMade,
      });
      throw err;
    }
  }
};
