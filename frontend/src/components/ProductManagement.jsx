/**
 * ProductManagement Component
 * Complete CRUD operations for products with categories, images, and inventory
 */
import React, { useState, useEffect, useCallback } from 'react';
import Input from './common/Input';
import Toast from './common/Toast';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory 
} from '../services/productService';

const ProductManagement = ({ onBack, darkMode }) => {
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({ 
    currentPage: 1, 
    totalPages: 1, 
    total: 0, 
    limit: 10 
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    sku: '',
    brand: '',
    isActive: true,
    isFeatured: false,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 10,
        status: filterStatus === 'all' ? 'all' : (filterStatus === 'active' ? undefined : 'inactive'),
      };

      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await getProducts(params);
      if (response.success) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filterCategory, filterStatus, searchQuery]);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      console.log('Categories response:', response);
      
      if (response.success) {
        const cats = response.data?.categories || response.data || [];
        console.log('Setting categories:', cats);
        setCategories(cats);
      } else if (Array.isArray(response)) {
        // Handle if response is directly an array
        console.log('Direct array response:', response);
        setCategories(response);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku,
        brand: formData.brand,
        category: formData.category,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      // Handle image if exists
      if (formData.image) {
        productData.images = [formData.image];
      } else if (imagePreview) {
        productData.images = [imagePreview];
      }

      const response = await createProduct(productData);
      if (response.success) {
        showToast('Product added successfully! Your new product is now live.', 'success');
        resetForm();
        setView('list');
        fetchProducts(); // Refresh the list
      } else {
        showToast(response.message || 'Failed to add product', 'error');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Failed to add product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku,
        brand: formData.brand,
        category: formData.category,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      // Handle image if exists
      if (formData.image) {
        productData.images = [formData.image];
      } else if (imagePreview && imagePreview !== selectedProduct.images?.[0]?.url) {
        productData.images = [imagePreview];
      }

      const response = await updateProduct(selectedProduct._id, productData);
      if (response.success) {
        showToast('Product updated successfully! Changes have been saved.', 'success');
        resetForm();
        setView('list');
        fetchProducts(); // Refresh the list
      } else {
        showToast(response.message || 'Failed to update product', 'error');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Failed to update product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await deleteProduct(id);
        if (response.success) {
          showToast('Product deleted successfully!', 'success');
          fetchProducts(); // Refresh the list
        } else {
          showToast(response.message || 'Failed to delete product', 'error');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Bulk delete selected products
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      showToast('Please select products to delete', 'warning');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`)) {
      try {
        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const productId of selectedProducts) {
          try {
            const response = await deleteProduct(productId);
            if (response.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        if (successCount > 0) {
          showToast(`Successfully deleted ${successCount} product(s)`, 'success');
        }
        if (failCount > 0) {
          showToast(`Failed to delete ${failCount} product(s)`, 'error');
        }

        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting products:', error);
        showToast('Failed to delete products. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  // Bulk edit - only allows editing one product at a time
  const handleBulkEdit = () => {
    if (selectedProducts.length === 1) {
      const product = products.find(p => p._id === selectedProducts[0]);
      if (product) {
        handleEditProduct(product);
      }
    }
  };

  // Edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category?._id || product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      sku: product.sku,
      brand: product.brand || '',
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      image: null,
    });
    setImagePreview(product.images?.[0]?.url || null);
    setView('edit');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      sku: '',
      brand: '',
      isActive: true,
      isFeatured: false,
      image: null,
    });
    setImagePreview(null);
    setSelectedProduct(null);
  };

  // Add new category
  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        const response = await createCategory({ 
          name: newCategory.trim(),
          slug: newCategory.trim().toLowerCase().replace(/\s+/g, '-')
        });
        if (response.success) {
          alert('Category added successfully!');
          setNewCategory('');
          setShowCategoryModal(false);
          fetchCategories();
        } else {
          alert(response.message || 'Failed to add category');
        }
      } catch (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category');
      }
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await deleteCategory(categoryId);
        if (response.success) {
          showToast('Category deleted successfully!', 'success');
          fetchCategories();
        } else {
          showToast(response.message || 'Failed to delete category', 'error');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Failed to delete category. Please try again.', 'error');
      }
    }
  };

  // Product List View
  if (view === 'list') {
    return (
      <>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            darkMode={darkMode}
          />
        )}
        <div className="space-y-6 pl-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Product Management</h2>
            <p className="text-sm text-indigo-600 mt-1 font-medium">
              Manage your product inventory and categories
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{ backgroundColor: '#492273' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
            >
              Categories
            </button>
            <button
              onClick={() => setView('add')}
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{ backgroundColor: '#492273' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
            >
              Add
            </button>
            <button
              onClick={handleBulkEdit}
              disabled={selectedProducts.length !== 1 || loading}
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{ backgroundColor: '#492273' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
            >
              Edit
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedProducts.length === 0 || loading}
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{ backgroundColor: '#b31e28' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b1720'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b31e28'}
            >
              Delete{selectedProducts.length > 0 && ` (${selectedProducts.length})`}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-cream rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="Search Products"
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={(props) => (
                  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-cream rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                      style={{ accentColor: '#492273' }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-cream divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading products...</p>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg
                          className="w-12 h-12 mx-auto mb-4 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-sm">No products found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {searchQuery ? 'Try a different search' : 'Add your first product to get started'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-all duration-300 product-row-3d">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          className="h-4 w-4 rounded border-gray-300"
                          style={{ accentColor: '#492273' }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 product-image-container-3d">
                            {product.images && product.images.length > 0 && product.images[0].url ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover product-image-3d shadow-md"
                                src={product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`}
                                alt={product.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{product.category?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          PKR {product.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            product.stock < 10 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-white font-medium px-4 py-1.5 rounded-lg transition-all duration-200 mr-3"
                          style={{ backgroundColor: '#492273' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-white font-medium px-4 py-1.5 rounded-lg transition-all duration-200"
                          style={{ backgroundColor: '#b31e28' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b1720'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b31e28'}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && products.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> products
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed modern-button transition-all duration-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed modern-button transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-cream rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Manage Categories
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#492273' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a2d87')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#492273')}
                  >
                    Add
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No categories yet. Add your first category above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <div
                          key={cat._id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-700">{cat.name}</span>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="transition-all duration-200"
                            style={{ color: '#b31e28' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#8b1720'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#b31e28'}
                            disabled={loading}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
                  style={{ backgroundColor: '#6b7280' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  // Add/Edit Product Form View
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          darkMode={darkMode}
        />
      )}
      <div className="space-y-6 pl-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {view === 'add' ? 'Add New Product' : 'Edit Product'}
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {view === 'add'
              ? 'Fill in the details to add a new product'
              : 'Update product information'}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setView('list');
          }}
          className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
          style={{ backgroundColor: '#6b7280' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={view === 'add' ? handleAddProduct : handleUpdateProduct}>
        <div className="bg-cream rounded-lg shadow-md p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
              {/* Preview Box */}
              <div className="h-40 w-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
                {imagePreview ? (
                  <div className="relative h-full w-full group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-cream p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="inline-flex items-center px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Upload from Computer
                    </div>
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    📁 Click "Upload from Computer" to select an image
                  </p>
                  <p className="text-xs text-gray-500">
                    ✓ Supported formats: PNG, JPG, JPEG, GIF
                  </p>
                  <p className="text-xs text-gray-500">
                    ✓ Maximum file size: 5MB
                  </p>
                  <p className="text-xs text-gray-500">
                    ✓ Recommended dimensions: 800x800px
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
            />

            <Input
              label="SKU"
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="e.g., PROD-001"
              required
            />

            <Input
              label="Brand"
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="Enter brand name"
              required
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter product description"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />

            <Input
              label="Stock Quantity"
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              required
            />

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: '#492273' }}
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Active Status
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: '#492273' }}
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Featured Product
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView('list');
              }}
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{ backgroundColor: '#6b7280' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{ backgroundColor: '#492273' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
            >
              {view === 'add' ? 'Add Product' : 'Update Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
    </>
  );
};

export default ProductManagement;
