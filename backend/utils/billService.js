/**
 * Bill Service — Generates branded HTML bills for orders.
 * Used by the /api/bills/:orderId endpoint so customers can
 * view, print, and download their bill from the SMS link.
 */

const generateBillHtml = (order) => {
  const restaurantName = process.env.RESTAURANT_NAME || 'ByteDine Restaurant';
  const restaurantAddress = process.env.RESTAURANT_ADDRESS || '';
  const restaurantGstin = process.env.RESTAURANT_GSTIN || '';
  const restaurantPhone = process.env.RESTAURANT_PHONE || '';

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const paymentLabel =
    order.paymentMethod === 'upi' ? 'UPI / Online' :
    order.paymentMethod === 'card' ? 'Card' : 'Cash';

  const itemRows = (order.items || [])
    .map((item) => {
      const addonTotal = item.addons
        ? item.addons.reduce((s, a) => s + (a.price || 0), 0)
        : 0;
      const unitPrice = (item.price || 0) + addonTotal;
      const lineTotal = unitPrice * item.quantity;
      const addonText = item.addons && item.addons.length
        ? `<div style="font-size:11px;color:#888;margin-top:2px;">+ ${item.addons.map(a => a.name).join(', ')}</div>`
        : '';
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
            <div style="font-weight:600;color:#1a1a2e;">${item.name || 'Item'}</div>
            ${addonText}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;">${item.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;color:#555;">₹${unitPrice.toLocaleString('en-IN')}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1a1a2e;">₹${lineTotal.toLocaleString('en-IN')}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bill — ${order.orderNumber || 'Order'} | ${restaurantName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family:'Inter',system-ui,-apple-system,sans-serif;
      background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%);
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    }
    .bill-container {
      background:#ffffff;
      border-radius:24px;
      max-width:440px;
      width:100%;
      overflow:hidden;
      box-shadow:0 25px 60px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.05);
    }
    .bill-header {
      background:linear-gradient(135deg,#ff6b35 0%,#f7931e 50%,#ff6b35 100%);
      padding:28px 24px 22px;
      text-align:center;
      color:#fff;
    }
    .bill-header h1 { font-size:22px; font-weight:800; letter-spacing:0.5px; }
    .bill-header .subtitle { font-size:12px; opacity:0.85; margin-top:4px; }
    .bill-header .address { font-size:11px; opacity:0.7; margin-top:6px; line-height:1.5; }
    .bill-meta {
      display:flex;
      justify-content:space-between;
      padding:16px 24px;
      background:#fafafa;
      border-bottom:1px solid #f0f0f0;
      font-size:12px;
      color:#666;
    }
    .bill-meta strong { color:#1a1a2e; font-weight:700; }
    .bill-body { padding:0 24px; }
    .bill-body table { width:100%; border-collapse:collapse; }
    .bill-body th {
      padding:14px 8px 10px;
      text-align:left;
      font-size:11px;
      font-weight:700;
      color:#999;
      text-transform:uppercase;
      letter-spacing:0.5px;
      border-bottom:2px solid #f0f0f0;
    }
    .bill-body th:nth-child(2),
    .bill-body th:nth-child(3),
    .bill-body th:nth-child(4) { text-align:center; }
    .bill-body th:nth-child(4) { text-align:right; }
    .totals {
      padding:16px 24px 20px;
      border-top:2px dashed #e0e0e0;
    }
    .totals .row {
      display:flex;
      justify-content:space-between;
      padding:5px 0;
      font-size:13px;
      color:#666;
    }
    .totals .row.grand {
      margin-top:10px;
      padding-top:12px;
      border-top:2px solid #1a1a2e;
      font-size:18px;
      font-weight:800;
      color:#1a1a2e;
    }
    .totals .row.grand span:last-child { color:#ff6b35; }
    .payment-badge {
      margin:0 24px 20px;
      padding:14px 18px;
      border-radius:14px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      font-size:13px;
      font-weight:600;
    }
    .payment-badge.paid {
      background:linear-gradient(135deg,#e8faf0,#d4f5e2);
      color:#0d7a3e;
      border:1px solid #b8ecd0;
    }
    .payment-badge.pending {
      background:linear-gradient(135deg,#fff8e8,#fef3cd);
      color:#856404;
      border:1px solid #ffeaa7;
    }
    .bill-footer {
      background:#fafafa;
      padding:20px 24px;
      text-align:center;
      border-top:1px solid #f0f0f0;
    }
    .bill-footer p { font-size:12px; color:#999; line-height:1.6; }
    .bill-footer .thanks { font-size:15px; font-weight:700; color:#ff6b35; margin-bottom:6px; }
    .actions {
      padding:16px 24px 24px;
      display:flex;
      gap:10px;
    }
    .actions button {
      flex:1;
      padding:14px;
      border:none;
      border-radius:14px;
      font-size:13px;
      font-weight:700;
      cursor:pointer;
      transition:transform 0.15s,box-shadow 0.15s;
    }
    .actions button:active { transform:scale(0.97); }
    .btn-print {
      background:linear-gradient(135deg,#ff6b35,#f7931e);
      color:#fff;
      box-shadow:0 4px 15px rgba(255,107,53,0.3);
    }
    .btn-download {
      background:#1a1a2e;
      color:#fff;
      box-shadow:0 4px 15px rgba(26,26,46,0.2);
    }
    @media print {
      body { background:#fff; padding:0; }
      .bill-container { box-shadow:none; border-radius:0; max-width:100%; }
      .actions { display:none; }
    }
  </style>
</head>
<body>
  <div class="bill-container">
    <div class="bill-header">
      <h1>${restaurantName}</h1>
      ${restaurantPhone ? `<div class="subtitle">📞 ${restaurantPhone}</div>` : ''}
      ${restaurantAddress ? `<div class="address">${restaurantAddress}</div>` : ''}
      ${restaurantGstin ? `<div class="address">GSTIN: ${restaurantGstin}</div>` : ''}
    </div>

    <div class="bill-meta">
      <div>
        <div>Order <strong>${order.orderNumber || '—'}</strong></div>
        <div style="margin-top:2px;">Table <strong>${order.tableNumber || '—'}</strong></div>
      </div>
      <div style="text-align:right;">
        <div>${orderDate}</div>
        ${order.customerName ? `<div style="margin-top:2px;"><strong>${order.customerName}</strong></div>` : ''}
      </div>
    </div>

    <div class="bill-body">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="row">
        <span>Subtotal</span>
        <span>₹${(order.subtotal || 0).toLocaleString('en-IN')}</span>
      </div>
      <div class="row">
        <span>GST (5%)</span>
        <span>₹${(order.tax || 0).toLocaleString('en-IN')}</span>
      </div>
      ${order.discount > 0 ? `
      <div class="row" style="color:#0d7a3e;">
        <span>Discount</span>
        <span>-₹${(order.discount || 0).toLocaleString('en-IN')}</span>
      </div>` : ''}
      <div class="row grand">
        <span>Grand Total</span>
        <span>₹${(order.total || 0).toLocaleString('en-IN')}</span>
      </div>
    </div>

    <div class="payment-badge ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}">
      <span>${order.paymentStatus === 'paid' ? '✅ Payment Complete' : '⏳ Payment Pending'}</span>
      <span>${paymentLabel}</span>
    </div>

    <div class="bill-footer">
      <p class="thanks">Thank you for dining with us! 🍽️</p>
      <p>We hope you enjoyed your meal.<br/>Visit again soon!</p>
    </div>

    <div class="actions">
      <button class="btn-print" onclick="window.print()">🖨️ Print Bill</button>
      <button class="btn-download" onclick="shareBill()">📤 Share</button>
    </div>
  </div>

  <script>
    async function shareBill() {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Bill — ${order.orderNumber || "Order"}',
            text: 'My bill from ${restaurantName}: ₹${(order.total || 0).toLocaleString("en-IN")}',
            url: window.location.href,
          });
        } catch(e) { /* user cancelled */ }
      } else {
        // Fallback: copy link
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Bill link copied to clipboard!');
        } catch(e) {
          prompt('Copy this link:', window.location.href);
        }
      }
    }
  </script>
</body>
</html>`;
};

module.exports = { generateBillHtml };
