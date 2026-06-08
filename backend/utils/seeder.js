const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const connectDB = require('../config/database');

const menuItems = [
  // Starters
  { name: 'Paneer Tikka', nameHindi: 'पनीर टिक्का', category: 'Starters', price: 280, isVeg: true, isPopular: true, spiceLevel: 'Medium', prepTime: 20, orderCount: 145, description: 'Marinated cottage cheese grilled in tandoor', tags: ['tandoor', 'grilled', 'starter'], image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400' },
  { name: 'Veg Spring Rolls', nameHindi: 'वेज स्प्रिंग रोल्स', category: 'Starters', price: 180, isVeg: true, spiceLevel: 'Mild', prepTime: 15, orderCount: 89, description: 'Crispy rolls stuffed with fresh vegetables', tags: ['crispy', 'chinese'], image: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400' },
  { name: 'Chicken Seekh Kebab', nameHindi: 'चिकन सीख कबाब', category: 'Starters', price: 320, isVeg: false, isPopular: true, spiceLevel: 'Spicy', prepTime: 25, orderCount: 132, description: 'Minced chicken skewers grilled over charcoal', tags: ['non-veg', 'grilled', 'kebab'], image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400' },
  { name: 'Hara Bhara Kebab', nameHindi: 'हरा भरा कबाब', category: 'Starters', price: 220, isVeg: true, spiceLevel: 'Mild', prepTime: 18, orderCount: 67, description: 'Spinach and peas patties, shallow fried', tags: ['healthy', 'veg'], image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },

  // Main Course
  { name: 'Paneer Butter Masala', nameHindi: 'पनीर बटर मसाला', category: 'Main Course', price: 320, isVeg: true, isPopular: true, isFeatured: true, spiceLevel: 'Medium', prepTime: 20, orderCount: 234, description: 'Cottage cheese in rich tomato butter gravy', tags: ['popular', 'creamy', 'curry'], image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400' },
  { name: 'Dal Makhani', nameHindi: 'दाल मखनी', category: 'Main Course', price: 280, isVeg: true, isPopular: true, spiceLevel: 'Mild', prepTime: 30, orderCount: 198, description: 'Slow cooked black lentils in butter and cream', tags: ['popular', 'dal', 'comfort'], image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
  { name: 'Butter Chicken', nameHindi: 'बटर चिकन', category: 'Main Course', price: 380, isVeg: false, isPopular: true, isFeatured: true, spiceLevel: 'Mild', prepTime: 25, orderCount: 312, description: 'Tender chicken in velvety tomato cream sauce', tags: ['popular', 'non-veg', 'creamy'], image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400' },
  { name: 'Shahi Paneer', nameHindi: 'शाही पनीर', category: 'Main Course', price: 340, isVeg: true, spiceLevel: 'Mild', prepTime: 22, orderCount: 156, description: 'Paneer in rich Mughlai gravy with cashews', tags: ['rich', 'mughlai'], image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400' },
  { name: 'Chicken Biryani', nameHindi: 'चिकन बिरयानी', category: 'Rice & Biryani', price: 350, isVeg: false, isPopular: true, isFeatured: true, spiceLevel: 'Medium', prepTime: 35, orderCount: 289, description: 'Fragrant basmati rice layered with spiced chicken', tags: ['biryani', 'rice', 'non-veg'], image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
  { name: 'Veg Biryani', nameHindi: 'वेज बिरयानी', category: 'Rice & Biryani', price: 280, isVeg: true, spiceLevel: 'Medium', prepTime: 30, orderCount: 167, description: 'Aromatic basmati rice with fresh vegetables', tags: ['biryani', 'rice', 'veg'], image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400' },

  // Breads
  { name: 'Butter Naan', nameHindi: 'बटर नान', category: 'Breads', price: 60, isVeg: true, spiceLevel: 'Mild', prepTime: 8, orderCount: 445, description: 'Soft leavened bread brushed with butter', tags: ['bread', 'tandoor'], image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
  { name: 'Garlic Naan', nameHindi: 'गार्लिक नान', category: 'Breads', price: 80, isVeg: true, isPopular: true, spiceLevel: 'Mild', prepTime: 8, orderCount: 389, description: 'Naan topped with garlic and coriander', tags: ['bread', 'garlic', 'tandoor'], image: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=400' },
  { name: 'Tandoori Roti', nameHindi: 'तंदूरी रोटी', category: 'Breads', price: 40, isVeg: true, spiceLevel: 'Mild', prepTime: 6, orderCount: 523, description: 'Whole wheat bread baked in tandoor', tags: ['bread', 'healthy', 'tandoor'], image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },

  // Desserts
  { name: 'Gulab Jamun', nameHindi: 'गुलाब जामुन', category: 'Desserts', price: 120, isVeg: true, spiceLevel: 'Mild', prepTime: 10, orderCount: 234, description: 'Soft milk dumplings soaked in rose syrup', tags: ['sweet', 'dessert', 'traditional'], image: 'https://images.unsplash.com/photo-1666985595778-c74a31e15f21?w=400' },
  { name: 'Kulfi', nameHindi: 'कुल्फी', category: 'Desserts', price: 100, isVeg: true, spiceLevel: 'Mild', prepTime: 5, orderCount: 178, description: 'Traditional Indian ice cream with cardamom', tags: ['ice cream', 'dessert', 'cold'], image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400' },

  // Beverages
  { name: 'Mango Lassi', nameHindi: 'आम लस्सी', category: 'Beverages', price: 120, isVeg: true, spiceLevel: 'Mild', prepTime: 5, orderCount: 267, isPopular: true, description: 'Refreshing yogurt drink with fresh mango', tags: ['drink', 'cold', 'refreshing'], image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400' },
  { name: 'Masala Chai', nameHindi: 'मसाला चाय', category: 'Beverages', price: 60, isVeg: true, spiceLevel: 'Mild', prepTime: 5, orderCount: 312, description: 'Spiced Indian tea with ginger and cardamom', tags: ['hot', 'tea', 'spiced'], image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400' },
  { name: 'Fresh Lime Soda', nameHindi: 'फ्रेश लाइम सोडा', category: 'Beverages', price: 80, isVeg: true, spiceLevel: 'Mild', prepTime: 3, orderCount: 189, description: 'Chilled lime soda, sweet or salted', tags: ['cold', 'refreshing', 'drink'], image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400' },
];

const seedDB = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'admin',
    });

    // Create kitchen user
    await User.create({
      name: 'Kitchen Staff',
      email: 'kitchen@restaurant.com',
      password: 'kitchen123',
      role: 'kitchen',
    });

    console.log('👥 Users created');

    // Create menu items
    const createdItems = await MenuItem.insertMany(menuItems);
    console.log(`🍽️  ${createdItems.length} menu items created`);

    // Set complementary items
    const paneerButter = await MenuItem.findOne({ name: 'Paneer Butter Masala' });
    const butterNaan = await MenuItem.findOne({ name: 'Butter Naan' });
    const garlicNaan = await MenuItem.findOne({ name: 'Garlic Naan' });
    const mangoLassi = await MenuItem.findOne({ name: 'Mango Lassi' });
    const dalMakhani = await MenuItem.findOne({ name: 'Dal Makhani' });

    if (paneerButter && garlicNaan && mangoLassi) {
      await MenuItem.findByIdAndUpdate(paneerButter._id, {
        complementaryItems: [garlicNaan._id, mangoLassi._id, dalMakhani?._id].filter(Boolean),
      });
    }

    const butterChicken = await MenuItem.findOne({ name: 'Butter Chicken' });
    if (butterChicken && butterNaan && mangoLassi) {
      await MenuItem.findByIdAndUpdate(butterChicken._id, {
        complementaryItems: [butterNaan._id, mangoLassi._id].filter(Boolean),
      });
    }

    // Create tables 1–10
    const tables = Array.from({ length: 10 }, (_, i) => ({
      tableNumber: i + 1,
      capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
    }));
    await Table.insertMany(tables);
    console.log('🪑 10 tables created');

    console.log('\n✅ Database seeded successfully!');
    console.log('📧 Admin: admin@restaurant.com / admin123');
    console.log('📧 Kitchen: kitchen@restaurant.com / kitchen123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
