const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { protect, admin } = require('../Middleware/authMiddleware');
const { validate, authValidation } = require('../Middleware/validationMiddleware');
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    deleteAccount,
    getAllCustomers,
    getCustomerById,
    getCustomerStats,
    googleAuthSuccess,
    authFailure,
    getUserSettings,
    updateUserSettings,
    updatePassword,
} = require('../Controllers/authController');

// Regular auth routes
router.post('/register', authValidation.register, validate, registerUser);
router.post('/login', authValidation.login, validate, loginUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.delete('/account', protect, deleteAccount);

// Settings routes
router.route('/settings')
    .get(protect, getUserSettings)
    .put(protect, updateUserSettings);

// Password change route
router.put('/password', protect, updatePassword);

// Address management routes
router.route('/addresses')
    .get(protect, getAddresses)
    .post(protect, addAddress);

router.route('/addresses/:addressId')
    .put(protect, updateAddress)
    .delete(protect, deleteAddress);

router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// Customer management routes (Admin)
router.get('/customers/stats', protect, admin, getCustomerStats);
router.get('/customers', protect, admin, getAllCustomers);
router.get('/customers/:id', protect, admin, getCustomerById);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
    googleAuthSuccess
);

// Failure route
router.get('/failure', authFailure);

module.exports = router;
