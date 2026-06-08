import React from 'react';
import { useCart } from '../../context/CartContext';

const spiceStyles = {
  Mild: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Spicy: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'Extra Spicy': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

export default function MenuItemCard({ item, lang, t }) {
  const { cart, addToCart, updateQuantity } = useCart();

  // Bind directly to global cart state
  const cartItem = cart.find(i => i.menuItem === item._id);
  const qty = cartItem ? cartItem.quantity : 0;

  const displayName = lang === 'hi' && item.nameHindi ? item.nameHindi :
    lang === 'mr' && item.nameMarathi ? item.nameMarathi : item.name;

  const handleAdd = () => {
    addToCart(item, 1);
  };

  const handleIncrement = () => {
    updateQuantity(item._id, qty + 1);
  };

  const handleDecrement = () => {
    updateQuantity(item._id, qty - 1);
  };

  return (
    <article className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-ash border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-glow-sm hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-md dark:hover:shadow-glow-md transition-all duration-300 relative overflow-hidden group">
      {/* Left Column: Details (60%) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {/* Veg/Non-Veg Square Indicator */}
          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center p-[2px] ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </div>
          {item.isPopular && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              ⭐ Bestseller
            </span>
          )}
        </div>

        {/* Item Title */}
        <h3 className="font-display text-[16px] font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-orange-500 transition-colors">
          {displayName}
        </h3>

        {/* Price */}
        <p className="text-[15px] font-extrabold text-orange-500 mt-1">
          ₹{item.price}
        </p>

        {/* Description */}
        {item.description && (
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-sans">
            {item.description}
          </p>
        )}

        {/* Badges / Prep Time / Spice Level */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-3">
          {item.prepTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              ⏱️ {item.prepTime}m
            </span>
          )}
          {item.spiceLevel && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${spiceStyles[item.spiceLevel] || 'bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/10 text-gray-500'}`}>
              🌶️ {item.spiceLevel}
            </span>
          )}
        </div>
      </div>

      {/* Right Column: Square Image & Floating Button (40%) */}
      <div className="relative w-[110px] h-[110px] flex-shrink-0 flex items-center justify-center">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-2xl shadow-md border border-gray-200/50 dark:border-white/10 group-hover:scale-[1.03] transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-smoke dark:to-coal border border-gray-200/50 dark:border-white/10 flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}

        {/* Floating ADD Button / Stepper */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[90px] h-9">
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!item.isAvailable}
              className="w-full h-full bg-white text-orange-500 border border-orange-500/25 rounded-xl font-extrabold text-xs shadow-lg hover:bg-orange-50 hover:border-orange-500/50 active:scale-95 transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
            >
              {item.isAvailable ? (
                <>
                  Add <span className="text-orange-600 font-bold text-sm">+</span>
                </>
              ) : (
                <span className="text-gray-400 text-[10px] font-semibold">Out</span>
              )}
            </button>
          ) : (
            <div className="w-full h-full bg-white text-orange-500 border border-orange-500/25 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-between px-1.5">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 active:scale-75 text-orange-600 text-base font-black transition-transform"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-coal font-black text-xs select-none">{qty}</span>
              <button
                onClick={handleIncrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 active:scale-75 text-orange-600 text-base font-black transition-transform"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
