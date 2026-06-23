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
      <div className="relative h-24 w-full rounded-t-2xl">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover rounded-t-2xl"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-smoke dark:to-coal rounded-t-2xl">🍽️</div>
        )}
        
        {/* Veg/Non-veg Dot */}
        <span className={`absolute left-2.5 top-2.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-coal ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />

        {/* Floating ADD/Stepper button overlapping bottom edge of image */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[80px] h-8 z-10">
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!item.isAvailable}
              className="w-full h-full bg-white dark:bg-ash text-orange-600 dark:text-orange-400 border border-gray-200 dark:border-gray-600 rounded-xl font-black text-[11px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4)] hover:bg-gray-50 dark:hover:bg-coal active:scale-95 transition-all flex items-center justify-center uppercase tracking-wide"
            >
              {item.isAvailable ? 'ADD' : 'OUT'}
            </button>
          ) : (
            <div className="w-full h-full bg-white dark:bg-ash text-orange-600 dark:text-orange-400 border border-gray-200 dark:border-gray-600 rounded-xl font-black text-[11px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-between px-1">
              <button
                onClick={handleDecrement}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-orange-50 dark:hover:bg-coal active:scale-75 text-orange-600 dark:text-orange-400 text-base transition-transform"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-coal dark:text-white font-black select-none text-[11px]">{qty}</span>
              <button
                onClick={handleIncrement}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-orange-50 dark:hover:bg-coal active:scale-75 text-orange-600 dark:text-orange-400 text-base transition-transform"
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

export default function RecommendationSection({ weatherPicks, userFavorites, combos, weatherCondition, activeOffers }) {
  const hasWeather = weatherPicks && weatherPicks.length > 0;
  const hasFavs = userFavorites && userFavorites.length > 0;
  const hasCombos = combos && combos.length > 0;

  if (!hasWeather && !hasFavs && !hasCombos && !activeOffers) return null;

  return (
    <section className="mb-6 space-y-6">
      {/* Active Offers Banner */}
      {activeOffers && (
        <div className="animate-fade-in bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-3 shadow-sm text-white font-bold text-xs text-center border border-orange-300">
          🎉 {activeOffers}
        </div>
      )}

      {/* Your Favorites */}
      {hasFavs && (
        <div className="animate-fade-in">
          <div className="mb-3 border-l-4 border-pink-500 pl-3">
            <h3 className="font-display text-[15px] font-extrabold text-gray-900 dark:text-white tracking-wide">❤️ Your Usuals</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Based on your past orders</p>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide">
            {userFavorites.map(item => <ItemCard key={item._id} item={item} tone="orange" />)}
          </div>
        </div>
      )}

      {/* Weather Picks */}
      {hasWeather && (
        <div className="animate-fade-in">
          <div className="mb-3 border-l-4 border-blue-400 pl-3">
            <h3 className="font-display text-[15px] font-extrabold text-gray-900 dark:text-white tracking-wide">
              {weatherCondition === 'Rainy' ? '🌧️ Perfect for the Rain' :
               weatherCondition === 'Hot' ? '☀️ Beat the Heat' :
               weatherCondition === 'Cold' ? '❄️ Warm Up' : '🌤️ Perfect for Today'}
            </h3>
            <p className="text-[11px] text-blue-500/70 dark:text-blue-300/60 mt-0.5 font-sans">Curated for the current weather</p>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide">
            {weatherPicks.map(item => <ItemCard key={item._id} item={item} tone="blue" />)}
          </div>
        </div>
      )}

      {/* Best Combos / High Profit */}
      {hasCombos && (
        <div className="animate-fade-in">
          <div className="mb-3 border-l-4 border-flame pl-3">
            <h3 className="font-display text-[15px] font-extrabold text-gray-900 dark:text-white tracking-wide">✨ Complete Your Meal</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Chef recommended add-ons</p>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide">
            {combos.map(item => <ItemCard key={item._id} item={item} tone="orange" />)}
          </div>
        </div>
      )}
    </section>
  );
}
