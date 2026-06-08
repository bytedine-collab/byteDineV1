import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../services/api';
import { getSocket, joinRoom } from '../services/socket';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-300',
  confirmed: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-300',
  preparing: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-300',
  ready: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-300',
  served: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300',
};

const NEXT_STATUS = {
  pending: 'preparing',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const NEXT_LABEL = {
  pending: 'Start Preparing',
  confirmed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Served',
};

export default function KitchenPanel() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [updatingId, setUpdatingId] = useState(null);

  const playBell = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15, 0.3].forEach(t => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = 1046;
        g.gain.setValueAtTime(0.4, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.4);
      });
    } catch (e) {}
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderAPI.getAll({ limit: 80 });
      setOrders(res.data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const socket = getSocket();
    joinRoom('kitchen');

    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev]);
      playBell();
      toast.success(`New order - Table ${order.tableNumber}`, { duration: 6000 });
    });

    socket.on('orderUpdated', (order) => {
      setOrders(prev => prev.map(o => o._id === order._id ? order : o));
    });

    return () => { socket.off('newOrder'); socket.off('orderUpdated'); };
  }, [fetchOrders]);

  const handleAdvanceStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    setUpdatingId(order._id);
    try {
      await orderAPI.updateStatus(order._id, { status: nextStatus });
      toast.success(`Order ${order.orderNumber} -> ${nextStatus}`);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return !['completed', 'cancelled', 'served'].includes(o.status);
    if (filter === 'ready') return o.status === 'ready';
    if (filter === 'preparing') return o.status === 'preparing';
    return true;
  });

  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    return diff < 1 ? 'Just now' : `${diff}m ago`;
  };

  const isUrgent = (createdAt, status) => {
    if (['served','completed'].includes(status)) return false;
    return (Date.now() - new Date(createdAt)) > 20 * 60 * 1000;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-coal flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-flame border-t-transparent rounded-full animate-spin shadow-glow-md" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-coal dark:text-white transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200/60 dark:border-white/5 bg-white/90 dark:bg-coal/90 px-4 py-4 backdrop-blur-xl transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-flame to-ember rounded-2xl flex items-center justify-center text-xl shadow-glow-md">👨‍🍳</div>
            <div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 dark:text-white leading-none">Kitchen Panel</h1>
              <p className="text-xs text-gray-500 mt-1">{user?.name} · Active Session</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-600 dark:text-green-300 text-xs font-bold">Live</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-yellow-300 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-sm shadow-sm active:scale-95 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Sign Out Button */}
            <button onClick={logout} className="rounded-full border border-gray-200 dark:border-white/10 px-3.5 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-300 active:scale-95 transition-all duration-200">Sign out</button>
          </div>
        </div>
      </header>

      {/* Filters bar */}
      <div className="bg-white/80 dark:bg-[#111118]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide transition-colors duration-300">
        {[
          { id: 'active', label: '⚡ Active', count: orders.filter(o => !['completed','cancelled','served'].includes(o.status)).length },
          { id: 'preparing', label: '🔥 Preparing', count: orders.filter(o => o.status === 'preparing').length },
          { id: 'ready', label: '✅ Ready', count: orders.filter(o => o.status === 'ready').length },
          { id: 'all', label: '📋 All', count: orders.length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap active:scale-95 transition-all duration-200 ${
              filter === f.id 
                ? 'bg-gradient-to-r from-flame to-ember text-white shadow-glow-md' 
                : 'bg-gray-100 border border-gray-200 text-gray-500 dark:bg-ash dark:border-white/5 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-smoke'
            }`}
          >
            {f.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${filter === f.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-coal text-gray-700 dark:text-gray-300'}`}>{f.count}</span>
          </button>
        ))}
        <button onClick={fetchOrders} className="ml-auto text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm px-3.5 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 active:scale-95 transition-all">
          ↻ Refresh
        </button>
      </div>

      {/* Orders Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-20 rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm transition-colors duration-300">
            <p className="text-6xl mb-4">👨‍🍳</p>
            <h3 className="text-gray-800 dark:text-gray-300 text-lg font-bold">No orders to display</h3>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">New orders will appear here automatically</p>
          </div>
        ) : filteredOrders.map(order => {
          const urgent = isUrgent(order.createdAt, order.status);
          return (
            <article
              key={order._id}
              className={`bg-white dark:bg-ash rounded-2xl overflow-hidden transition-all hover:scale-[1.01] shadow-sm dark:shadow-glow-sm border border-gray-200 dark:border-white/5 border-l-4 ${
                urgent ? 'border-l-red-500 shadow-red-500/10 animate-pulse-slow' :
                order.status === 'ready' ? 'border-l-green-500' :
                order.status === 'preparing' ? 'border-l-orange-500' :
                'border-l-yellow-500'
              }`}
            >
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-coal/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-gray-900 dark:text-white">Table {order.tableNumber}</span>
                    {urgent && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse font-bold">URGENT</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] ${urgent ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{getElapsedTime(order.createdAt)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block mt-1.5 font-bold ${STATUS_COLORS[order.status] || 'text-gray-400 border-white/10'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="px-4 py-4 space-y-3 min-h-[120px]">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="bg-orange-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center font-extrabold flex-shrink-0">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white font-extrabold">{item.name}</p>
                      {item.specialInstructions && <p className="text-[10px] text-yellow-600 dark:text-yellow-300 italic font-semibold mt-0.5">⚠ {item.specialInstructions}</p>}
                    </div>
                  </div>
                ))}
                {order.specialRequests && (
                  <div className="mt-2 p-2.5 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl">
                    <p className="text-[11px] text-yellow-700 dark:text-yellow-300 font-semibold leading-relaxed">📝 {order.specialRequests}</p>
                  </div>
                )}
              </div>

              {NEXT_STATUS[order.status] && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleAdvanceStatus(order)}
                    disabled={updatingId === order._id}
                    className={`w-full py-3 rounded-xl text-xs font-black active:scale-95 disabled:opacity-50 tracking-wide uppercase transition-all ${
                      order.status === 'preparing' ? 'bg-green-600 hover:bg-green-500 text-white' :
                      order.status === 'ready' ? 'bg-purple-600 hover:bg-purple-500 text-white' :
                      'bg-gradient-to-r from-flame to-ember text-white shadow-glow-sm'
                    }`}
                  >
                    {updatingId === order._id ? '...' : NEXT_LABEL[order.status]}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
