const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/coupons';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// Get all coupons (admin)
export const getAllCoupons = async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch coupons');
    }
    return data;
};

// Create coupon (admin)
export const createCoupon = async (couponData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(couponData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create coupon');
    }
    return data;
};

// Get single coupon (admin)
export const getCoupon = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch coupon');
    }
    return data;
};

// Update coupon (admin)
export const updateCoupon = async (id, couponData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(couponData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update coupon');
    }
    return data;
};

// Delete coupon (admin)
export const deleteCoupon = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete coupon');
    }
    return data;
};

// Validate coupon (customer)
export const validateCoupon = async (data) => {
    const { code, orderAmount } = data;
    const response = await fetch(`${API_URL}/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ code, cartTotal: orderAmount }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to validate coupon');
    }

    // Return with discountAmount for frontend
    return {
        success: true,
        message: 'Coupon is valid',
        data: {
            ...result.data?.coupon,
            discountAmount: result.data?.coupon?.discount || 0,
        },
    };
};
