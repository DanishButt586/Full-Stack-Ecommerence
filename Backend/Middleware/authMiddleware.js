const { sendResponse } = require('../Library/helper');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');

// Protect routes - Authentication middleware
const protect = async (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return sendResponse(res, 401, false, 'Not authorized, no token provided');
    }

    try {
        // Verify as real JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id);

        if (!user) {
            return sendResponse(res, 401, false, 'User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        console.error('Token received:', token?.substring(0, 20) + '...');

        // Provide more specific error messages
        if (error.name === 'JsonWebTokenError') {
            return sendResponse(res, 401, false, 'Invalid token. Please log in again.');
        } else if (error.name === 'TokenExpiredError') {
            return sendResponse(res, 401, false, 'Token expired. Please log in again.');
        }

        return sendResponse(res, 401, false, 'Not authorized, token failed');
    }
};

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        sendResponse(res, 403, false, 'Not authorized as admin');
    }
};

module.exports = { protect, admin };
