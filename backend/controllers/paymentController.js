const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { sendBillSms } = require('../utils/smsService');
const crypto = require('crypto');
const axios = require('axios');

// @desc    Cash payment
// @route   POST /api/payments/cash
// @access  Private
const cashPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: 'paid', paymentMethod: 'cash', status: 'completed' },
      { new: true }
    ).populate('items.menuItem', 'name image');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await Payment.create({
      order: orderId,
      tableNumber: order.tableNumber,
      amount: order.total,
      method: 'cash',
      status: 'success',
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('paymentSuccess', { orderId, tableNumber: order.tableNumber, amount: order.total });
      io.to(`table-${order.tableNumber}`).emit('paymentSuccess', { orderId, amount: order.total });
      io.to('admin-room').emit('orderUpdated', order);
      io.to(`table-${order.tableNumber}`).emit('orderUpdated', order);
    }

    sendBillSms(order);

    res.json({ success: true, message: 'Cash payment recorded', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create PhonePe payment
// @route   POST /api/payments/create-order
// @access  Public
const createPhonePePayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    const payableAmount = Number(order.total || amount);
    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }
    
    const merchantId = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
    const saltKey = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const saltIndex = process.env.PHONEPE_SALT_INDEX || 1;
    const env = process.env.PHONEPE_ENV || 'UAT';

    const merchantTransactionId = `${orderId}_${Date.now()}`;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-status?orderId=${orderId}&transactionId=${merchantTransactionId}`;

    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: 'MUID' + Date.now(),
      amount: Math.round(payableAmount * 100),
      redirectUrl: redirectUrl,
      redirectMode: 'REDIRECT',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToSign = base64Payload + '/pg/v1/pay' + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const checksum = sha256 + '###' + saltIndex;

    const url = env === 'PROD' 
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

    const response = await axios.post(url, { request: base64Payload }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      }
    });

    if (response.data.success) {
      const redirectUrl = response.data.data?.instrumentResponse?.redirectInfo?.url;
      if (!redirectUrl) {
        throw new Error('PhonePe did not return a payment URL');
      }

      await Payment.create({
        order: orderId,
        tableNumber: order.tableNumber,
        amount: payableAmount,
        method: 'upi',
        status: 'pending',
        transactionId: merchantTransactionId,
      });

      res.json({
        success: true,
        data: {
          redirectUrl,
          transactionId: merchantTransactionId,
        },
      });
    } else {
      throw new Error(response.data.message || 'PhonePe initialization failed');
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify PhonePe Payment
// @route   POST /api/payments/verify
// @access  Public
const verifyPayment = async (req, res) => {
  try {
    const { transactionId, orderId } = req.body;

    if (!transactionId || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing transaction details' });
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
    const saltKey = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const saltIndex = process.env.PHONEPE_SALT_INDEX || 1;
    const env = process.env.PHONEPE_ENV || 'UAT';

    const stringToSign = `/pg/v1/status/${merchantId}/${transactionId}${saltKey}`;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const checksum = sha256 + '###' + saltIndex;

    const url = env === 'PROD'
      ? `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${transactionId}`
      : `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${transactionId}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId
      }
    });

    if (response.data.code === 'PAYMENT_SUCCESS') {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: 'paid', paymentMethod: 'upi', status: 'completed' },
        { new: true }
      ).populate('items.menuItem', 'name image');

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      await Payment.findOneAndUpdate({
        order: orderId,
        transactionId: transactionId,
      }, {
        order: orderId,
        tableNumber: order.tableNumber,
        amount: order.total,
        method: 'upi',
        status: 'success',
        transactionId: transactionId
      }, { upsert: true, new: true });

      const io = req.app.get('io');
      if (io) {
        io.to('admin-room').emit('paymentSuccess', { orderId, tableNumber: order.tableNumber, amount: order.total });
        io.to(`table-${order.tableNumber}`).emit('paymentSuccess', { orderId, amount: order.total });
        io.to('admin-room').emit('orderUpdated', order);
        io.to(`table-${order.tableNumber}`).emit('orderUpdated', order);
      }

      sendBillSms(order);

      res.json({ success: true, message: 'Payment verified successfully', data: order });
    } else {
      res.status(400).json({ success: false, message: 'Payment not successful', status: response.data.code });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { cashPayment, createPhonePePayment, verifyPayment };
