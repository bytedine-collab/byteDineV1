import { useState, useEffect } from 'react';

// Logic-based AI recommendations (no external ML needed)
export const useAIRecommendations = (menuItems, cart) => {
  const [recommendations, setRecommendations] = useState([]);
  const [upsellItems, setUpsellItems] = useState([]);
  const [timeBasedSuggestions, setTimeBasedSuggestions] = useState([]);

  useEffect(() => {
    if (!menuItems || menuItems.length === 0) return;
    generateRecommendations();
  }, [menuItems, cart]);

  const generateRecommendations = () => {
    const hour = new Date().getHours();

    // Time-based suggestions
    let timeItems = [];
    if (hour >= 6 && hour < 11) {
      // Breakfast time
      timeItems = menuItems.filter(i =>
        i.category === 'Beverages' || i.tags?.includes('light')
      );
    } else if (hour >= 11 && hour < 15) {
      // Lunch
      timeItems = menuItems.filter(i =>
        i.category === 'Main Course' || i.category === 'Rice & Biryani'
      );
    } else if (hour >= 15 && hour < 18) {
      // Snack time
      timeItems = menuItems.filter(i =>
        i.category === 'Starters' || i.category === 'Beverages'
      );
    } else {
      // Dinner
      timeItems = menuItems.filter(i =>
        i.isPopular || i.isFeatured
      );
    }
    setTimeBasedSuggestions(timeItems.slice(0, 4));

    // Popular items not in cart
    const cartIds = cart.map(c => c.menuItem);
    const popular = menuItems
      .filter(i => i.isPopular && !cartIds.includes(i._id) && i.isAvailable)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 6);
    setRecommendations(popular);

    // Upsell: based on cart categories
    if (cart.length > 0) {
      const cartCategories = [...new Set(cart.map(i => i.category))];
      let upsell = [];

      // If main course in cart, suggest breads and beverages
      if (cartCategories.includes('Main Course')) {
        const breads = menuItems.filter(i =>
          i.category === 'Breads' && !cartIds.includes(i._id)
        ).slice(0, 2);
        const beverages = menuItems.filter(i =>
          i.category === 'Beverages' && !cartIds.includes(i._id)
        ).slice(0, 1);
        upsell = [...breads, ...beverages];
      }

      // If starters only, suggest main course
      if (cartCategories.includes('Starters') && !cartCategories.includes('Main Course')) {
        const mains = menuItems.filter(i =>
          i.category === 'Main Course' && i.isPopular && !cartIds.includes(i._id)
        ).slice(0, 3);
        upsell = [...upsell, ...mains];
      }

      // If meal, suggest desserts
      if ((cartCategories.includes('Main Course') || cartCategories.includes('Rice & Biryani'))
        && !cartCategories.includes('Desserts')) {
        const desserts = menuItems.filter(i =>
          i.category === 'Desserts' && !cartIds.includes(i._id)
        ).slice(0, 2);
        upsell = [...upsell, ...desserts];
      }

      setUpsellItems([...new Map(upsell.map(i => [i._id, i])).values()].slice(0, 4));
    } else {
      setUpsellItems([]);
    }
  };

  // Parse voice input into cart items
  const parseVoiceOrder = (transcript, menuItems) => {
    const lowerText = transcript.toLowerCase();
    const results = [];

    // Number words mapping
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
    };

    menuItems.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemWords = itemName.split(' ');

      // Check if item name appears in transcript
      const itemMentioned = itemWords.some(word =>
        word.length > 3 && lowerText.includes(word)
      ) || lowerText.includes(itemName);

      if (itemMentioned) {
        // Try to find quantity before item name
        let quantity = 1;

        // Check for digit numbers
        const digitMatch = lowerText.match(new RegExp(`(\\d+)\\s*(?:${itemWords.join('|')})`));
        if (digitMatch) {
          quantity = parseInt(digitMatch[1]);
        } else {
          // Check for word numbers
          Object.entries(numberWords).forEach(([word, num]) => {
            const pattern = new RegExp(`${word}\\s+(?:${itemWords.join('|')})`, 'i');
            if (pattern.test(lowerText)) quantity = num;
          });
        }

        results.push({ item, quantity });
      }
    });

    return results;
  };

  return { recommendations, upsellItems, timeBasedSuggestions, parseVoiceOrder };
};
