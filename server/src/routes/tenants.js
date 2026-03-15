const router = require('express').Router();
const tenantController = require('../controllers/tenantController');

router.get('/', tenantController.listTenants);

module.exports = router;
