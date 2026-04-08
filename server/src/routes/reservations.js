const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createReservationSchema, checkOutSchema, roomTransferSchema } = require('../schemas/reservation');

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
router.post('/', authorize('admin', 'manager', 'front_desk'), validateBody(createReservationSchema), reservationController.create);
router.put('/:id', authorize('admin', 'manager', 'front_desk'), reservationController.update);
router.put('/:id/check-in', authorize('admin', 'manager', 'front_desk'), reservationController.checkIn);
router.put('/:id/check-out', authorize('admin', 'manager', 'front_desk'), validateBody(checkOutSchema), reservationController.checkOut);
router.put('/:id/room-transfer', authorize('admin', 'manager', 'front_desk'), validateBody(roomTransferSchema), reservationController.roomTransfer);
router.put('/:id/convert-to-nightly', authorize('admin', 'manager', 'front_desk'), reservationController.convertToNightly);
router.get('/:id/check-in-summary', authorize('admin', 'manager', 'front_desk'), reservationController.checkInSummaryPdf);
router.get('/:id/check-out-summary', authorize('admin', 'manager', 'front_desk'), reservationController.checkOutSummaryPdf);
router.put('/:id/cancel', authorize('admin', 'manager', 'front_desk'), reservationController.cancel);

module.exports = router;
