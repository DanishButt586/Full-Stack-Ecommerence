import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const CustomerNotificationDropdown = ({ isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const socketRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationService.getCustomerNotifications(1, 10);
            if (response.success) {
                // Show ALL customer notifications (no filtering by type)
                let filteredNotifications = response.data.notifications.filter(n =>
                    n.isCustomerNotification === true
                );
                // Apply user-selected filter
                if (filter === 'unread') {
                    filteredNotifications = filteredNotifications.filter(n => !n.isRead);
                } else if (filter === 'delivered' || filter === 'approved') {
                    filteredNotifications = filteredNotifications.filter(n => n.type === 'order_approved');
                } else if (filter === 'declined') {
                    filteredNotifications = filteredNotifications.filter(n => n.type === 'order_declined' || n.type === 'order_cancelled');
                }
                setNotifications(filteredNotifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Initialize socket connection
    useEffect(() => {
        fetchUnreadCount();

        // Get user ID from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id;

        if (!userId) {
            console.warn('⚠️ No user ID found in localStorage');
            return;
        }

        console.log('🔌 Setting up socket for user:', userId);

        // Setup Socket.IO client for real-time notifications
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_SERVER_URL, {
                transports: ['websocket'],
                withCredentials: true
            });

            // Log connection events
            socketRef.current.on('connect', () => {
                console.log('✅ Socket connected:', socketRef.current.id);
            });

            socketRef.current.on('disconnect', () => {
                console.log('❌ Socket disconnected');
            });

            socketRef.current.on('error', (error) => {
                console.error('❌ Socket error:', error);
            });
        }
        const socket = socketRef.current;

        // Join customer room
        const joinRoom = () => {
            socket.emit('joinCustomer', userId);
            console.log('👤 Joining customer room:', userId);
        };

        // If already connected, join immediately
        if (socket.connected) {
            console.log('✅ Socket already connected, joining room immediately');
            joinRoom();
        } else {
            // Otherwise wait for connection
            console.log('⏳ Waiting for socket connection...');
            socket.once('connect', joinRoom);
        }

        // Listen for customer notification events
        const handleCustomerNotification = (notification) => {
            console.log('📬 Received customerNotification event:', notification);
            // Accept all customer notifications
            if (notification && notification.isCustomerNotification === true) {
                console.log('✅ Adding notification to state:', notification._id);
                setNotifications((prev) => [notification, ...prev]);
                setUnreadCount((prev) => prev + 1);
            } else {
                console.log('⏭️ Notification filtered out', {
                    isCustomerNotification: notification?.isCustomerNotification,
                    type: notification?.type,
                    title: notification?.title
                });
            }
        };

        socket.on('customerNotification', handleCustomerNotification);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('customerNotification', handleCustomerNotification);
                socketRef.current.off('connect', joinRoom);
            }
        };
    }, []); // Empty dependency array - run once on mount

    // Fetch notifications on mount and whenever filter changes
    useEffect(() => {
        const run = async () => {
            await fetchNotifications();
        };
        run();
    }, [fetchNotifications]);

    // Periodic unread count refresh (lightweight, every 10 seconds)
    useEffect(() => {
        const unreadInterval = setInterval(() => {
            fetchUnreadCount();
        }, 10000);

        return () => clearInterval(unreadInterval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationService.getCustomerUnreadCount();
            if (response.success) {
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markCustomerNotificationAsRead(notificationId);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notificationService.deleteCustomerNotification(notificationId);
            // Remove from local state immediately
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            // Refresh counts
            fetchUnreadCount();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };
    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.isRead) {
            await handleMarkAsRead(notification._id);
        }
        
        setIsOpen(false);
        
        // Navigate based on notification type
        if (notification.type === 'review_pending' || notification.type === 'review_approved' || notification.type === 'review_rejected') {
            // For review notifications, go to reviews tab with the specific order
            navigate('/dashboard', { 
                state: { 
                    activeTab: 'reviews', 
                    orderId: notification.orderId?._id || notification.orderId 
                } 
            });
        } else {
            // For order notifications, go to orders tab with the specific order
            navigate('/dashboard', { 
                state: { 
                    activeTab: 'orders', 
                    orderId: notification.orderId?._id || notification.orderId 
                } 
            });
        }
    };
    const toggleDropdown = () => {
        if (!isOpen) {
            // When opening dropdown, refresh notifications
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const formatDate = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffInSeconds = Math.floor((now - notifDate) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return notifDate.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_approved':
                return '🎉';
            case 'order_declined':
                return '😔';
            case 'order_cancelled':
                return '🚫';
            case 'review_approved':
                return '⭐';
            case 'review_rejected':
                return '❌';
            case 'cart_cleared':
                return '🛒';
            case 'review_pending':
                return '✍️';
            default:
                return '📦';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'order_approved':
                return isDarkMode ? 'bg-green-900/50 border-green-700' : 'bg-green-50 border-green-200';
            case 'order_declined':
                return isDarkMode ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-200';
            case 'order_cancelled':
                return isDarkMode ? 'bg-orange-900/50 border-orange-700' : 'bg-orange-50 border-orange-200';
            case 'review_approved':
                return isDarkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-50 border-blue-200';
            case 'review_rejected':
                return isDarkMode ? 'bg-yellow-900/50 border-yellow-700' : 'bg-yellow-50 border-yellow-200';
            default:
                return isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
        }
    };

    const getThemeColors = () => {
        return {
            bellHover: isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-pink-100 text-pink-600',
            badge: isDarkMode ? 'bg-red-600' : 'bg-pink-500',
            headerBg: isDarkMode ? 'bg-red-950/20' : 'bg-pink-50',
            headerBorder: isDarkMode ? 'border-red-800' : 'border-pink-200',
            headerText: isDarkMode ? 'text-red-200' : 'text-pink-700',
            activeButton: isDarkMode ? 'bg-red-700 text-white' : 'bg-pink-600 text-white',
            inactiveButton: isDarkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50' : 'bg-pink-100 text-pink-700 hover:bg-pink-200',
            dropdownBg: isDarkMode ? 'bg-gray-900 border-red-800' : 'bg-white border-pink-200',
            hoverBg: isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-pink-50',
            markReadBtn: isDarkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-pink-600 hover:bg-pink-100',
            footerText: isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-pink-600 hover:text-pink-700',
            spinnerColor: isDarkMode ? 'border-red-400' : 'border-pink-600',
        };
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button
                onClick={toggleDropdown}
                className={`relative p-2 rounded-lg transition-colors ${getThemeColors().bellHover}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 ${getThemeColors().badge} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-96 rounded-lg shadow-2xl border z-50 ${
                    isDarkMode ? 'bg-gray-900 border-red-800' : 'bg-white border-pink-200'
                }`}>
                    {/* Header - Only show notification count and filters */}
                    <div className={`p-4 border-b ${isDarkMode ? 'border-red-800 bg-red-950/20' : 'border-pink-200 bg-pink-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-red-200' : 'text-pink-700'}`}>Notifications</h3>
                            {unreadCount > 0 && (
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-red-700 text-red-100' : 'bg-pink-200 text-pink-800'}`}>{unreadCount} new</span>
                            )}
                        </div>
                        <div className="flex gap-2 mb-3">
                            {['all', 'unread', 'approved', 'declined'].map((filterOption) => (
                                <button
                                    key={filterOption}
                                    onClick={() => setFilter(filterOption)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === filterOption ? getThemeColors().activeButton : getThemeColors().inactiveButton}`}
                                >
                                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Mark All as Read Button */}
                        <button
                            onClick={async () => {
                                try {
                                    await notificationService.markAllCustomerNotificationsAsRead();
                                    // Update all notifications to read in state immediately
                                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                    // Reset unread count immediately
                                    setUnreadCount(0);
                                    // Refresh from server
                                    await fetchNotifications();
                                    await fetchUnreadCount();
                                } catch (err) {
                                    console.error('Error marking all as read:', err);
                                }
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                isDarkMode
                                    ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-700'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            }`}
                        >
                            ✓ Mark All as Read
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${getThemeColors().spinnerColor}`}></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className={`p-8 text-center ${isDarkMode ? 'text-red-300' : 'text-pink-600'}`}>
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="font-medium">No notifications</p>
                                <p className="text-sm mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 border-b transition-colors cursor-pointer ${
                                        isDarkMode ? 'border-red-900/30' : 'border-pink-100'
                                    } ${!notification.isRead ? getNotificationColor(notification.type) : ''} ${getThemeColors().hoverBg}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`font-semibold text-sm ${isDarkMode ? 'text-red-100' : 'text-gray-900'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification._id);
                                                        }}
                                                        className={`text-xs px-2 py-1 rounded transition-colors ${getThemeColors().markReadBtn}`}
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                            <p className={`text-sm mt-1 ${
                                                notification.type === 'order_approved'
                                                    ? isDarkMode ? 'text-green-300 font-bold' : 'text-green-600 font-bold'
                                                    : notification.type === 'order_declined' || notification.type === 'order_cancelled'
                                                        ? isDarkMode ? 'text-red-300 font-bold' : 'text-red-600 font-bold'
                                                        : isDarkMode ? 'text-red-200' : 'text-gray-600'
                                            }`}>
                                                {notification.type === 'order_approved' ? (
                                                    <span>Congratulations order <b>#{notification.orderNumber}</b> is delivered. Please write a review for that product.</span>
                                                ) : (notification.type === 'order_declined' || notification.type === 'order_cancelled') && notification.orderNumber && notification.cancelReason ? (
                                                    <span>We are sorry that order <b>#{notification.orderNumber}</b> is cancelled. Reason: <b>{notification.cancelReason}</b></span>
                                                ) : (
                                                    notification.message
                                                )}
                                            </p>
                                            {notification.type === 'order_approved' && (
                                                <div className={`mt-2 p-2 rounded text-xs font-medium ${
                                                    isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200'
                                                }`}>
                                                    <span className="flex items-center gap-1">
                                                        ⭐ Click here to write a review
                                                    </span>
                                                </div>
                                            )}
                                            {(notification.type === 'order_declined' || notification.type === 'order_cancelled') && notification.cancelReason && (
                                                <div className={`mt-2 p-2 rounded text-xs ${
                                                    isDarkMode ? 'bg-red-900/30 text-red-200 border border-red-800' : 'bg-red-50 text-red-800 border border-red-200'
                                                }`}>
                                                    <p className="font-semibold">❗ Reason:</p>
                                                    <p className="mt-1">{notification.cancelReason}</p>
                                                </div>
                                            )}
                                            <p className={`text-xs mt-2 ${isDarkMode ? 'text-red-400/60' : 'text-pink-500/60'}`}>
                                                {formatDate(notification.createdAt)}
                                            </p>
                                            {/* Actions: Delete */}
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${isDarkMode ? 'bg-red-900/30 text-red-300 border-red-700 hover:bg-red-800/50' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'}`}
                                                    onClick={e => { 
                                                        e.stopPropagation(); 
                                                        handleDelete(notification._id);
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer removed as requested */}
                    {/* 'View all notifications' link/button removed as per request */}
                </div>
            )}
        </div>
    );
};

export default CustomerNotificationDropdown;
