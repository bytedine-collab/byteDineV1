const Table = require('../models/Table');
const QRCode = require('qrcode');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true })
      .populate('currentSession', 'orderNumber status total')
      .sort({ tableNumber: 1 });
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get table by number
// @route   GET /api/tables/:number
// @access  Public
const getTableByNumber = async (req, res) => {
  try {
    const table = await Table.findOne({ tableNumber: req.params.number, isActive: true });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create table
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;
    const table = await Table.create({ tableNumber, capacity });

    // Generate QR code URL
    const qrUrl = `${process.env.FRONTEND_URL}/menu?table=${tableNumber}&qr=${table.qrCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    });

    res.status(201).json({
      success: true,
      data: table,
      qrCode: qrCodeDataUrl,
      qrUrl,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Table number already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Generate QR code for table
// @route   GET /api/tables/:number/qr
// @access  Private/Admin
const generateQR = async (req, res) => {
  try {
    const table = await Table.findOne({ tableNumber: req.params.number });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const qrUrl = `${process.env.FRONTEND_URL}/menu?table=${table.tableNumber}&qr=${table.qrCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    });

    res.json({ success: true, qrCode: qrCodeDataUrl, qrUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private
const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const io = req.app.get('io');
    if (io) io.to('admin-room').emit('tableUpdated', table);

    res.json({ success: true, data: table });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getTables, getTableByNumber, createTable, generateQR, updateTableStatus };
