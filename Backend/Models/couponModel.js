const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [3, 'Coupon code must be at least 3 characters'],
            maxlength: [20, 'Coupon code cannot exceed 20 characters'],
        },
        discountType: {
            type: String,
            enum: ['percentage', 'amount'],
            required: [true, 'Discount type is required'],
        },
        discountValue: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [0, 'Discount value cannot be negative'],
        },
        maxDiscount: {
            type: Number,
            default: null,
            description: 'Maximum discount amount (for percentage coupons)',
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: [0, 'Minimum order amount cannot be negative'],
        },
        validFrom: {
            type: Date,
            required: [true, 'Valid from date is required'],
        },
        validUntil: {
            type: Date,
            required: [true, 'Valid until date is required'],
        },
        usageLimit: {
            type: Number,
            default: null,
            description: 'Total number of times coupon can be used',
        },
        usagePerUser: {
            type: Number,
            default: 1,
            description: 'Number of times a single user can use this coupon',
        },
        timesUsed: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usedBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                usageCount: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Validate that validUntil is after validFrom
couponSchema.pre('save', function (next) {
    if (this.validUntil <= this.validFrom) {
        throw new Error('Valid until date must be after valid from date');
    }
    next();
});

// Check if coupon is valid
couponSchema.methods.isValid = function () {
    const now = new Date();
    return (
        this.isActive &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        (!this.usageLimit || this.timesUsed < this.usageLimit)
    );
};

// Check if user can use this coupon
couponSchema.methods.canUserUse = function (userId) {
    const userUsage = this.usedBy.find((u) => u.userId.toString() === userId.toString());
    return !userUsage || userUsage.usageCount < this.usagePerUser;
};

module.exports = mongoose.model('Coupon', couponSchema);
