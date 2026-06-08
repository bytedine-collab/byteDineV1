const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrder, updateOrderStatus, getOrdersByTable, callWaiter } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createOrder);
router.get('/', protect, getOrders);
router.post('/call-waiter', callWaiter);
router.get('/table/:tableNumber', getOrdersByTable);
router.get('/:id', getOrder);
router.put('/:id/status', protect, authorize('admin', 'kitchen'), updateOrderStatus);

module.exports = router;
