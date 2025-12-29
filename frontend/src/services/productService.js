const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const fetchApi = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const defaultHeaders = {};

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
};

// ==================== PRODUCT ENDPOINTS ====================

// Get all products with filters
export const getProducts = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return fetchApi(endpoint);
};

// Get single product
export const getProductById = async (id) => {
    return fetchApi(`/products/${id}`);
};

// Create product
export const createProduct = async (productData) => {
    const formData = new FormData();

    // Append text fields
    Object.keys(productData).forEach(key => {
        if (key === 'images' && productData.images) {
            // Handle file uploads
            if (Array.isArray(productData.images)) {
                productData.images.forEach(image => {
                    if (image instanceof File) {
                        formData.append('images', image);
                    }
                });
            }
        } else if (key === 'specifications' && productData.specifications) {
            formData.append('specifications', JSON.stringify(productData.specifications));
        } else if (key === 'tags' && Array.isArray(productData.tags)) {
            formData.append('tags', productData.tags.join(','));
        } else if (productData[key] !== undefined && productData[key] !== null) {
            formData.append(key, productData[key]);
        }
    });

    return fetchApi('/products', {
        method: 'POST',
        body: formData,
    });
};

// Update product
export const updateProduct = async (id, productData) => {
    const formData = new FormData();

    // Append text fields
    Object.keys(productData).forEach(key => {
        if (key === 'images' && productData.images) {
            // Handle file uploads
            if (Array.isArray(productData.images)) {
                productData.images.forEach(image => {
                    if (image instanceof File) {
                        formData.append('images', image);
                    }
                });
            }
        } else if (key === 'specifications' && productData.specifications) {
            formData.append('specifications', JSON.stringify(productData.specifications));
        } else if (key === 'tags' && Array.isArray(productData.tags)) {
            formData.append('tags', productData.tags.join(','));
        } else if (productData[key] !== undefined && productData[key] !== null) {
            formData.append(key, productData[key]);
        }
    });

    return fetchApi(`/products/${id}`, {
        method: 'PUT',
        body: formData,
    });
};

// Delete product
export const deleteProduct = async (id) => {
    return fetchApi(`/products/${id}`, {
        method: 'DELETE',
    });
};

// Update stock
export const updateStock = async (id, stock, operation = 'set') => {
    return fetchApi(`/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock, operation }),
    });
};

// Bulk update products
export const bulkUpdateProducts = async (productIds, updateData) => {
    return fetchApi('/products/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ productIds, updateData }),
    });
};

// Delete product image
export const deleteProductImage = async (productId, imageIndex) => {
    return fetchApi(`/products/${productId}/images/${imageIndex}`, {
        method: 'DELETE',
    });
};

// ==================== INVENTORY ENDPOINTS ====================

// Get inventory summary
export const getInventorySummary = async () => {
    return fetchApi('/products/inventory/summary');
};

// Get low stock products
export const getLowStockProducts = async (threshold = 10) => {
    return fetchApi(`/products/inventory/low-stock?threshold=${threshold}`);
};

// Get out of stock products
export const getOutOfStockProducts = async () => {
    return fetchApi('/products/inventory/out-of-stock');
};

// ==================== CATEGORY ENDPOINTS ====================

// Get all categories
export const getCategories = async () => {
    return fetchApi('/categories');
};

// Get single category
export const getCategoryById = async (id) => {
    return fetchApi(`/categories/${id}`);
};

// Create category
export const createCategory = async (categoryData) => {
    return fetchApi('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
    });
};

// Update category
export const updateCategory = async (id, categoryData) => {
    return fetchApi(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
    });
};

// Delete category
export const deleteCategory = async (id) => {
    return fetchApi(`/categories/${id}`, {
        method: 'DELETE',
    });
};

// ==================== REVIEW ENDPOINTS ====================

// Get product reviews
export const getProductReviews = async (productId) => {
    return fetchApi(`/reviews/${productId}`);
};

// Create review
export const createReview = async (reviewData) => {
    return fetchApi('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
    });
};

// Update review
export const updateReview = async (id, reviewData) => {
    return fetchApi(`/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
    });
};

// Delete review
export const deleteReview = async (id) => {
    return fetchApi(`/reviews/${id}`, {
        method: 'DELETE',
    });
};

// ==================== RELATED PRODUCTS ====================

// Get related products (same category)
export const getRelatedProducts = async (productId, category, limit = 4) => {
    const params = new URLSearchParams({
        category,
        limit: limit.toString(),
        status: 'all'
    }).toString();
    const response = await fetchApi(`/products?${params}`);
    // Filter out the current product
    if (response.data && response.data.products) {
        response.data.products = response.data.products.filter(p => p._id !== productId);
    }
    return response;
};

// Get featured products
export const getFeaturedProducts = async (limit = 8) => {
    const params = new URLSearchParams({
        featured: 'true',
        limit: limit.toString()
    }).toString();
    return fetchApi(`/products?${params}`);
};

const productService = {
    // Products
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    bulkUpdateProducts,
    deleteProductImage,
    // Inventory
    getInventorySummary,
    getLowStockProducts,
    getOutOfStockProducts,
    // Categories
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    // Reviews
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    // Related & Featured
    getRelatedProducts,
    getFeaturedProducts,
};

export default productService;
