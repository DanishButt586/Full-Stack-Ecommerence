const Product = require('../Models/productModel');
const Category = require('../Models/categoryModel');
const { sendResponse, asyncHandler } = require('../Library/helper');
const fs = require('fs');
const path = require('path');

// @desc    Get all products with advanced filtering
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        category,
        search,
        minPrice,
        maxPrice,
        sort,
        status,
        inStock,
        featured,
        brand
    } = req.query;

    const query = {};

    // Filter by active status (public view) or all (admin)
    if (status === 'all') {
        // Admin view - show all
    } else if (status === 'inactive') {
        query.isActive = false;
    } else {
        query.isActive = true;
    }

    // Filter by category
    if (category && category !== 'all') {
        query.category = category;
    }

    // Search by name or description
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
        ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by stock
    if (inStock === 'true') {
        query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
        query.stock = 0;
    }

    // Filter by featured
    if (featured === 'true') {
        query.isFeatured = true;
    }

    // Filter by brand
    if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
        case 'price_asc':
            sortOption.price = 1;
            break;
        case 'price_desc':
            sortOption.price = -1;
            break;
        case 'name_asc':
            sortOption.name = 1;
            break;
        case 'name_desc':
            sortOption.name = -1;
            break;
        case 'stock_asc':
            sortOption.stock = 1;
            break;
        case 'stock_desc':
            sortOption.stock = -1;
            break;
        case 'rating':
            sortOption['ratings.average'] = -1;
            break;
        case 'oldest':
            sortOption.createdAt = 1;
            break;
        case 'newest':
        default:
            sortOption.createdAt = -1;
    }

    const products = await Product.find(query)
        .populate('category', 'name slug image')
        .sort(sortOption)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    const count = await Product.countDocuments(query);

    // Get inventory stats
    const inventoryStats = await Product.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$stock' },
                lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] } },
                outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
                totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
            }
        }
    ]);

    sendResponse(res, 200, true, 'Products fetched successfully', {
        products,
        pagination: {
            totalPages: Math.ceil(count / Number(limit)),
            currentPage: Number(page),
            totalProducts: count,
            limit: Number(limit)
        },
        inventoryStats: inventoryStats[0] || {
            totalProducts: 0,
            totalStock: 0,
            lowStock: 0,
            outOfStock: 0,
            totalValue: 0
        }
    });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');

    if (product) {
        sendResponse(res, 200, true, 'Product fetched successfully', product);
    } else {
        sendResponse(res, 404, false, 'Product not found');
    }
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, comparePrice, category, brand, stock, sku, specifications, tags, isFeatured, isActive } = req.body;

    // Check if SKU already exists
    if (sku) {
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            return sendResponse(res, 400, false, 'Product with this SKU already exists');
        }
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => ({
            url: `/uploads/products/${file.filename}`,
            alt: name
        }));
    } else if (req.body.images) {
        // Handle base64 or URL images
        images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        images = images.map(img => ({
            url: typeof img === 'string' ? img : img.url,
            alt: name
        }));
    }

    const product = await Product.create({
        name,
        description,
        price,
        comparePrice,
        category,
        brand,
        stock: stock || 0,
        sku,
        images,
        specifications: specifications ? JSON.parse(specifications) : [],
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isActive: isActive !== 'false' && isActive !== false
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    sendResponse(res, 201, true, 'Product created successfully', populatedProduct);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    const { name, description, price, comparePrice, category, brand, stock, sku, specifications, tags, isFeatured, isActive } = req.body;

    // Check if SKU already exists for another product
    if (sku && sku !== product.sku) {
        const existingProduct = await Product.findOne({ sku, _id: { $ne: req.params.id } });
        if (existingProduct) {
            return sendResponse(res, 400, false, 'Product with this SKU already exists');
        }
    }

    // Handle image uploads
    let images = product.images;
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
            url: `/uploads/products/${file.filename}`,
            alt: name || product.name
        }));
        images = [...images, ...newImages];
    } else if (req.body.images) {
        const newImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        images = newImages.map(img => ({
            url: typeof img === 'string' ? img : img.url,
            alt: name || product.name
        }));
    }

    const updateData = {
        name: name || product.name,
        description: description || product.description,
        price: price || product.price,
        comparePrice: comparePrice !== undefined ? comparePrice : product.comparePrice,
        category: category || product.category,
        brand: brand !== undefined ? brand : product.brand,
        stock: stock !== undefined ? Number(stock) : product.stock,
        sku: sku || product.sku,
        images,
        specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : product.specifications,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : product.tags,
        isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured,
        isActive: isActive !== undefined ? (isActive !== 'false' && isActive !== false) : product.isActive
    };

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    }).populate('category', 'name slug');

    sendResponse(res, 200, true, 'Product updated successfully', product);
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    // Delete product images from storage
    if (product.images && product.images.length > 0) {
        product.images.forEach(image => {
            if (image.url && image.url.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, '..', image.url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        });
    }

    await Product.findByIdAndDelete(req.params.id);
    sendResponse(res, 200, true, 'Product deleted successfully');
});

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
const updateStock = asyncHandler(async (req, res) => {
    const { stock, operation } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    let newStock;
    if (operation === 'add') {
        newStock = product.stock + Number(stock);
    } else if (operation === 'subtract') {
        newStock = Math.max(0, product.stock - Number(stock));
    } else {
        newStock = Number(stock);
    }

    product.stock = newStock;
    await product.save();

    sendResponse(res, 200, true, 'Stock updated successfully', {
        productId: product._id,
        name: product.name,
        previousStock: operation === 'add' ? newStock - Number(stock) : operation === 'subtract' ? newStock + Number(stock) : product.stock,
        newStock: newStock
    });
});

// @desc    Bulk update products
// @route   PATCH /api/products/bulk
// @access  Private/Admin
const bulkUpdateProducts = asyncHandler(async (req, res) => {
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return sendResponse(res, 400, false, 'Product IDs are required');
    }

    const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: updateData }
    );

    sendResponse(res, 200, true, `${result.modifiedCount} products updated successfully`);
});

// @desc    Get low stock products
// @route   GET /api/products/inventory/low-stock
// @access  Private/Admin
const getLowStockProducts = asyncHandler(async (req, res) => {
    const threshold = Number(req.query.threshold) || 10;

    const products = await Product.find({
        stock: { $lte: threshold, $gt: 0 },
        isActive: true
    })
        .populate('category', 'name')
        .sort({ stock: 1 });

    sendResponse(res, 200, true, 'Low stock products fetched successfully', {
        products,
        count: products.length,
        threshold
    });
});

// @desc    Get out of stock products
// @route   GET /api/products/inventory/out-of-stock
// @access  Private/Admin
const getOutOfStockProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({
        stock: 0,
        isActive: true
    })
        .populate('category', 'name')
        .sort({ updatedAt: -1 });

    sendResponse(res, 200, true, 'Out of stock products fetched successfully', {
        products,
        count: products.length
    });
});

// @desc    Get inventory summary
// @route   GET /api/products/inventory/summary
// @access  Private/Admin
const getInventorySummary = asyncHandler(async (req, res) => {
    const summary = await Product.aggregate([
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalProducts: { $sum: 1 },
                            activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
                            totalStock: { $sum: '$stock' },
                            totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
                            avgPrice: { $avg: '$price' },
                            lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] } },
                            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
                            featured: { $sum: { $cond: ['$isFeatured', 1, 0] } }
                        }
                    }
                ],
                byCategory: [
                    {
                        $group: {
                            _id: '$category',
                            count: { $sum: 1 },
                            totalStock: { $sum: '$stock' },
                            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
                        }
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'categoryInfo'
                        }
                    },
                    {
                        $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true }
                    },
                    {
                        $project: {
                            categoryName: '$categoryInfo.name',
                            count: 1,
                            totalStock: 1,
                            totalValue: 1
                        }
                    }
                ],
                recentProducts: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 5 },
                    { $project: { name: 1, price: 1, stock: 1, createdAt: 1 } }
                ]
            }
        }
    ]);

    sendResponse(res, 200, true, 'Inventory summary fetched successfully', {
        overall: summary[0].overall[0] || {},
        byCategory: summary[0].byCategory,
        recentProducts: summary[0].recentProducts
    });
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageIndex
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res) => {
    const { id, imageIndex } = req.params;
    const product = await Product.findById(id);

    if (!product) {
        return sendResponse(res, 404, false, 'Product not found');
    }

    if (imageIndex < 0 || imageIndex >= product.images.length) {
        return sendResponse(res, 400, false, 'Invalid image index');
    }

    const imageToDelete = product.images[imageIndex];

    // Delete from file system if it's a local file
    if (imageToDelete.url && imageToDelete.url.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', imageToDelete.url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    product.images.splice(imageIndex, 1);
    await product.save();

    sendResponse(res, 200, true, 'Image deleted successfully', product);
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    bulkUpdateProducts,
    getLowStockProducts,
    getOutOfStockProducts,
    getInventorySummary,
    deleteProductImage
};
