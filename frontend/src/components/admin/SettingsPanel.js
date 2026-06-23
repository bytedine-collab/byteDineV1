import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { configAPI } from '../../services/api';

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [weatherOverride, setWeatherOverride] = useState('Auto');
  const [activeOffers, setActiveOffers] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await configAPI.get();
      if (res.data.data) {
        setWeatherOverride(res.data.data.weatherOverride || 'Auto');
        setActiveOffers(res.data.data.activeOffers || '');
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configAPI.update({ weatherOverride, activeOffers });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#111118] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recommendation Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Weather Override
            </label>
            <p className="text-xs text-gray-500 mb-3">
              By default, the AI uses a free API to detect the current weather and recommend appropriate items (e.g., Soups when Rainy). Use this to manually force a weather condition.
            </p>
            <select
              value={weatherOverride}
              onChange={(e) => setWeatherOverride(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-coal p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500"
            >
              <option value="Auto">Auto (Detected via API)</option>
              <option value="Rainy">Force Rainy (Boost Soups & Starters)</option>
              <option value="Sunny">Force Hot/Sunny (Boost Cold Drinks & Salads)</option>
              <option value="Cold">Force Cold (Boost Hot Drinks & Main Course)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Active Offers Banner
            </label>
            <input
              type="text"
              value={activeOffers}
              onChange={(e) => setActiveOffers(e.target.value)}
              placeholder="e.g., Use code DINE20 for 20% off on all Desserts!"
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-coal p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
