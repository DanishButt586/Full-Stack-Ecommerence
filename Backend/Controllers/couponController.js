const Coupon = require('../Models/couponModel');
const { sendResponse, asyncHandler } = require('../Library/helper');
let io; // Reference to Socket.IO instance

// Function to set io instance (called from index.js)
const setIO = (socketIO) => {
    io = socketIO;
};

// @desc    Get all coupons (admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Coupon.countDocuments();
    const coupons = await Coupon.find()
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    sendResponse(res, 200, true, 'Coupons fetched successfully', {
        coupons,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Create a new coupon (admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
    const {
        code,
        discountType,
        discountValue,
        maxDiscount,
        minOrderAmount,
        validFrom,
        validUntil,
        usageLimit,
        usagePerUser,
        description,
        isActive,
        applicableCategories,
        applicableProducts,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
        return sendResponse(res, 400, false, 'Missing required fields');
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return sendResponse(res, 400, false, 'Coupon code already exists');
    }

    // Validate discount value based on type
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return sendResponse(res, 400, false, 'Percentage discount must be between 0 and 100');
    }

    // Validate dates
    const from = new Date(validFrom);
    const until = new Date(validUntil);
    if (until <= from) {
        return sendResponse(res, 400, false, 'Valid until date must be after valid from date');
    }

    const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        minOrderAmount: minOrderAmount || 0,
        validFrom: from,
        validUntil: until,
        usageLimit: usageLimit || null,
        usagePerUser: usagePerUser || 1,
        description: description || '',
        isActive: isActive !== false,
        applicableCategories: applicableCategories || [],
        applicableProducts: applicableProducts || [],
    });

    await coupon.populate('applicableCategories', 'name');
    await coupon.populate('applicableProducts', 'name');

    // Emit Socket.IO event for real-time update
    if (io) {
        io.emit('coupon:created', coupon);
    }

    sendResponse(res, 201, true, 'Coupon created successfully', coupon);
});

// @desc    Get single coupon (admin)
// @route   GET /api/coupons/:id
// @access  Private/Admin
const getCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id)
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name');

    if (!coupon) {
        return sendResponse(res, 404, false, 'Coupon not found');
    }

    sendResponse(res, 200, true, 'Coupon fetched successfully', coupon);
});

// @desc    Update coupon (admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        code,
        discountType,
        discountValue,
        maxDiscount,
        minOrderAmount,
        validFrom,
        validUntil,
        usageLimit,
        usagePerUser,
        description,
        isActive,
        applicableCategories,
        applicableProducts,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
        return sendResponse(res, 404, false, 'Coupon not found');
    }

    // Check if new code already exists (if code is being changed)
    if (code && code.toUpperCase() !== coupon.code) {
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return sendResponse(res, 400, false, 'Coupon code already exists');
        }
        coupon.code = code.toUpperCase();
    }

    // Validate dates if being updated
    if (validFrom && validUntil) {
        const from = new Date(validFrom);
        const until = new Date(validUntil);
        if (until <= from) {
            return sendResponse(res, 400, false, 'Valid until date must be after valid from date');
        }
        coupon.validFrom = from;
        coupon.validUntil = until;
    }

    // Update fields
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) {
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return sendResponse(res, 400, false, 'Percentage discount must be between 0 and 100');
        }
        coupon.discountValue = discountValue;
    }
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (usagePerUser !== undefined) coupon.usagePerUser = usagePerUser;
    if (description !== undefined) coupon.description = description;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (applicableCategories) coupon.applicableCategories = applicableCategories;
    if (applicableProducts) coupon.applicableProducts = applicableProducts;

    await coupon.save();
    await coupon.populate('applicableCategories', 'name');
    await coupon.populate('applicableProducts', 'name');

    // Emit Socket.IO event for real-time update
    if (io) {
        io.emit('coupon:updated', coupon);
    }

    sendResponse(res, 200, true, 'Coupon updated successfully', coupon);
});

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
        return sendResponse(res, 404, false, 'Coupon not found');
    }

    // Emit Socket.IO event for real-time update
    if (io) {
        io.emit('coupon:deleted', req.params.id);
    }

    sendResponse(res, 200, true, 'Coupon deleted successfully');
});

// @desc    Validate coupon (customer)
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
    const { code, cartTotal } = req.body;

    if (!code) {
        return sendResponse(res, 400, false, 'Coupon code is required');
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
        return sendResponse(res, 404, false, 'Coupon not found');
    }

    if (!coupon.isValid()) {
        return sendResponse(res, 400, false, 'Coupon is expired or not active');
    }

    if (!coupon.canUserUse(req.user._id)) {
        return sendResponse(res, 400, false, 'You have already used this coupon the maximum number of times');
    }

    if (cartTotal < coupon.minOrderAmount) {
        return sendResponse(res, 400, false, `Minimum order amount is Rs. ${coupon.minOrderAmount}`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
    } else {
        discount = coupon.discountValue;
    }

    sendResponse(res, 200, true, 'Coupon is valid', {
        coupon: {
            _id: coupon._id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discount,
        },
    });
});

module.exports = {
    getAllCoupons,
    createCoupon,
    getCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    setIO, // Export setIO to allow index.js to set the Socket.IO instance
};
