const Cart = require('../Models/cartModel');
const Product = require('../Models/productModel');
const { sendResponse, asyncHandler } = require('../Library/helper');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    // Admin users should not have a shopping cart; avoid invalid ObjectId lookups
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users do not have a shopping cart');
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price comparePrice images stock sku');

    if (cart) {
        // Validate stock and update prices
        let needsUpdate = false;
        for (let item of cart.items) {
            if (item.product) {
                // Update price if product price changed
                if (item.price !== item.product.price) {
                    item.price = item.product.price;
                    needsUpdate = true;
                }
                // Validate quantity against stock
                if (item.quantity > item.product.stock) {
                    item.quantity = item.product.stock;
                    needsUpdate = true;
                }
            }
        }
        // Remove items with 0 stock
        const originalLength = cart.items.length;
        cart.items = cart.items.filter(item => item.product && item.product.stock > 0);
        if (cart.items.length !== originalLength) needsUpdate = true;

        if (needsUpdate) {
            await cart.save();
        }

        sendResponse(res, 200, true, 'Cart fetched successfully', cart);
    } else {
        sendResponse(res, 200, true, 'Cart is empty', { items: [], totalPrice: 0 });
    }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const { productId, quantity = 1 } = req.body;

    // Get product to validate stock and get current price
    const product = await Product.findById(productId);
    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    if (!product.isActive) {
        return sendResponse(res, 400, false, 'Product is not available');
    }

    if (product.stock < quantity) {
        return sendResponse(res, 400, false, `Only ${product.stock} items available in stock`);
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [{ product: productId, quantity, price: product.price }],
        });
    } else {
        const existingItem = cart.items.find((item) => item.product.toString() === productId);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                return sendResponse(res, 400, false, `Cannot add more. Only ${product.stock} items available`);
            }
            existingItem.quantity = newQuantity;
            existingItem.price = product.price; // Update price
        } else {
            cart.items.push({ product: productId, quantity, price: product.price });
        }

        await cart.save();
    }

    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price comparePrice images stock sku');
    sendResponse(res, 200, true, 'Item added to cart', updatedCart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const { quantity } = req.body;

    if (quantity < 1) {
        return sendResponse(res, 400, false, 'Quantity must be at least 1');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        const item = cart.items.id(req.params.itemId);

        if (item) {
            // Validate against stock
            const product = await Product.findById(item.product);
            if (!product) {
                return sendResponse(res, 404, false, 'Product not found');
            }
            if (quantity > product.stock) {
                return sendResponse(res, 400, false, `Only ${product.stock} items available in stock`);
            }

            item.quantity = quantity;
            item.price = product.price; // Update price
            await cart.save();

            const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price comparePrice images stock sku');
            sendResponse(res, 200, true, 'Cart updated', updatedCart);
        } else {
            sendResponse(res, 404, false, 'Item not found in cart');
        }
    } else {
        sendResponse(res, 404, false, 'Cart not found');
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price comparePrice images stock sku');
        sendResponse(res, 200, true, 'Item removed from cart', updatedCart);
    } else {
        sendResponse(res, 404, false, 'Cart not found');
    }
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        cart.items = [];
        await cart.save();
        sendResponse(res, 200, true, 'Cart cleared', { items: [], totalPrice: 0 });
    } else {
        sendResponse(res, 200, true, 'Cart is already empty', { items: [], totalPrice: 0 });
    }
});

// @desc    Save cart for later (move to saved items)
// @route   POST /api/cart/save-for-later/:itemId
// @access  Private
const saveForLater = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return sendResponse(res, 404, false, 'Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
        return sendResponse(res, 404, false, 'Item not found in cart');
    }

    const item = cart.items[itemIndex];

    // Initialize savedItems if not exists
    if (!cart.savedItems) {
        cart.savedItems = [];
    }

    // Check if already saved
    const alreadySaved = cart.savedItems.find(saved => saved.product.toString() === item.product.toString());
    if (!alreadySaved) {
        cart.savedItems.push({
            product: item.product,
            quantity: item.quantity,
            price: item.price
        });
    }

    // Remove from cart items
    cart.items.splice(itemIndex, 1);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
        .populate('items.product', 'name price comparePrice images stock sku')
        .populate('savedItems.product', 'name price comparePrice images stock sku');

    sendResponse(res, 200, true, 'Item saved for later', updatedCart);
});

// @desc    Move saved item back to cart
// @route   POST /api/cart/move-to-cart/:itemId
// @access  Private
const moveToCart = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || !cart.savedItems) {
        return sendResponse(res, 404, false, 'No saved items found');
    }

    const itemIndex = cart.savedItems.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
        return sendResponse(res, 404, false, 'Saved item not found');
    }

    const savedItem = cart.savedItems[itemIndex];
    const product = await Product.findById(savedItem.product);

    if (!product || !product.isActive) {
        return sendResponse(res, 400, false, 'Product is no longer available');
    }

    if (product.stock < 1) {
        return sendResponse(res, 400, false, 'Product is out of stock');
    }

    // Check if already in cart
    const existingItem = cart.items.find(item => item.product.toString() === savedItem.product.toString());
    if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + savedItem.quantity, product.stock);
        existingItem.quantity = newQuantity;
        existingItem.price = product.price;
    } else {
        cart.items.push({
            product: savedItem.product,
            quantity: Math.min(savedItem.quantity, product.stock),
            price: product.price
        });
    }

    // Remove from saved items
    cart.savedItems.splice(itemIndex, 1);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
        .populate('items.product', 'name price comparePrice images stock sku')
        .populate('savedItems.product', 'name price comparePrice images stock sku');

    sendResponse(res, 200, true, 'Item moved to cart', updatedCart);
});

// @desc    Remove saved item
// @route   DELETE /api/cart/saved/:itemId
// @access  Private
const removeSavedItem = asyncHandler(async (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return sendResponse(res, 403, false, 'Admin users cannot modify cart');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || !cart.savedItems) {
        return sendResponse(res, 404, false, 'No saved items found');
    }

    cart.savedItems = cart.savedItems.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
        .populate('items.product', 'name price comparePrice images stock sku')
        .populate('savedItems.product', 'name price comparePrice images stock sku');

    sendResponse(res, 200, true, 'Saved item removed', updatedCart);
});

// @desc    Get all carts (for admin dashboard)
// @route   GET /api/cart/admin/all
// @access  Private/Admin
const getAllCarts = asyncHandler(async (req, res) => {
    const carts = await Cart.find({})
        .populate('user', 'name email phone')
        .populate('items.product', 'name price images sku')
        .populate('savedItems.product', 'name price images sku')
        .sort({ updatedAt: -1 });

    // Calculate totals for each cart if not already done
    const cartsWithTotals = carts.map(cart => {
        const cartObj = cart.toObject();
        if (!cartObj.totalPrice || !cartObj.itemCount) {
            cartObj.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            cartObj.itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
        }
        return cartObj;
    });

    console.log(`Admin fetched ${cartsWithTotals.length} carts`);
    sendResponse(res, 200, true, 'All carts fetched successfully', { carts: cartsWithTotals });
});

// @desc    Clear a specific user's cart (admin only)
// @route   DELETE /api/cart/admin/:userId
// @access  Private/Admin
const clearUserCartByAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId }).populate('user', 'name email');

    if (!cart) {
        return sendResponse(res, 404, false, 'Cart not found for this user');
    }

    // Store cart info before clearing
    const itemCount = cart.items.length;
    const totalValue = cart.totalPrice;

    cart.items = [];
    cart.savedItems = [];
    await cart.save();

    // Create notification in database for customer
    const Notification = require('../Models/notificationModel');
    try {
        await Notification.create({
            customerId: userId,
            type: 'cart_cleared',
            title: 'Cart Cleared by Admin',
            message: `Your shopping cart with ${itemCount} item(s) has been cleared by admin`,
            isCustomerNotification: true,
            metadata: {
                itemCount,
                totalValue,
                clearedBy: req.user?.name || 'Admin',
                clearedAt: new Date()
            }
        });
        console.log(`Notification created for user ${userId} - cart cleared`);
    } catch (err) {
        console.error('Error creating cart cleared notification:', err);
    }

    // Emit socket event to notify user in real-time
    const io = req.app.get('io');
    if (io) {
        io.to(`customer_${userId}`).emit('cart_cleared', {
            message: 'Your cart has been cleared by admin',
            timestamp: new Date()
        });
        console.log(`Socket event cart_cleared emitted to customer_${userId}`);
    }

    sendResponse(res, 200, true, 'User cart cleared successfully', { cart });
});

// @desc    Get cart summary (for admin dashboard)
// @route   GET /api/cart/admin/summary
// @access  Private/Admin
const getCartsSummary = asyncHandler(async (req, res) => {
    const summary = await Cart.aggregate([
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalCarts: { $sum: 1 },
                            totalItems: { $sum: { $size: '$items' } },
                            totalValue: { $sum: '$totalPrice' },
                            avgCartValue: { $avg: '$totalPrice' },
                            cartsWithItems: {
                                $sum: {
                                    $cond: [{ $gt: [{ $size: '$items' }, 0] }, 1, 0]
                                }
                            }
                        }
                    }
                ],
                recentCarts: [
                    { $sort: { updatedAt: -1 } },
                    { $limit: 10 },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'userInfo'
                        }
                    },
                    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            userName: '$userInfo.name',
                            userEmail: '$userInfo.email',
                            itemCount: { $size: '$items' },
                            totalPrice: 1,
                            updatedAt: 1
                        }
                    }
                ],
                abandonedCarts: [
                    {
                        $match: {
                            updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                            'items.0': { $exists: true }
                        }
                    },
                    { $count: 'count' }
                ]
            }
        }
    ]);

    const overall = summary[0].overall[0] || {
        totalCarts: 0,
        totalItems: 0,
        totalValue: 0,
        avgCartValue: 0,
        cartsWithItems: 0
    };

    sendResponse(res, 200, true, 'Cart summary fetched', {
        summary: {
            totalCarts: overall.totalCarts,
            totalItems: overall.totalItems,
            totalValue: overall.totalValue,
            avgCartValue: overall.avgCartValue,
            cartsWithItems: overall.cartsWithItems,
            recentCarts: summary[0].recentCarts,
            abandonedCarts: summary[0].abandonedCarts[0]?.count || 0
        }
    });
});

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    getAllCarts,
    clearUserCartByAdmin,
    getCartsSummary
};
