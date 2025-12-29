const express = require('express');
const router = express.Router();
const { protect, admin } = require('../Middleware/authMiddleware');
const {
    createOrder,
    validateOrder,
    processPayment,
    updateOrderToPaid,
    getCheckoutSummary,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrders,
} = require('../Controllers/orderController');

// Public checkout routes (require auth in production)
router.post('/validate', protect, validateOrder);
router.post('/process-payment', protect, processPayment);
router.get('/checkout-summary', protect, getCheckoutSummary);

// Order CRUD routes - Protected (GET requires admin)
router.route('/').post(protect, createOrder).get(protect, admin, getAllOrders);
router.get('/myorders', protect, getMyOrders);

// Order specific routes - Protected
router.route('/:id').get(protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
