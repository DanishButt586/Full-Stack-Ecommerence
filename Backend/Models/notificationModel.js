const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: false,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['order_placed', 'order_approved', 'order_declined', 'order_cancelled', 'order_status_changed', 'review_submitted', 'review_approved', 'review_rejected', 'review_pending', 'cart_cleared'],
            required: true,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'relatedModel',
        },
        relatedModel: {
            type: String,
            enum: ['Order', 'Review', 'Product'],
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        orderNumber: {
            type: String,
            required: false,
        },
        customerName: {
            type: String,
        },
        customerEmail: {
            type: String,
        },
        orderTotal: {
            type: Number,
            required: false,
        },
        orderItems: [
            {
                name: String,
                quantity: Number,
                price: Number,
            }
        ],
        isRead: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'declined'],
            default: 'pending',
        },
        adminAction: {
            type: String,
            enum: ['none', 'approved', 'declined', 'cancelled'],
            default: 'none',
        },
        cancelReason: {
            type: String,
            default: null,
        },
        isCustomerNotification: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ customerId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isRead: 1 });
notificationSchema.index({ status: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
