const express = require('express');
const {
    createPaymentIntent,
    confirmPayment,
    getPaymentStatus,
    handleWebhook
} = require('../Controllers/paymentController');
const { protect } = require('../Middleware/authMiddleware');

const router = express.Router();

// Protected routes (require authentication)
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.get('/status/:paymentIntentId', protect, getPaymentStatus);

// Webhook route (public, called by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
