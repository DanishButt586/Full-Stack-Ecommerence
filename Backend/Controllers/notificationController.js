const Notification = require('../Models/notificationModel');
const Order = require('../Models/orderModel');
const User = require('../Models/userModel');
const { sendResponse, asyncHandler } = require('../Library/helper');

// @desc    Create notification for order placement
// @route   POST /api/notifications/create
// @access  Private
const createOrderNotification = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
        return sendResponse(res, 404, false, 'Order not found');
    }

    const notification = await Notification.create({
        orderId: order._id,
        customerId: order.user._id,
        type: 'order_placed',
        title: `New Order from ${order.user.name}`,
        message: `Order #${order.orderNumber} has been placed by ${order.user.name}`,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        customerEmail: order.user.email,
        orderTotal: order.totalPrice,
        orderItems: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        })),
        status: 'pending',
    });

    sendResponse(res, 201, true, 'Notification created successfully', notification);
});

// @desc    Get all notifications for admin
// @route   GET /api/notifications
// @access  Private/Admin
const getNotifications = asyncHandler(async (req, res) => {
    const { status = 'all', isRead = 'all', page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    if (isRead && isRead !== 'all') {
        filter.isRead = isRead === 'true';
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
        .populate('orderId', 'orderNumber totalPrice orderStatus')
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ isRead: false, status: 'pending' });

    sendResponse(res, 200, true, 'Notifications fetched successfully', {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
        unreadCount,
    });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    sendResponse(res, 200, true, 'Notification marked as read', notification);
});

// @desc    Approve order
// @route   PUT /api/notifications/:id/approve
// @access  Private/Admin
const approveOrder = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id).populate('orderId');

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    // Update admin notification
    notification.adminAction = 'approved';
    notification.status = 'approved';
    notification.isRead = true;
    await notification.save();

    // Update order status to approved (not delivered - admin can set delivered manually from order management)
    const order = await Order.findByIdAndUpdate(
        notification.orderId,
        {
            orderStatus: 'approved',
            approvedAt: Date.now()
        },
        { new: true }
    );

    // Create customer notification
    await Notification.create({
        orderId: notification.orderId,
        customerId: notification.customerId,
        type: 'order_approved',
        title: '🎉 Order Approved!',
        message: `Great news! Your order #${notification.orderNumber} has been approved and is being prepared for shipment. We'll update you with tracking information once it ships.`,
        orderNumber: notification.orderNumber,
        orderTotal: notification.orderTotal,
        status: 'approved',
        isCustomerNotification: true,
    });

    sendResponse(res, 200, true, 'Order approved successfully', {
        notification,
        order,
    });
});

// @desc    Decline order
// @route   PUT /api/notifications/:id/decline
// @access  Private/Admin
const declineOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return sendResponse(res, 400, false, 'Decline reason is required');
    }

    const notification = await Notification.findById(req.params.id).populate('orderId');

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    // Update admin notification
    notification.adminAction = 'declined';
    notification.status = 'declined';
    notification.cancelReason = reason;
    notification.isRead = true;
    await notification.save();

    // Update order status
    const order = await Order.findByIdAndUpdate(
        notification.orderId,
        {
            orderStatus: 'cancelled',
            cancelReason: reason
        },
        { new: true }
    );

    // Restore product stock
    const Product = require('../Models/productModel');
    if (order) {
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }
    }

    // Create customer notification
    await Notification.create({
        orderId: notification.orderId,
        customerId: notification.customerId,
        type: 'order_declined',
        title: '😔 Order Cancelled',
        message: `We sincerely apologize, but we had to cancel your order #${notification.orderNumber}. Reason: ${reason}. We're truly sorry for the inconvenience. Please contact our support team if you have any questions.`,
        orderNumber: notification.orderNumber,
        orderTotal: notification.orderTotal,
        cancelReason: reason,
        status: 'declined',
        isCustomerNotification: true,
    });

    sendResponse(res, 200, true, 'Order declined successfully', {
        notification,
        order,
    });
});

// @desc    Cancel approved order
// @route   PUT /api/notifications/:id/cancel
// @access  Private/Admin
const cancelApprovedOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return sendResponse(res, 400, false, 'Cancellation reason is required');
    }

    const notification = await Notification.findById(req.params.id).populate('orderId');

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    if (notification.status !== 'approved') {
        return sendResponse(res, 400, false, 'Only approved orders can be cancelled');
    }

    // Update admin notification
    notification.adminAction = 'cancelled';
    notification.status = 'cancelled';
    notification.cancelReason = reason;
    notification.isRead = true;
    await notification.save();

    // Update order status and restore stock
    const order = await Order.findById(notification.orderId).populate('items.product');

    if (order) {
        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        order.orderStatus = 'cancelled';
        order.cancelReason = reason;
        await order.save();
    }

    // Create customer notification
    await Notification.create({
        orderId: notification.orderId,
        customerId: notification.customerId,
        type: 'order_cancelled',
        title: '🚫 Order Cancelled',
        message: `We sincerely apologize, but your order #${notification.orderNumber} has been cancelled. Reason: ${reason}. We're truly sorry for any inconvenience this may have caused. If you have any questions, please don't hesitate to contact our support team.`,
        orderNumber: notification.orderNumber,
        orderTotal: notification.orderTotal,
        cancelReason: reason,
        status: 'pending',
        isCustomerNotification: true,
    });

    sendResponse(res, 200, true, 'Order cancelled successfully', {
        notification,
        order,
    });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/count/unread
// @access  Private/Admin
const getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        isRead: false,
        status: 'pending',
    });

    sendResponse(res, 200, true, 'Unread count fetched', { unreadCount });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    sendResponse(res, 200, true, 'Notification deleted successfully', notification);
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private/Admin
const getNotificationById = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id)
        .populate('orderId')
        .populate('customerId', 'name email phone');

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    // Mark as read
    if (!notification.isRead) {
        notification.isRead = true;
        await notification.save();
    }

    sendResponse(res, 200, true, 'Notification fetched successfully', notification);
});

// @desc    Get customer notifications
// @route   GET /api/notifications/customer/my
// @access  Private/Customer
const getCustomerNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Notification.countDocuments({
        customerId: req.user._id,
        isCustomerNotification: true,
    });

    const notifications = await Notification.find({
        customerId: req.user._id,
        isCustomerNotification: true,
    })
        .populate('orderId', 'orderNumber totalPrice orderStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
        customerId: req.user._id,
        isCustomerNotification: true,
        isRead: false,
    });

    sendResponse(res, 200, true, 'Customer notifications fetched successfully', {
        notifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
        unreadCount,
    });
});

// @desc    Get customer unread notification count
// @route   GET /api/notifications/customer/count
// @access  Private/Customer
const getCustomerUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        customerId: req.user._id,
        isCustomerNotification: true,
        isRead: false,
    });

    sendResponse(res, 200, true, 'Unread count fetched', { unreadCount });
});

// @desc    Mark customer notification as read
// @route   PUT /api/notifications/customer/:id/read
// @access  Private/Customer
const markCustomerNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: req.params.id,
            customerId: req.user._id,
            isCustomerNotification: true,
        },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    sendResponse(res, 200, true, 'Notification marked as read', notification);
});

// @desc    Delete customer notification
// @route   DELETE /api/notifications/customer/:id
// @access  Private/Customer
const deleteCustomerNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        customerId: req.user._id,
        isCustomerNotification: true,
    });

    if (!notification) {
        return sendResponse(res, 404, false, 'Notification not found');
    }

    sendResponse(res, 200, true, 'Notification deleted successfully', notification);
});

// @desc    Mark all admin notifications as read
// @route   PUT /api/notifications/admin/mark-all-read
// @access  Private/Admin
const markAllAdminNotificationsAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        { isRead: false },
        { isRead: true }
    );

    sendResponse(res, 200, true, `Marked ${result.modifiedCount} notifications as read`, {
        modifiedCount: result.modifiedCount,
    });
});

// @desc    Mark all customer notifications as read
// @route   PUT /api/notifications/customer/mark-all-read
// @access  Private
const markAllCustomerNotificationsAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        {
            customerId: req.user._id,
            isCustomerNotification: true,
            isRead: false,
        },
        { isRead: true }
    );

    sendResponse(res, 200, true, `Marked ${result.modifiedCount} notifications as read`, {
        modifiedCount: result.modifiedCount,
    });
});

module.exports = {
    createOrderNotification,
    getNotifications,
    markAsRead,
    approveOrder,
    declineOrder,
    cancelApprovedOrder,
    getUnreadCount,
    deleteNotification,
    getNotificationById,
    getCustomerNotifications,
    getCustomerUnreadCount,
    markCustomerNotificationAsRead,
    deleteCustomerNotification,
    markAllAdminNotificationsAsRead,
    markAllCustomerNotificationsAsRead,
};
