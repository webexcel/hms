const { Op } = require('sequelize');
const { getAdapter } = require('../services/channelManager');
const inventorySync = require('../services/inventorySync');
const { pushRatesToChannels } = require('../services/rateSync');
const { encryptJSON, generateApiKey, hashApiKey } = require('../utils/encryption');
const { logAudit } = require('../utils/auditLogger');
const { getPagination, getPagingData } = require('../utils/pagination');
const dayjs = require('dayjs');
const logger = require('../utils/logger');

// === Channel CRUD ===

const listChannels = async (req, res, next) => {
  try {
    const { OtaChannel } = req.db;
    const channels = await OtaChannel.findAll({
      order: [['name', 'ASC']],
      attributes: { exclude: ['api_credentials'] },
    });
    res.json(channels);
  } catch (error) {
    next(error);
  }
};

const getChannel = async (req, res, next) => {
  try {
    const { OtaChannel, ChannelRateMapping, RatePlan } = req.db;
    const channel = await OtaChannel.findByPk(req.params.id, {
      attributes: { exclude: ['api_credentials'] },
      include: [
        { model: ChannelRateMapping, as: 'rateMappings', include: [{ model: RatePlan, as: 'ratePlan' }] },
      ],
    });
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
  } catch (error) {
    next(error);
  }
};

const createChannel = async (req, res, next) => {
  try {
    const { OtaChannel } = req.db;
    const { api_credentials, ...rest } = req.body;

    const data = { ...rest };
    if (api_credentials) {
      data.api_credentials = encryptJSON(api_credentials);
    }

    const channel = await OtaChannel.create(data);

    await logAudit(req.db.AuditLog, {
      action: 'create',
      entity_type: 'OtaChannel',
      entity_id: channel.id,
      user_id: req.user.id,
      ip_address: req.ip,
      new_values: { name: channel.name, code: channel.code },
    });

    res.status(201).json(channel);
  } catch (error) {
    next(error);
  }
};

const updateChannel = async (req, res, next) => {
  try {
    const { OtaChannel } = req.db;
    const channel = await OtaChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const { api_credentials, ...rest } = req.body;
    const data = { ...rest };
    if (api_credentials) {
      data.api_credentials = encryptJSON(api_credentials);
    }

    const oldValues = channel.toJSON();
    delete oldValues.api_credentials;

    await channel.update(data);

    await logAudit(req.db.AuditLog, {
      action: 'update',
      entity_type: 'OtaChannel',
      entity_id: channel.id,
      user_id: req.user.id,
      ip_address: req.ip,
      old_values: oldValues,
      new_values: rest,
    });

    res.json(channel);
  } catch (error) {
    next(error);
  }
};

const deleteChannel = async (req, res, next) => {
  try {
    const { OtaChannel } = req.db;
    const channel = await OtaChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    await channel.update({ is_active: false });

    await logAudit(req.db.AuditLog, {
      action: 'deactivate',
      entity_type: 'OtaChannel',
      entity_id: channel.id,
      user_id: req.user.id,
      ip_address: req.ip,
    });

    res.json({ message: 'Channel deactivated' });
  } catch (error) {
    next(error);
  }
};

// === Test Connection ===

const testConnection = async (req, res, next) => {
  try {
    const { OtaChannel } = req.db;
    const channel = await OtaChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const adapter = getAdapter(channel.code);
    const result = await adapter.testConnection(channel);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// === Manual Full Sync ===

const triggerSync = async (req, res, next) => {
  try {
    const { OtaChannel, ChannelRateMapping } = req.db;
    const channel = await OtaChannel.findByPk(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const daysAhead = channel.sync_config?.inventory_days_ahead || 30;
    const fromDate = dayjs().format('YYYY-MM-DD');
    const toDate = dayjs().add(daysAhead, 'day').format('YYYY-MM-DD');

    // Recalculate inventory first
    await inventorySync.recalculateInventory(req.db, null, fromDate, toDate);

    // Queue sync for this channel
    try {
      const { availabilitySyncQueue, rateSyncQueue } = require('../services/queue');
      await availabilitySyncQueue.add({ fromDate, toDate, channelId: channel.id });

      // Push all OTA-visible rate plans
      const mappings = await ChannelRateMapping.findAll({
        where: { channel_id: channel.id, is_active: true },
      });
      for (const mapping of mappings) {
        await rateSyncQueue.add({ ratePlanId: mapping.rate_plan_id });
      }
    } catch (err) {
      logger.warn('Queue not available for sync:', err.message);
    }

    await channel.update({ last_sync_at: new Date() });
    res.json({ message: 'Full sync triggered', fromDate, toDate });
  } catch (error) {
    next(error);
  }
};

// === Sync Logs ===

const getSyncLogs = async (req, res, next) => {
  try {
    const { ChannelSyncLog } = req.db;
    const { page = 1, limit = 20, status, operation } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const where = { channel_id: req.params.id };
    if (status) where.status = status;
    if (operation) where.operation = operation;

    const result = await ChannelSyncLog.findAndCountAll({
      where,
      limit: size,
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json(getPagingData(result, page, size));
  } catch (error) {
    next(error);
  }
};

// === Rate Mappings ===

const listRateMappings = async (req, res, next) => {
  try {
    const { ChannelRateMapping, RatePlan } = req.db;
    const mappings = await ChannelRateMapping.findAll({
      where: { channel_id: req.params.id },
      include: [{ model: RatePlan, as: 'ratePlan' }],
      order: [['created_at', 'DESC']],
    });
    res.json(mappings);
  } catch (error) {
    next(error);
  }
};

const createRateMapping = async (req, res, next) => {
  try {
    const { ChannelRateMapping } = req.db;
    const mapping = await ChannelRateMapping.create({
      channel_id: req.params.id,
      ...req.body,
    });
    res.status(201).json(mapping);
  } catch (error) {
    next(error);
  }
};

const updateRateMapping = async (req, res, next) => {
  try {
    const { ChannelRateMapping } = req.db;
    const mapping = await ChannelRateMapping.findByPk(req.params.mappingId);
    if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
    await mapping.update(req.body);
    res.json(mapping);
  } catch (error) {
    next(error);
  }
};

const deleteRateMapping = async (req, res, next) => {
  try {
    const { ChannelRateMapping } = req.db;
    const mapping = await ChannelRateMapping.findByPk(req.params.mappingId);
    if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
    await mapping.destroy();
    res.json({ message: 'Mapping deleted' });
  } catch (error) {
    next(error);
  }
};

// === API Key Management ===

const listApiKeys = async (req, res, next) => {
  try {
    const { ApiKey, OtaChannel } = req.db;
    const keys = await ApiKey.findAll({
      include: [{ model: OtaChannel, as: 'channel', attributes: ['id', 'name', 'code'] }],
      attributes: { exclude: ['key_hash'] },
      order: [['created_at', 'DESC']],
    });
    res.json(keys);
  } catch (error) {
    next(error);
  }
};

const createApiKey = async (req, res, next) => {
  try {
    const { ApiKey } = req.db;
    const { name, channel_id, permissions, rate_limit, expires_at } = req.body;

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = await ApiKey.create({
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      channel_id,
      permissions: permissions || ['booking.create', 'booking.modify', 'booking.cancel'],
      rate_limit: rate_limit || 1000,
      expires_at,
    });

    await logAudit(req.db.AuditLog, {
      action: 'create',
      entity_type: 'ApiKey',
      entity_id: apiKey.id,
      user_id: req.user.id,
      ip_address: req.ip,
      new_values: { name, channel_id, key_prefix: keyPrefix },
    });

    // Return the raw key ONLY on creation - it can never be retrieved again
    res.status(201).json({
      ...apiKey.toJSON(),
      raw_key: rawKey,
      message: 'Store this API key securely. It cannot be retrieved again.',
    });
  } catch (error) {
    next(error);
  }
};

const revokeApiKey = async (req, res, next) => {
  try {
    const { ApiKey } = req.db;
    const apiKey = await ApiKey.findByPk(req.params.keyId);
    if (!apiKey) return res.status(404).json({ message: 'API key not found' });

    await apiKey.update({ is_active: false });

    await logAudit(req.db.AuditLog, {
      action: 'revoke',
      entity_type: 'ApiKey',
      entity_id: apiKey.id,
      user_id: req.user.id,
      ip_address: req.ip,
    });

    res.json({ message: 'API key revoked' });
  } catch (error) {
    next(error);
  }
};

// === Reconciliation ===

const listReconciliations = async (req, res, next) => {
  try {
    const { OtaReconciliation, OtaChannel } = req.db;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const where = {};
    if (req.params.id) where.channel_id = req.params.id;

    const result = await OtaReconciliation.findAndCountAll({
      where,
      include: [{ model: OtaChannel, as: 'channel', attributes: ['id', 'name', 'code'] }],
      limit: size,
      offset,
      order: [['period_end', 'DESC']],
    });

    res.json(getPagingData(result, page, size));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  testConnection,
  triggerSync,
  getSyncLogs,
  listRateMappings,
  createRateMapping,
  updateRateMapping,
  deleteRateMapping,
  listApiKeys,
  createApiKey,
  revokeApiKey,
  listReconciliations,
};
