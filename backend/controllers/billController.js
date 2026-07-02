const Order = require('../models/Order');
const { generateBillHtml } = require('../utils/billService');

/**
 * @desc    Get a formatted HTML bill for an order (publicly accessible via SMS link)
 * @route   GET /api/bills/:orderId
 * @access  Public
 */
const getBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.menuItem', 'name image category');

    if (!order) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f0f1a;color:#fff;">
          <div style="text-align:center;"><h1>Bill Not Found</h1><p style="color:#888;">This order does not exist or has been removed.</p></div>
        </body></html>
      `);
    }

    const html = generateBillHtml(order);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Bill generation error:', error.message);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f0f1a;color:#fff;">
        <div style="text-align:center;"><h1>Something went wrong</h1><p style="color:#888;">Could not generate the bill. Please try again later.</p></div>
      </body></html>
    `);
  }
};

module.exports = { getBill };
