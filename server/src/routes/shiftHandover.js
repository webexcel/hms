const express = require('express');
const router = express.Router();
const shiftHandoverController = require('../controllers/shiftHandoverController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', shiftHandoverController.getStats);
router.get('/pending', shiftHandoverController.getPending);
router.get('/', shiftHandoverController.list);
router.get('/:id', shiftHandoverController.getById);
router.post('/', shiftHandoverController.create);
router.put('/:id/accept', shiftHandoverController.accept);
router.put('/:id/reject', shiftHandoverController.reject);

module.exports = router;
