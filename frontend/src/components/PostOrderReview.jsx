/**
 * PostOrderReview Component
 * Allows customers to review products after order delivery
 */

import React, { useState, useMemo } from 'react';
import Button from './common/Button';
import { createReview } from '../services/reviewService';

const PostOrderReview = ({ order, darkMode = false, userReviews = [], onClose, onReviewSubmitted }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reviews, setReviews] = useState({});
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [submittedReview, setSubmittedReview] = useState(null);

    // Get list of already reviewed product IDs
    const reviewedProductIds = useMemo(() => {
        return new Set(userReviews.map(review => review.product?._id || review.product));
    }, [userReviews]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRatingChange = (productId, rating) => {
        setReviews(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                rating,
            },
        }));
    };

    const handleInputChange = (productId, field, value) => {
        setReviews(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value,
            },
        }));
    };

    const handleSubmitReview = async (productId) => {
        const review = reviews[productId];
        if (!review || !review.rating) {
            showNotification('Please select a rating', 'error');
            return;
        }

        try {
            setLoading(true);
            const reviewData = {
                rating: review.rating,
                comment: review.comment || '',
            };

            // Pass productId and orderId to createReview
            await createReview(productId, reviewData, order._id);
            
            // Get product details for submitted review display
            const item = order.items.find(i => (i.product?._id || i.product) === productId);
            const productName = item.product?.name || item.name;
            const productImage = item.product?.image || item.image;
            
            // Show complete submitted review
            setSubmittedReview({
                productName,
                productImage,
                rating: review.rating,
                comment: review.comment || '',
                submittedAt: new Date().toLocaleString()
            });
            
            // Remove the reviewed product from the list
            setReviews(prev => {
                const updated = { ...prev };
                delete updated[productId];
                return updated;
            });

            if (onReviewSubmitted) {
                onReviewSubmitted();
            }
        } catch (err) {
            showNotification(err.message || 'Failed to submit review', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating, onRate) => {
        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onRate(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                            rating >= star 
                                ? 'text-yellow-400' 
                                : (darkMode ? 'text-dark-600' : 'text-gray-300')
                        }`}
                        type="button"
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Submitted Review Success Modal */}
            {submittedReview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className={`rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${
                        darkMode ? 'bg-dark-800' : 'bg-white'
                    }`}>
                        {/* Success Header */}
                        <div className={`p-6 text-center border-b ${
                            darkMode ? 'bg-green-900/30 border-dark-700' : 'bg-green-50 border-green-200'
                        }`}>
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${
                                darkMode ? 'text-green-400' : 'text-green-700'
                            }`}>
                                Review Submitted Successfully!
                            </h3>
                            <p className={`text-sm ${
                                darkMode ? 'text-primary-200/70' : 'text-gray-600'
                            }`}>
                                Your feedback has been received and will appear after admin approval
                            </p>
                        </div>

                        {/* Review Details */}
                        <div className="p-6 space-y-4">
                            {/* Product Info */}
                            <div className="flex gap-4 items-center">
                                <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                                    darkMode ? 'bg-dark-700' : 'bg-gray-100'
                                }`}>
                                    <img
                                        src={submittedReview.productImage || '/placeholder.jpg'}
                                        alt={submittedReview.productName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-semibold ${
                                        darkMode ? 'text-primary-100' : 'text-gray-900'
                                    }`}>{submittedReview.productName}</h4>
                                    <p className={`text-xs ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>{submittedReview.submittedAt}</p>
                                </div>
                            </div>

                            <div className={`border-t pt-4 ${
                                darkMode ? 'border-dark-700' : 'border-gray-200'
                            }`}>
                                {/* Rating Display */}
                                <div className="mb-3">
                                    <p className={`text-sm font-medium mb-1 ${
                                        darkMode ? 'text-primary-200' : 'text-gray-700'
                                    }`}>Your Rating</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`text-xl ${
                                                    submittedReview.rating >= star ? 'text-yellow-400' : 'text-gray-300'
                                                }`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                        <span className={`ml-2 text-sm ${
                                            darkMode ? 'text-primary-200' : 'text-gray-600'
                                        }`}>({submittedReview.rating}/5)</span>
                                    </div>
                                </div>

                                {/* Comment Display */}
                                {submittedReview.comment && (
                                    <div>
                                        <p className={`text-sm font-medium mb-1 ${
                                            darkMode ? 'text-primary-200' : 'text-gray-700'
                                        }`}>Your Review</p>
                                        <p className={`text-sm p-3 rounded-lg ${
                                            darkMode ? 'bg-dark-700/50 text-primary-100' : 'bg-gray-50 text-gray-700'
                                        }`}>
                                            {submittedReview.comment}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className={`p-3 rounded-lg flex items-start gap-2 ${
                                darkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'
                            }`}>
                                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <p className={`text-xs ${
                                    darkMode ? 'text-blue-300' : 'text-blue-700'
                                }`}>
                                    Your review is pending approval. You'll be notified once it's approved and visible to other customers.
                                </p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className={`p-6 border-t ${
                            darkMode ? 'border-dark-700' : 'border-gray-200'
                        }`}>
                            <button
                                onClick={() => setSubmittedReview(null)}
                                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold"
                            >
                                Continue Reviewing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Review Form */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                    darkMode ? 'bg-dark-800' : 'bg-cream'
                }`}>
                {/* Header */}
                <div className={`sticky top-0 p-6 border-b flex items-center justify-between ${
                    darkMode ? 'bg-dark-800 border-dark-700' : 'bg-cream border-gray-100'
                }`}>
                    <h2 className={`text-2xl font-bold ${
                        darkMode ? 'text-primary-100' : 'text-gray-900'
                    }`}>
                        Share Your Feedback
                    </h2>
                    <button
                        onClick={onClose}
                        className={`text-3xl ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        ×
                    </button>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`m-4 p-4 rounded-lg ${
                        notification.type === 'error' 
                            ? (darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800')
                            : (darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800')
                    }`}>
                        {notification.message}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-6">
                    {order?.items?.filter(item => {
                        const productId = item.product?._id || item.product;
                        return !reviewedProductIds.has(productId);
                    }).length === 0 ? (
                        <div className="text-center py-8">
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {order?.items?.length > 0 
                                    ? 'All products have been reviewed'
                                    : 'No products to review'
                                }
                            </p>
                        </div>
                    ) : (
                        order?.items?.filter(item => {
                            const productId = item.product?._id || item.product;
                            return !reviewedProductIds.has(productId);
                        }).map((item) => {
                            // Handle both populated and non-populated product references
                            const productId = item.product?._id || item.product;
                            const productName = item.product?.name || item.name;
                            const productImage = item.product?.image || item.image;
                            const review = reviews[productId];
                            const isExpanded = selectedProduct === productId;

                            return (
                                <div
                                    key={productId}
                                    className={`border rounded-xl p-4 transition-colors ${
                                        darkMode 
                                            ? 'border-dark-600 hover:border-primary-500' 
                                            : 'border-gray-100 hover:border-primary-400'
                                    }`}
                                >
                                    {/* Product Info */}
                                    <div className="flex gap-4 mb-4">
                                        <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                                            darkMode ? 'bg-dark-700' : 'bg-gray-50'
                                        }`}>
                                            <img
                                                src={productImage || '/placeholder.jpg'}
                                                alt={productName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-semibold ${
                                                darkMode ? 'text-primary-100' : 'text-gray-900'
                                            }`}>{productName}</h3>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Qty: {item.quantity}</p>
                                            <p className={`text-sm font-medium ${
                                                darkMode ? 'text-primary-400' : 'text-primary-600'
                                            }`}>
                                                Rs. {item.price * item.quantity}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Review Form */}
                                    {isExpanded ? (
                                        <div className={`space-y-4 pt-4 border-t ${
                                            darkMode ? 'border-dark-600' : 'border-gray-100'
                                        }`}>
                                            {/* Rating */}
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${
                                                    darkMode ? 'text-primary-200' : 'text-gray-700'
                                                }`}>
                                                    Rate this product *
                                                </label>
                                                {renderStars(
                                                    review?.rating || 0,
                                                    (rating) => handleRatingChange(productId, rating)
                                                )}
                                            </div>

                                            {/* Comment */}
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${
                                                    darkMode ? 'text-primary-200' : 'text-gray-700'
                                                }`}>
                                                    Your Review (Optional)
                                                </label>
                                                <textarea
                                                    placeholder="Share your experience with this product..."
                                                    value={review?.comment || ''}
                                                    onChange={(e) =>
                                                        handleInputChange(productId, 'comment', e.target.value)
                                                    }
                                                    rows="3"
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none resize-none ${
                                                        darkMode 
                                                            ? 'bg-dark-700 border-dark-600 text-primary-100 focus:ring-primary-500 placeholder-gray-500'
                                                            : 'bg-white border-gray-200 text-gray-900 focus:ring-primary-500 placeholder-gray-400'
                                                    }`}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    onClick={() => handleSubmitReview(productId)}
                                                    disabled={loading || !review?.rating}
                                                    className={`flex-1 ${
                                                        darkMode 
                                                            ? '!bg-primary-600 hover:!bg-primary-700' 
                                                            : '!bg-primary-600 hover:!bg-primary-700'
                                                    }`}
                                                >
                                                    {loading ? 'Submitting...' : 'Submit Review'}
                                                </Button>
                                                <button
                                                    onClick={() => setSelectedProduct(null)}
                                                    className={`px-4 py-2 border rounded-lg transition-colors ${
                                                        darkMode 
                                                            ? 'border-dark-600 text-primary-200 hover:bg-dark-700'
                                                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedProduct(productId)}
                                            className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                                                darkMode 
                                                    ? 'bg-primary-900/30 text-primary-300 hover:bg-primary-900/50'
                                                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                            }`}
                                        >
                                            Write a Review
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default PostOrderReview;
