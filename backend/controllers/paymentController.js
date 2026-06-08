const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { sendBillSms } = require('../utils/smsService');

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

module.exports = { cashPayment };
