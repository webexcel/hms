const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET routes - any authenticated user
router.get('/arrivals', reservationController.getArrivals);
router.get('/departures', reservationController.getDepartures);
router.get('/calendar', reservationController.calendar);
router.get('/availability', reservationController.checkAvailability);
router.get('/', reservationController.list);

// Group booking routes (must be before /:id to avoid "group" being treated as an id)
router.get('/group/:groupId', reservationController.getGroup);
router.put('/group/:groupId/check-in', authorize('admin', 'manager', 'front_desk'), reservationController.groupCheckIn);
router.put('/group/:groupId/check-out', authorize('admin', 'manager', 'front_desk'), reservationController.groupCheckOut);
router.put('/group/:groupId/cancel', authorize('admin', 'manager', 'front_desk'), reservationController.groupCancel);

router.get('/:id/refund-preview', reservationController.refundPreview);
router.get('/:id', reservationController.getById);

// POST/PUT routes - restricted to admin, manager, front_desk
router.post('/', authorize('admin', 'manager', 'front_desk'), reservationController.create);
router.put('/:id', authorize('admin', 'manager', 'front_desk'), reservationController.update);
router.put('/:id/check-in', authorize('admin', 'manager', 'front_desk'), reservationController.checkIn);
router.put('/:id/check-out', authorize('admin', 'manager', 'front_desk'), reservationController.checkOut);
router.put('/:id/room-transfer', authorize('admin', 'manager', 'front_desk'), reservationController.roomTransfer);
router.put('/:id/cancel', authorize('admin', 'manager', 'front_desk'), reservationController.cancel);

module.exports = router;
