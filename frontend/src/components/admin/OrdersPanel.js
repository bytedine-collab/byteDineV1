import React, { useState } from 'react';
import { orderAPI, paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  preparing: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  ready:     'bg-green-500/20 text-green-300 border-green-500/40',
  served:    'bg-purple-500/20 text-purple-300 border-purple-500/40',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-600',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/40',
};

const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

export default function OrdersPanel({ orders, onUpdateStatus, onRefresh }) {
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'active') return !['completed', 'cancelled'].includes(o.status);
    if (filterStatus === 'unpaid') return o.paymentStatus !== 'paid' && o.status !== 'cancelled';
    return o.status === filterStatus;
  });

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCashPayment = async (orderId) => {
    setProcessingPaymentId(orderId);
    try {
      await paymentAPI.cash({ orderId });
      toast.success('Payment collected');
      onRefresh();
      setSelectedOrder(null);
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const getElapsed = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const counts = {
    active: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    unpaid: orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled').length,
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'active', label: '⚡ Active', count: counts.active },
          { id: 'pending', label: '⏳ Pending', count: counts.pending },
          { id: 'preparing', label: '🔥 Preparing', count: counts.preparing },
          { id: 'ready', label: '✅ Ready', count: counts.ready },
          { id: 'unpaid', label: '💰 Unpaid', count: counts.unpaid },
          { id: 'completed', label: '✔ Done', count: null },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterStatus === f.id
                ? 'bg-gradient-to-r from-flame to-ember text-white shadow-glow-md'
                : 'bg-ash border border-white/5 text-gray-400 hover:text-white hover:bg-smoke'
            }`}
          >
            {f.label}
            {f.count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === f.id ? 'bg-white/20' : 'bg-coal'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
        <button onClick={onRefresh} className="ml-auto px-4 py-2 text-sm text-gray-400 hover:text-white bg-ash border border-white/5 hover:bg-smoke rounded-full active:scale-95">
          ↻ Refresh
        </button>
      </div>

      {/* Orders grid */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-400 text-lg">No orders found</p>
          <p className="text-gray-600 text-sm mt-1">Orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order._id}
              className={`bg-ash border rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-orange-500/40 transition-all shadow-glow-sm ${
                order.status === 'pending' ? 'border-yellow-500/50 shadow-md shadow-yellow-500/10 animate-slide-down' : 'border-white/5'
              }`}
              onClick={() => setSelectedOrder(order)}
            >
              {/* Card header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b border-white/5 bg-coal/40 border-l-4 ${
                order.status === 'pending' ? 'border-l-yellow-400' :
                order.status === 'preparing' ? 'border-l-orange-400' :
                order.status === 'ready' ? 'border-l-green-400' :
                'border-l-white/10'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Table {order.tableNumber}</span>
                    {order.status === 'pending' && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">NEW</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_BADGE[order.status]}`}>
                    {order.status}
                  </span>
                  <p className={`text-xs mt-1 ${Math.floor((Date.now() - new Date(order.createdAt)) / 60000) > 20 ? 'text-red-400 font-bold' : 'text-gray-600'}`}>{getElapsed(order.createdAt)}</p>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 py-3 space-y-2">
                {order.items?.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-orange-500/20 text-orange-300 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-gray-300 truncate">{item.name}</span>
                    <span className="text-gray-600 text-xs ml-auto">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                {order.items?.length > 4 && (
                  <p className="text-xs text-gray-600 pl-7">+{order.items.length - 4} more items</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-white">₹{order.total?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/5 text-gray-400'
                  }`}>
                    {order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus === 'pending_cash' ? 'Pending Payment (Cash)' : 'Unpaid'}
                  </span>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="px-4 pb-4 flex gap-2" onClick={e => e.stopPropagation()}>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'preparing')}
                    disabled={updatingId === order._id}
                    className="flex-1 bg-gradient-to-r from-flame to-ember text-white text-xs py-2.5 rounded-xl font-bold shadow-glow-sm active:scale-95 disabled:opacity-50"
                  >
                    {updatingId === order._id ? '...' : '▶ Start Prep'}
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'ready')}
                    disabled={updatingId === order._id}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-white text-xs py-2.5 rounded-xl font-bold active:scale-95 disabled:opacity-50"
                  >
                    {updatingId === order._id ? '...' : '✓ Mark Ready'}
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'served')}
                    disabled={updatingId === order._id}
                    className="flex-1 bg-purple-500 hover:bg-purple-400 text-white text-xs py-2.5 rounded-xl font-bold active:scale-95 disabled:opacity-50"
                  >
                    {updatingId === order._id ? '...' : '🍽️ Served'}
                  </button>
                )}
                {order.paymentStatus === 'pending_cash' && (
                  <button
                    onClick={() => handleCashPayment(order._id)}
                    disabled={processingPaymentId === order._id}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs py-2.5 rounded-xl font-bold active:scale-95 disabled:opacity-50"
                  >
                    {processingPaymentId === order._id ? '...' : 'Mark as Payment Collected'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-ash border border-white/10 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-ash/95 backdrop-blur-xl">
              <div>
                <h3 className="font-bold text-white">Table {selectedOrder.tableNumber}</h3>
                <p className="text-xs text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full border ${STATUS_BADGE[selectedOrder.status]}`}>
                  {selectedOrder.status}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {selectedOrder.paymentStatus === 'pending_cash' ? 'Pending Payment (Cash)' : selectedOrder.paymentStatus}
                </span>
              </div>

              {/* All items */}
              <div className="space-y-2">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                      {item.quantity}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-white">{item.name}</p>
                      {item.specialInstructions && (
                        <p className="text-xs text-yellow-400">⚠ {item.specialInstructions}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {selectedOrder.specialRequests && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-xs text-yellow-400 font-semibold mb-1">Special Requests</p>
                  <p className="text-sm text-gray-300">{selectedOrder.specialRequests}</p>
                </div>
              )}

              {/* Bill summary */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span><span>₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>GST (5%)</span><span>₹{selectedOrder.tax}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white border-t border-gray-700 pt-2">
                  <span>Total</span><span>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {ALL_STATUSES.filter(s => s !== selectedOrder.status && !['cancelled'].includes(s)).map(s => (
                  <button
                    key={s}
                    onClick={() => { handleStatusUpdate(selectedOrder._id, s); setSelectedOrder(null); }}
                    className="w-full text-left px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 rounded-xl transition-colors"
                  >
                    Set status → <span className="font-semibold text-white capitalize">{s}</span>
                  </button>
                ))}
                {selectedOrder.paymentStatus === 'pending_cash' && (
                  <button
                    onClick={() => handleCashPayment(selectedOrder._id)}
                    disabled={processingPaymentId === selectedOrder._id}
                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {processingPaymentId === selectedOrder._id ? 'Processing...' : 'Mark as Payment Collected'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
