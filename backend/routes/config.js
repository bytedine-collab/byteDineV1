const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// In a real app, protect these with auth middleware
router.route('/')
  .get(configController.getConfig)
  .put(configController.updateConfig);

module.exports = router;
