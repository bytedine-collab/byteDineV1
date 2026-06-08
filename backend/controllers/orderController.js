const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (customer)
const createOrder = async (req, res) => {
  try {
    const { tableId, tableNumber, items, customerName, customerPhone, specialRequests, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }
    if (!customerPhone || !PHONE_REGEX.test(String(customerPhone).trim())) {
      return res.status(400).json({ success: false, message: 'Valid mobile number is required' });
    }

    // Validate and enrich items with current prices
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Error(`Item ${item.name || item.menuItem} is not available`);
      }
      // Update order count
      await MenuItem.findByIdAndUpdate(item.menuItem, { $inc: { orderCount: 1 } });
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || '',
      };
    }));

    const order = await Order.create({
      table: tableId,
      tableNumber,
      items: enrichedItems,
      customerName,
      customerPhone: String(customerPhone).trim(),
      specialRequests,
      paymentMethod: paymentMethod === 'cash' ? 'cash' : undefined,
      paymentStatus: paymentMethod === 'cash' ? 'pending_cash' : 'unpaid',
    });

    // Update table status
    await Table.findByIdAndUpdate(tableId, { status: 'occupied', currentSession: order._id });

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('table', 'tableNumber')
      .populate('items.menuItem', 'name image category');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('newOrder', populatedOrder);
      io.to('kitchen-room').emit('newOrder', populatedOrder);
      io.to(`table-${tableNumber}`).emit('orderCreated', populatedOrder);
    }

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (admin/kitchen)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { status, tableNumber, date, limit = 50 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (tableNumber) query.tableNumber = tableNumber;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(query)
      .populate('table', 'tableNumber capacity')
      .populate('items.menuItem', 'name image category prepTime')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'tableNumber')
      .populate('items.menuItem', 'name image category');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (admin/kitchen)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, itemId, itemStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Update individual item status
    if (itemId && itemStatus) {
      const item = order.items.id(itemId);
      if (item) item.status = itemStatus;
    }

    // Update overall order status
    if (status) {
      order.status = status;
      if (status === 'served') order.servedAt = new Date();
      if (status === 'completed') {
        order.completedAt = new Date();
        // Free up table
        await Table.findByIdAndUpdate(order.table, { status: 'available', currentSession: null });
      }
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('table', 'tableNumber')
      .populate('items.menuItem', 'name image');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('orderUpdated', populatedOrder);
      io.to('kitchen-room').emit('orderUpdated', populatedOrder);
      io.to(`table-${order.tableNumber}`).emit('orderUpdated', populatedOrder);
    }

    res.json({ success: true, data: populatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get orders by table number (for customer tracking)
// @route   GET /api/orders/table/:tableNumber
// @access  Public
const getOrdersByTable = async (req, res) => {
  try {
    const orders = await Order.find({
      tableNumber: req.params.tableNumber,
      status: { $nin: ['completed', 'cancelled'] },
    })
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Call waiter
// @route   POST /api/orders/call-waiter
// @access  Public
const callWaiter = async (req, res) => {
  try {
    const { tableNumber, message } = req.body;
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('waiterCall', { tableNumber, message, timestamp: new Date() });
    }
    res.json({ success: true, message: 'Waiter notified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, getOrdersByTable, callWaiter };
