const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Config = require('../models/Config');

// Helper to determine category based on weather code or override
const getWeatherCategories = (weatherCondition) => {
  if (['Rainy', 'Rain'].includes(weatherCondition)) {
    return ['Soups', 'Specials', 'Starters'];
  }
  if (['Sunny', 'Hot'].includes(weatherCondition)) {
    return ['Beverages', 'Desserts', 'Salads'];
  }
  if (['Cold'].includes(weatherCondition)) {
    return ['Soups', 'Main Course', 'Breads'];
  }
  // Default fallback categories
  return ['Specials', 'Main Course', 'Desserts'];
};

exports.getRecommendations = async (req, res) => {
  try {
    const { customerPhone, cartItems, lat, lon } = req.body; // or req.query depending on route type, but let's use POST for complex bodies
    
    // 1. Fetch Global Config
    let config = await Config.findOne({ key: 'global_settings' });
    let weatherCondition = 'Clear';
    let isWeatherAuto = true;

    if (config && config.weatherOverride && config.weatherOverride !== 'Auto') {
      weatherCondition = config.weatherOverride;
      isWeatherAuto = false;
    }

    // 2. Fetch from Open-Meteo if Auto
    if (isWeatherAuto) {
      try {
        // Default to Mumbai if lat/lon not provided
        const latitude = lat || 19.0760;
        const longitude = lon || 72.8777;
        // Node 18+ has native fetch
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await response.json();
        
        // WMO Weather interpretation codes
        const code = data.current_weather?.weathercode || 0;
        if (code >= 51 && code <= 99) {
          weatherCondition = 'Rainy';
        } else if (data.current_weather?.temperature > 30) {
          weatherCondition = 'Hot';
        } else if (data.current_weather?.temperature < 20) {
          weatherCondition = 'Cold';
        } else {
          weatherCondition = 'Clear';
        }
      } catch (err) {
        console.error('Weather API failed, falling back to Clear', err);
      }
    }

    // 3. Get Weather Picks
    const weatherCategories = getWeatherCategories(weatherCondition);
    const weatherPicks = await MenuItem.find({
      category: { $in: weatherCategories },
      isAvailable: true
    }).limit(5).lean();

    // 4. Get User Favorites (if phone provided)
    let userFavorites = [];
    if (customerPhone) {
      // Find orders for this phone, aggregate item frequency
      const userOrders = await Order.find({ customerPhone, status: { $in: ['completed', 'served'] } }).lean();
      const itemCounts = {};
      
      userOrders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (item.menuItem) {
              itemCounts[item.menuItem] = (itemCounts[item.menuItem] || 0) + item.quantity;
            }
          });
        }
      });
      
      const topItemIds = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(entry => entry[0]);
        
      if (topItemIds.length > 0) {
        userFavorites = await MenuItem.find({ _id: { $in: topItemIds }, isAvailable: true }).lean();
      }
    }

    // 5. Get Profit Upsells / Combos
    // Find popular/featured items that are NOT currently in the cart
    const cartIds = cartItems || [];
    const combos = await MenuItem.find({
      _id: { $nin: cartIds },
      $or: [{ isFeatured: true }, { isPopular: true }],
      isAvailable: true
    }).limit(5).lean();

    // In case no popular items exist, just fallback to random items
    let finalCombos = combos;
    if (combos.length === 0) {
      finalCombos = await MenuItem.find({
        _id: { $nin: cartIds },
        isAvailable: true
      }).limit(3).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        weatherCondition,
        weatherPicks,
        userFavorites,
        combos: finalCombos,
        activeOffers: config ? config.activeOffers : ''
      }
    });

  } catch (error) {
    console.error('Recommendation Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating recommendations' });
  }
};
