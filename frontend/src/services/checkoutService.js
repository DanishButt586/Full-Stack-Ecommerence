const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// ==================== ADDRESS MANAGEMENT ====================

// Get all addresses
export const getAddresses = async () => {
    const response = await fetch(`${API_URL}/auth/addresses`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch addresses');
    }
    return data;
};

// Add new address
export const addAddress = async (addressData) => {
    try {
        console.log('📍 Adding address with data:', addressData);
        const bodyData = JSON.stringify(addressData);
        console.log('📍 Stringified body:', bodyData);

        const response = await fetch(`${API_URL}/auth/addresses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: bodyData,
        });

        console.log('📍 Response status:', response.status, response.statusText);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned invalid response format');
        }

        const data = await response.json();
        console.log('📍 Response data:', data);

        if (!response.ok) {
            console.error('❌ Add address failed:', data);
            throw new Error(data.message || 'Failed to add address');
        }

        console.log('✅ Address added successfully');
        return data;
    } catch (error) {
        console.error('❌ Error in addAddress:', error);
        if (error instanceof SyntaxError) {
            throw new Error('Invalid data format. Please check your address information.');
        }
        throw error;
    }
};

// Update address
export const updateAddress = async (addressId, addressData) => {
    try {
        console.log('📍 Updating address:', addressId, 'with data:', addressData);
        const bodyData = JSON.stringify(addressData);
        console.log('📍 Stringified body:', bodyData);

        const response = await fetch(`${API_URL}/auth/addresses/${addressId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: bodyData,
        });

        console.log('📍 Response status:', response.status, response.statusText);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned invalid response format');
        }

        const data = await response.json();
        console.log('📍 Response data:', data);

        if (!response.ok) {
            console.error('❌ Update address failed:', data);
            throw new Error(data.message || 'Failed to update address');
        }

        console.log('✅ Address updated successfully');
        return data;
    } catch (error) {
        console.error('❌ Error in updateAddress:', error);
        if (error instanceof SyntaxError) {
            throw new Error('Invalid data format. Please check your address information.');
        }
        throw error;
    }
};

// Delete address
export const deleteAddress = async (addressId) => {
    const response = await fetch(`${API_URL}/auth/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete address');
    }
    return data;
};

// Set default address
export const setDefaultAddress = async (addressId) => {
    const response = await fetch(`${API_URL}/auth/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to set default address');
    }
    return data;
};

// ==================== CHECKOUT ====================

// Get checkout summary
export const getCheckoutSummary = async () => {
    const response = await fetch(`${API_URL}/orders/checkout-summary`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch checkout summary');
    }
    return data;
};

// Validate order before checkout
export const validateOrder = async (shippingAddress) => {
    const response = await fetch(`${API_URL}/orders/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ shippingAddress }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Order validation failed');
    }
    return data;
};

// Process payment
export const processPayment = async (paymentData) => {
    const response = await fetch(`${API_URL}/orders/process-payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(paymentData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Payment processing failed');
    }
    return data;
};

// Create order
export const createOrder = async (orderData) => {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
    }
    return data;
};

// ==================== ORDER MANAGEMENT ====================

// Get user's orders
export const getMyOrders = async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/orders/myorders?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
    }
    return data;
};

// Get all orders (admin)
export const getAllOrdersAdmin = async (page = 1, limit = 20, status = 'all') => {
    const response = await fetch(`${API_URL}/orders?page=${page}&limit=${limit}&status=${status}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admin orders');
    }

    return data;
};

// Get order by ID
export const getOrderById = async (orderId) => {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch order');
    }
    return data;
};

// Cancel order
export const cancelOrder = async (orderId) => {
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
    }
    return data;
};

// Update order status (admin)
export const updateOrderStatus = async (orderId, statusData) => {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(statusData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
    }
    return data;
};

// ==================== PAYMENT HELPERS ====================

// Format card number with spaces
export const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
        return parts.join(' ');
    } else {
        return value;
    }
};

// Format expiry date
export const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
        return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
};

// Validate card number (Luhn algorithm)
export const validateCardNumber = (number) => {
    const regex = /^[0-9]{13,19}$/;
    const cardNumber = number.replace(/\s/g, '');

    if (!regex.test(cardNumber)) {
        return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

// Get card type from number
export const getCardType = (number) => {
    const cardNumber = number.replace(/\s/g, '');

    const patterns = {
        visa: /^4/,
        mastercard: /^5[1-5]/,
        amex: /^3[47]/,
        discover: /^6(?:011|5)/,
        diners: /^3(?:0[0-5]|[68])/,
        jcb: /^(?:2131|1800|35)/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(cardNumber)) {
            return type;
        }
    }

    return 'unknown';
};

// Validate expiry date
export const validateExpiry = (expiry) => {
    const [month, year] = expiry.split('/');

    if (!month || !year) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
};

// Validate CVV
export const validateCVV = (cvv, cardType) => {
    const length = cardType === 'amex' ? 4 : 3;
    const regex = new RegExp(`^[0-9]{${length}}$`);
    return regex.test(cvv);
};

const checkoutService = {
    // Address
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    // Checkout
    getCheckoutSummary,
    validateOrder,
    processPayment,
    createOrder,
    // Orders
    getMyOrders,
    getOrderById,
    cancelOrder,
    // Helpers
    formatCardNumber,
    formatExpiry,
    validateCardNumber,
    getCardType,
    validateExpiry,
    validateCVV,
};

export default checkoutService;
