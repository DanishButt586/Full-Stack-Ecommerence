const express = require('express');
const router = express.Router();
const { protect, admin } = require('../Middleware/authMiddleware');
const {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    getAllReviews,
    approveReview,
    rejectReview,
    hideReview,
    deleteReviewAdmin,
    getReviewAnalytics,
    markAsAbusive,
    getMyPendingReviews,
    getMyReviews,
} = require('../Controllers/reviewController');

// Public/User routes
router.route('/').post(protect, createReview);
router.get('/my/pending', protect, getMyPendingReviews);
router.get('/my/reviews', protect, getMyReviews);
router.get('/:productId', getProductReviews);
router.route('/:id').put(protect, updateReview).delete(protect, deleteReview);

// Admin routes
router.get('/admin/analytics', protect, admin, getReviewAnalytics);
router.get('/admin/all', protect, admin, getAllReviews);
router.put('/admin/approve/:id', protect, admin, approveReview);
router.put('/admin/reject/:id', protect, admin, rejectReview);
router.put('/admin/hide/:id', protect, admin, hideReview);
router.put('/admin/abusive/:id', protect, admin, markAsAbusive);
router.delete('/admin/:id', protect, admin, deleteReviewAdmin);

module.exports = router;
