const Category = require('../Models/categoryModel');
const { sendResponse, asyncHandler } = require('../Library/helper');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true }).populate('parent', 'name slug');
    sendResponse(res, 200, true, 'Categories fetched successfully', categories);
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');

    if (category) {
        sendResponse(res, 200, true, 'Category fetched successfully', category);
    } else {
        sendResponse(res, 404, false, 'Category not found');
    }
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    sendResponse(res, 201, true, 'Category created successfully', category);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (category) {
        sendResponse(res, 200, true, 'Category updated successfully', category);
    } else {
        sendResponse(res, 404, false, 'Category not found');
    }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (category) {
        sendResponse(res, 200, true, 'Category deleted successfully');
    } else {
        sendResponse(res, 404, false, 'Category not found');
    }
});

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
