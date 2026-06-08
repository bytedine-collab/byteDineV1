import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#FF6B35', '#3b82f6', '#10b981', '#a855f7', '#F7C59F', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ash border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name === 'Revenue' || p.name === 'revenue' ? `₹${p.value?.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard({ analytics, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success('Analytics refreshed');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  if (!analytics) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-flame border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400">Loading analytics...</p>
    </div>
  );

  const { today, total, topItems, weeklyRevenue, peakHours, ordersByStatus, categoryStats } = analytics;
  const peakHoursFormatted = (peakHours || []).map(h => ({ hour: `${h._id}:00`, orders: h.count }));
  const weeklyFormatted = (weeklyRevenue || []).map(d => ({
    date: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    Revenue: Math.round(d.revenue),
    Orders: d.orders,
  }));
  const statusData = (ordersByStatus || []).map(s => ({ name: s._id, value: s.count }));
  const categoryData = (categoryStats || []).slice(0, 6).map(c => ({ name: c._id, orders: c.count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold text-white">Analytics Overview</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-ash border border-white/5 hover:bg-smoke text-gray-300 rounded-xl text-sm active:scale-95 disabled:opacity-50"
        >
          <span className={refreshing ? 'animate-spin' : ''}>↻</span> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: today?.orders ?? 0, icon: '📋', color: 'from-blue-300 to-cyan-300', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: "Today's Revenue", value: `₹${(today?.revenue ?? 0).toLocaleString()}`, icon: '💰', color: 'from-green-300 to-emerald-300', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Total Orders', value: total?.orders ?? 0, icon: '📦', color: 'from-orange-300 to-amber-300', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Avg Order Value', value: today?.orders > 0 ? `₹${Math.round((today?.revenue ?? 0) / today.orders)}` : '₹0', icon: '📈', color: 'from-purple-300 to-pink-300', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`relative overflow-hidden border rounded-2xl p-4 backdrop-blur-xl shadow-glow-sm ${kpi.bg}`}>
            <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-300/40 to-transparent" />
            <span className="text-2xl">{kpi.icon}</span>
            <p className={`mt-2 text-2xl font-extrabold bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue - Last 7 Days">
          {weeklyFormatted.length === 0 ? (
            <EmptyChart label="No data available" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyFormatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" fill="#FF6B35" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Peak Hours">
          {peakHoursFormatted.length === 0 ? (
            <EmptyChart label="No data available" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={peakHoursFormatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="orders" stroke="#FF6B35" strokeWidth={3} dot={{ fill: '#FF6B35', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Orders by Category">
          {categoryData.length === 0 ? (
            <EmptyChart label="No data available" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" radius={[0, 8, 8, 0]}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Today's Order Status">
          {statusData.length === 0 ? (
            <EmptyChart label="No orders today" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={76} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="bg-ash border border-white/5 rounded-2xl overflow-hidden shadow-glow-sm">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="font-display font-bold text-white text-sm">🏆 Top Selling Items</h3>
        </div>
        <div className="divide-y divide-white/5">
          {(topItems || []).length === 0 ? (
            <p className="text-gray-500 text-sm p-5">No data yet</p>
          ) : (topItems || []).map((item, i) => (
            <div key={item._id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                i === 0 ? 'bg-yellow-500 text-black' :
                i === 1 ? 'bg-gray-400 text-black' :
                i === 2 ? 'bg-amber-600 text-white' :
                'bg-coal text-gray-400'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              {item.image && (
                <img src={item.image} alt={item.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" onError={e => { e.target.style.display='none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-orange-300">{item.orderCount} orders</p>
                <p className="text-xs text-gray-500">₹{item.price}</p>
              </div>
              <div className="w-24 hidden sm:block">
                <div className="h-2 bg-coal rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-flame to-ember rounded-full" style={{ width: `${Math.min(100, (item.orderCount / ((topItems[0]?.orderCount || 1))) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-ash border border-white/5 rounded-2xl p-5 shadow-glow-sm">
      <h3 className="font-display font-bold text-white mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ label }) {
  return <div className="h-52 flex items-center justify-center text-gray-600 text-sm">{label}</div>;
}
