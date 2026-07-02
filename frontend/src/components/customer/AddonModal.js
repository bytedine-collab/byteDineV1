import React, { useState } from 'react';

export default function AddonModal({ item, onClose, onAdd }) {
  const [selectedAddons, setSelectedAddons] = useState([]);

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.name === addon.name);
      if (exists) return prev.filter(a => a.name !== addon.name);
      return [...prev, addon];
    });
  };

  const handleConfirm = () => {
    onAdd(item, 1, '', selectedAddons);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-coal w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slide-up sm:animate-none">
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Customize</h3>
            <p className="text-xs text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold">×</button>
        </div>

        <div className="p-5 max-h-[50vh] overflow-y-auto">
          <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">Add-ons</h4>
          <div className="space-y-2">
            {item.addons.map((addon, idx) => {
              const isSelected = selectedAddons.find(a => a.name === addon.name);
              return (
                <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={!!isSelected}
                      onChange={() => toggleAddon(addon)}
                      className="w-5 h-5 rounded text-orange-500 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{addon.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">+₹{addon.price}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-flame to-ember text-white font-black uppercase tracking-wider shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all"
          >
            Add to Cart - ₹{item.price + selectedAddons.reduce((a,b)=>a+b.price, 0)}
          </button>
        </div>
      </div>
    </div>
  );
}
