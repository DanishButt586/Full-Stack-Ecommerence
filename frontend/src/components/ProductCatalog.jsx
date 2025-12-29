/**
 * ProductCatalog Component
 * Browse products with advanced search, filters, and sorting
 * Integrated with backend API
 */

import React, { useState, useEffect, useCallback } from 'react';
import Input from './common/Input';
import Button from './common/Button';
import { getProducts, getCategories } from '../services/productService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Format price in PKR
const formatPKR = (price) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const ProductCatalog = ({ onProductClick, initialState = {}, onStateChange, darkMode }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination - initialize from saved state
  const [pagination, setPagination] = useState({
    currentPage: initialState.currentPage || 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12,
  });

  // Filters - initialize from saved state
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(initialState.selectedCategory || 'all');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState(initialState.sortBy || 'popularity');
  const [viewMode, setViewMode] = useState('grid');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(initialState.searchQuery || '');
  
  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentPage: pagination.currentPage,
        searchQuery,
        selectedCategory,
        sortBy,
      });
    }
  }, [pagination.currentPage, searchQuery, selectedCategory, sortBy, onStateChange]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategoriesData();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      // Add filters
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (priceRange[0] > 0) {
        params.minPrice = priceRange[0];
      }
      if (priceRange[1] < 50000) {
        params.maxPrice = priceRange[1];
      }
      if (inStockOnly) {
        params.inStock = 'true';
      }

      // Add sorting
      switch (sortBy) {
        case 'price-low':
          params.sort = 'price_asc';
          break;
        case 'price-high':
          params.sort = 'price_desc';
          break;
        case 'rating':
          params.sort = 'rating';
          break;
        case 'newest':
          params.sort = 'newest';
          break;
        case 'name-asc':
          params.sort = 'name_asc';
          break;
        case 'name-desc':
          params.sort = 'name_desc';
          break;
        default:
          params.sort = 'newest';
      }

      const response = await getProducts(params);
      
      if (response.success && response.data) {
        // Filter by rating on client side (if not supported by API)
        let filteredProducts = response.data.products || [];
        if (minRating > 0) {
          filteredProducts = filteredProducts.filter(
            (p) => (p.ratings?.average || 0) >= minRating
          );
        }
        setProducts(filteredProducts);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 1,
          totalProducts: response.data.pagination?.totalProducts || filteredProducts.length,
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.limit,
    selectedCategory,
    debouncedSearch,
    priceRange,
    minRating,
    sortBy,
    inStockOnly,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [selectedCategory, debouncedSearch, priceRange, minRating, sortBy, inStockOnly]);

  // Get image URL
  const getImageUrl = (product) => {
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0].url;
      if (imageUrl.startsWith('/uploads')) {
        // Remove /api from API_URL and construct proper backend URL
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${imageUrl}`;
      }
      return imageUrl;
    }
    return null;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 50000]);
    setMinRating(0);
    setSortBy('popularity');
    setInStockOnly(false);
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="relative rounded-3xl overflow-hidden perspective-container" style={{ minHeight: '200px' }}>
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 animate-gradient-shift"></div>
        
        {/* 3D Floating Spheres - Shopping themed */}
        <div className="absolute top-8 right-12 w-20 h-20 bg-gradient-to-br from-primary-300/20 to-primary-500/30 rounded-full backdrop-blur-sm border border-cream/20 animate-float-sphere shadow-2xl"></div>
        <div className="absolute top-24 right-32 w-14 h-14 bg-gradient-to-br from-cream/15 to-primary-400/25 rounded-full backdrop-blur-md border border-cream/20 animate-float-sphere shadow-2xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-16 right-24 w-16 h-16 bg-gradient-to-br from-primary-400/20 to-pink-500/20 rounded-full backdrop-blur-sm border border-cream/15 animate-float-sphere shadow-2xl" style={{ animationDelay: '4s' }}></div>

        {/* Soft Neon Rings */}
        <div className="absolute top-12 left-16 w-28 h-28 rounded-full border-4 border-cream/30 animate-neon-ring" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full border-3 border-primary-300/40 animate-neon-ring" style={{ animationDelay: '1.5s' }}></div>

        {/* Gradient Triangles */}
        <div className="absolute top-10 left-1/3 w-0 h-0 border-l-[28px] border-r-[28px] border-b-[45px] border-l-transparent border-r-transparent border-b-primary-400/20 animate-triangle-float backdrop-blur-sm"></div>
        <div className="absolute bottom-12 right-1/3 w-0 h-0 border-l-[22px] border-r-[22px] border-b-[35px] border-l-transparent border-r-transparent border-b-cream/15 animate-triangle-float" style={{ animationDelay: '2s' }}></div>

        {/* Shopping-themed Floating Icons (SVG squiggles) */}
        <svg className="absolute top-1/4 left-1/4 w-16 h-16 opacity-30 animate-squiggle" viewBox="0 0 100 100">
          <path d="M10,50 Q30,20 50,50 T90,50" stroke="rgba(255, 246, 233, 0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
        <svg className="absolute bottom-1/3 right-1/4 w-14 h-14 opacity-25 animate-squiggle" viewBox="0 0 100 100" style={{ animationDelay: '3s' }}>
          <path d="M10,50 Q30,80 50,50 T90,50" stroke="rgba(189, 168, 183, 0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>

        {/* Glow Dots */}
        <div className="absolute top-6 left-8 w-3 h-3 bg-cream/60 rounded-full animate-glow-pulse shadow-lg"></div>
        <div className="absolute top-16 right-40 w-2 h-2 bg-primary-300/70 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-14 left-1/3 w-2.5 h-2.5 bg-cream/50 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-28 right-16 w-2 h-2 bg-primary-200/60 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1.5s' }}></div>

        {/* Animated Waves */}
        <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="rgba(255, 246, 233, 0.1)">
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,40 Q360,20 720,40 T1440,40 L1440,120 L0,120 Z;
                M0,60 Q360,80 720,60 T1440,60 L1440,120 L0,120 Z;
                M0,40 Q360,20 720,40 T1440,40 L1440,120 L0,120 Z
              "
            />
          </path>
        </svg>

        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(189, 168, 183, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255, 246, 233, 0.15) 0%, transparent 50%)`
        }}></div>

        {/* Glow Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cream/50 to-transparent animate-shimmer"></div>

        {/* Content */}
        <div className="relative backdrop-blur-sm bg-cream/5 border border-cream/10 rounded-3xl shadow-2xl p-6 sm:p-8 m-4">
          <div className="relative z-10 flex items-center gap-4">
            {/* Shopping Icon Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cream/10 backdrop-blur-md rounded-2xl border border-cream/20 animate-fade-in">
              <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-cream mb-1 drop-shadow-lg animate-slide-in-left">
                Product Catalog
              </h1>
              <p className="text-cream/80 text-sm sm:text-base drop-shadow-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Discover amazing products with advanced search and filters
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-cream/10 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-cream/10 rounded-br-3xl"></div>
      </div>

      {/* Search Bar */}
      <div className={`rounded-2xl shadow-md p-6 ${
        darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
      }`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search products by name or description..."
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
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-2xl border-2 transition-colors ${
                viewMode === 'grid'
                  ? 'border-primary-600 bg-primary-50 text-primary-600'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-2xl border-2 transition-colors ${
                viewMode === 'list'
                  ? 'border-primary-600 bg-primary-50 text-primary-600'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className={`rounded-2xl shadow-md p-6 space-y-6 sticky top-6 ${
            darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-primary-50 border border-primary-100'
          }`}>
            <h3 className={`text-lg font-semibold ${
              darkMode ? 'text-primary-100' : 'text-gray-900'
            }`}>Filters</h3>

            {/* Categories */}
            <div>
              <h4 className={`text-sm font-medium mb-3 ${
                darkMode ? 'text-primary-200' : 'text-gray-700'
              }`}>Category</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-2xl transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : darkMode ? 'text-primary-100 hover:bg-dark-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category._id)}
                    className={`w-full text-left px-3 py-2 rounded-2xl transition-colors ${
                      selectedCategory === category._id
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : darkMode ? 'text-primary-100 hover:bg-dark-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className={`text-sm font-medium mb-3 ${
                darkMode ? 'text-primary-200' : 'text-gray-700'
              }`}>Price Range</h4>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className={`flex justify-between text-sm ${
                  darkMode ? 'text-primary-100' : 'text-gray-600'
                }`}>
                  <span>{formatPKR(priceRange[0])}</span>
                  <span>{formatPKR(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <h4 className={`text-sm font-medium mb-3 ${
                darkMode ? 'text-primary-200' : 'text-gray-700'
              }`}>Minimum Rating</h4>
              <div className="space-y-2">
                {[4, 3, 2, 1, 0].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`w-full text-left px-3 py-2 rounded-2xl transition-colors flex items-center ${
                      minRating === rating
                        ? 'bg-primary-100 text-primary-700'
                        : darkMode ? 'text-primary-100 hover:bg-dark-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {renderStars(rating)}
                    {rating > 0 && <span className="ml-2 text-xs">& up</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            <Button
              variant="outline"
              fullWidth
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sort and Results Count */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl shadow-md p-4 ${
            darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-primary-100' : 'text-gray-600'
            }`}>
              {loading ? 'Loading...' : (
                <>
                  Showing <span className="font-semibold">{products.length}</span> of{' '}
                  <span className="font-semibold">{pagination.totalProducts}</span>{' '}
                  {pagination.totalProducts === 1 ? 'product' : 'products'}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <label className={`text-sm ${darkMode ? 'text-primary-100' : 'text-gray-600'}`}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${darkMode ? 'bg-dark-700 border-dark-600 text-primary-100' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`rounded-2xl shadow-md overflow-hidden animate-pulse ${
                  darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
                }`}>
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/4" />
                      <div className="h-8 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" onClick={fetchProducts} className="mt-4">
                Try Again
              </Button>
            </div>
          )}

          {/* No Products */}
          {!loading && !error && products.length === 0 && (
            <div className={`rounded-2xl shadow-md p-12 text-center ${
              darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
            }`}>
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
              <p className={darkMode ? 'text-primary-100' : 'text-gray-600'}>No products found matching your criteria</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-primary-200/60' : 'text-gray-500'}`}>Try adjusting your filters</p>
              <Button variant="outline" onClick={resetFilters} className="mt-4">
                Reset Filters
              </Button>
            </div>
          )}

          {/* Products Display */}
          {!loading && !error && products.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className={`product-card-3d rounded-2xl shadow-depth-md overflow-hidden cursor-pointer group transform-gpu ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
                  }`}
                  onClick={() => onProductClick?.(product)}
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-200 overflow-visible product-shimmer">
                    <div className="relative w-full h-full overflow-hidden rounded-t-2xl">
                      {getImageUrl(product) ? (
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover product-image-3d"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-20 h-20 text-gray-400 product-image-3d"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded badge-3d-bounce z-10">
                          Featured
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-cream text-xs font-bold px-2 py-1 rounded z-10">
                          Out of Stock
                        </span>
                      )}
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-cream text-xs font-bold px-2 py-1 rounded z-10">
                          Low Stock
                        </span>
                      )}
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="absolute bottom-2 left-2 bg-green-500 text-cream text-xs font-bold px-2 py-1 rounded badge-3d-bounce z-10" style={{ animationDelay: '0.5s' }}>
                          {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    {/* Floating Shadow */}
                    <div className="product-shadow"></div>
                    {/* Premium Reflection Effect */}
                    <div className="product-reflection"></div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <span className="text-xs text-primary-600 font-medium">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                    <h3 className={`text-lg font-semibold mt-1 group-hover:text-primary-600 transition-colors line-clamp-1 ${
                      darkMode ? 'text-primary-100' : 'text-gray-900'
                    }`}>
                      {product.name}
                    </h3>
                    <p className={`text-sm mt-2 line-clamp-2 ${
                      darkMode ? 'text-primary-200/80' : 'text-gray-600'
                    }`}>
                      {product.description}
                    </p>

                    {/* Rating */}
                    <div className="mt-3 flex items-center justify-between">
                      {renderStars(product.ratings?.average || 0)}
                      <span className={`text-xs ${
                        darkMode ? 'text-primary-200/60' : 'text-gray-500'
                      }`}>{product.ratings?.count || 0} reviews</span>
                    </div>

                    {/* Price and Action */}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className={'text-xl font-bold price-highlight-3d ' + (darkMode ? 'text-primary-100' : 'text-gray-900')}>
                          {formatPKR(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className={'ml-2 text-sm line-through ' + (darkMode ? 'text-primary-200/60' : 'text-gray-500')}>
                            {formatPKR(product.comparePrice)}
                          </span>
                        )}
                      </div>
                      <button 
                        className="button-3d-interactive button-glow-inner px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-cream rounded-2xl font-semibold text-sm shadow-depth-md hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Sold Out' : 'View'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {!loading && !error && products.length > 0 && viewMode === 'list' && (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className={`product-card-3d rounded-2xl shadow-depth-md overflow-hidden cursor-pointer transform-gpu ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
                  }`}
                  onClick={() => onProductClick?.(product)}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Product Image */}
                    <div className="relative w-full sm:w-48 h-48 bg-gray-200 flex-shrink-0 overflow-visible product-shimmer">
                      <div className="relative w-full h-full overflow-hidden rounded-l-2xl sm:rounded-l-2xl rounded-t-2xl sm:rounded-t-none">
                        {getImageUrl(product) ? (
                          <img
                            src={getImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover product-image-3d"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-20 h-20 text-gray-400 product-image-3d"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        )}
                        {product.isFeatured && (
                          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded badge-3d-bounce z-10">
                            Featured
                          </span>
                        )}
                      </div>
                      {/* Floating Shadow */}
                      <div className="product-shadow"></div>
                      {/* Premium Reflection Effect */}
                      <div className="product-reflection"></div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                          <span className="text-xs text-primary-600 font-medium">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                          <h3 className={`text-xl font-semibold mt-1 ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}>
                            {product.name}
                          </h3>
                          <p className={`text-sm mt-2 line-clamp-2 ${
                            darkMode ? 'text-primary-200/80' : 'text-gray-600'
                          }`}>{product.description}</p>

                          {/* Rating */}
                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            {renderStars(product.ratings?.average || 0)}
                            <span className={`text-sm ${
                              darkMode ? 'text-primary-200/60' : 'text-gray-500'
                            }`}>
                              {product.ratings?.count || 0} reviews
                            </span>
                            {product.stock === 0 && (
                              <span className="text-xs text-red-600 font-semibold">
                                Out of Stock
                              </span>
                            )}
                            {product.stock > 0 && product.stock < 10 && (
                              <span className="text-xs text-orange-600 font-semibold">
                                Only {product.stock} left!
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price and Action */}
                        <div className="lg:text-right">
                          <div className="flex items-baseline gap-2 lg:justify-end">
                            <span className={`text-2xl font-bold price-highlight-3d ${
                              darkMode ? 'text-primary-100' : 'text-gray-900'
                            }`}>
                              {formatPKR(product.price)}
                            </span>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <span className={'text-sm line-through ' + (darkMode ? 'text-primary-200/60' : 'text-gray-500')}>
                                {formatPKR(product.comparePrice)}
                              </span>
                            )}
                          </div>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-sm text-green-600 font-medium">
                              Save {Math.round((1 - product.price / product.comparePrice) * 100)}%
                            </span>
                          )}
                          <button 
                            className="button-3d-interactive button-glow-inner mt-3 w-full px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-cream rounded-2xl font-semibold text-sm shadow-depth-md hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                            disabled={product.stock === 0}
                          >
                            {product.stock === 0 ? 'Sold Out' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                      className={`w-10 h-10 rounded-2xl font-medium transition-colors ${
                        pagination.currentPage === pageNum
                          ? 'bg-primary-600 text-cream'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.totalPages, prev.currentPage + 1) }))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;

