const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, expenseController.addExpense);
router.get('/download', protect, expenseController.downloadBalanceSheet);
router.get('/:userId', protect, expenseController.getUserExpenses);
router.get('/', protect, expenseController.getAllExpenses);

module.exports = router;
