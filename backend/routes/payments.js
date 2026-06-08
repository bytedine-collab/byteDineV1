const express = require('express');
const router = express.Router();
const { cashPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/cash', protect, authorize('admin'), cashPayment);

module.exports = router;
