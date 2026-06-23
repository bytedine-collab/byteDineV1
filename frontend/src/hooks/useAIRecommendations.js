import { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';

// AI recommendations using the backend engine
export const useAIRecommendations = (menuItems, cart) => {
  const [weatherPicks, setWeatherPicks] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [combos, setCombos] = useState([]);
  const [weatherCondition, setWeatherCondition] = useState('');
  const [activeOffers, setActiveOffers] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [cart]);

  const fetchRecommendations = async () => {
    try {
      const customerPhone = localStorage.getItem('customerPhone') || '';
      const cartItems = cart.map(c => c.menuItem);
      
      const res = await recommendationAPI.get({ customerPhone, cartItems });
      
      if (res.data.success) {
        setWeatherPicks(res.data.data.weatherPicks || []);
        setUserFavorites(res.data.data.userFavorites || []);
        setCombos(res.data.data.combos || []);
        setWeatherCondition(res.data.data.weatherCondition || '');
        setActiveOffers(res.data.data.activeOffers || '');
      }
    } catch (err) {
      console.error('Failed to fetch AI recommendations', err);
    }
  };
  // Kept for backward compatibility if needed internally

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

  return { weatherPicks, userFavorites, combos, weatherCondition, activeOffers, parseVoiceOrder };
};
