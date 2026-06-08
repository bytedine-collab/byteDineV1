const express = require('express');
const router = express.Router();
const { getTables, getTableByNumber, createTable, generateQR, updateTableStatus } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getTables);
router.get('/:number', getTableByNumber);
router.post('/', protect, authorize('admin'), createTable);
router.get('/:number/qr', protect, authorize('admin'), generateQR);
router.put('/:id/status', protect, authorize('admin'), updateTableStatus);

module.exports = router;
