const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// All routes require admin, manager, or front_desk role
router.use(authorize('admin', 'manager', 'front_desk'));

// GET /stats - must be before /:id to avoid conflict
router.get('/stats', billingController.getStats);

// GET /group/:groupId/invoice - combined group invoice
router.get('/group/:groupId/invoice', billingController.getGroupInvoice);

// POST /group/:groupId/payments - record payment for entire group
router.post('/group/:groupId/payments', billingController.recordGroupPayment);

// GET / - list billings with filters and pagination
router.get('/', billingController.list);

// POST / - create new billing
router.post('/', billingController.create);

// GET /:id - get billing by ID with all associations
router.get('/:id', billingController.getById);

// POST /:id/items - add billing item
router.post('/:id/items', billingController.addItem);

// DELETE /:id/items/:itemId - remove billing item
router.delete('/:id/items/:itemId', billingController.removeItem);

// POST /:id/payments - record payment
router.post('/:id/payments', billingController.recordPayment);

// GET /:id/invoice - JSON invoice data for React
router.get('/:id/invoice', billingController.getInvoice);

// GET /:id/invoice/pdf - generate invoice PDF
router.get('/:id/invoice/pdf', billingController.generatePdf);

// GET /:id/gst-invoice - get GST invoice data
router.get('/:id/gst-invoice', billingController.getGstInvoice);

module.exports = router;
