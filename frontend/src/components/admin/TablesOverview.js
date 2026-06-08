import React, { useState } from 'react';
import { tableAPI, orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  available: { bg: 'bg-green-500/10 border-green-500/40', dot: 'bg-green-400', text: 'text-green-400', label: 'Available' },
  occupied:  { bg: 'bg-orange-500/10 border-orange-500/40', dot: 'bg-orange-400', text: 'text-orange-400', label: 'Occupied' },
  reserved:  { bg: 'bg-blue-500/10 border-blue-500/40', dot: 'bg-blue-400', text: 'text-blue-400', label: 'Reserved' },
  cleaning:  { bg: 'bg-yellow-500/10 border-yellow-500/40', dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Cleaning' },
};

const TABLE_STATUSES = ['available', 'occupied', 'reserved', 'cleaning'];

export default function TablesOverview({ tables, onRefresh }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [addingTable, setAddingTable] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4 });
  const [updatingId, setUpdatingId] = useState(null);

  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      setLoadingOrders(true);
      try {
        const res = await orderAPI.getByTable(table.tableNumber);
        setTableOrders(res.data.data);
      } catch {
        toast.error('Could not load table orders');
      } finally {
        setLoadingOrders(false);
      }
    } else {
      setTableOrders([]);
    }
  };

  const handleStatusChange = async (tableId, status) => {
    setUpdatingId(tableId);
    try {
      await tableAPI.updateStatus(tableId, { status });
      toast.success('Table status updated');
      onRefresh();
      if (selectedTable?._id === tableId) {
        setSelectedTable(prev => ({ ...prev, status }));
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddTable = async () => {
    if (!newTable.tableNumber) return toast.error('Enter table number');
    setAddingTable(true);
    try {
      await tableAPI.create(newTable);
      toast.success(`Table ${newTable.tableNumber} created!`);
      setNewTable({ tableNumber: '', capacity: 4 });
      setAddingTable(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create table');
      setAddingTable(false);
    }
  };

  const occupied = tables.filter(t => t.status === 'occupied').length;
  const available = tables.filter(t => t.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: tables.length, icon: '🪑', color: 'text-white' },
          { label: 'Occupied', value: occupied, icon: '🍽️', color: 'text-orange-400' },
          { label: 'Available', value: available, icon: '✅', color: 'text-green-400' },
          { label: 'Other', value: tables.length - occupied - available, icon: '⏳', color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Table Map</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map(table => {
              const style = STATUS_STYLES[table.status] || STATUS_STYLES.available;
              return (
                <button
                  key={table._id}
                  onClick={() => handleSelectTable(table)}
                  className={`relative border rounded-2xl p-4 text-center transition-all hover:scale-105 ${style.bg} ${
                    selectedTable?._id === table._id ? 'ring-2 ring-orange-500 scale-105' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${style.dot} mx-auto mb-2 ${table.status === 'occupied' ? 'animate-pulse' : ''}`} />
                  <p className="text-white font-bold text-lg">T{table.tableNumber}</p>
                  <p className={`text-xs ${style.text} mt-0.5`}>{style.label}</p>
                  <p className="text-xs text-gray-600 mt-1">👥 {table.capacity}</p>
                  {table.status === 'occupied' && table.currentSession && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add New Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h4 className="font-semibold text-gray-300 mb-3 text-sm">Add New Table</h4>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Table #"
                value={newTable.tableNumber}
                onChange={e => setNewTable(p => ({ ...p, tableNumber: e.target.value }))}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              />
              <select
                value={newTable.capacity}
                onChange={e => setNewTable(p => ({ ...p, capacity: Number(e.target.value) }))}
                className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                {[2, 4, 6, 8, 10].map(n => <option key={n} value={n}>{n} seats</option>)}
              </select>
              <button
                onClick={handleAddTable}
                disabled={addingTable}
                className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {addingTable ? '...' : '+ Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Table Detail Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {selectedTable ? (
            <>
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Table {selectedTable.tableNumber}</h3>
                    <p className="text-xs text-gray-500">Capacity: {selectedTable.capacity} seats</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLES[selectedTable.status]?.bg} ${STATUS_STYLES[selectedTable.status]?.text}`}>
                    {selectedTable.status}
                  </span>
                </div>
              </div>

              {/* Status Controls */}
              <div className="p-4 border-b border-gray-800">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {TABLE_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedTable._id, s)}
                      disabled={s === selectedTable.status || updatingId === selectedTable._id}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
                        s === selectedTable.status
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      {updatingId === selectedTable._id ? '...' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Orders */}
              <div className="p-4 flex-1 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Active Orders</p>
                {loadingOrders ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : tableOrders.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No active orders</p>
                ) : tableOrders.map(order => (
                  <div key={order._id} className="bg-gray-800 rounded-xl p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">{order.orderNumber}</span>
                      <span className="text-xs text-orange-400 font-bold">₹{order.total}</span>
                    </div>
                    {order.items?.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-xs text-gray-400">× {item.quantity} {item.name}</p>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-gray-600">+{order.items.length - 3} more</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                        order.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {order.status}
                      </span>
                      <span className={`text-xs ${order.paymentStatus === 'paid' ? 'text-green-400' : 'text-gray-500'}`}>
                        {order.paymentStatus === 'paid' ? '✓ paid' : 'unpaid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <p className="text-4xl mb-3">🪑</p>
              <p className="text-gray-500 text-sm">Select a table to view details and manage orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
