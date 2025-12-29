const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderNumber: {
            type: String,
            unique: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: String,
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, 'Quantity must be at least 1'],
                },
                price: {
                    type: Number,
                    required: true,
                },
                image: String,
                reviewed: {
                    type: Boolean,
                    default: false,
                },
                reviewId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Review',
                    default: null,
                },
            },
        ],
        shippingAddress: {
            street: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            zipCode: {
                type: String,
                required: true,
            },
            country: {
                type: String,
                required: true,
            },
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['card', 'paypal', 'cod', 'jazzcash', 'easypaisa', 'bank', 'stripe'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentResult: {
            id: String,
            status: String,
            updateTime: String,
            emailAddress: String,
            cardType: String,
            last4: String,
            wallet: String,
            phone: String,
            transactionId: String,
            method: String,
            accountName: String,
            accountNumber: String,
            reference: String,
        },
        paymentDetails: {
            transactionId: String,
            amount: Number,
            currency: String,
            paidAt: Date,
        },
        itemsPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        deliveredAt: {
            type: Date,
        },
        cancelReason: {
            type: String,
            default: null,
            statusHistory: [
                {
                    status: String,
                    changedAt: {
                        type: Date,
                        default: Date.now,
                    },
                    changedBy: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `ORD-${timestamp}${random}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
