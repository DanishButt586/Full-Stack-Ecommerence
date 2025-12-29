const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const {
    generateSalesReport,
    generateInventoryReport,
    generateCustomerReport,
} = require('../Controllers/reportController');

// All report routes require authentication and admin access
// Note: You can add additional admin middleware check here if needed

// Sales Report
router.get('/sales', protect, generateSalesReport);

// Inventory Report
router.get('/inventory', protect, generateInventoryReport);

// Customer Report
router.get('/customers', protect, generateCustomerReport);

module.exports = router;
