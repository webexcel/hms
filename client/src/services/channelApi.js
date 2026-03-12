import api from './api';

// Channels
export const getChannels = () => api.get('/channels');
export const getChannel = (id) => api.get(`/channels/${id}`);
export const createChannel = (data) => api.post('/channels', data);
export const updateChannel = (id, data) => api.put(`/channels/${id}`, data);
export const deleteChannel = (id) => api.delete(`/channels/${id}`);
export const testChannelConnection = (id) => api.post(`/channels/${id}/test`);
export const triggerChannelSync = (id) => api.post(`/channels/${id}/sync`);

// Sync Logs
export const getSyncLogs = (id, params) => api.get(`/channels/${id}/logs`, { params });

// Rate Mappings
export const getRateMappings = (channelId) => api.get(`/channels/${channelId}/rate-mappings`);
export const createRateMapping = (channelId, data) => api.post(`/channels/${channelId}/rate-mappings`, data);
export const updateRateMapping = (channelId, mappingId, data) => api.put(`/channels/${channelId}/rate-mappings/${mappingId}`, data);
export const deleteRateMapping = (channelId, mappingId) => api.delete(`/channels/${channelId}/rate-mappings/${mappingId}`);

// API Keys
export const getApiKeys = () => api.get('/channels/api-keys/list');
export const createApiKey = (data) => api.post('/channels/api-keys', data);
export const revokeApiKey = (keyId) => api.put(`/channels/api-keys/${keyId}/revoke`);

// Reconciliation
export const getReconciliations = (channelId, params) => api.get(`/channels/${channelId}/reconciliation`, { params });
