const express = require('express');
const router = express.Router();
const { protect, admin } = require('../Middleware/authMiddleware');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    getAllCarts,
    clearUserCartByAdmin,
    getCartsSummary,
} = require('../Controllers/cartController');

// User cart routes (protected)
router.route('/').get(protect, getCart).post(protect, addToCart).delete(protect, clearCart);
router.route('/:itemId').put(protect, updateCartItem).delete(protect, removeFromCart);

// Save for later routes (protected)
router.post('/save-for-later/:itemId', protect, saveForLater);
router.post('/move-to-cart/:itemId', protect, moveToCart);
router.delete('/saved/:itemId', protect, removeSavedItem);

// Admin routes
router.get('/admin/all', protect, admin, getAllCarts);
router.get('/admin/summary', protect, admin, getCartsSummary);
router.delete('/admin/:userId', protect, admin, clearUserCartByAdmin);

module.exports = router;
