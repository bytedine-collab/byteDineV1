const express = require('express');
const router = express.Router();
const { cashPayment, createPhonePePayment, verifyPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/cash', protect, authorize('admin', 'kitchen'), cashPayment);
router.post('/create-order', createPhonePePayment);
router.post('/verify', verifyPayment);

module.exports = router;
