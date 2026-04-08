const axios = require('axios');
const { decryptJSON } = require('../../utils/encryption');
const logger = require('../../utils/logger');

// Simple circuit breaker state per channel
const circuitBreakers = new Map();
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 60000;

function getCircuitState(channelId) {
  if (!circuitBreakers.has(channelId)) {
    circuitBreakers.set(channelId, { failures: 0, openedAt: null });
  }
  return circuitBreakers.get(channelId);
}

function isCircuitOpen(channelId) {
  const state = getCircuitState(channelId);
  if (state.failures < FAILURE_THRESHOLD) return false;
  if (state.openedAt && Date.now() - state.openedAt > COOLDOWN_MS) {
    // Half-open: allow one request through
    state.failures = FAILURE_THRESHOLD - 1;
    state.openedAt = null;
    return false;
  }
  return true;
}

function recordSuccess(channelId) {
  const state = getCircuitState(channelId);
  state.failures = 0;
  state.openedAt = null;
}

function recordFailure(channelId) {
  const state = getCircuitState(channelId);
  state.failures += 1;
  if (state.failures >= FAILURE_THRESHOLD && !state.openedAt) {
    state.openedAt = Date.now();
    logger.error(`Circuit breaker OPEN for channel ${channelId}`);
  }
}

/**
 * Make an HTTP request to an OTA API with retry, logging, and circuit breaker.
 *
 * @param {Object} options
 * @param {Object} options.channel - OtaChannel instance
 * @param {string} options.method - HTTP method
 * @param {string} options.path - URL path (appended to channel.api_url)
 * @param {Object} [options.data] - Request body
 * @param {Object} [options.headers] - Additional headers
 * @param {string} options.operation - Operation name for logging
 * @param {string} [options.correlationId]
 * @param {Object} [options.ChannelSyncLog] - The ChannelSyncLog model for logging (per-tenant)
 */
async function otaRequest({ channel, method, path, data, headers = {}, operation, correlationId, ChannelSyncLog }) {
  if (isCircuitOpen(channel.id)) {
    throw new Error(`Circuit breaker open for channel ${channel.code}. Retry later.`);
  }

  // Decrypt credentials if present
  let credentials = {};
  if (channel.api_credentials) {
    try {
      credentials = decryptJSON(channel.api_credentials);
    } catch (e) {
      logger.error('Failed to decrypt channel credentials:', e.message);
    }
  }

  const url = `${channel.api_url}${path}`;
  const startTime = Date.now();

  const logEntry = {
    channel_id: channel.id,
    direction: 'outbound',
    operation,
    endpoint: url,
    request_payload: data || null,
    correlation_id: correlationId || null,
    status: 'pending',
  };

  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(credentials.api_key ? { 'Authorization': `Bearer ${credentials.api_key}` } : {}),
        ...(credentials.auth_header || {}),
        ...headers,
      },
      timeout: 15000,
    });

    recordSuccess(channel.id);

    if (ChannelSyncLog) {
      await ChannelSyncLog.create({
        ...logEntry,
        response_payload: response.data,
        status: 'success',
        status_code: response.status,
        duration_ms: Date.now() - startTime,
      });
    }

    return response.data;
  } catch (err) {
    recordFailure(channel.id);

    const statusCode = err.response?.status || null;
    const errorMsg = err.response?.data?.message || err.message;

    if (ChannelSyncLog) {
      await ChannelSyncLog.create({
        ...logEntry,
        response_payload: err.response?.data || null,
        status: statusCode === 408 || err.code === 'ECONNABORTED' ? 'timeout' : 'failed',
        status_code: statusCode,
        error_message: errorMsg,
        duration_ms: Date.now() - startTime,
      });
    }

    // Don't retry on 4xx (client errors)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const error = new Error(`OTA API error (${statusCode}): ${errorMsg}`);
      error.unrecoverable = true;
      throw error;
    }

    throw err;
  }
}

module.exports = { otaRequest };
