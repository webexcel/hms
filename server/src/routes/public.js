const express = require('express');
const router = express.Router();
const publicTenant = require('../middleware/publicTenant');
const publicController = require('../controllers/publicController');

// All public routes use publicTenant middleware (no JWT auth)
router.use(publicTenant);

router.get('/hotel-info', publicController.getHotelInfo);
router.get('/rooms', publicController.listRoomTypes);
router.get('/rooms/:type', publicController.getRoomTypeDetail);
router.get('/availability', publicController.checkAvailability);
router.post('/booking', publicController.createBooking);
router.get('/booking/:ref', publicController.lookupBooking);

module.exports = router;
