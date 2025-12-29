const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/cart';

// Helper function to get auth token
const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('⚠️ No token found in localStorage for cart');
    }
    return token || '';
};

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// Get current user's cart
export const getCart = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch cart');
    }
    return data;
};

// Add item to cart
export const addToCart = async (productId, quantity = 1) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ productId, quantity }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to add item to cart');
    }
    return data;
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
    const response = await fetch(`${API_URL}/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update cart item');
    }
    return data;
};

// Remove item from cart
export const removeFromCart = async (itemId) => {
    const response = await fetch(`${API_URL}/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to remove item from cart');
    }
    return data;
};

// Clear entire cart
export const clearCart = async () => {
    const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to clear cart');
    }
    return data;
};

// Save cart for later
export const saveCartForLater = async () => {
    const response = await fetch(`${API_URL}/save-for-later`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to save cart');
    }
    return data;
};

// Get saved cart items
export const getSavedCart = async () => {
    const response = await fetch(`${API_URL}/saved`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch saved cart');
    }
    return data;
};

// Restore saved cart
export const restoreSavedCart = async () => {
    const response = await fetch(`${API_URL}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to restore saved cart');
    }
    return data;
};

// Admin: Get all carts
export const getAllCarts = async (retryCount = 0) => {
    const maxRetries = 2;
    console.log('=== getAllCarts called ===');
    console.log('Retry attempt:', retryCount);
    console.log('API URL:', `${API_URL}/admin/all`);

    try {
        const headers = getAuthHeaders();
        console.log('Request headers:', headers);

        const response = await fetch(`${API_URL}/admin/all`, {
            headers,
            credentials: 'include',
        });

        console.log('getAllCarts response status:', response.status);
        console.log('getAllCarts response ok:', response.ok);

        const data = await response.json();
        console.log('getAllCarts response data:', data);
        console.log('Data structure:', {
            hasSuccess: !!data.success,
            hasMessage: !!data.message,
            hasData: !!data.data,
            hasCarts: !!data.data?.carts,
            cartsLength: data.data?.carts?.length || 0
        });

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch all carts');
        }

        return data;
    } catch (error) {
        console.error('getAllCarts error:', error);
        if (retryCount < maxRetries) {
            console.log(`Retrying getAllCarts (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getAllCarts(retryCount + 1);
        }
        throw error;
    }
};

// Admin: Get cart summary/analytics
export const getCartSummary = async (retryCount = 0) => {
    const maxRetries = 2;
    console.log('=== getCartSummary called ===');
    console.log('Retry attempt:', retryCount);
    console.log('API URL:', `${API_URL}/admin/summary`);

    try {
        const headers = getAuthHeaders();
        console.log('Request headers:', headers);

        const response = await fetch(`${API_URL}/admin/summary`, {
            headers,
            credentials: 'include',
        });

        console.log('getCartSummary response status:', response.status);
        console.log('getCartSummary response ok:', response.ok);

        const data = await response.json();
        console.log('getCartSummary response data:', data);
        console.log('Data structure:', {
            hasSuccess: !!data.success,
            hasMessage: !!data.message,
            hasData: !!data.data,
            hasSummary: !!data.data?.summary,
        });

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch cart summary');
        }

        return data;
    } catch (error) {
        console.error('getCartSummary error:', error);
        if (retryCount < maxRetries) {
            console.log(`Retrying getCartSummary (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getCartSummary(retryCount + 1);
        }
        throw error;
    }
};

// Admin: Clear a specific user's cart
export const clearUserCart = async (userId) => {
    const response = await fetch(`${API_URL}/admin/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to clear user cart');
    }
    return data;
};

const cartService = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    saveCartForLater,
    getSavedCart,
    restoreSavedCart,
    getAllCarts,
    getCartSummary,
    clearUserCart,
};

export default cartService;
