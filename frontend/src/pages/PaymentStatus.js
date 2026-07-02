import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderAPI, paymentAPI } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');

  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Confirming your payment...');
  const [order, setOrder] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return null;
    const res = await orderAPI.getById(orderId);
    setOrder(res.data.data);
    return res.data.data;
  }, [orderId]);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId || !transactionId) {
        setStatus('failed');
        setMessage('Payment details are missing.');
        return;
      }

      try {
        const res = await paymentAPI.verify({ orderId, transactionId });
        const paidOrder = res.data.data;
        setOrder(paidOrder);
        setStatus('success');
        setMessage('Payment successful. Your order is confirmed.');
        toast.success('Payment successful!');
      } catch (err) {
        try {
          await loadOrder();
        } catch {
          // The original verification error is more useful to the customer.
        }
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Payment could not be verified. Please contact staff.');
        toast.error('Payment verification failed');
      }
    };

    verifyPayment();
  }, [orderId, transactionId, loadOrder]);

  const tableNumber = order?.tableNumber || searchParams.get('table') || '1';
  const confirmationUrl = orderId ? `/order-confirmation/${orderId}?table=${tableNumber}` : `/menu?table=${tableNumber}`;
  const billUrl = orderId ? `${API_URL.replace('/api', '')}/api/bills/${orderId}` : null;

  return (
    <div className="min-h-screen bg-coal text-white flex items-center justify-center px-4">
      <main className="w-full max-w-md rounded-3xl border border-white/10 bg-ash p-6 text-center shadow-glow-sm">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black ${
          status === 'success'
            ? 'bg-green-500/15 text-green-300'
            : status === 'failed'
              ? 'bg-red-500/15 text-red-300'
              : 'bg-orange-500/15 text-orange-300'
        }`}>
          {status === 'checking' ? (
            <div className="h-8 w-8 rounded-full border-4 border-orange-300 border-t-transparent animate-spin" />
          ) : status === 'success' ? '✓' : '!'}
        </div>

        <h1 className="font-display text-2xl font-extrabold">
          {status === 'checking' ? 'Checking Payment' : status === 'success' ? 'Payment Complete' : 'Payment Needs Attention'}
        </h1>
        <p className="mt-2 text-sm text-gray-400">{message}</p>

        {order && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Order</span>
              <span className="text-white">{order.orderNumber}</span>
            </div>
            <div className="mt-2 flex justify-between text-gray-400">
              <span>Total</span>
              <span className="text-white">Rs {order.total?.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* SMS Notification Banner */}
        {status === 'success' && order?.customerPhone && (
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
            <p className="text-xs text-green-300 font-semibold flex items-center justify-center gap-1.5">
              <span>📩</span> Bill sent to {order.customerPhone.replace(/(\d{2})\d{6}(\d{2})/, '$1••••••$2')} via SMS
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {/* View Bill Button */}
          {status === 'success' && billUrl && (
            <a
              href={billUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-flame to-ember px-4 text-sm font-black uppercase tracking-wider text-white shadow-glow-md active:scale-95 gap-2"
            >
              <span>📄</span> View & Download Bill
            </a>
          )}

          <Link
            to={confirmationUrl}
            className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl px-4 text-sm font-black uppercase tracking-wider active:scale-95 ${
              status === 'success'
                ? 'bg-white/10 text-white border border-white/10 hover:bg-white/15'
                : 'bg-gradient-to-r from-flame to-ember text-white shadow-glow-md'
            }`}
          >
            View Order
          </Link>
        </div>
      </main>
    </div>
  );
}
