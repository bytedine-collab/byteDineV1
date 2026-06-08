import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState(null);
  const [tableId, setTableId] = useState(null);

  // Persist cart in localStorage (offline support)
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, quantity = 1, specialInstructions = '') => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem === item._id);
      if (existing) {
        return prev.map(i =>
          i.menuItem === item._id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        menuItem: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity,
        specialInstructions,
        isVeg: item.isVeg,
        category: item.category,
      }];
    });
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(prev => prev.map(i =>
      i.menuItem === menuItemId ? { ...i, quantity } : i
    ));
  };

  const removeFromCart = (menuItemId) => {
    setCart(prev => prev.filter(i => i.menuItem !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, addItem: addToCart, updateQuantity, removeFromCart, clearCart,
      subtotal, tax, total, itemCount,
      tableNumber, setTableNumber,
      tableId, setTableId,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
