const express = require('express');
const router = express.Router();
const { protect, admin } = require('../Middleware/authMiddleware');
const {
    getAllCoupons,
    createCoupon,
    getCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
} = require('../Controllers/couponController');

// Admin routes (protected & admin only)
router.route('/').get(protect, admin, getAllCoupons).post(protect, admin, createCoupon);
router.route('/:id').get(protect, admin, getCoupon).put(protect, admin, updateCoupon).delete(protect, admin, deleteCoupon);

// Customer route (protected)
router.post('/validate', protect, validateCoupon);

module.exports = router;
