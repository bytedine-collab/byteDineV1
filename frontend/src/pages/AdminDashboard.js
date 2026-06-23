import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI, tableAPI, analyticsAPI } from '../services/api';
import { getSocket, joinRoom } from '../services/socket';
import toast from 'react-hot-toast';
import OrdersPanel from '../components/admin/OrdersPanel';
import TablesOverview from '../components/admin/TablesOverview';
import MenuManager from '../components/admin/MenuManager';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import QRManager from '../components/admin/QRManager';
import SettingsPanel from '../components/admin/SettingsPanel';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  { id: 'orders', label: 'Live Orders', icon: '🍽️' },
  { id: 'tables', label: 'Tables', icon: '🪑' },
  { id: 'menu', label: 'Menu', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'qr', label: 'QR Codes', icon: '📱' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const playNotification = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        orderAPI.getAll({ limit: 100 }),
        tableAPI.getAll(),
      ]);
      setOrders(ordersRes.data.data);
      setTables(tablesRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      setAnalytics(res.data.data);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchData();
    fetchAnalytics();

    const socket = getSocket();
    joinRoom('admin');

    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev]);
      setNewOrderCount(c => c + 1);
      playNotification();
      toast.success(`New order from Table ${order.tableNumber}!`, { duration: 5000 });
    });

    socket.on('orderUpdated', (order) => {
      setOrders(prev => prev.map(o => o._id === order._id ? order : o));
    });

    socket.on('waiterCall', ({ tableNumber, message }) => {
      setWaiterCalls(prev => [{ tableNumber, message, time: new Date() }, ...prev.slice(0, 4)]);
      playNotification();
      toast(`Table ${tableNumber} is calling a waiter!`, { icon: '🔔', duration: 8000 });
    });

    socket.on('paymentSuccess', ({ tableNumber, amount }) => {
      toast.success(`Payment received from Table ${tableNumber} - ₹${amount}`);
      fetchData();
    });

    socket.on('tableUpdated', (table) => {
      setTables(prev => prev.map(t => t._id === table._id ? table : t));
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderUpdated');
      socket.off('waiterCall');
      socket.off('paymentSuccess');
      socket.off('tableUpdated');
    };
  }, [fetchData, fetchAnalytics]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, { status });
      toast.success('Order status updated');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const occupiedTables = tables.filter(t => t.status && t.status !== 'available').length;
  const todayRevenue = orders
    .filter(o => o.paymentStatus === 'paid' && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-coal flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-flame border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-glow-md"></div>
        <p className="text-gray-900 dark:text-gray-400 font-medium font-display">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-coal dark:text-white flex transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111118] border-r border-gray-200/60 dark:border-white/5 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200/60 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-flame to-ember flex items-center justify-center text-xl shadow-glow-md">🍴</div>
              <div>
                <h1 className="font-display font-extrabold text-gray-900 dark:text-white leading-none">SmartDine</h1>
                <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); if (tab.id === 'orders') setNewOrderCount(0); }}
                className={`relative w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold active:scale-95 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border-l-4 border-flame'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white border-l-4 border-transparent'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'orders' && newOrderCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse font-bold">
                    {newOrderCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Waiter alert sidebar box */}
          {waiterCalls.length > 0 && (
            <div className="p-4 border-t border-gray-200/60 dark:border-white/5">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2.5 font-extrabold uppercase tracking-wider">Waiter Calls</p>
              <div className="space-y-2">
                {waiterCalls.slice(0, 3).map((call, i) => (
                  <div key={i} className="rounded-2xl bg-yellow-500/10 border border-yellow-500/25 p-3">
                    <p className="text-yellow-600 dark:text-yellow-300 text-xs font-black">Table {call.tableNumber}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{new Date(call.time).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User profile & Action buttons */}
          <div className="p-4 border-t border-gray-200/60 dark:border-white/5 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-flame to-ember rounded-full flex items-center justify-center text-white text-sm font-black shadow-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-snug">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-1">
              <button
                onClick={toggleTheme}
                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-2 py-2 text-center text-[11px] font-bold text-gray-600 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all duration-200"
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>
              <button 
                onClick={logout} 
                className="flex-1 rounded-xl border border-red-200 dark:border-red-400/10 bg-red-500/5 px-2 py-2 text-center text-[11px] font-bold text-red-600 dark:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Dashboard top header */}
        <header className="sticky top-0 z-30 border-b border-gray-200/60 dark:border-white/5 bg-white/90 dark:bg-coal/85 px-4 lg:px-6 py-4 backdrop-blur-xl transition-colors duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden h-11 w-11 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center text-lg active:scale-95">
                ☰
              </button>
              <div>
                <h2 className="font-display text-xl font-extrabold text-gray-900 dark:text-white leading-none">
                  {TABS.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Quick stats indicators in header */}
            <div className="hidden lg:flex items-center gap-3">
              {[
                { label: 'Active Orders', value: activeOrders.length, dot: 'bg-orange-500' },
                { label: 'Today', value: `₹${todayRevenue.toLocaleString()}`, dot: 'bg-green-500' },
                { label: 'Tables', value: `${occupiedTables}/${tables.length} occupied`, dot: 'bg-blue-500' },
              ].map(stat => (
                <div key={stat.label} className="rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-colors duration-300">
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${stat.dot}`} />
                  <span className="text-gray-400 dark:text-gray-500">{stat.label}: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
              <div className="rounded-full border border-green-200 dark:border-green-400/20 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-600 dark:text-green-300">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />Live
              </div>
            </div>
          </div>
        </header>

        {/* Tab content panel */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-slide-up">
          {activeTab === 'orders' && (
            <OrdersPanel orders={orders} onUpdateStatus={handleUpdateStatus} onRefresh={fetchData} />
          )}
          {activeTab === 'tables' && (
            <TablesOverview tables={tables} onRefresh={fetchData} />
          )}
          {activeTab === 'menu' && (
            <MenuManager />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard analytics={analytics} onRefresh={fetchAnalytics} />
          )}
          {activeTab === 'qr' && (
            <QRManager tables={tables} />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
}
