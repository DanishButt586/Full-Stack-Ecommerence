require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const connectDB = require('./database');
const { errorHandler } = require('./Library/helper');
const passport = require('./config/passport');
const { setIO: setCouponIO } = require('./Controllers/couponController');

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

const app = express();
const PORT = process.env.PORT || 5000;
const http = require('http');
const server = http.createServer(app);
const { initSocket } = require('./notificationSocket');

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 1000, 10), // Increased for development
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed requests
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => {
        // Skip rate limiting for health checks and static files
        const path = req.path || '';
        if (path === '/' || path.startsWith('/uploads/')) return true;
        return false;
    }
});
app.use(limiter);

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 10),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || 50, 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
    skip: (req) => {
        const path = req.path || '';
        // Allow Google OAuth handshake endpoints to avoid false positives on re-login
        if (path.startsWith('/google')) return true;
        if (path.startsWith('/failure')) return true;
        if (path.startsWith('/success')) return true;
        return false;
    }
});

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware (required for passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'E-commerce API is running!',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authLimiter, require('./Routes/authRoutes'));
app.use('/api/products', require('./Routes/productRoutes'));
app.use('/api/categories', require('./Routes/categoryRoutes'));
app.use('/api/orders', require('./Routes/orderRoutes'));
app.use('/api/cart', require('./Routes/cartRoutes'));
app.use('/api/reviews', require('./Routes/reviewRoutes'));
app.use('/api/coupons', require('./Routes/couponRoutes'));
app.use('/api/reports', require('./Routes/reportRoutes'));
app.use('/api/notifications', require('./Routes/notificationRoutes'));
app.use('/api/payment', require('./Routes/paymentRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.IO before starting server
console.log('🔧 Initializing Socket.IO...');
const io = initSocket(server);
console.log('✅ Socket.IO initialized');

// Set the Socket.IO instance in coupon controller for real-time updates
setCouponIO(io);

// Start server with Socket.IO
console.log(`🚀 Starting server on port ${PORT}...`);
const serverInstance = server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV}`);
    console.log(`✅ Server address:`, server.address());
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    }
});
