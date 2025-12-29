const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const {
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
} = require('../Controllers/notificationController');

// All routes require authentication
router.use(protect);

// Customer notification routes - Mark all BEFORE specific ID routes
router.get('/customer/my', getCustomerNotifications);
router.get('/customer/count', getCustomerUnreadCount);
router.put('/customer/mark-all-read', markAllCustomerNotificationsAsRead); // Must come BEFORE /:id routes
router.put('/customer/:id/read', markCustomerNotificationAsRead);
router.delete('/customer/:id', deleteCustomerNotification);

// Admin notification routes
// Get unread count
router.get('/count/unread', getUnreadCount);

// Get all notifications
router.get('/', getNotifications);

// Mark all as read - Must come BEFORE /:id routes
router.put('/mark-all-read', markAllAdminNotificationsAsRead);

// Get notification by ID - Must come AFTER specific routes
router.get('/:id', getNotificationById);

// Create notification
router.post('/create', createOrderNotification);

// Mark as read - Must come AFTER /mark-all-read
router.put('/:id/read', markAsRead);

// Approve order
router.put('/:id/approve', approveOrder);

// Decline order
router.put('/:id/decline', declineOrder);

// Cancel approved order
router.put('/:id/cancel', cancelApprovedOrder);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
