const Order = require('../Models/orderModel');
const Cart = require('../Models/cartModel');
const Product = require('../Models/productModel');
const Notification = require('../Models/notificationModel');
const { sendResponse, asyncHandler } = require('../Library/helper');

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const {
        shippingAddress,
        paymentMethod,
        paymentResult,
    } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        return sendResponse(res, 400, false, 'Cart is empty');
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city ||
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
        return sendResponse(res, 400, false, 'Please provide complete shipping address');
    }

    // Validate stock availability for all items
    const stockErrors = [];
    for (const item of cart.items) {
        const product = await Product.findById(item.product._id || item.product);
        if (!product) {
            stockErrors.push(`Product not found: ${item.product}`);
        } else if (product.stock < item.quantity) {
            stockErrors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
    }

    if (stockErrors.length > 0) {
        return sendResponse(res, 400, false, 'Stock validation failed', { errors: stockErrors });
    }

    // Calculate prices
    const itemsPrice = cart.totalPrice;
    const taxPrice = Number((itemsPrice * 0.08).toFixed(2)); // 8% tax
    const shippingPrice = itemsPrice > 50 ? 0 : 5.99; // Free shipping over $50
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

    // Prepare order items
    const orderItems = cart.items.map(item => ({
        product: item.product._id || item.product,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.image || item.product.images?.[0]?.url || '',
    }));

    // Create the order
    const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || 'card',
        paymentResult: paymentResult || null,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        isPaid: paymentMethod === 'card' && paymentResult?.status === 'completed',
        paidAt: paymentMethod === 'card' && paymentResult?.status === 'completed' ? Date.now() : null,
    });

    // Update product stock
    for (const item of cart.items) {
        await Product.findByIdAndUpdate(
            item.product._id || item.product,
            { $inc: { stock: -item.quantity } }
        );
    }

    // Clear the cart
    cart.items = [];
    await cart.save();

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.product', 'name image');

    // Create notification for admin
    try {
        await Notification.create({
            orderId: order._id,
            customerId: req.user._id,
            type: 'order_placed',
            title: `New Order from ${req.user.name}`,
            message: `Order #${order.orderNumber} has been placed by ${req.user.name} for ${new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(totalPrice)}`,
            orderNumber: order.orderNumber,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderTotal: totalPrice,
            orderItems: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            status: 'pending',
        });

        // Create notification for customer
        const customerOrderNotif = await Notification.create({
            orderId: order._id,
            customerId: req.user._id,
            type: 'order_placed',
            title: 'Order Placed Successfully!',
            message: `Your order #${order.orderNumber} has been placed successfully for ${new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(totalPrice)}. Our team will review and approve your order shortly.`,
            orderNumber: order.orderNumber,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderTotal: totalPrice,
            orderItems: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            status: 'pending',
            isCustomerNotification: true,
        });

        // Emit real-time notification to customer for order placed
        try {
            const { emitCustomerNotification } = require('../notificationSocket');
            console.log('🚀 Emitting order placed notification to customer:', req.user._id);
            emitCustomerNotification(req.user._id, customerOrderNotif);
            console.log('✅ Order placed notification emitted successfully');
        } catch (socketError) {
            console.error('⚠️ Socket emit error (order placed):', socketError);
        }
    } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the order creation if notification fails
    }

    sendResponse(res, 201, true, 'Order created successfully', { order: populatedOrder });
});

// @desc    Validate order before checkout
// @route   POST /api/orders/validate
// @access  Private
const validateOrder = asyncHandler(async (req, res) => {
    const { shippingAddress } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        return sendResponse(res, 400, false, 'Cart is empty');
    }

    const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: {
            itemsCount: cart.itemCount,
            itemsPrice: cart.totalPrice,
            taxPrice: Number((cart.totalPrice * 0.08).toFixed(2)),
            shippingPrice: cart.totalPrice > 50 ? 0 : 5.99,
            totalPrice: 0,
        },
        items: [],
    };

    // Calculate total
    validationResult.summary.totalPrice = Number((
        validationResult.summary.itemsPrice +
        validationResult.summary.taxPrice +
        validationResult.summary.shippingPrice
    ).toFixed(2));

    // Validate each item
    for (const item of cart.items) {
        const product = await Product.findById(item.product._id || item.product);

        const itemValidation = {
            productId: item.product._id || item.product,
            name: product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
            isValid: true,
            errors: [],
        };

        if (!product) {
            itemValidation.isValid = false;
            itemValidation.errors.push('Product no longer available');
            validationResult.isValid = false;
        } else if (!product.isActive) {
            itemValidation.isValid = false;
            itemValidation.errors.push('Product is currently unavailable');
            validationResult.isValid = false;
        } else if (product.stock < item.quantity) {
            itemValidation.isValid = false;
            itemValidation.errors.push(`Only ${product.stock} items available`);
            validationResult.isValid = false;
        } else if (product.stock <= 5) {
            validationResult.warnings.push(`Low stock for ${product.name}: Only ${product.stock} left`);
        }

        // Check price changes
        if (product && product.price !== item.price) {
            validationResult.warnings.push(`Price changed for ${product.name}: was $${item.price}, now $${product.price}`);
        }

        validationResult.items.push(itemValidation);
    }

    // Validate shipping address if provided
    if (shippingAddress) {
        const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
        const missingFields = requiredFields.filter(field => !shippingAddress[field]);

        if (missingFields.length > 0) {
            validationResult.errors.push(`Missing address fields: ${missingFields.join(', ')}`);
            validationResult.isValid = false;
        }
    }

    sendResponse(res, 200, true, 'Order validation complete', validationResult);
});

// @desc    Process payment
// @route   POST /api/orders/process-payment
// @access  Private
const processPayment = asyncHandler(async (req, res) => {
    const { paymentMethod, paymentDetails, amount } = req.body;

    // In production, integrate with real payment gateway (Stripe, PayPal, etc.)
    // This is a simulation for development

    if (!paymentMethod) {
        return sendResponse(res, 400, false, 'Payment method is required');
    }

    if (!amount || amount <= 0) {
        return sendResponse(res, 400, false, 'Invalid payment amount');
    }

    // Simulate payment processing
    const paymentResult = {
        id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        method: paymentMethod,
        amount: amount,
        currency: 'USD',
        updateTime: new Date().toISOString(),
        emailAddress: req.user?.email || paymentDetails?.email,
    };

    // Simulate card validation
    if (paymentMethod === 'card') {
        if (!paymentDetails?.cardNumber || !paymentDetails?.expiry || !paymentDetails?.cvv) {
            return sendResponse(res, 400, false, 'Invalid card details');
        }

        // Basic card validation (Luhn algorithm simulation)
        const cardNumber = paymentDetails.cardNumber.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            return sendResponse(res, 400, false, 'Invalid card number');
        }

        // Simulate random failures for testing (5% failure rate)
        if (Math.random() < 0.05) {
            return sendResponse(res, 400, false, 'Payment declined. Please try again or use a different card.');
        }

        paymentResult.cardLast4 = cardNumber.slice(-4);
        paymentResult.cardBrand = getCardBrand(cardNumber);
    }

    // Simulate PayPal payment
    if (paymentMethod === 'paypal') {
        if (!paymentDetails?.email) {
            return sendResponse(res, 400, false, 'PayPal email is required');
        }
        paymentResult.paypalEmail = paymentDetails.email;
    }

    sendResponse(res, 200, true, 'Payment processed successfully', { paymentResult });
});

// Helper function to determine card brand
const getCardBrand = (cardNumber) => {
    const patterns = {
        visa: /^4/,
        mastercard: /^5[1-5]/,
        amex: /^3[47]/,
        discover: /^6(?:011|5)/,
    };

    for (const [brand, pattern] of Object.entries(patterns)) {
        if (pattern.test(cardNumber)) {
            return brand;
        }
    }
    return 'unknown';
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return sendResponse(res, 404, false, 'Order not found');
    }

    // Verify order belongs to user or user is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return sendResponse(res, 403, false, 'Not authorized to update this order');
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        updateTime: req.body.updateTime,
        emailAddress: req.body.emailAddress,
    };

    const updatedOrder = await order.save();
    sendResponse(res, 200, true, 'Order payment updated', { order: updatedOrder });
});

// @desc    Get order summary for checkout
// @route   GET /api/orders/checkout-summary
// @access  Private
const getCheckoutSummary = asyncHandler(async (req, res) => {
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'items.product',
        select: 'name price image images stock isActive',
    });

    if (!cart || cart.items.length === 0) {
        return sendResponse(res, 400, false, 'Cart is empty');
    }

    // Calculate prices
    const itemsPrice = cart.totalPrice;
    const taxPrice = Number((itemsPrice * 0.08).toFixed(2));
    const shippingPrice = itemsPrice > 50 ? 0 : 5.99;
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

    const summary = {
        items: cart.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
        })),
        itemsCount: cart.itemCount,
        pricing: {
            subtotal: itemsPrice,
            tax: taxPrice,
            shipping: shippingPrice,
            total: totalPrice,
        },
        freeShippingThreshold: 50,
        amountToFreeShipping: itemsPrice >= 50 ? 0 : Number((50 - itemsPrice).toFixed(2)),
    };

    sendResponse(res, 200, true, 'Checkout summary fetched', summary);
});

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    sendResponse(res, 200, true, 'Orders fetched successfully', {
        orders,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('items.product', 'name image');

    if (!order) {
        return sendResponse(res, 404, false, 'Order not found');
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return sendResponse(res, 403, false, 'Not authorized to view this order');
    }

    sendResponse(res, 200, true, 'Order fetched successfully', { order });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return sendResponse(res, 404, false, 'Order not found');
    }

    // Check if user owns the order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return sendResponse(res, 403, false, 'Not authorized to cancel this order');
    }

    // Can only cancel orders that are not already delivered, cancelled, or approved
    if (['delivered', 'cancelled', 'approved'].includes(order.orderStatus)) {
        return sendResponse(res, 400, false, `Cannot cancel order with status: ${order.orderStatus}`);
    }

    // Restore product stock
    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
        );
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Create admin notification when customer cancels order
    if (req.user.role !== 'admin') {
        const notification = await Notification.create({
            orderId: order._id,
            customerId: order.user._id,
            type: 'order_cancelled',
            title: `Order Cancelled by ${order.user.name}`,
            message: `Customer ${order.user.name} cancelled order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
            orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
            customerName: order.user.name,
            customerEmail: order.user.email,
            orderTotal: order.totalPrice,
            orderItems: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            status: 'pending',
            isCustomerNotification: false,
            relatedId: order._id,
            relatedModel: 'Order',
            metadata: {
                orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
                totalPrice: order.totalPrice,
                itemCount: order.items.length
            }
        });
        // Emit real-time notification to admin
        try {
            const { emitAdminNotification } = require('../notificationSocket');
            emitAdminNotification(notification);
        } catch (e) {
            console.error('Socket emit error:', e);
        }
    }

    sendResponse(res, 200, true, 'Order cancelled successfully', { order });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    console.log('📝 updateOrderStatus called');
    console.log('Order ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        console.log('❌ Order not found');
        return sendResponse(res, 404, false, 'Order not found');
    }

    // Prevent status change if already delivered
    if (order.orderStatus === 'delivered') {
        console.log('⚠️ Cannot change status - order already delivered');
        return sendResponse(res, 400, false, 'Cannot change status of delivered order');
    }

    // Allow status changes for cancelled orders to reprocess them
    // This enables admin to change cancelled orders to pending/processing if needed

    const { status, declineReason } = req.body;
    console.log('Status from request:', status);

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        console.log('❌ Invalid status:', status);
        return sendResponse(res, 400, false, 'Invalid order status');
    }

    const oldStatus = order.orderStatus;

    // Handle stock restoration when cancelling
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
        console.log('📦 Restoring stock for cancelled order');
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }
    }

    // Handle stock deduction when changing from cancelled back to active status
    if (order.orderStatus === 'cancelled' && status !== 'cancelled') {
        console.log('📦 Deducting stock for reactivated order');
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return sendResponse(res, 400, false, 'Insufficient stock to reactivate this order');
            }
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }
    }

    order.orderStatus = status;

    // Send notifications to customer for all status changes
    if (oldStatus !== status) {
        console.log('🔄 Creating notifications for status change:', { oldStatus, newStatus: status });
        let notificationType = 'order_placed';
        let notificationTitle = 'Order Status Updated';
        let notificationMessage = `Your order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} status has been updated to ${status}.`;

        // Customize notification based on status
        if (status === 'processing') {
            notificationType = 'order_approved';
            notificationTitle = 'Order Processing';
            notificationMessage = `Your order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} is now being processed.`;
        } else if (status === 'shipped') {
            notificationType = 'order_approved';
            notificationTitle = 'Order Shipped';
            notificationMessage = `Your order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} has been shipped and is on its way!`;
        } else if (status === 'delivered') {
            notificationType = 'order_approved';
            notificationTitle = 'Order Delivered';
            notificationMessage = `Your order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} has been delivered. Please leave a review!`;
            order.deliveredAt = Date.now();

            // Create review notifications for each product
            for (const item of order.items) {
                try {
                    await Notification.create({
                        orderId: order._id,
                        customerId: order.user._id,
                        type: 'review_pending',
                        title: 'Review Your Purchase',
                        message: `Please share your experience with ${item.name}`,
                        orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
                        customerName: order.user.name,
                        customerEmail: order.user.email,
                        isCustomerNotification: true,
                        relatedId: item.product,
                        relatedModel: 'Product',
                        metadata: {
                            productId: item.product,
                            productName: item.name,
                            productImage: item.image,
                            orderId: order._id,
                            orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
                        }
                    });
                } catch (reviewNotifError) {
                    console.error('Error creating review notification:', reviewNotifError);
                }
            }
        } else if (status === 'cancelled') {

            // Track status history
            if (!order.statusHistory) {
                order.statusHistory = [];
            }
            order.statusHistory.push({
                status: status,
                changedAt: Date.now(),
                changedBy: req.user._id,
            });
            notificationType = 'order_cancelled';
            notificationTitle = 'Order Cancelled';
            notificationMessage = declineReason
                ? `Your order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} has been cancelled. Reason: ${declineReason}`
                : `Your order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} has been cancelled.`;
        }

        // Create customer notification
        try {
            // Map order status to notification status
            let notificationStatus = 'pending';
            if (status === 'processing' || status === 'shipped' || status === 'delivered') {
                notificationStatus = 'approved';
            } else if (status === 'cancelled') {
                notificationStatus = 'declined';
            }

            console.log('💾 Creating notification with:', {
                customerId: order.user._id,
                type: notificationType,
                isCustomerNotification: true,
                status: notificationStatus
            });

            const customerNotif = await Notification.create({
                orderId: order._id,
                customerId: order.user._id,
                type: notificationType,
                title: notificationTitle,
                message: notificationMessage,
                orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
                customerName: order.user.name,
                customerEmail: order.user.email,
                orderTotal: order.totalPrice,
                orderItems: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                status: notificationStatus,
                isCustomerNotification: true,
                relatedId: order._id,
                relatedModel: 'Order',
                cancelReason: declineReason || null,
                metadata: {
                    orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
                    totalPrice: order.totalPrice,
                    itemCount: order.items.length,
                    oldStatus: oldStatus,
                    newStatus: status
                }
            });

            // Emit real-time notification to customer
            try {
                const { emitCustomerNotification } = require('../notificationSocket');
                console.log('🚀 Attempting to emit customer notification');
                console.log('   Customer ID:', order.user._id);
                console.log('   User ID Type:', typeof order.user._id);
                console.log('   User ID Value:', order.user._id.toString());
                console.log('   Notification:', {
                    _id: customerNotif._id,
                    type: customerNotif.type,
                    isCustomerNotification: customerNotif.isCustomerNotification,
                    title: customerNotif.title
                });
                emitCustomerNotification(order.user._id, customerNotif);
                console.log('✅ Customer notification emitted successfully');
            } catch (e) {
                console.error('❌ Socket emit error (customer):', e);
            }

            // Create admin notification for order status change
            try {
                const adminNotif = await Notification.create({
                    orderId: order._id,
                    customerId: order.user._id,
                    type: 'order_status_changed',
                    title: `Order Status Updated`,
                    message: `Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()} status changed from ${oldStatus} to ${status}`,
                    orderNumber: order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
                    customerName: order.user.name,
                    customerEmail: order.user.email,
                    orderTotal: order.totalPrice,
                    orderItems: order.items.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    status: notificationStatus,
                    adminAction: 'none',
                    metadata: {
                        oldStatus: oldStatus,
                        newStatus: status,
                        changedBy: req.user._id,
                        changedAt: Date.now()
                    }
                });

                // Emit real-time notification to admin
                try {
                    const { emitAdminNotification } = require('../notificationSocket');
                    console.log('📢 Emitting admin notification');
                    emitAdminNotification(adminNotif);
                    console.log('✅ Admin notification emitted successfully');
                } catch (e) {
                    console.error('❌ Socket emit error (admin):', e);
                }
            } catch (adminNotifError) {
                console.error('Error creating admin notification:', adminNotifError);
            }
        } catch (notifError) {
            console.error('Error creating customer notification:', notifError);
        }
    }

    const updatedOrder = await order.save();
    sendResponse(res, 200, true, 'Order status updated', { order: updatedOrder });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status && status !== 'all') {
        filter.orderStatus = status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
        .populate('user', 'name email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Calculate statistics
    const stats = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: '$totalPrice' },
                paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
            },
        },
    ]);

    sendResponse(res, 200, true, 'Orders fetched successfully', {
        orders,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
        stats: stats[0] || {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            paidOrders: 0,
        },
    });
});

module.exports = {
    createOrder,
    validateOrder,
    processPayment,
    updateOrderToPaid,
    getCheckoutSummary,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrders,
};
