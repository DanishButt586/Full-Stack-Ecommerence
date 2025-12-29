/**
 * Authentication API Service
 * Connects to backend API for user authentication
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL + '/auth' : 'http://localhost:5000/api/auth';

/**
 * Register new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - Registration response
 */
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Registration failed');
        }
        throw new Error('Network error. Please check your connection.');
    }
};

/**
 * Login user
 * @param {object} credentials - Login credentials
 * @returns {Promise<object>} - Login response
 */
export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Login failed');
        }
        throw new Error('Network error. Please check your connection.');
    }
};

/**
 * Check email availability
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if available
 */
export const checkEmailAvailability = async (email) => {
    // Simple client-side check for now
    // In production, make API call to backend
    return Promise.resolve(true);
};

/**
 * Delete current account
 * @returns {Promise<object>} - Deletion response
 */
export const deleteAccount = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/account`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Failed to delete account');
        }
        throw new Error('Network error. Please check your connection.');
    }
};
