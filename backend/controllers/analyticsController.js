const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Payment = require('../models/Payment');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
const getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    // Today's stats
    const todayOrders = await Order.find({ createdAt: { $gte: today, $lt: tomorrow } });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);

    // Total orders count
    const totalOrders = await Order.countDocuments();

    // Most ordered items
    const topItems = await MenuItem.find().sort({ orderCount: -1 }).limit(5);

    // Revenue last 7 days
    const weeklyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: last7Days }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Peak hours analysis
    const peakHours = await Order.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Category popularity
    const categoryStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: '$itemDetails' },
      { $group: { _id: '$itemDetails.category', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        today: {
          orders: todayOrders.length,
          revenue: todayRevenue,
        },
        total: { orders: totalOrders },
        topItems,
        weeklyRevenue,
        peakHours,
        ordersByStatus,
        categoryStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardAnalytics };
