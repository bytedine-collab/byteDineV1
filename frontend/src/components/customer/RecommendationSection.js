import React from 'react';
import { useCart } from '../../context/CartContext';

function ItemCard({ item, tone = 'orange' }) {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItem = cart.find(i => i.menuItem === item._id);
  const qty = cartItem ? cartItem.quantity : 0;

  const toneClasses = tone === 'blue'
    ? 'border-blue-100 bg-white hover:border-blue-300 dark:border-blue-500/10 dark:bg-blue-950/10 dark:hover:border-blue-400/30 shadow-sm'
    : 'border-orange-100 bg-white hover:border-orange-300 dark:border-orange-500/10 dark:bg-orange-950/10 dark:hover:border-orange-400/30 shadow-sm';

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
    <div className={`w-36 flex-shrink-0 overflow-hidden rounded-2xl border ${toneClasses} backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col pb-3`}>
      {/* Top: Photo Area with Veg/Non-Veg icon */}
      <div className="relative h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-smoke dark:to-coal overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🍽️</div>
        )}
        
        {/* Veg/Non-veg Dot */}
        <span className={`absolute left-2.5 top-2.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-coal ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />

        {/* Floating ADD/Stepper button overlapping bottom edge of image */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[80px] h-8 z-10">
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!item.isAvailable}
              className="w-full h-full bg-white text-orange-500 border border-orange-500/20 rounded-xl font-extrabold text-[11px] shadow-lg hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-0.5 uppercase tracking-wide"
            >
              {item.isAvailable ? 'Add +' : 'Out'}
            </button>
          ) : (
            <div className="w-full h-full bg-white text-orange-500 border border-orange-500/20 rounded-xl font-extrabold text-[11px] shadow-lg flex items-center justify-between px-1.5">
              <button
                onClick={handleDecrement}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-50 active:scale-75 text-orange-600 font-black"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-coal font-black select-none text-[10px]">{qty}</span>
              <button
                onClick={handleIncrement}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-50 active:scale-75 text-orange-600 font-black"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Text Content */}
      <div className="p-2.5 pt-4 flex flex-col flex-1">
        <p className="line-clamp-2 text-xs font-bold leading-tight text-gray-900 dark:text-white mb-2 font-display">
          {item.name}
        </p>
        <p className="text-xs font-extrabold text-orange-500 mt-auto">
          ₹{item.price}
        </p>
      </div>
    </div>
  );
}

export default function RecommendationSection({ items, upsellItems, recommendations }) {
  const popularItems = items || recommendations || [];
  const upsell = upsellItems || [];

  if (popularItems.length === 0 && upsell.length === 0) return null;

  return (
    <section className="mb-6 space-y-6">
      {popularItems.length > 0 && (
        <div className="animate-fade-in">
          <div className="mb-3 border-l-4 border-flame pl-3">
            <h3 className="font-display text-[15px] font-extrabold text-gray-900 dark:text-white tracking-wide">✨ Picks for You</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Chef-friendly matches based on your table</p>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide">
            {popularItems.map(item => <ItemCard key={item._id} item={item} />)}
          </div>
        </div>
      )}

      {upsell.length > 0 && (
        <div className="animate-fade-in">
          <div className="mb-3 border-l-4 border-blue-400 pl-3">
            <h3 className="font-display text-[15px] font-extrabold text-gray-900 dark:text-white tracking-wide">Complete Your Meal</h3>
            <p className="text-[11px] text-blue-500/70 dark:text-blue-300/60 mt-0.5 font-sans">Pairs beautifully with your cart</p>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide">
            {upsell.map(item => <ItemCard key={item._id} item={item} tone="blue" />)}
          </div>
        </div>
      )}
    </section>
  );
}
