/**
 * ProductDetails Component
 * Detailed product view with reviews and related products
 * Integrated with backend API
 */

import React, { useState, useEffect } from 'react';
import Button from './common/Button';
import { getProductReviews, getProducts, createReview } from '../services/productService';

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

const ProductDetails = ({ product, onBack, onAddToCart, onRelatedProductClick }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [productData, setProductData] = useState(product);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch full product details on load to ensure images are complete
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (product?._id) {
          const { getProductById } = await import('../services/productService');
          const response = await getProductById(product._id);
          if (response.success && response.data) {
            setProductData(response.data);
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        // Fall back to the product prop if fetch fails
        setProductData(product);
      }
    };
    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  // Check if product is in wishlist on load
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlisted(wishlist.some(item => item._id === productData?._id));
  }, [productData?._id]);

  // Toggle wishlist
  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (isWishlisted) {
      // Remove from wishlist
      const updated = wishlist.filter(item => item._id !== productData._id);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setIsWishlisted(false);
      // Dispatch storage event for Dashboard to pick up
      window.dispatchEvent(new Event('storage'));
    } else {
      // Add to wishlist
      const productToSave = {
        _id: productData._id,
        name: productData.name,
        price: productData.price,
        images: productData.images,
        category: productData.category,
        ratings: productData.ratings,
      };
      wishlist.push(productToSave);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsWishlisted(true);
      // Dispatch storage event for Dashboard to pick up
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Handle image load error
  const handleImageError = (index) => {
    setFailedImages(prev => new Set([...prev, index]));
  };

  // Handle add to cart with loading state
  const handleAddToCart = async () => {
    setAddingToCart(true);
    setAddToCartError(null);
    try {
      const result = await onAddToCart?.(productData, quantity);
      if (result && result.success === false) {
        setAddToCartError(result.message || 'Failed to add item to cart');
      }
    } catch (err) {
      setAddToCartError(err?.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!productData?._id) return;
      setLoadingReviews(true);
      try {
        const response = await getProductReviews(productData._id);
        if (response.success && response.data) {
          setReviews(response.data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [productData?._id]);

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!productData?.category?._id) return;
      setLoadingRelated(true);
      try {
        const response = await getProducts({
          category: productData.category._id,
          limit: 4,
        });
        if (response.success && response.data?.products) {
          // Filter out current product
          const filtered = response.data.products.filter(p => p._id !== productData._id);
          setRelatedProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelatedProducts();
  }, [productData?.category?._id, productData?._id]);

  // Get image URL - Same logic as ProductCatalog
  const getImageUrl = (image) => {
    if (!image) return null;
    
    // Handle case where image is an object with url property
    const imageUrl = image?.url || image;
    
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    
    // Handle /uploads paths - remove /api from API_URL and construct proper backend URL
    if (imageUrl.startsWith('/uploads')) {
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}${imageUrl}`;
    }
    
    // If it already has a protocol (http, https), return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // For other relative paths
    if (imageUrl.startsWith('/')) {
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const response = await createReview({
        product: productData._id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      if (response.success) {
        // Refresh reviews
        const reviewsResponse = await getProductReviews(productData._id);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data);
        }
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', comment: '' });
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-6 py-3 text-primary-600 hover:text-primary-700 font-semibold transition-all duration-200 hover:bg-primary-50 rounded-xl border-2 border-primary-600 hover:border-primary-700 group"
      >
        <svg
          className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Catalog
      </button>

      {/* Product Details Section */}
      <div className="bg-cream rounded-2xl shadow-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Product Images */}
          <div>
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden p-4">
              <div className="relative w-full h-full flex items-center justify-center">
                {productData?.images && productData.images.length > 0 && !failedImages.has(selectedImage) ? (
                  <img
                    src={getImageUrl(productData.images[selectedImage])}
                    alt={productData.name}
                    className="w-auto h-auto max-w-full max-h-full object-contain product-image-3d"
                    onError={() => handleImageError(selectedImage)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No image available</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Premium Floating Shadow */}
              <div className="product-shadow"></div>
              {/* Premium Reflection Effect */}
              <div className="product-reflection"></div>
            </div>
            {/* Image Thumbnails */}
            {productData?.images && productData.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {productData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setFailedImages(prev => {
                        const updated = new Set(prev);
                        updated.delete(index);
                        return updated;
                      });
                    }}
                    className={`w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary-600' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {!failedImages.has(index) ? (
                      <img
                        src={getImageUrl(image)}
                        alt={`${productData.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(index)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {productData?.isFeatured && (
              <div className="flex items-center text-yellow-600 mt-4">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold">Featured Product</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="text-sm text-primary-600 font-medium uppercase">
                {productData?.category?.name || 'Uncategorized'}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{productData?.name}</h1>
              {productData?.brand && (
                <p className="text-sm text-gray-500 mt-1">Brand: {productData.brand}</p>
              )}
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4">
              {renderStars(productData?.ratings?.average || 0)}
              <span className="text-sm text-gray-600">
                {(productData?.ratings?.average || 0).toFixed(1)} ({productData?.ratings?.count || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatPKR(productData?.price)}
              </span>
              {productData?.comparePrice && productData.comparePrice > productData.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPKR(productData.comparePrice)}
                  </span>
                  <span className="bg-green-100 text-green-800 text-sm font-semibold px-2 py-1 rounded">
                    {Math.round((1 - productData.price / productData.comparePrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            {productData?.stock === 0 ? (
              <span className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded">
                Out of Stock
              </span>
            ) : productData?.stock < 10 ? (
              <span className="text-sm text-orange-600 font-semibold">
                Only {productData.stock} left in stock!
              </span>
            ) : null}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase mb-2">
                Description
              </h3>
              <p className="text-gray-600">{productData?.description}</p>
            </div>

            {/* Availability */}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Availability:</span>
              <span
                className={`font-semibold ${
                  productData?.stock > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {productData?.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-2xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <span className="px-6 py-2 border-x border-gray-300 font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(productData?.stock || quantity, quantity + 1))
                  }
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  disabled={productData?.stock === 0 || addingToCart}
                  onClick={handleAddToCart}
                  className="cta-button-3d cta-button-primary flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-cream font-semibold rounded-2xl shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform-gpu"
                >
                  {addingToCart ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                  <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`cta-button-3d cta-wishlist-bounce flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all shadow-md ${
                    isWishlisted 
                      ? 'bg-red-50 border-red-500 text-red-500 shadow-red-200' 
                      : 'bg-cream border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-500 hover:shadow-red-100'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
              {addToCartError && (
                <div className="text-red-600 text-sm font-medium mt-1">{addToCartError}</div>
              )}
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free shipping on orders over Rs. 5,000
              </div>
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                30-day return policy
              </div>
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure payment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-cream rounded-2xl shadow-md overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('description')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'description'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setSelectedTab('reviews')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'reviews'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setSelectedTab('related')}
              className={`px-6 py-4 font-medium transition-colors ${
                selectedTab === 'related'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Related Products
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'description' && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <p className="text-gray-600 mb-4">{productData?.description}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>High-quality materials and construction</li>
                <li>Designed for durability and performance</li>
                <li>Easy to use and maintain</li>
                <li>Comes with manufacturer warranty</li>
              </ul>
            </div>
          )}

          {selectedTab === 'reviews' && (
            <div className="space-y-6">
              {/* Review Form */}
              {showReviewForm ? (
                <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className="p-1"
                          >
                            <svg
                              className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        placeholder="Sum up your review"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        placeholder="Share your experience with this product"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <Button variant="outline" onClick={() => setShowReviewForm(true)}>
                  Write a Review
                </Button>
              )}

              {/* Reviews List */}
              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border-b border-gray-200 pb-6">
                      <div className="flex gap-3 mb-3">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-4 bg-gray-200 rounded w-32" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                          {renderStars(review.rating)}
                          {review.isVerifiedPurchase && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'related' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                You might also like
              </h3>
              {loadingRelated ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-gray-200 rounded-2xl mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : relatedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No related products found.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((related) => (
                    <div
                      key={related._id}
                      onClick={() => onRelatedProductClick?.(related)}
                      className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary-500"
                    >
                      <div className="aspect-square bg-gray-200 rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                        {related.images && related.images.length > 0 ? (
                          <img
                            src={getImageUrl(related.images[0])}
                            alt={related.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg
                            className="w-12 h-12 text-gray-400"
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
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                        {related.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900">
                          {formatPKR(related.price)}
                        </span>
                        <div className="flex items-center text-xs text-gray-600">
                          <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {(related.ratings?.average || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

