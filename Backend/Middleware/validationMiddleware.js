const { body, validationResult } = require('express-validator');

// Validation middleware that runs all checks and returns errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// Auth validation rules
const authValidation = {
    register: [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters')
            .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
        body('email')
            .trim()
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
        body('phone')
            .optional()
            .trim()
            .matches(/^\d{10,}$/).withMessage('Phone must be at least 10 digits'),
    ],
    login: [
        body('email')
            .trim()
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required'),
    ],
};

// Product validation rules
const productValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty().withMessage('Product name is required')
            .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3-100 characters'),
        body('description')
            .trim()
            .notEmpty().withMessage('Description is required')
            .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
        body('price')
            .notEmpty().withMessage('Price is required')
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category')
            .trim()
            .notEmpty().withMessage('Category is required'),
    ],
};

// Order validation rules
const orderValidation = {
    create: [
        body('items')
            .isArray({ min: 1 }).withMessage('Order must have at least one item'),
        body('shippingAddress')
            .notEmpty().withMessage('Shipping address is required'),
        body('totalAmount')
            .isFloat({ min: 0 }).withMessage('Total amount must be positive'),
    ],
};

// Review validation rules
const reviewValidation = {
    create: [
        body('rating')
            .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
        body('comment')
            .trim()
            .notEmpty().withMessage('Comment is required')
            .isLength({ min: 5, max: 500 }).withMessage('Comment must be between 5-500 characters'),
    ],
};

// Cart validation rules
const cartValidation = {
    addItem: [
        body('productId')
            .trim()
            .notEmpty().withMessage('Product ID is required'),
        body('quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    ],
};

module.exports = {
    validate,
    authValidation,
    productValidation,
    orderValidation,
    reviewValidation,
    cartValidation
};
