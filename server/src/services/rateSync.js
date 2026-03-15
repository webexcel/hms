/**
 * Push rate plan to all active channels that have a mapping.
 * @param {Object} db - Tenant models object
 */
async function pushRatesToChannels(db, ratePlanId) {
  try {
    const { rateSyncQueue } = require('./queue');
    await rateSyncQueue.add({ ratePlanId }, { priority: 2 });
  } catch (err) {
    console.warn('Failed to queue rate sync:', err.message);
  }
}

/**
 * Called when a rate plan is created or updated.
 * Checks if the plan is OTA-visible, then pushes to mapped channels.
 * @param {Object} db - Tenant models object
 */
async function handleRateChange(db, ratePlanId) {
  try {
    const { RatePlan, ChannelRateMapping, OtaChannel } = db;
    const ratePlan = await RatePlan.findByPk(ratePlanId);

    if (!ratePlan || !ratePlan.is_ota_visible) return;

    const mappings = await ChannelRateMapping.findAll({
      where: { rate_plan_id: ratePlanId, is_active: true },
      include: [{ model: OtaChannel, as: 'channel', where: { is_active: true } }],
    });

    if (mappings.length === 0) return;

    await pushRatesToChannels(db, ratePlanId);
  } catch (err) {
    console.error('Rate sync after rate change failed:', err.message);
  }
}

module.exports = {
  pushRatesToChannels,
  handleRateChange,
};
