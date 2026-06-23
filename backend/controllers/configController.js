const Config = require('../models/Config');

// Get the global config (create if it doesn't exist)
exports.getConfig = async (req, res) => {
  try {
    let config = await Config.findOne({ key: 'global_settings' });
    if (!config) {
      config = await Config.create({ key: 'global_settings', weatherOverride: 'Auto' });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching config' });
  }
};

// Update the global config
exports.updateConfig = async (req, res) => {
  try {
    const { weatherOverride, activeOffers } = req.body;
    let config = await Config.findOne({ key: 'global_settings' });
    
    if (!config) {
      config = await Config.create({ key: 'global_settings', weatherOverride: 'Auto' });
    }
    
    if (weatherOverride !== undefined) config.weatherOverride = weatherOverride;
    if (activeOffers !== undefined) config.activeOffers = activeOffers;
    
    await config.save();
    
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error updating config' });
  }
};
