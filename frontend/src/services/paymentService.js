const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/payment';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// Create payment intent
export const createPaymentIntent = async (amount, orderId) => {
    const response = await fetch(`${API_URL}/create-intent`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ amount, orderId }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment intent');
    }
    return data;
};

// Confirm payment
export const confirmPayment = async (paymentIntentId, orderId) => {
    const response = await fetch(`${API_URL}/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId, orderId }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm payment');
    }
    return data;
};

// Get payment status
export const getPaymentStatus = async (paymentIntentId) => {
    const response = await fetch(`${API_URL}/status/${paymentIntentId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to get payment status');
    }
    return data;
};
