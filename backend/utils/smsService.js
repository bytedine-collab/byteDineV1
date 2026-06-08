const formatItems = (items = []) =>
  items.map(item => `${item.name} x${item.quantity}`).join(', ');

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};

const buildBillMessage = (order) => (
  `Thank you for your order!\n` +
  `Order ID: #${order.orderNumber}\n` +
  `Items: ${formatItems(order.items)}\n` +
  `Total: ₹${order.total}\n` +
  `Payment: Paid\n` +
  `Visit Again!`
);

const sendViaFast2SMS = async (phone, message) => {
  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: phone,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fast2SMS failed: ${response.status} ${body}`);
  }
};

const sendViaTwilio = async (phone, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const to = phone.startsWith('+') ? phone : `+91${normalizePhone(phone)}`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: message }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Twilio failed: ${response.status} ${body}`);
  }
};

const sendBillSms = async (order) => {
  if (!order?.customerPhone) return { skipped: true, reason: 'No customer phone' };

  const message = buildBillMessage(order);
  try {
    if (process.env.FAST2SMS_API_KEY) {
      await sendViaFast2SMS(normalizePhone(order.customerPhone), message);
      return { success: true, provider: 'fast2sms' };
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      await sendViaTwilio(order.customerPhone, message);
      return { success: true, provider: 'twilio' };
    }

    console.log('[SMS skipped] Configure FAST2SMS_API_KEY or Twilio env vars. Message:\n' + message);
    return { skipped: true, reason: 'SMS provider not configured', message };
  } catch (error) {
    console.error(`SMS send failed for ${order.orderNumber}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = { sendBillSms, buildBillMessage };
