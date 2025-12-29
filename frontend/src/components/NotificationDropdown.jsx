import React, { useState, useEffect, useRef, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const NotificationDropdown = ({ darkMode, isOpen, onClose, onRefreshCount }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, approved, declined, cancelled
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [decliningOrder, setDecliningOrder] = useState(null);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await notificationService.getNotifications(filter, 'all', 1, 50);
            // Show ALL admin notifications without filtering
            setNotifications(data.data.notifications || []);
        } catch (err) {
            console.error('Fetch Notifications Error:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }

        // Setup Socket.IO for real-time notifications
        if (isOpen && !socketRef.current) {
            socketRef.current = io(SOCKET_SERVER_URL, {
                transports: ['websocket'],
                withCredentials: true
            });

            socketRef.current.on('connect', () => {
                console.log('Admin socket connected');
                socketRef.current.emit('joinAdmin');
            });

            // Listen for new order notifications
            socketRef.current.on('newOrder', (notification) => {
                console.log('📦 New order received:', notification);
                setNotifications((prev) => [notification, ...prev]);
            });

            // Listen for review submitted notifications
            socketRef.current.on('reviewSubmitted', (notification) => {
                console.log('⭐ Review submitted:', notification);
                setNotifications((prev) => [notification, ...prev]);
            });

            // Listen for admin notifications (order status changes)
            socketRef.current.on('adminNotification', (notification) => {
                console.log('📊 Admin notification received:', notification);
                setNotifications((prev) => [notification, ...prev]);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isOpen, fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleDecline = async () => {
        if (!declineReason.trim()) {
            setError('Please provide a reason for declining this order');
            return;
        }

        try {
            setLoading(true);
            const orderId = decliningOrder._id;
            await notificationService.declineOrder(orderId, declineReason);
            setNotifications(notifications.map(n => 
                n._id === orderId ? { ...n, status: 'declined', adminAction: 'declined', cancelReason: declineReason } : n
            ));
            setSelectedNotification(null);
            setShowDeclineModal(false);
            setDeclineReason('');
            setDecliningOrder(null);
        } catch (err) {
            setError('Failed to decline order');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            setError('Please provide a reason for cancellation');
            return;
        }

        try {
            setLoading(true);
            const orderId = cancellingOrder._id;
            await notificationService.cancelApprovedOrder(orderId, cancelReason);
            setNotifications(notifications.map(n => 
                n._id === orderId ? { ...n, status: 'cancelled', adminAction: 'cancelled', cancelReason } : n
            ));
            setSelectedNotification(null);
            setShowCancelModal(false);
            setCancelReason('');
            setCancellingOrder(null);
        } catch (err) {
            setError('Failed to cancel order');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Removed unused handleStatusChange to clean up warnings

    const handleDelete = async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (err) {
            setError('Failed to delete notification');
            console.error(err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Clean message and convert dollar amounts to PKR
    const cleanMessage = (message) => {
        if (!message) return message;
        // Replace $X,XXX.XX with Rs X,XXX
        return message.replace(/\$[\d,]+\.?\d*/g, (match) => {
            // Remove $ and convert to number
            const amount = parseFloat(match.replace('$', '').replace(/,/g, ''));
            // Format as PKR
            return formatCurrency(amount);
        });
    };

    const getStatusColor = (notification) => {
        const status = notification.status;
        const type = notification.type;
        
        if (type === 'order_cancelled') {
            return darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200';
        }
        
        switch (status) {
            case 'pending':
                return darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200';
            case 'approved':
                return darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200';
            case 'declined':
                return darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200';
            default:
                return darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
        }
    };

    const getStatusBadge = (notification) => {
        const type = notification.type;
        
        if (type === 'order_cancelled') {
            return 'bg-orange-100 text-orange-800';
        }
        
        const status = notification.status;
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getDisplayStatus = (notification) => {
        if (notification.type === 'order_cancelled') {
            return 'Cancelled';
        }
        return notification.status;
    };

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className={`absolute right-0 mt-2 w-96 rounded-xl shadow-2xl z-50 border overflow-hidden ${
                darkMode
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
            }`}
        >
            {/* Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        📬 Notifications
                    </h3>
                    <button
                        onClick={onClose}
                        className={`text-xl font-bold transition-colors ${
                            darkMode
                                ? 'text-gray-400 hover:text-gray-200'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        ✕
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap mb-3">
                    {['all', 'pending', 'approved', 'declined', 'cancelled', 'reviews'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                                filter === f
                                    ? darkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 text-blue-700'
                                    : darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {f === 'reviews' ? '⭐ Reviews' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Mark All as Read Button */}
                <button
                    onClick={async () => {
                        try {
                            await notificationService.markAllAdminNotificationsAsRead();
                            // Update all notifications to read in state immediately
                            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            // Refresh from server
                            await fetchNotifications();
                            // Refresh parent unread count
                            if (onRefreshCount) {
                                await onRefreshCount();
                            }
                        } catch (err) {
                            console.error('Error marking all as read:', err);
                        }
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        darkMode
                            ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-700'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                >
                    ✓ Mark All as Read
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className={`p-3 m-3 rounded-lg text-sm ${
                    darkMode
                        ? 'bg-red-900/30 text-red-200 border border-red-700'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {error}
                </div>
            )}

            {/* Content */}
            <div className={`max-h-96 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`border-b p-4 cursor-pointer transition-colors ${getStatusColor(notification)} ${
                                darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedNotification(selectedNotification?._id === notification._id ? null : notification)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        {notification.type === 'order_cancelled' && <span className="text-lg">🚫</span>}
                                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {notification.customerName}
                                        </h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(notification)}`}>
                                            {getDisplayStatus(notification)}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Order #{notification.orderNumber}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {formatCurrency(notification.orderTotal)}
                                    </p>
                                </div>
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Expanded View */}
                            {selectedNotification?._id === notification._id && (
                                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    {/* Only show message if not apology/congrats/sorry */}
                                    {notification.message &&
                                        !notification.message.toLowerCase().includes('we sincerely apologize') &&
                                        !notification.message.toLowerCase().includes('we had to cancel your order') &&
                                        !notification.message.toLowerCase().includes('we\'re truly sorry for the inconvenience') &&
                                        !notification.message.toLowerCase().includes('congratulations') &&
                                        !notification.message.toLowerCase().includes('delivered') &&
                                        !notification.message.toLowerCase().includes('review') &&
                                        !notification.message.toLowerCase().includes('sorry') && (
                                            <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {cleanMessage(notification.message)}
                                            </p>
                                    )}

                                    {/* Order Items */}
                                    {notification.orderItems && notification.orderItems.length > 0 && (
                                        <div className={`mb-3 p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Items Ordered:
                                            </p>
                                            {notification.orderItems.map((item, idx) => (
                                                <div key={idx} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    • {item.quantity}x {item.name} - {formatCurrency(item.price)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* View Details Button */}
                                    {notification.orderId && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => {
                                                    const orderId = notification.orderId?._id || notification.orderId;
                                                    console.log('Navigating to order:', orderId, 'From notification:', notification);
                                                    // Navigate to admin dashboard with orders tab and selected order
                                                    navigate('/dashboard', { 
                                                        state: { 
                                                            selectedOrderId: orderId,
                                                            activeTab: 'orders'
                                                        },
                                                        replace: false
                                                    });
                                                    onClose();
                                                }}
                                                className={`w-full px-4 py-2 rounded font-semibold text-sm transition-colors ${
                                                    darkMode 
                                                        ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50 border border-blue-700' 
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                                                }`}
                                            >
                                                👁️ View Order Details
                                            </button>
                                        </div>
                                    )}

                                    {/* Delete Button - Always available */}
                                    <div className="mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notification._id);
                                            }}
                                            className={`w-full px-3 py-2 rounded text-sm font-semibold transition-colors ${
                                                darkMode
                                                    ? 'bg-red-900/30 text-red-300 border border-red-700 hover:bg-red-800/50'
                                                    : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                                            }`}
                                        >
                                            🗑️ Delete Notification
                                        </button>
                                    </div>

                                    {/* No Cancel Button for Approved/Delivered Orders */}
                                    {notification.status === 'approved' && notification.type !== 'order_cancelled' && null}
                                    
                                    {/* Cancelled Order Info */}
                                    {notification.type === 'order_cancelled' && (
                                        <div className={`p-3 rounded ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                                            <p className={`text-sm font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                                                🚫 Order Cancelled by Customer
                                            </p>
                                            <p className={`text-xs mt-1 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                                                Stock has been automatically restored.
                                            </p>
                                        </div>
                                    )}

                                    {/* Customer Email */}
                                    <div className={`mt-3 p-2 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                            📧 {notification.customerEmail}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No notifications
                    </div>
                )}
            </div>

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className={`rounded-lg shadow-lg p-6 max-w-md w-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Cancel Order #{cancellingOrder?.orderNumber}
                        </h3>
                        
                        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Please provide a reason for cancelling this order. The customer will be notified.
                        </p>
                        
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter cancellation reason..."
                            rows={4}
                            className={`w-full px-3 py-2 rounded border mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                darkMode 
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                        />
                        
                        {error && (
                            <p className="text-red-600 text-sm mb-4">{error}</p>
                        )}
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setError('');
                                }}
                                disabled={loading}
                                className={`flex-1 px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 ${
                                    darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                }`}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={loading || !cancelReason.trim()}
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decline Order Modal */}
            {showDeclineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className={`rounded-lg shadow-lg p-6 max-w-md w-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Decline Order #{decliningOrder?.orderNumber}
                        </h3>
                        
                        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Please provide a reason for declining this order. The customer will be notified and the order will be cancelled.
                        </p>
                        
                        <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Enter decline reason (e.g., Out of stock, Invalid payment, etc.)..."
                            rows={4}
                            className={`w-full px-3 py-2 rounded border mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                darkMode 
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                        />
                        
                        {error && (
                            <p className="text-red-600 text-sm mb-4">{error}</p>
                        )}
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowDeclineModal(false);
                                    setDeclineReason('');
                                    setDecliningOrder(null);
                                    setError('');
                                }}
                                disabled={loading}
                                className={`flex-1 px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 ${
                                    darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                }`}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleDecline}
                                disabled={loading || !declineReason.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Declining...' : 'Confirm Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
