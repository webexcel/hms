const MmtAdapter = require('./mmtAdapter');
const GoibiboAdapter = require('./goibiboAdapter');

const adapters = {
  mmt: new MmtAdapter(),
  goibibo: new GoibiboAdapter(),
};

/**
 * Get the appropriate adapter for a channel code.
 * @param {string} channelCode - e.g., 'mmt', 'goibibo'
 * @returns {BaseAdapter}
 */
function getAdapter(channelCode) {
  const adapter = adapters[channelCode?.toLowerCase()];
  if (!adapter) {
    throw new Error(`No adapter found for channel: ${channelCode}`);
  }
  return adapter;
}

/**
 * Register a new adapter (for extending with Booking.com, Agoda, etc.)
 */
function registerAdapter(code, adapter) {
  adapters[code.toLowerCase()] = adapter;
}

module.exports = { getAdapter, registerAdapter };
