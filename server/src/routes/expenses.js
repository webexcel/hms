const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/format-b', expenseController.getFormatB);
router.get('/hr-cash-ledger', expenseController.getHrCashLedger);
router.post('/format-b/save', expenseController.saveFormatB);
router.get('/list', expenseController.listReports);
router.post('/entry', expenseController.createExpense);
router.delete('/entry/:id', expenseController.deleteExpense);
router.post('/gpay', expenseController.createGpayTransfer);
router.delete('/gpay/:id', expenseController.deleteGpayTransfer);
router.post('/bank', expenseController.createBankWithdrawal);
router.delete('/bank/:id', expenseController.deleteBankWithdrawal);

module.exports = router;
