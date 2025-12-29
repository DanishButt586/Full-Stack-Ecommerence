import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.warn('⚠️ No token found in localStorage for reports');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
    };
};

const reportService = {
    // Get Sales Report
    getSalesReport: async (startDate, endDate, status) => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (status) params.append('status', status);

            const response = await axios.get(`${API_BASE_URL}/reports/sales?${params}`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to fetch sales report' };
        }
    },

    // Get Inventory Report
    getInventoryReport: async (category, lowStockThreshold) => {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (lowStockThreshold) params.append('lowStockThreshold', lowStockThreshold);

            const response = await axios.get(`${API_BASE_URL}/reports/inventory?${params}`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to fetch inventory report' };
        }
    },

    // Get Customer Report
    getCustomerReport: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/reports/customers`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to fetch customer report' };
        }
    },
};

export default reportService;
