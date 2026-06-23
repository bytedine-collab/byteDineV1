import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { menuAPI, orderAPI, tableAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAIRecommendations } from '../hooks/useAIRecommendations';
import { useTranslation } from '../utils/translations';
import MenuItemCard from '../components/customer/MenuItemCard';
import CartPanel from '../components/customer/CartPanel';
import VoiceOrderButton from '../components/customer/VoiceOrderButton';
import OrderTracker from '../components/customer/OrderTracker';
import RecommendationSection from '../components/customer/RecommendationSection';
import UpsellModal from '../components/customer/UpsellModal';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: '🍽️' },
  { id: 'Starters', label: 'Starters', icon: '🥗' },
  { id: 'Main Course', label: 'Mains', icon: '🍛' },
  { id: 'Breads', label: 'Breads', icon: '🫓' },
  { id: 'Rice & Biryani', label: 'Rice', icon: '🍚' },
  { id: 'Desserts', label: 'Desserts', icon: '🍮' },
  { id: 'Beverages', label: 'Drinks', icon: '🥤' },
];

const LANGUAGES = [
  { id: 'en', label: 'EN', flag: '🇬🇧' },
  { id: 'hi', label: 'हिं', flag: '🇮🇳' },
  { id: 'mr', label: 'मर', flag: '🇮🇳' },
];

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get('table');

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [lang, setLang] = useState('en');
  const [tableInfo, setTableInfo] = useState(null);
  const [waiterActive, setWaiterActive] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const { cart, addToCart, itemCount, total, setTableNumber, setTableId } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { weatherPicks, userFavorites, combos, weatherCondition, activeOffers, parseVoiceOrder } = useAIRecommendations(menuItems, cart);
  const { t } = useTranslation(lang);

  useEffect(() => {
    if (!tableNumber) {
      toast.error('Invalid table QR code');
      return;
    }
    setTableNumber(tableNumber);
    loadMenu();
    loadTableInfo();
    loadActiveOrders();
    setupSocket();
  }, [tableNumber]);

  useEffect(() => {
    if (itemCount > 0) {
      setCartPulse(true);
      const timer = setTimeout(() => setCartPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  const loadMenu = async () => {
    try {
      const res = await menuAPI.getAll({ isAvailable: true });
      setMenuItems(res.data.data);
      localStorage.setItem('cachedMenu', JSON.stringify(res.data.data));
      localStorage.setItem('menuCachedAt', Date.now().toString());
    } catch {
      const cached = localStorage.getItem('cachedMenu');
      if (cached) {
        setMenuItems(JSON.parse(cached));
        toast('Using cached menu (offline mode)', { icon: '📦' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    try {
      const res = await tableAPI.getByNumber(tableNumber);
      setTableInfo(res.data.data);
      setTableId(res.data.data._id);
    } catch (err) {
      console.error('Table info error:', err);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const res = await orderAPI.getByTable(tableNumber);
      setActiveOrders(res.data.data);
    } catch (err) {
      console.error('Orders error:', err);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    socket.emit('joinTable', { tableNumber });

    socket.on('orderUpdated', (order) => {
      setActiveOrders(prev =>
        prev.map(o => o._id === order._id ? order : o)
      );
      const statusMap = { preparing: '👨‍🍳 Preparing your order!', ready: '🔔 Your order is ready!', served: '✅ Enjoy your meal!' };
      if (statusMap[order.status]) toast(statusMap[order.status], { duration: 4000 });
    });

    socket.on('orderCreated', (order) => {
      setActiveOrders(prev => [order, ...prev]);
    });

    socket.on('waiterOnWay', () => {
      toast('🏃 Waiter is on the way!', { duration: 3000 });
    });

    return () => socket.off('orderUpdated').off('orderCreated').off('waiterOnWay');
  };

  const handleVoiceResult = useCallback((transcript) => {
    const results = parseVoiceOrder(transcript, menuItems);
    if (results.length === 0) {
      toast.error('Could not recognize items. Please try again.');
      return;
    }
    results.forEach(({ item, quantity }) => {
      addToCart(item, quantity);
      toast.success(`Added ${quantity}x ${item.name}`);
    });
  }, [menuItems, parseVoiceOrder, addToCart]);

  const handleCallWaiter = async () => {
    try {
      setWaiterActive(true);
      await orderAPI.callWaiter({ tableNumber, message: 'Customer needs assistance' });
      toast.success(t('waiterCalled') || 'Waiter called! Assistance is on the way.');
      setTimeout(() => setWaiterActive(false), 2000);
    } catch {
      setWaiterActive(false);
      toast.error('Could not call waiter. Please try again.');
    }
  };

  const handleItemAdded = () => {
    setShowUpsellModal(true);
  };

  const filteredItems = menuItems.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchVeg = !vegOnly || item.isVeg;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchVeg && matchSearch;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-coal flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-flame border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-glow-md"></div>
        <p className="text-gray-900 dark:text-white text-base font-black font-display tracking-wide">Loading Menu...</p>
        <p className="text-gray-500 text-xs mt-1">Table {tableNumber}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-coal dark:text-white pb-28 font-sans transition-colors duration-300">
      {/* Premium background radial highlights (visible in dark mode only) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.06),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(247,197,159,0.06),transparent_30%)]" />

      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/60 dark:border-white/5 bg-white/90 dark:bg-coal/85 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 py-3.5">
          {/* Top row: Brand & Table Context */}
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div>
              <h1 className="font-display text-xl font-black tracking-tight bg-gradient-to-r from-flame to-ember bg-clip-text text-transparent">
                🍴 SmartDine
              </h1>
              <div className="mt-0.5 h-0.5 w-10 rounded-full bg-gradient-to-r from-flame to-ember" />
            </div>
            
            {/* Table context & active waiter button */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-flame to-ember px-3 py-1.5 text-xs font-black text-white shadow-glow-sm">
                Table {tableNumber}
              </span>
              
              <button
                onClick={handleCallWaiter}
                disabled={waiterActive}
                className={`h-8 w-8 rounded-xl border flex items-center justify-center text-sm transition-all duration-300 ${
                  waiterActive
                    ? 'bg-yellow-400 text-coal border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.25)] scale-95'
                    : 'bg-gray-100 text-yellow-600 border-gray-200 dark:bg-white/5 dark:text-yellow-300 dark:border-white/10 hover:bg-yellow-500/10 active:scale-95'
                }`}
                aria-label="Call waiter"
              >
                🛎️
              </button>
            </div>
          </div>

          {/* Languages, Theme & Orders bar */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              {/* Compact language switcher */}
              <div className="flex bg-gray-100 dark:bg-ash border border-gray-200 dark:border-white/10 rounded-xl p-0.5">
                {LANGUAGES.map(language => (
                  <button
                    key={language.id}
                    onClick={() => setLang(language.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all duration-200 ${
                      lang === language.id
                        ? 'bg-gradient-to-r from-flame to-ember text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {language.label.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="h-7 w-7 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-yellow-300 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-xs active:scale-95 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>

            {/* Active Orders tracker pill */}
            {activeOrders.length > 0 && (
              <button
                onClick={() => setShowTracker(true)}
                className="relative h-7 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 px-3 text-[10px] font-black tracking-wider text-blue-600 dark:text-blue-200 border border-blue-400/20 active:scale-95 flex items-center gap-1.5 transition-all"
              >
                <span>📋 MY ORDERS</span>
                <span className="bg-flame text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {activeOrders.length}
                </span>
              </button>
            )}
          </div>

          {/* Search bar (Zomato style) */}
          <div className="relative mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
            <input
              type="text"
              placeholder={t('search') || "Search for dishes..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full min-h-[44px] rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-ash pl-10 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-coal/30 focus:shadow-[0_0_0_3.5px_rgba(249,115,22,0.08)] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filters: Veg Only and Voice ordering */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`h-9 flex items-center gap-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                vegOnly 
                  ? 'bg-green-500/15 text-green-600 dark:text-green-300 border border-green-500/25 shadow-[0_0_12px_rgba(34,197,94,0.08)]' 
                  : 'bg-gray-100 dark:bg-ash text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center p-[2px] ${vegOnly ? 'border-green-500' : 'border-gray-400 dark:border-gray-500'}`}>
                {vegOnly && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
              </div>
              <span>{t('vegOnly') || 'Veg Only'}</span>
            </button>
            <VoiceOrderButton onResult={handleVoiceResult} t={t} />
          </div>

          {/* Horizontal category scroll pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`h-9 flex-shrink-0 rounded-xl px-4 text-xs font-black tracking-wide transition-all active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-flame to-ember text-white shadow-glow-sm border-0'
                    : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-ash dark:text-gray-400 dark:border-white/5 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-smoke dark:hover:text-white'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>{cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-5">
        {/* AI Recommendations */}
        {activeCategory === 'All' && !search && !vegOnly && (weatherPicks.length > 0 || userFavorites.length > 0 || combos.length > 0) && (
          <RecommendationSection
            weatherPicks={weatherPicks}
            userFavorites={userFavorites}
            combos={combos}
            weatherCondition={weatherCondition}
            activeOffers={activeOffers}
            onAdd={addToCart}
            onItemAdded={handleItemAdded}
            t={t}
          />
        )}

        {/* Menu list header */}
        <div className="mb-4">
          <h2 className="font-display text-[15px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest pl-1">
            {activeCategory === 'All' ? 'All Dishes' : activeCategory}
          </h2>
        </div>

        {/* Menu items list */}
        <div className="grid grid-cols-1 gap-3.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-ash/40">
              <p className="text-5xl mb-4">🍽️</p>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-300">No dishes match your filter</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Try clearing search or checking other categories.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div key={item._id} className="animate-slide-up" style={{ animationDelay: `${index * 40}ms` }}>
                <MenuItemCard item={item} lang={lang} t={t} onItemAdded={handleItemAdded} />
              </div>
            ))
          )}
        </div>
      </main>

      {/* Sticky Bottom Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-50 via-gray-50/95 dark:from-coal dark:via-coal/90 to-transparent pt-6 pb-6 px-4">
          <button
            onClick={() => setShowCart(true)}
            className={`mx-auto flex h-14 w-full max-w-lg items-center justify-between rounded-2xl bg-gradient-to-r from-flame to-ember px-5 py-4 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all ${cartPulse ? 'scale-[1.02]' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="relative text-xl">
                🛒
                <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-orange-600">
                  {itemCount}
                </span>
              </span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest leading-none">View Order</p>
                <p className="text-sm font-black text-white mt-0.5">Dine-in Cart</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="font-black text-base text-white">₹{total}</span>
              <span className="text-white text-lg font-bold">➜</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Sheet checkout overlay */}
      {showCart && (
        <CartPanel
          tableNumber={tableNumber}
          tableId={tableInfo?._id}
          onClose={() => setShowCart(false)}
          onOrderPlaced={(order) => {
            setActiveOrders(prev => [order, ...prev]);
            setShowCart(false);
            setShowTracker(true);
          }}
          t={t}
          lang={lang}
        />
      )}

      {/* Order status tracker overlay */}
      {showTracker && (
        <OrderTracker
          orders={activeOrders}
          onClose={() => setShowTracker(false)}
          t={t}
        />
      )}

      {/* KFC-style Upsell Modal */}
      {showUpsellModal && combos.length > 0 && (
        <UpsellModal 
          items={combos.slice(0, 3)} 
          onClose={() => setShowUpsellModal(false)} 
          t={t} 
          lang={lang} 
        />
      )}
    </div>
  );
}
