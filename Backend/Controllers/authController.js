const User = require('../Models/userModel');
const Cart = require('../Models/cartModel');
const { sendResponse, asyncHandler } = require('../Library/helper');
const jwt = require('jsonwebtoken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, avatar } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return sendResponse(res, 400, false, 'User already exists');
    }

    // Create user with customer role (buyers only)
    const user = await User.create({
        name,
        email,
        password,
        phone,
        avatar: avatar || '',
        role: 'customer', // Force customer role for registrations
    });

    if (user) {
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        sendResponse(res, 201, true, 'User registered successfully', {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
            },
            token: token
        });
    } else {
        sendResponse(res, 400, false, 'Invalid user data');
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Handle Admin login with persisted credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'Admin123@gmail.com';
    const adminDefaultPassword = process.env.ADMIN_PASSWORD || 'Admin123@';
    if (email === adminEmail) {
        let adminUser = await User.findOne({ email: adminEmail }).select('+password');

        // Seed admin user if missing
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Admin',
                email: adminEmail,
                password: adminDefaultPassword,
                role: 'admin'
            });
            adminUser = await User.findOne({ email: adminEmail }).select('+password');
        }

        const passwordValid = await adminUser.comparePassword(password);
        if (passwordValid) {
            // Generate real JWT token for admin
            const token = jwt.sign(
                { id: adminUser._id, email: adminUser.email, role: adminUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            return sendResponse(res, 200, true, 'Login successful', {
                user: {
                    _id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: adminUser.role,
                    phone: adminUser.phone,
                    avatar: adminUser.avatar,
                },
                token: token
            });
        }

        return sendResponse(res, 401, false, 'Invalid email or password');
    }

    // Check for user by email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
        // Generate real JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        sendResponse(res, 200, true, 'Login successful', {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
            },
            token: token
        });
    } else {
        sendResponse(res, 401, false, 'Invalid email or password');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        sendResponse(res, 200, true, 'Profile fetched successfully', {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            addresses: user.addresses,
            avatar: user.avatar,
        });
    } else {
        sendResponse(res, 404, false, 'User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.avatar = req.body.avatar || user.avatar;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        sendResponse(res, 200, true, 'Profile updated successfully', {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
        });
    } else {
        sendResponse(res, 404, false, 'User not found');
    }
});

// @desc    Get user addresses
// @route   GET /api/auth/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'Addresses fetched successfully', {
        addresses: user.addresses || [],
    });
});

// @desc    Add new address
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
    const { addressType, fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    // Validate required fields
    if (!fullName || !phone || !street || !city || !country) {
        return sendResponse(res, 400, false, 'Please provide all required address fields');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        return sendResponse(res, 404, false, 'User not found');
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });
    }

    // If this is the first address, make it default
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    const newAddress = {
        addressType: addressType || 'home',
        fullName,
        phone,
        street,
        city,
        state: state || '',
        zipCode: zipCode || '',
        country,
        isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    sendResponse(res, 201, true, 'Address added successfully', {
        addresses: user.addresses,
        newAddress: user.addresses[user.addresses.length - 1],
    });
});

// @desc    Update address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const { addressType, fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        return sendResponse(res, 404, false, 'User not found');
    }

    const addressIndex = user.addresses.findIndex(
        addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
        return sendResponse(res, 404, false, 'Address not found');
    }

    // If setting as default, remove default from others
    if (isDefault) {
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });
    }

    // Update address fields
    const address = user.addresses[addressIndex];
    address.addressType = addressType || address.addressType;
    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.country = country || address.country;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    sendResponse(res, 200, true, 'Address updated successfully', {
        addresses: user.addresses,
        updatedAddress: address,
    });
});

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
        return sendResponse(res, 404, false, 'User not found');
    }

    const addressIndex = user.addresses.findIndex(
        addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
        return sendResponse(res, 404, false, 'Address not found');
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, make first one default
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    sendResponse(res, 200, true, 'Address deleted successfully', {
        addresses: user.addresses,
    });
});

// @desc    Set default address
// @route   PUT /api/auth/addresses/:addressId/default
// @access  Private
const setDefaultAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
        return sendResponse(res, 404, false, 'User not found');
    }

    const addressExists = user.addresses.some(
        addr => addr._id.toString() === addressId
    );

    if (!addressExists) {
        return sendResponse(res, 404, false, 'Address not found');
    }

    // Update default status
    user.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    sendResponse(res, 200, true, 'Default address updated', {
        addresses: user.addresses,
    });
});

// @desc    Delete current account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return sendResponse(res, 401, false, 'Not authorized');
    }

    const user = await User.findById(userId);
    if (!user) {
        return sendResponse(res, 404, false, 'User not found');
    }

    await Cart.deleteOne({ user: userId });
    await User.deleteOne({ _id: userId });

    sendResponse(res, 200, true, 'Account deleted successfully');
});

// @desc    Get all customers (Admin only)
// @route   GET /api/auth/customers
// @access  Admin
const getAllCustomers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, search = '', sort = '-createdAt' } = req.query;

    console.log('🔍 getAllCustomers called - Page:', page, 'Limit:', limit, 'Search:', search);

    // Build query for customers only
    let query = { role: 'customer' };

    // Search by name or email
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
        .select('-password')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    console.log('✅ Found', customers.length, 'customers. Names:', customers.map(c => c.name).join(', '));

    sendResponse(res, 200, true, 'Customers fetched successfully', {
        customers,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit),
        },
    });
});

// @desc    Get customer by ID (Admin only)
// @route   GET /api/auth/customers/:id
// @access  Admin
const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await User.findById(req.params.id).select('-password');

    if (!customer || customer.role !== 'customer') {
        return sendResponse(res, 404, false, 'Customer not found');
    }

    sendResponse(res, 200, true, 'Customer fetched successfully', { customer });
});

// @desc    Get customer statistics (Admin only)
// @route   GET /api/auth/customers/stats
// @access  Admin
const getCustomerStats = asyncHandler(async (req, res) => {
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Get customers registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = await User.countDocuments({
        role: 'customer',
        createdAt: { $gte: thirtyDaysAgo },
    });

    // Get customers registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCustomers = await User.countDocuments({
        role: 'customer',
        createdAt: { $gte: sevenDaysAgo },
    });

    sendResponse(res, 200, true, 'Customer stats fetched successfully', {
        stats: {
            total: totalCustomers,
            newThisMonth: newCustomers,
            newThisWeek: recentCustomers,
        },
    });
});

// @desc    Google OAuth Success
// @route   GET /api/auth/google/success
// @access  Public
const googleAuthSuccess = asyncHandler(async (req, res) => {
    if (req.user) {
        // Check if user exists or needs to complete signup
        if (req.user.isExisting) {
            // Existing user - generate token and login
            const token = jwt.sign(
                { id: req.user.user._id, role: req.user.user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' }
            );

            // Redirect to frontend with token
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
                _id: req.user.user._id,
                name: req.user.user.name,
                email: req.user.user.email,
                role: req.user.user.role,
                avatar: req.user.user.avatar,
            }))}`);
        } else {
            // New user - redirect to signup completion with Google data
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/auth/complete-signup?googleData=${encodeURIComponent(JSON.stringify({
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar,
            }))}`);
        }
    } else {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/failure`);
    }
});

// @desc    OAuth Failure
// @route   GET /api/auth/failure
// @access  Public
const authFailure = asyncHandler(async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/failure`);
});

// @desc    Get user settings (appearance & localization)
// @route   GET /api/auth/settings
// @access  Private
const getUserSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        sendResponse(res, 200, true, 'Settings fetched successfully', {
            settings: user.settings || {
                theme: 'light',
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'MM/DD/YYYY'
            }
        });
    } else {
        sendResponse(res, 404, false, 'User not found');
    }
});

// @desc    Update user settings (appearance & localization)
// @route   PUT /api/auth/settings
// @access  Private
const updateUserSettings = asyncHandler(async (req, res) => {
    const { theme, language, timezone, dateFormat } = req.body;

    // Validate theme
    if (theme && !['light', 'dark'].includes(theme)) {
        return sendResponse(res, 400, false, 'Invalid theme value');
    }

    // Validate dateFormat
    if (dateFormat && !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(dateFormat)) {
        return sendResponse(res, 400, false, 'Invalid date format');
    }

    const user = await User.findById(req.user._id);

    if (user) {
        // Ensure settings object exists (for older records)
        if (!user.settings) {
            user.settings = {};
        }

        // Update only provided fields
        if (theme) user.settings.theme = theme;
        if (language) user.settings.language = language;
        if (timezone) user.settings.timezone = timezone;
        if (dateFormat) user.settings.dateFormat = dateFormat;

        await user.save();

        sendResponse(res, 200, true, 'Settings updated successfully', {
            settings: user.settings
        });
    } else {
        sendResponse(res, 404, false, 'User not found');
    }
});

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return sendResponse(res, 400, false, 'Please provide current and new password');
    }

    if (newPassword.length < 6) {
        return sendResponse(res, 400, false, 'Password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (user) {
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return sendResponse(res, 401, false, 'Current password is incorrect');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        sendResponse(res, 200, true, 'Password changed successfully');
    } else {
        sendResponse(res, 404, false, 'User not found');
    }
});

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAllCustomers,
    getCustomerById,
    getCustomerStats,
    googleAuthSuccess,
    authFailure,
    deleteAccount,
    getUserSettings,
    updateUserSettings,
    updatePassword,
};
