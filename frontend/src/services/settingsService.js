const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/auth';

// Helper function to get auth token
const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('⚠️ No token found in localStorage');
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

// Get user settings
export const getUserSettings = async () => {
    console.log('=== getUserSettings called ===');

    try {
        const headers = getAuthHeaders();
        console.log('Request headers:', headers);

        const response = await fetch(`${API_URL}/settings`, {
            headers,
            credentials: 'include',
        });

        console.log('getUserSettings response status:', response.status);
        const data = await response.json();
        console.log('getUserSettings response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch settings');
        }

        return data;
    } catch (error) {
        console.error('getUserSettings error:', error);
        throw error;
    }
};

// Update user settings
export const updateUserSettings = async (settings) => {
    console.log('=== updateUserSettings called ===');
    console.log('Settings to update:', settings);

    try {
        const headers = getAuthHeaders();
        console.log('Request headers:', headers);

        const response = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify(settings),
        });

        console.log('updateUserSettings response status:', response.status);
        const data = await response.json();
        console.log('updateUserSettings response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update settings');
        }

        return data;
    } catch (error) {
        console.error('updateUserSettings error:', error);
        throw error;
    }
};

// Update user password
export const updatePassword = async (currentPassword, newPassword) => {
    console.log('=== updatePassword called ===');

    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/password`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        console.log('updatePassword response status:', response.status);
        const data = await response.json();
        console.log('updatePassword response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password');
        }

        return data;
    } catch (error) {
        console.error('updatePassword error:', error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
    console.log('=== updateUserProfile called ===');
    console.log('Profile data to update:', profileData);

    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify(profileData),
        });

        console.log('updateUserProfile response status:', response.status);
        const data = await response.json();
        console.log('updateUserProfile response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        return data;
    } catch (error) {
        console.error('updateUserProfile error:', error);
        throw error;
    }
};
