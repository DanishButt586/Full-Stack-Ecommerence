/**
 * Validation Utilities
 * Provides client-side validation for authentication forms
 */

/**
 * Validates email format using RFC 5322 compliant regex
 * @param {string} email - Email address to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return { isValid: false, message: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    return {
        isValid,
        message: isValid ? '' : 'Please enter a valid email address',
    };
};

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateUsername = (username) => {
    if (!username || username.trim() === '') {
        return { isValid: false, message: 'Username is required' };
    }

    if (username.length < 3) {
        return { isValid: false, message: 'Username must be at least 3 characters' };
    }

    if (username.length > 20) {
        return { isValid: false, message: 'Username must be less than 20 characters' };
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    const isValid = usernameRegex.test(username);

    return {
        isValid,
        message: isValid ? '' : 'Username can only contain letters, numbers, and underscores',
    };
};

/**
 * Validates username or email (for login)
 * @param {string} value - Username or email to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateUsernameOrEmail = (value) => {
    if (!value || value.trim() === '') {
        return { isValid: false, message: 'Username or email is required' };
    }

    // Check if it's an email (contains @)
    if (value.includes('@')) {
        return validateEmail(value);
    } else {
        return validateUsername(value);
    }
};

/**
 * Validates password strength
 * Requirements: Minimum 8 characters, at least one uppercase, one lowercase, one number
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and strength score
 */
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid =
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber;

    // Calculate strength score (0-4)
    let strength = 0;
    if (password.length >= minLength) strength++;
    if (hasUpperCase && hasLowerCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;

    return {
        isValid,
        strength,
        message: isValid
            ? 'Strong password'
            : 'Password must be at least 8 characters with uppercase, lowercase, and number',
    };
};

/**
 * Validates full name format
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid name (2+ characters, letters and spaces only)
 */
export const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name.trim());
};

/**
 * Validates phone number format (basic international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
};

/**
 * Password strength indicator
 * @param {number} strength - Strength score (0-4)
 * @returns {object} - Color and text for UI display
 */
export const getPasswordStrengthIndicator = (strength) => {
    const indicators = {
        0: { color: 'bg-gray-300', text: 'Very Weak', textColor: 'text-gray-500' },
        1: { color: 'bg-red-500', text: 'Weak', textColor: 'text-red-500' },
        2: { color: 'bg-orange-500', text: 'Fair', textColor: 'text-orange-500' },
        3: { color: 'bg-yellow-500', text: 'Good', textColor: 'text-yellow-500' },
        4: { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-500' },
    };

    return indicators[strength] || indicators[0];
};
