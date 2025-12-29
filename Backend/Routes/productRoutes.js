const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
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
} = require('../Controllers/productController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Inventory routes (must be before /:id routes)
router.get('/inventory/summary', getInventorySummary);
router.get('/inventory/low-stock', getLowStockProducts);
router.get('/inventory/out-of-stock', getOutOfStockProducts);

// Bulk operations
router.patch('/bulk', bulkUpdateProducts);

// Main product routes
router.route('/')
    .get(getProducts)
    .post(upload.array('images', 5), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(upload.array('images', 5), updateProduct)
    .delete(deleteProduct);

// Stock management
router.patch('/:id/stock', updateStock);

// Image management
router.delete('/:id/images/:imageIndex', deleteProductImage);

module.exports = router;
