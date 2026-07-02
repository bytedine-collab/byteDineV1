const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  nameHindi: { type: String, trim: true },
  nameMarathi: { type: String, trim: true },
  description: { type: String, trim: true },
  descriptionHindi: { type: String, trim: true },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Starters', 'Main Course', 'Breads', 'Rice & Biryani', 'Desserts', 'Beverages', 'Soups', 'Salads', 'Specials'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/300x200?text=Food',
  },
  isVeg: {
    type: Boolean,
    default: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  spiceLevel: {
    type: String,
    enum: ['Mild', 'Medium', 'Spicy', 'Extra Spicy'],
    default: 'Medium',
  },
  prepTime: {
    type: Number, // minutes
    default: 15,
  },
  tags: [String],
  complementaryItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  }],
  orderCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5,
  },
  addons: [{
    name: String,
    price: Number
  }],
}, { timestamps: true });

// Text search index
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
