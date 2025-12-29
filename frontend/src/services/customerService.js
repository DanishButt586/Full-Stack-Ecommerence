const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/auth';

// Get auth token from localStorage
const getAuthToken = () => {
    try {
        // Get token directly from localStorage (standard approach)
        const token = localStorage.getItem('token');

        if (!token) {
            console.warn('⚠️ No token found in localStorage');
            return '';
        }

        return token;
    } catch (error) {
        console.error('❌ Error getting auth token:', error);
        return '';
    }
};

// Fetch all customers with pagination and search
export const getCustomers = async (page = 1, limit = 100, search = '', retryCount = 0) => {
    const maxRetries = 2;

    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
        });

        const url = `${API_URL}/customers?${params}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();

            if (retryCount < maxRetries && response.status >= 500) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return getCustomers(page, limit, search, retryCount + 1);
            }

            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data?.data?.customers && data.data.customers.length > 0) {
            console.log('👥 First 3 customer names:',
                data.data.customers.slice(0, 3).map(c => c.name).join(', '));
        }
        console.log('================================================\n');

        return data;
    } catch (error) {
        console.error('❌ ========== CUSTOMER SERVICE ERROR ==========');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('===============================================\n');

        // Retry on network errors
        if (retryCount < maxRetries) {
            console.log('🔄 Retrying after error...');
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return getCustomers(page, limit, search, retryCount + 1);
        }

        return {
            success: false,
            message: error.message || 'Failed to fetch customers',
            error: error.toString()
        };
    }
};

// Fetch customer by ID
export const getCustomerById = async (customerId) => {
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return { success: false, message: 'Failed to fetch customer' };
    }
};

// Fetch customer statistics
export const getCustomerStats = async () => {
    try {
        const response = await fetch(`${API_URL}/customers/stats`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        return { success: false, message: 'Failed to fetch customer stats' };
    }
};
