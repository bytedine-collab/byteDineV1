import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
const STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Being Prepared',
  ready: 'Ready to Serve',
  served: 'Served',
  completed: 'Completed',
};
const STATUS_DESC = {
  pending: 'Your order has been placed. We are reviewing it.',
  confirmed: 'Your order is confirmed and heading to the kitchen.',
  preparing: 'Our chefs are cooking your delicious meal.',
  ready: 'Your food is ready. A waiter is bringing it over.',
  served: 'Enjoy your meal.',
  completed: 'Thank you for dining with us.',
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await orderAPI.getById(orderId);
      setOrder(res.data.data);
    } catch {
      toast.error('Could not load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const socket = getSocket();

    socket.on('orderUpdated', (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
        if (updatedOrder.status === 'ready') toast.success('Your food is ready!', { duration: 6000 });
        if (updatedOrder.status === 'served') toast.success('Food has been served. Enjoy!', { duration: 5000 });
      }
    });

    socket.on('paymentSuccess', ({ orderId: paidOrderId }) => {
      if (paidOrderId === orderId) fetchOrder();
    });

    return () => {
      socket.off('orderUpdated');
      socket.off('paymentSuccess');
    };
  }, [orderId, fetchOrder]);

  const currentStepIndex = STATUS_STEPS.indexOf(order?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-coal flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-flame border-t-transparent rounded-full animate-spin shadow-glow-md" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-coal flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-4xl mb-4">Order not found</p>
          <Link to={`/menu?table=${tableNumber}`} className="mt-4 inline-block text-orange-300 hover:text-orange-200">
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-coal text-white pb-10">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.14),transparent_34%)]" />

      <header className="relative border-b border-white/5 bg-[#111118]/80 px-4 py-8 backdrop-blur-xl">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-flame to-ember rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow-lg animate-float">
            <span className="text-4xl">
              {order.status === 'served' || order.status === 'completed'
                ? 'Done'
                : order.status === 'preparing'
                  ? 'Chef'
                  : order.status === 'ready'
                    ? 'Ready'
                    : 'Live'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-1">Order {order.orderNumber}</h1>
          <p className="text-gray-400 text-sm">Table {order.tableNumber}</p>
        </div>
      </header>

      <main className="relative max-w-lg mx-auto px-4 pt-6 space-y-5">
        <section
          className={`rounded-3xl border p-5 text-center shadow-glow-sm ${
            order.status === 'ready'
              ? 'bg-green-500/10 border-green-500/30'
              : order.status === 'preparing'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-ash border-white/5'
          }`}
        >
          <p className="font-display text-2xl font-extrabold mb-1">{STATUS_LABELS[order.status]}</p>
          <p className="text-gray-400 text-sm">{STATUS_DESC[order.status]}</p>
        </section>

        {order.status !== 'completed' && (
          <section className="bg-ash border border-white/5 rounded-3xl p-5 shadow-glow-sm">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Order Progress</h3>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-flame to-ember transition-all duration-700"
                style={{ width: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 ${
                        i < currentStepIndex
                          ? 'bg-flame border-flame text-white'
                          : i === currentStepIndex
                            ? 'bg-flame border-flame text-white animate-pulse shadow-glow-md'
                            : 'bg-coal border-white/10 text-gray-600'
                      }`}
                    >
                      {i < currentStepIndex ? 'OK' : i + 1}
                    </div>
                    <span className={`text-xs text-center leading-tight ${i <= currentStepIndex ? 'text-orange-300' : 'text-gray-600'}`}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-ash border border-white/5 rounded-3xl overflow-hidden shadow-glow-sm">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-display font-bold">Your Order</h3>
          </div>
          <div className="divide-y divide-white/5">
            {order.items?.map((item, i) => (
              <div key={i} className={`px-5 py-3 flex items-center justify-between ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="bg-orange-500/20 text-orange-300 text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="text-sm text-white">{item.name}</span>
                </div>
                <span className="text-sm text-gray-400">Rs {Number(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>Rs {order.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>GST (5%)</span>
              <span>Rs {order.tax?.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>-Rs {order.discount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white text-lg pt-2 border-t border-white/10">
              <span>Total</span>
              <span>Rs {order.total?.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {order.paymentStatus !== 'paid' && ['served', 'ready', 'completed'].includes(order.status) && (
          <section className="bg-ash border border-white/5 rounded-3xl p-5 shadow-glow-sm">
            <h3 className="font-display font-bold mb-4">Payment</h3>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-center">
              <p className="font-semibold text-orange-300">Offline payment pending</p>
              <p className="mt-2 text-xs text-gray-400">
                Please pay cash at the counter or to the waiter. Amount due: Rs {order.total?.toLocaleString()}
              </p>
            </div>
          </section>
        )}

        {order.paymentStatus === 'paid' && (
          <section className="bg-green-500/10 border border-green-500/30 rounded-3xl p-5 text-center shadow-glow-sm">
            <p className="text-green-300 font-bold">Payment Complete</p>
            <p className="text-gray-400 text-sm mt-1">Rs {order.total?.toLocaleString()} paid via {order.paymentMethod}</p>
          </section>
        )}

        <Link to={`/menu?table=${tableNumber}`} className="block text-center text-orange-300 hover:text-orange-200 text-sm py-2">
          Order More Items
        </Link>
      </main>
    </div>
  );
}
