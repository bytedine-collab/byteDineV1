const express = require('express');
const router = express.Router();
const { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, getPopularItems } = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getMenu);
router.get('/popular', getPopularItems);
router.get('/:id', getMenuItem);
router.post('/', protect, authorize('admin'), createMenuItem);
router.put('/:id', protect, authorize('admin'), updateMenuItem);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;
