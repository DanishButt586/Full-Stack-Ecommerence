const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['admin', 'customer'],
            default: 'customer',
        },
        avatar: {
            type: String,
            default: '',
        },
        addresses: [
            {
                addressType: {
                    type: String,
                    enum: ['home', 'work', 'other'],
                    default: 'home',
                },
                fullName: String,
                phone: String,
                street: String,
                city: String,
                state: String,
                zipCode: String,
                country: String,
                isDefault: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        // Appearance & Localization Settings
        settings: {
            theme: {
                type: String,
                enum: ['light', 'dark'],
                default: 'light',
            },
            language: {
                type: String,
                default: 'en',
            },
            timezone: {
                type: String,
                default: 'UTC',
            },
            dateFormat: {
                type: String,
                enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
                default: 'MM/DD/YYYY',
            },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
