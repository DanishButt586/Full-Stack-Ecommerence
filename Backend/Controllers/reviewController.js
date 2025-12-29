const Review = require('../Models/reviewModel');
const Product = require('../Models/productModel');
const Order = require('../Models/orderModel');
const Notification = require('../Models/notificationModel');
const { sendResponse, asyncHandler } = require('../Library/helper');

// @desc    Get product reviews
// @route   GET /api/reviews/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({
        product: req.params.productId,
        isApproved: true,
        isVisible: true
    })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 });

    sendResponse(res, 200, true, 'Reviews fetched successfully', reviews);
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { product, order, rating, title, comment, itemId } = req.body;

    // Check if order is provided and delivered
    if (order) {
        const orderExists = await Order.findOne({
            _id: order,
            user: req.user._id,
            orderStatus: 'delivered'
        });

        if (!orderExists) {
            return sendResponse(res, 400, false, 'Order must be delivered before you can review');
        }

        // Check if the product is in the order
        const productInOrder = orderExists.items.find(
            item => item.product.toString() === product.toString()
        );

        if (!productInOrder) {
            return sendResponse(res, 400, false, 'You can only review products from your approved orders');
        }

        // Check if this specific item has already been reviewed
        if (productInOrder.reviewed) {
            return sendResponse(res, 400, false, 'You have already reviewed this item');
        }
    }


    const review = await Review.create({
        user: req.user._id,
        product,
        order: order || null,
        rating,
        title,
        comment,
        isVerifiedPurchase: !!order,
        isApproved: false, // Review needs admin approval
    });

    // Mark the specific item as reviewed in the order
    if (order && itemId) {
        const orderDoc = await Order.findById(order);
        const item = orderDoc.items.id(itemId);
        if (item) {
            item.reviewed = true;
            item.reviewId = review._id;
            await orderDoc.save();
        }
    }

    // Delete the review pending notification for this product
    try {
        await Notification.deleteMany({
            customerId: req.user._id,
            type: 'review_pending',
            'metadata.productId': product,
            'metadata.orderId': order
        });
    } catch (notifError) {
        console.error('Error deleting review pending notification:', notifError);
    }
    // Get product details for notification
    const productDetails = await Product.findById(product);
    const userDetails = await require('../Models/userModel').findById(req.user._id);

    // Create notification for admin
    const adminNotif = await Notification.create({
        orderId: order || null,
        customerId: req.user._id,
        type: 'review_submitted',
        title: '⭐ New Review Submitted',
        message: `${userDetails.name} submitted a review for ${productDetails.name}`,
        orderNumber: order ? (await Order.findById(order)).orderNumber : `Review-${Date.now()}`,
        customerName: userDetails.name,
        customerEmail: userDetails.email,
        orderTotal: 0,
        status: 'pending',
        isCustomerNotification: false,
        relatedId: review._id,
        relatedModel: 'Review',
        metadata: {
            productId: product,
            productName: productDetails.name,
            rating,
            reviewId: review._id
        }
    });
    // Emit real-time notification to admin
    try {
        const { emitAdminNotification } = require('../notificationSocket');
        emitAdminNotification(adminNotif);
    } catch (e) {
        console.error('Socket emit error (admin review):', e);
    }

    sendResponse(res, 201, true, 'Review submitted successfully and pending approval', review);
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (review && review.user.toString() === req.user._id.toString()) {
        review.rating = req.body.rating || review.rating;
        review.title = req.body.title || review.title;
        review.comment = req.body.comment || review.comment;
        review.isApproved = false; // Reset approval when edited

        const updatedReview = await review.save();


        sendResponse(res, 200, true, 'Review updated and pending approval', updatedReview);
    } else {
        sendResponse(res, 404, false, 'Review not found or unauthorized');
    }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (review && review.user.toString() === req.user._id.toString()) {
        const productId = review.product;
        await review.deleteOne();

        // Update product ratings
        const reviews = await Review.find({ product: productId });
        const avgRating = reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

        await Product.findByIdAndUpdate(productId, {
            'ratings.average': avgRating,
            'ratings.count': reviews.length,
        });

        sendResponse(res, 200, true, 'Review deleted successfully');
    } else {
        sendResponse(res, 404, false, 'Review not found or unauthorized');
    }
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // pending, approved, hidden, abusive

    let query = {};
    if (status === 'pending') {
        query.isApproved = false;
    } else if (status === 'approved') {
        query.isApproved = true;
        query.isVisible = true;
    } else if (status === 'hidden') {
        query.isVisible = false;
    } else if (status === 'abusive') {
        query.isAbusive = true;
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
        .populate('user', 'name email avatar')
        .populate('product', 'name')
        .populate('approvedBy', 'name')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    sendResponse(res, 200, true, 'Reviews fetched successfully', {
        reviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Approve review (admin)
// @route   PUT /api/reviews/admin/approve/:id
// @access  Private/Admin
const approveReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id).populate('product', 'name');

    if (!review) {
        return sendResponse(res, 404, false, 'Review not found');
    }

    review.isApproved = true;
    review.isVisible = true;
    review.approvedBy = req.user._id;
    review.approvalDate = new Date();

    await review.save();

    // Update product ratings
    const reviews = await Review.find({ product: review.product._id, isApproved: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

    await Product.findByIdAndUpdate(review.product._id, {
        'ratings.average': avgRating,
        'ratings.count': reviews.length,
    });

    // Notify customer that their review was approved
    await Notification.create({
        type: 'review_approved',
        title: '✅ Review Approved',
        message: `Your review for ${review.product.name} has been approved and is now visible`,
        customerId: review.user,
        relatedId: review._id,
        metadata: {
            productId: review.product._id,
            productName: review.product.name,
            reviewId: review._id
        }
    });

    await review.populate('user', 'name email');

    sendResponse(res, 200, true, 'Review approved successfully', review);
});

// @desc    Reject review (admin)
// @route   PUT /api/reviews/admin/reject/:id
// @access  Private/Admin
const rejectReview = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const review = await Review.findById(req.params.id).populate('product', 'name');

    if (!review) {
        return sendResponse(res, 404, false, 'Review not found');
    }

    review.isApproved = false;
    review.isVisible = false;
    review.hideReason = reason || 'Review does not meet our guidelines';
    review.reviewedBy = req.user._id;
    review.reviewDate = new Date();

    await review.save();

    // Notify customer that their review was rejected
    await Notification.create({
        type: 'review_rejected',
        title: '❌ Review Not Approved',
        message: `Your review for ${review.product.name} was not approved. Reason: ${review.hideReason}`,
        customerId: review.user,
        relatedId: review._id,
        metadata: {
            productId: review.product._id,
            productName: review.product.name,
            reviewId: review._id,
            reason: review.hideReason
        }
    });

    await review.populate('user', 'name email');

    sendResponse(res, 200, true, 'Review rejected successfully', review);
});

// @desc    Hide review (admin)
// @route   PUT /api/reviews/admin/hide/:id
// @access  Private/Admin
const hideReview = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
        return sendResponse(res, 404, false, 'Review not found');
    }

    review.isVisible = false;
    review.hideReason = reason || null;
    review.reviewedBy = req.user._id;
    review.reviewDate = new Date();

    await review.save();

    // Update product ratings
    const reviews = await Review.find({ product: review.product, isApproved: true, isVisible: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

    await Product.findByIdAndUpdate(review.product, {
        'ratings.average': avgRating,
        'ratings.count': reviews.length,
    });

    sendResponse(res, 200, true, 'Review hidden successfully', review);
});

// @desc    Mark review as abusive (admin)
// @route   PUT /api/reviews/admin/abusive/:id
// @access  Private/Admin
const markAsAbusive = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!['spam', 'offensive', 'irrelevant', 'misleading', 'other'].includes(reason)) {
        return sendResponse(res, 400, false, 'Invalid abuse reason');
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
        return sendResponse(res, 404, false, 'Review not found');
    }

    review.isAbusive = true;
    review.abuseReason = reason;
    review.isVisible = false;
    review.reviewedBy = req.user._id;
    review.reviewDate = new Date();

    await review.save();

    // Update product ratings
    const reviews = await Review.find({ product: review.product, isApproved: true, isVisible: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

    await Product.findByIdAndUpdate(review.product, {
        'ratings.average': avgRating,
        'ratings.count': reviews.length,
    });

    sendResponse(res, 200, true, 'Review marked as abusive', review);
});

// @desc    Delete review (admin)
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
const deleteReviewAdmin = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return sendResponse(res, 404, false, 'Review not found');
    }

    const productId = review.product;
    await review.deleteOne();

    // Update product ratings
    const reviews = await Review.find({ product: productId, isApproved: true, isVisible: true });
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

    await Product.findByIdAndUpdate(productId, {
        'ratings.average': avgRating,
        'ratings.count': reviews.length,
    });

    sendResponse(res, 200, true, 'Review deleted successfully');
});

// @desc    Get review analytics (admin)
// @route   GET /api/reviews/admin/analytics
// @access  Private/Admin
const getReviewAnalytics = asyncHandler(async (req, res) => {
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ isApproved: true, isVisible: true });
    const pendingReviews = await Review.countDocuments({ isApproved: false });
    const hiddenReviews = await Review.countDocuments({ isVisible: false });
    const abusiveReviews = await Review.countDocuments({ isAbusive: true });

    // Rating distribution
    const ratingDistribution = await Review.aggregate([
        { $match: { isApproved: true, isVisible: true } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Average rating
    const avgRatingData = await Review.aggregate([
        { $match: { isApproved: true, isVisible: true } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    const avgRating = avgRatingData.length > 0 ? avgRatingData[0].avgRating : 0;

    // Top rated products
    const topRatedProducts = await Review.aggregate([
        { $match: { isApproved: true, isVisible: true } },
        {
            $group: {
                _id: '$product',
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
        { $sort: { avgRating: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product',
            },
        },
    ]);

    // Verified vs unverified reviews
    const verifiedPurchaseReviews = await Review.countDocuments({ isVerifiedPurchase: true, isApproved: true, isVisible: true });

    const analytics = {
        totalReviews,
        approvedReviews,
        pendingReviews,
        hiddenReviews,
        abusiveReviews,
        avgRating: avgRating.toFixed(2),
        ratingDistribution,
        topRatedProducts,
        verifiedPurchaseReviews,
    };

    sendResponse(res, 200, true, 'Analytics fetched successfully', analytics);
});

// @desc    Get pending reviews for current user
// @route   GET /api/reviews/my/pending
// @access  Private
const getMyPendingReviews = asyncHandler(async (req, res) => {
    // Get all delivered orders for the user
    const deliveredOrders = await Order.find({
        user: req.user._id,
        orderStatus: 'delivered',
    }).populate('items.product', 'name images price');

    // Extract items that haven't been reviewed yet
    const pendingReviews = [];

    for (const order of deliveredOrders) {
        for (const item of order.items) {
            if (!item.reviewed && item.product) {
                pendingReviews.push({
                    _id: item._id,
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    product: item.product,
                    quantity: item.quantity,
                    price: item.price,
                    deliveredAt: order.deliveredAt,
                    reviewed: false,
                });
            }
        }
    }

    sendResponse(res, 200, true, 'Pending reviews fetched successfully', pendingReviews);
});

// @desc    Get user's own reviews
// @route   GET /api/reviews/my/reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ user: req.user._id })
        .populate('product', 'name images price')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 });

    sendResponse(res, 200, true, 'Your reviews fetched successfully', reviews);
});

module.exports = {
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
};
