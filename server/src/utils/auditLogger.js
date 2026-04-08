const logger = require('./logger');
/**
 * Log an audit event.
 *
 * @param {Object} AuditLog - The AuditLog model (from req.db.AuditLog)
 * @param {Object} options
 * @param {string} options.action - e.g. 'create', 'update', 'delete', 'check_in'
 * @param {string} options.entity_type - e.g. 'Reservation', 'Payment', 'Room'
 * @param {number} [options.entity_id]
 * @param {number} [options.user_id]
 * @param {Object} [options.old_values]
 * @param {Object} [options.new_values]
 * @param {string} [options.ip_address]
 * @param {string} [options.source] - 'user', 'system', 'api', 'ota'
 * @param {number} [options.channel_id] - FK to OtaChannel
 */
async function logAudit(AuditLog, {
  action,
  entity_type,
  entity_id = null,
  user_id = null,
  old_values = null,
  new_values = null,
  ip_address = null,
  source = 'user',
  channel_id = null,
}) {
  try {
    await AuditLog.create({
      action,
      entity_type,
      entity_id,
      user_id,
      old_values,
      new_values,
      ip_address,
      source,
      channel_id,
    });
  } catch (err) {
    // Audit logging should never crash the main flow
    logger.error('Audit log write failed:', err.message);
  }
}

/**
 * Create audit logger from Express request context.
 * Uses req.db.AuditLog automatically.
 */
function auditFromReq(req) {
  return (opts) =>
    logAudit(req.db.AuditLog, {
      ...opts,
      user_id: opts.user_id ?? req.user?.id,
      ip_address: opts.ip_address ?? req.ip,
      source: opts.source ?? (req.channel ? 'ota' : 'user'),
      channel_id: opts.channel_id ?? req.channel?.id,
    });
}

module.exports = { logAudit, auditFromReq };
