import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { orderAPI, paymentAPI } from '../../services/api';

const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;

export default function CartPanel({ tableNumber, tableId, onClose, onOrderPlaced, t, combos = [], onAddCombo }) {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, tax, total } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      toast.error('Please enter your name');
      return false;
    }
    if (!PHONE_REGEX.test(customerPhone.trim())) {
      toast.error('Enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const placeOrder = async (method = 'cash') => {
    if (cart.length === 0) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        tableId,
        tableNumber: parseInt(tableNumber),
        items: cart,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        specialRequests: specialRequests.trim(),
        paymentMethod: method === 'online' ? 'upi' : 'cash',
      };
      
      const res = await orderAPI.create(orderData);
      const order = res.data.data;
      
      localStorage.setItem('customerPhone', customerPhone.trim());
      
      if (method === 'online') {
        await handleOnlinePayment(order);
      } else {
        clearCart();
        toast.success('Order placed! Kitchen is preparing your food.', { duration: 4000 });
        onOrderPlaced(order);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  const handleOnlinePayment = async (order) => {
    try {
      const res = await paymentAPI.createOrder({ amount: order.total, orderId: order._id });
      const redirectUrl = res.data?.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error('Payment gateway did not return a checkout URL');
      }

      clearCart();
      window.location.assign(redirectUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initialize payment gateway');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Semi-transparent dark overlay */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Slide-up sheet container */}
      <section className="relative z-10 animate-slide-up rounded-t-[32px] border-t border-gray-100 dark:border-white/10 bg-white dark:bg-ash shadow-2xl max-h-[88vh] flex flex-col overflow-hidden transition-colors duration-300">
        {/* Handle bar for visual sheet look */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/20" />
        </div>

        {/* Header section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
          <div>
            <h2 className="font-display text-xl font-extrabold text-gray-900 dark:text-white tracking-wide flex items-center gap-2">
              🛒 {t('cart') || 'My Cart'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Smart Restaurant Checkout — Table {tableNumber}</p>
          </div>
          <button 
            onClick={onClose} 
            className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white flex items-center justify-center font-bold text-lg active:scale-95 transition-all"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* Scrollable body content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-6xl animate-bounce">🍽️</p>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-300">Your cart is empty</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Add delicious items from the menu to satisfy your cravings.</p>
              <button 
                onClick={onClose} 
                className="mt-2 px-6 py-2.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-orange-500 hover:bg-gray-200 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 active:scale-95"
              >
                Go back to Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items list */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Selected Dishes</h3>
                {cart.map(item => (
                  <div 
                    key={item.menuItem} 
                    className="flex items-center gap-3 bg-gray-50 border border-gray-100 dark:bg-coal dark:border-white/5 rounded-2xl p-3 shadow-sm hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                  >
                    {/* Item Image */}
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-14 w-14 rounded-xl object-cover bg-smoke flex-shrink-0 border border-gray-200 dark:border-white/10"
                        onError={e => { e.target.style.display = 'none'; }} 
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-smoke flex items-center justify-center text-2xl flex-shrink-0 border border-gray-200 dark:border-white/10">
                        🍛
                      </div>
                    )}

                    {/* Item Name & Subtotal */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center p-[2px] flex-shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </span>
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white leading-snug">{item.name}</p>
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight truncate">
                          + {item.addons.map(a => a.name).join(', ')}
                        </p>
                      )}
                      <p className="text-xs font-bold text-orange-500 dark:text-orange-300 mt-1">
                        ₹{(item.price + (item.addons ? item.addons.reduce((a,b)=>a+b.price,0) : 0)) * item.quantity}
                      </p>
                    </div>

                    {/* Stepper with white background (Zomato Style) */}
                    <div className="flex items-center rounded-xl bg-white text-orange-500 border border-orange-500/25 h-8 px-1 shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.menuItem, item.quantity - 1)} 
                        className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-orange-50 active:scale-75 text-orange-600 font-black text-sm"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-black text-coal select-none">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.menuItem, item.quantity + 1)} 
                        className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-orange-50 active:scale-75 text-orange-600 font-black text-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove button */}
                    <button 
                      onClick={() => removeFromCart(item.menuItem)} 
                      className="h-8 w-8 rounded-xl bg-red-500/10 text-red-500 dark:text-red-300 hover:bg-red-500/20 active:scale-95 flex items-center justify-center transition-colors text-sm"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Upsell Recommendations */}
              {combos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-sm">✨</span> Complete Your Meal
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {combos.map(item => (
                      <div key={item._id} className="min-w-[140px] flex-shrink-0 bg-white dark:bg-coal border border-orange-200 dark:border-white/10 rounded-2xl p-2.5 shadow-sm">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="h-20 w-full object-cover rounded-xl mb-2 bg-gray-100 dark:bg-ash" 
                        />
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] font-black text-orange-500">₹{item.price}</p>
                          <button 
                            onClick={() => {
                              onAddCombo(item);
                              toast.success(`Added ${item.name}`);
                            }}
                            className="h-6 px-2.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300 text-[10px] font-bold active:scale-95 transition-all"
                          >
                            + ADD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Details Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contact Details</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                    <input
                      type="text"
                      placeholder="Your Name (e.g. John Doe)"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full min-h-[46px] rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-coal pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.08)]"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-Digit Mobile Number (Required)"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full min-h-[46px] rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-coal pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.08)]"
                    />
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Special Requests</h3>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Optional</span>
                </div>
                <textarea
                  placeholder={t('specialInstructions') || "E.g. Make it spicy, No onions, Serve hot..."}
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  rows={2}
                  className="w-full rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-coal px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none resize-none focus:border-orange-500/60 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.08)]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer sticky checkout bar */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 dark:border-white/5 bg-white dark:bg-coal/90 px-6 py-5 backdrop-blur-xl flex-shrink-0 transition-colors duration-300">
            {/* Bill Details breakdown */}
            <div className="mb-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-4 space-y-2.5">
              <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bill Details</h4>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Restaurant GST & Service Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-white/10 pt-2.5 text-base font-black text-gray-950 dark:text-white">
                <span>Grand Total</span>
                <span className="text-orange-500 dark:text-orange-400">₹{total}</span>
              </div>
            </div>

            {/* Place Order CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => placeOrder('cash')}
                disabled={loading}
                className="flex-1 min-h-[50px] rounded-2xl bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200 text-sm font-bold shadow-sm hover:bg-gray-200 dark:hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : 'Pay Cash'}
              </button>
              
              <button
                onClick={() => placeOrder('online')}
                disabled={loading}
                className="flex-[2] min-h-[50px] rounded-2xl bg-gradient-to-r from-flame to-ember text-sm font-black text-white shadow-glow-md hover:shadow-glow-lg hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Pay Online</span>
                    <span>➜</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
