const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/reviews';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// Get product reviews (public)
export const getProductReviews = async (productId) => {
    const response = await fetch(`${API_URL}/${productId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
    }
    return data;
};

// Get user's reviews
export const getUserReviews = async () => {
    const response = await fetch(`${API_URL}/my/reviews`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user reviews');
    }
    return data;
};

// Get pending reviews for user
export const getPendingReviews = async () => {
    const response = await fetch(`${API_URL}/my/pending`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch pending reviews');
    }
    return data;
};

// Create review (user)
export const createReview = async (productId, reviewData, orderId = null, itemId = null) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ product: productId, order: orderId, itemId, ...reviewData }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create review');
    }
    return data;
};

// Update review (user)
export const updateReview = async (id, reviewData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(reviewData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update review');
    }
    return data;
};

// Delete review (user)
export const deleteReview = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review');
    }
    return data;
};

// Get all reviews (admin)
export const getAllReviews = async (page = 1, limit = 10, status = null) => {
    let url = `${API_URL}/admin/all?page=${page}&limit=${limit}`;
    if (status) {
        url += `&status=${status}`;
    }
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
    }
    return data;
};

// Approve review (admin)
export const approveReview = async (id) => {
    const response = await fetch(`${API_URL}/admin/approve/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to approve review');
    }
    return data;
};

// Hide review (admin)
export const hideReview = async (id, reason = '') => {
    const response = await fetch(`${API_URL}/admin/hide/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to hide review');
    }
    return data;
};

// Reject review (admin)
export const rejectReview = async (id, reason) => {
    const response = await fetch(`${API_URL}/admin/reject/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to reject review');
    }
    return data;
};

// Mark review as abusive (admin)
export const markAsAbusive = async (id, reason) => {
    const response = await fetch(`${API_URL}/admin/abusive/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to mark review as abusive');
    }
    return data;
};

// Delete review (admin)
export const deleteReviewAdmin = async (id) => {
    const response = await fetch(`${API_URL}/admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review');
    }
    return data;
};

// Get review analytics (admin)
export const getReviewAnalytics = async () => {
    const response = await fetch(`${API_URL}/admin/analytics`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
    }
    return data;
};
