import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.warn('⚠️ No token found in localStorage for notifications');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const notificationService = {
    // Get all notifications
    getNotifications: async (status = 'all', isRead = 'all', page = 1, limit = 20) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/notifications?status=${status}&isRead=${isRead}&page=${page}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get Notifications Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch notifications' };
        }
    },

    // Get unread notification count
    getUnreadCount: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/notifications/count/unread`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get Unread Count Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch unread count' };
        }
    },

    // Get notification by ID
    getNotificationById: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/notifications/${id}`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get Notification Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch notification' };
        }
    },

    // Mark notification as read
    markAsRead: async (id) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/${id}/read`,
                {},
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Mark As Read Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to mark notification as read' };
        }
    },

    // Approve order
    approveOrder: async (id) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/${id}/approve`,
                {},
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Approve Order Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to approve order' };
        }
    },

    // Decline order
    declineOrder: async (id, reason = '') => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/${id}/decline`,
                { reason },
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Decline Order Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to decline order' };
        }
    },

    // Cancel approved order
    cancelApprovedOrder: async (id, reason = '') => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/${id}/cancel`,
                { reason },
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Cancel Order Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to cancel order' };
        }
    },

    // Delete notification
    deleteNotification: async (id) => {
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/notifications/${id}`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Delete Notification Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to delete notification' };
        }
    },

    // Customer notification functions
    // Get customer notifications
    getCustomerNotifications: async (page = 1, limit = 20) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/notifications/customer/my?page=${page}&limit=${limit}`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get Customer Notifications Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch notifications' };
        }
    },

    // Get customer unread count
    getCustomerUnreadCount: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/notifications/customer/count`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get Customer Unread Count Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to fetch unread count' };
        }
    },

    // Mark customer notification as read
    markCustomerNotificationAsRead: async (id) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/customer/${id}/read`,
                {},
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Mark Customer Notification As Read Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to mark notification as read' };
        }
    },

    // Delete customer notification
    deleteCustomerNotification: async (id) => {
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/notifications/customer/${id}`,
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Delete Customer Notification Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to delete notification' };
        }
    },

    // Mark all admin notifications as read
    markAllAdminNotificationsAsRead: async () => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/mark-all-read`,
                {},
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Mark All Admin Notifications As Read Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to mark all notifications as read' };
        }
    },

    // Mark all customer notifications as read
    markAllCustomerNotificationsAsRead: async () => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/customer/mark-all-read`,
                {},
                { headers: getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Mark All Customer Notifications As Read Error:', error);
            throw error.response?.data || { success: false, message: 'Failed to mark all notifications as read' };
        }
    },
};

export default notificationService;
