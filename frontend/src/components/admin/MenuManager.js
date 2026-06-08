import React, { useState, useEffect, useCallback } from 'react';
import { menuAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice & Biryani', 'Desserts', 'Beverages', 'Soups', 'Salads', 'Specials'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy', 'Extra Spicy'];

const EMPTY_FORM = {
  name: '', nameHindi: '', nameMarathi: '', description: '',
  category: 'Main Course', price: '', image: '', isVeg: true,
  isAvailable: true, isPopular: false, isFeatured: false,
  spiceLevel: 'Medium', prepTime: 15, tags: '',
};

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAvail, setFilterAvail] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await menuAPI.getAll({ isAvailable: undefined });
      setItems(res.data.data);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      ...EMPTY_FORM,
      ...item,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      return toast.error('Name, price and category are required');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        prepTime: Number(form.prepTime),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (editingItem) {
        await menuAPI.update(editingItem._id, payload);
        toast.success('Item updated!');
      } else {
        await menuAPI.create(payload);
        toast.success('Item added!');
      }
      setShowForm(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    setDeletingId(id);
    try {
      await menuAPI.delete(id);
      toast.success('Item deleted');
      setItems(prev => prev.filter(i => i._id !== id));
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await menuAPI.update(item._id, { isAvailable: !item.isAvailable });
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i));
      toast.success(`${item.name} ${!item.isAvailable ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = items.filter(item => {
    if (filterCategory !== 'All' && item.category !== filterCategory) return false;
    if (filterAvail === 'available' && !item.isAvailable) return false;
    if (filterAvail === 'unavailable' && item.isAvailable) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 w-48"
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterAvail}
            onChange={e => setFilterAvail(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Items</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMenu} className="px-3 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all">↻</button>
          <button
            onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Item
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 text-sm text-gray-500 flex-wrap">
        <span>{filtered.length} items shown</span>
        <span>·</span>
        <span className="text-green-400">{items.filter(i => i.isAvailable).length} available</span>
        <span>·</span>
        <span className="text-red-400">{items.filter(i => !i.isAvailable).length} unavailable</span>
        <span>·</span>
        <span className="text-orange-400">{items.filter(i => i.isPopular).length} popular</span>
      </div>

      {/* Items list grouped by category */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-gray-400">No items found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              {category}
              <span className="bg-gray-800 text-gray-500 text-xs px-2 py-0.5 rounded-full">{categoryItems.length}</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {categoryItems.map(item => (
                <div
                  key={item._id}
                  className={`bg-gray-900 border rounded-xl flex items-center gap-4 p-3 transition-all hover:border-gray-700 ${
                    item.isAvailable ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                  }`}
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-3 h-3 rounded-sm border flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      </span>
                      <span className="font-semibold text-white text-sm truncate">{item.name}</span>
                      {item.isPopular && <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">🔥 Popular</span>}
                      {item.isFeatured && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">⭐ Featured</span>}
                      {!item.isAvailable && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">Unavailable</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-orange-400 font-bold text-sm">₹{item.price}</span>
                      <span className="text-xs text-gray-500">{item.spiceLevel}</span>
                      <span className="text-xs text-gray-600">⏱ {item.prepTime}m</span>
                      <span className="text-xs text-gray-600">📦 {item.orderCount} orders</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle availability */}
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                        item.isAvailable
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
                      }`}
                      title={item.isAvailable ? 'Disable' : 'Enable'}
                    >
                      {item.isAvailable ? '✓ On' : '✗ Off'}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg flex items-center justify-center text-sm transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center text-sm transition-colors disabled:opacity-50"
                    >
                      {deletingId === item._id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h3 className="font-bold text-white text-lg">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Paneer Tikka"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Price (₹) *</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="e.g. 280"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Hindi Name</label>
                  <input name="nameHindi" value={form.nameHindi} onChange={handleChange} placeholder="e.g. पनीर टिक्का"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Marathi Name</label>
                  <input name="nameMarathi" value={form.nameMarathi} onChange={handleChange} placeholder="e.g. पनीर टिक्का"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                  placeholder="Short description of the dish..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Spice Level</label>
                  <select name="spiceLevel" value={form.spiceLevel} onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500">
                    {SPICE_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Prep Time (mins)</label>
                  <input name="prepTime" type="number" value={form.prepTime} onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Image URL</label>
                <input name="image" value={form.image} onChange={handleChange} placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                {form.image && (
                  <img src={form.image} alt="preview" className="w-24 h-16 rounded-lg object-cover mt-2" onError={e => { e.target.style.display='none'; }} />
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold uppercase tracking-wider">Tags (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. spicy, grilled, popular"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'isVeg', label: '🟢 Vegetarian' },
                  { name: 'isAvailable', label: '✅ Available' },
                  { name: 'isPopular', label: '🔥 Popular' },
                  { name: 'isFeatured', label: '⭐ Featured' },
                ].map(toggle => (
                  <label key={toggle.name} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl px-3 py-2.5 cursor-pointer">
                    <input type="checkbox" name={toggle.name} checked={!!form[toggle.name]} onChange={handleChange} className="accent-orange-500" />
                    <span className="text-xs text-gray-300">{toggle.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
