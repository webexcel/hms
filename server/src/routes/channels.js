const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const channelController = require('../controllers/channelController');

// All channel management routes require JWT auth + admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

// Channel CRUD
router.get('/', channelController.listChannels);
router.post('/', channelController.createChannel);
router.get('/:id', channelController.getChannel);
router.put('/:id', channelController.updateChannel);
router.delete('/:id', channelController.deleteChannel);

// Channel operations
router.post('/:id/test', channelController.testConnection);
router.post('/:id/sync', channelController.triggerSync);

// Sync logs
router.get('/:id/logs', channelController.getSyncLogs);

// Rate mappings
router.get('/:id/rate-mappings', channelController.listRateMappings);
router.post('/:id/rate-mappings', channelController.createRateMapping);
router.put('/:id/rate-mappings/:mappingId', channelController.updateRateMapping);
router.delete('/:id/rate-mappings/:mappingId', channelController.deleteRateMapping);

// API keys (not channel-specific)
router.get('/api-keys/list', channelController.listApiKeys);
router.post('/api-keys', channelController.createApiKey);
router.put('/api-keys/:keyId/revoke', channelController.revokeApiKey);

// Reconciliation
router.get('/:id/reconciliation', channelController.listReconciliations);

module.exports = router;
