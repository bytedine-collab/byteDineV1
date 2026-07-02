const express = require('express');
const router = express.Router();
const { getBill } = require('../controllers/billController');

// Public — no auth, so SMS links work without login
router.get('/:orderId', getBill);

module.exports = router;
