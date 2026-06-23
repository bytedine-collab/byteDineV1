import React from 'react';
import MenuItemCard from './MenuItemCard';

export default function UpsellModal({ items, onClose, t, lang }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Semi-transparent overlay */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" 
        onClick={onClose} 
      />

      {/* Slide-up modal */}
      <div className="relative z-10 animate-slide-up rounded-t-[32px] bg-white dark:bg-coal shadow-2xl flex flex-col overflow-hidden border-t border-gray-100 dark:border-white/10">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/20" />
        </div>

        <div className="px-5 pt-3 pb-2 text-center">
          <h2 className="font-display text-xl font-extrabold text-gray-900 dark:text-white tracking-wide">
            🍟 Want to add something?
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Perfect pairings to complete your meal
          </p>
        </div>

        <div className="px-4 py-3 overflow-y-auto max-h-[50vh] space-y-3">
          {items.map(item => (
            <MenuItemCard key={item._id} item={item} lang={lang} t={t} />
          ))}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-ash/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-coal border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-95 transition-transform"
          >
            No Thanks
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-flame to-ember text-white font-black text-sm shadow-[0_4px_14px_rgba(249,115,22,0.4)] active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
