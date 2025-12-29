/**
 * ReviewManagement Component
 * Admin panel for managing product reviews and feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getAllReviews, approveReview, hideReview, deleteReviewAdmin, markAsAbusive, getReviewAnalytics } from '../services/reviewService';

const ReviewManagement = ({ darkMode }) => {
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAbusiveModal, setShowAbusiveModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [abuseReason, setAbuseReason] = useState('offensive');
    const [hideReasonText, setHideReasonText] = useState('');

    // Fetch reviews
    const fetchReviews = useCallback(async (page = 1, status = null) => {
        try {
            setLoading(true);
            const response = await getAllReviews(page, 10, status);
            if (response.success) {
                setReviews(response.data.reviews);
                setPagination(response.data.pagination);
                setCurrentPage(page);
            }
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch analytics
    const fetchAnalytics = useCallback(async () => {
        try {
            setAnalyticsLoading(true);
            const response = await getReviewAnalytics();
            if (response.success) {
                setAnalytics(response.data);
            }
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews(1, null);
        fetchAnalytics();
    }, [fetchReviews, fetchAnalytics]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        const statusQuery = newStatus === 'all' ? null : newStatus;
        fetchReviews(1, statusQuery);
    };

    const handleApprove = async (id) => {
        try {
            await approveReview(id);
            showNotification('Review approved successfully', 'success');
            fetchReviews(currentPage, statusFilter === 'all' ? null : statusFilter);
            fetchAnalytics();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleHide = async (id) => {
        try {
            await hideReview(id, hideReasonText);
            showNotification('Review hidden successfully', 'success');
            setHideReasonText('');
            fetchReviews(currentPage, statusFilter === 'all' ? null : statusFilter);
            fetchAnalytics();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleMarkAbusive = async () => {
        if (!selectedReview) return;
        try {
            await markAsAbusive(selectedReview._id, abuseReason);
            showNotification('Review marked as abusive', 'success');
            setShowAbusiveModal(false);
            setSelectedReview(null);
            setAbuseReason('offensive');
            fetchReviews(currentPage, statusFilter === 'all' ? null : statusFilter);
            fetchAnalytics();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
        try {
            await deleteReviewAdmin(id);
            showNotification('Review deleted successfully', 'success');
            fetchReviews(currentPage, statusFilter === 'all' ? null : statusFilter);
            fetchAnalytics();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    const getStatusBadge = (review) => {
        if (review.isAbusive) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Abusive</span>;
        }
        if (!review.isVisible) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Hidden</span>;
        }
        if (!review.isApproved) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Pending</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
    };

    return (
        <div className={`space-y-6 ${darkMode ? 'text-white' : ''}`}>
            {/* Header */}
            <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Reviews & Feedback Management
                </h2>
                <p className="text-sm text-indigo-600 mt-1 font-medium">
                    Manage customer reviews, approve/hide reviews, and track rating analytics
                </p>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg ${notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {notification.message}
                </div>
            )}

            {/* Analytics Cards */}
            {analyticsLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-r-transparent rounded-full"></div>
                </div>
            ) : analytics ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { title: 'Total Reviews', value: analytics.totalReviews },
                        { title: 'Approved', value: analytics.approvedReviews },
                        { title: 'Pending', value: analytics.pendingReviews },
                        { title: 'Avg Rating', value: analytics.avgRating },
                    ].map((stat, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl shadow-lg p-4 sm:p-5 border transition-all duration-300 ${darkMode ? 'bg-white border-gray-200' : 'bg-cream/90 border-gray-100'}`}
                        >
                            <div className={`text-xs uppercase tracking-wider font-semibold mb-2 ${darkMode ? 'text-black' : 'text-gray-600'}`}>
                                {stat.title}
                            </div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-black' : 'text-gray-900'}`}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}



            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'approved', 'hidden', 'abusive'].map((status) => (
                    <button
                        key={status}
                        onClick={() => handleStatusFilterChange(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            statusFilter === status
                                ? 'text-white'
                                : darkMode
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        style={statusFilter === status ? { backgroundColor: '#492273' } : undefined}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Reviews Table */}
            <div className={`rounded-2xl shadow-md overflow-hidden ${darkMode ? 'bg-white border border-gray-200' : 'bg-white'}`}>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-r-transparent rounded-full"></div>
                        <p className="mt-4">Loading reviews...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <p className={`text-lg font-medium ${darkMode ? 'text-gray-700' : 'text-gray-700'}`}>No reviews found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`${darkMode ? 'bg-gray-50' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-200' : 'border-gray-200'}`}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-700' : 'text-gray-600'}`}>User & Product</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-700' : 'text-gray-600'}`}>Rating</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-700' : 'text-gray-600'}`}>Comment</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-700' : 'text-gray-600'}`}>Status</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-700' : 'text-gray-600'}`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-200' : 'divide-gray-200'}`}>
                                    {reviews.map((review) => (
                                        <tr key={review._id} className={`${darkMode ? 'hover:bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}>
                                            <td className={`px-6 py-4 ${darkMode ? 'text-gray-700' : 'text-gray-700'}`}>
                                                <div className="space-y-1">
                                                    <div className={`font-medium ${darkMode ? 'text-gray-900' : 'text-gray-900'}`}>
                                                        {review.user?.name || 'Anonymous'}
                                                    </div>
                                                    <div className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                                                        {review.product?.name || 'Product'}
                                                    </div>
                                                    {review.isVerifiedPurchase && (
                                                        <div className="text-xs bg-green-100 text-green-800 inline-block px-2 py-0.5 rounded">
                                                            ✓ Verified
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStars(review.rating)}
                                            </td>
                                            <td className={`px-6 py-4 max-w-xs ${darkMode ? 'text-gray-700' : 'text-gray-700'}`}>
                                                <div className="space-y-1">
                                                    {review.title && (
                                                        <div className={`font-medium text-sm ${darkMode ? 'text-gray-900' : 'text-gray-900'}`}>
                                                            {review.title}
                                                        </div>
                                                    )}
                                                    <div className="text-sm line-clamp-2">{review.comment}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(review)}
                                            </td>
                                            <td className="px-6 py-4 text-sm space-y-2">
                                                {!review.isApproved && (
                                                    <button
                                                        onClick={() => handleApprove(review._id)}
                                                        className={`block w-full px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {review.isApproved && review.isVisible && (
                                                    <button
                                                        onClick={() => handleHide(review._id)}
                                                        className={`block w-full px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                                                    >
                                                        Hide
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setShowAbusiveModal(true);
                                                    }}
                                                    className={`block w-full px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                                >
                                                    Report
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review._id)}
                                                    className={`block w-full px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className={`flex items-center justify-center gap-2 p-4 border-t ${darkMode ? 'border-gray-200' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => fetchReviews(currentPage - 1, statusFilter === 'all' ? null : statusFilter)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${darkMode ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => fetchReviews(page, statusFilter === 'all' ? null : statusFilter)}
                                        className={`w-8 h-8 rounded-lg transition-colors ${
                                            currentPage === page
                                                ? 'text-white'
                                                : darkMode ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                        style={currentPage === page ? { backgroundColor: '#492273' } : undefined}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => fetchReviews(currentPage + 1, statusFilter === 'all' ? null : statusFilter)}
                                    disabled={currentPage === pagination.pages}
                                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Abusive Modal */}
            {showAbusiveModal && selectedReview && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`rounded-2xl shadow-2xl max-w-md w-full ${darkMode ? 'bg-dark-800' : 'bg-white'}`}>
                        <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Report Review as Abusive
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAbusiveModal(false);
                                    setSelectedReview(null);
                                    setAbuseReason('offensive');
                                }}
                                className={`text-2xl leading-none ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Reason for Reporting
                                </label>
                                <select
                                    value={abuseReason}
                                    onChange={(e) => setAbuseReason(e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                        darkMode ? 'bg-dark-700 border-dark-600 text-white' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="offensive">Offensive Language</option>
                                    <option value="spam">Spam</option>
                                    <option value="irrelevant">Irrelevant to Product</option>
                                    <option value="misleading">Misleading Information</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t" style={{ borderTopColor: darkMode ? '#374151' : '#e5e7eb' }}>
                                <button
                                    onClick={handleMarkAbusive}
                                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 flex-1"
                                    style={{ backgroundColor: '#492273' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                                >
                                    Mark as Abusive
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAbusiveModal(false);
                                        setSelectedReview(null);
                                        setAbuseReason('offensive');
                                    }}
                                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 flex-1"
                                    style={{ backgroundColor: '#6b7280' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManagement;
