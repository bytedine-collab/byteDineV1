const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'global_settings'
  },
  weatherOverride: {
    type: String,
    enum: ['Auto', 'Rainy', 'Sunny', 'Cold'],
    default: 'Auto'
  },
  activeOffers: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
