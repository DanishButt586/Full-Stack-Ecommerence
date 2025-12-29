import React, { useState, useEffect, useCallback } from 'react';
import ConfirmCancelModal from './ConfirmCancelModal';
import { Link, useLocation } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../services/checkoutService';
import PostOrderReview from './PostOrderReview';
import { formatDateTimeWithSettings, useUserSettings } from '../utils/settings';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [cancelling, setCancelling] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const userSettings = useUserSettings();
    const location = useLocation();

    const fetchOrders = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMyOrders(page, 10);
            setOrders(data.orders || []);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Handle navigation from Dashboard reviews - open review modal for specific order
    useEffect(() => {
        if (location.state?.openReviewModal && location.state?.orderId && orders.length > 0) {
            const order = orders.find(o => o._id === location.state.orderId);
            if (order && order.orderStatus === 'delivered') {
                setSelectedOrder(order);
                setShowReviewModal(true);
                // Clear the navigation state
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, orders]);

    // Only open modal, do not navigate
    const handleCancelOrder = (orderId) => {
        const order = orders.find(o => o._id === orderId) || selectedOrder;
        if (order && !canCancelOrder(order.orderStatus)) {
            // Don't open modal for non-pending orders, just show error
            setError(`Cannot cancel this order. It has already been ${mapOrderStatus(order.orderStatus)}.`);
            return;
        }
        setCancelOrderId(orderId);
        setShowCancelModal(true);
    };

    // Confirm cancellation, update order, close modal, no navigation
    const confirmCancelOrder = async () => {
        if (!cancelOrderId) return;
        try {
            setCancelling(cancelOrderId);
            await cancelOrder(cancelOrderId);
            await fetchOrders(pagination.page);
            if (selectedOrder?._id === cancelOrderId) {
                setShowModal(false);
                setSelectedOrder(null);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to cancel order');
        } finally {
            setCancelling(null);
            setShowCancelModal(false);
            setCancelOrderId(null);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date) => {
        return formatDateTimeWithSettings(
            date,
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            },
            userSettings
        );
    };

    // Map backend status to customer-friendly status
    const mapOrderStatus = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'approved') return 'delivered';
        if (s === 'declined') return 'cancelled';
        return s;
    };

    // Check if order can be cancelled
    const canCancelOrder = (status) => {
        const mapped = mapOrderStatus(status);
        return mapped === 'pending';
    };

    const getStatusColor = (status) => {
        const mapped = mapOrderStatus(status);
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-primary-100 text-primary-800',
            shipped: 'bg-primary-100 text-primary-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[mapped] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const mapped = mapOrderStatus(status);
        const icons = {
            pending: '⏳',
            processing: '↻',
            shipped: '→',
            delivered: '✓',
            cancelled: '✗',
        };
        return icons[mapped] || '□';
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Premium Header Banner */}
                <div className="relative rounded-3xl overflow-hidden mb-8 perspective-container" style={{ minHeight: '180px' }}>
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 animate-gradient-shift"></div>
                    
                    {/* 3D Package/Order themed Spheres */}
                    <div className="absolute top-6 right-10 w-16 h-16 bg-gradient-to-br from-green-400/20 to-primary-500/30 rounded-full backdrop-blur-sm border border-cream/20 animate-float-sphere shadow-2xl"></div>
                    <div className="absolute bottom-8 right-28 w-12 h-12 bg-gradient-to-br from-cream/15 to-green-400/20 rounded-full backdrop-blur-md border border-cream/20 animate-float-sphere shadow-2xl" style={{ animationDelay: '1.5s' }}></div>
                    
                    {/* Neon Rings */}
                    <div className="absolute top-8 left-12 w-24 h-24 rounded-full border-3 border-cream/30 animate-neon-ring"></div>
                    <div className="absolute bottom-12 left-1/4 w-18 h-18 rounded-full border-3 border-green-400/30 animate-neon-ring" style={{ animationDelay: '1s' }}></div>
                    
                    {/* Gradient Triangles */}
                    <div className="absolute top-8 right-1/3 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[38px] border-l-transparent border-r-transparent border-b-primary-400/20 animate-triangle-float"></div>
                    
                    {/* Package Icons as Squiggles */}
                    <svg className="absolute top-1/4 left-1/3 w-14 h-14 opacity-30 animate-squiggle" viewBox="0 0 100 100">
                        <rect x="20" y="30" width="60" height="40" stroke="rgba(255, 246, 233, 0.5)" strokeWidth="3" fill="none" rx="5"/>
                        <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(255, 246, 233, 0.5)" strokeWidth="2"/>
                        <line x1="50" y1="30" x2="50" y2="70" stroke="rgba(255, 246, 233, 0.5)" strokeWidth="2"/>
                    </svg>
                    
                    {/* Glow Dots */}
                    <div className="absolute top-4 left-6 w-2.5 h-2.5 bg-cream/60 rounded-full animate-glow-pulse shadow-lg"></div>
                    <div className="absolute top-14 right-32 w-2 h-2 bg-green-400/70 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-10 left-1/4 w-2.5 h-2.5 bg-cream/50 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1s' }}></div>
                    
                    {/* Wave Animation */}
                    <svg className="absolute bottom-0 left-0 w-full opacity-15" viewBox="0 0 1440 100" preserveAspectRatio="none">
                        <path fill="rgba(255, 246, 233, 0.1)">
                            <animate attributeName="d" dur="7s" repeatCount="indefinite"
                                values="M0,30 Q360,10 720,30 T1440,30 L1440,100 L0,100 Z;
                                        M0,50 Q360,70 720,50 T1440,50 L1440,100 L0,100 Z;
                                        M0,30 Q360,10 720,30 T1440,30 L1440,100 L0,100 Z"/>
                        </path>
                    </svg>
                    
                    {/* Content */}
                    <div className="relative backdrop-blur-sm bg-cream/5 border border-cream/10 rounded-3xl shadow-2xl p-5 sm:p-6 m-3">
                        <div className="relative z-10 flex items-center gap-3">
                            {/* Package Icon */}
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-cream/10 backdrop-blur-md rounded-xl border border-cream/20 animate-fade-in">
                                <svg className="w-7 h-7 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-cream drop-shadow-lg animate-slide-in-left">
                                    My Orders
                                </h1>
                                <p className="text-cream/80 text-sm sm:text-base drop-shadow-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                    Track and manage your orders
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Decorative Corners */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cream/10 rounded-tl-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cream/10 rounded-br-3xl"></div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-600 mb-6">Start shopping to see your orders here.</p>
                        <Link
                            to="/products"
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Orders List */}
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="bg-cream rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-lg font-semibold text-gray-900">
                                                        {order.orderNumber}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                                                        {getStatusIcon(order.orderStatus)} {mapOrderStatus(order.orderStatus).charAt(0).toUpperCase() + mapOrderStatus(order.orderStatus).slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Placed on {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                            <div className="mt-4 md:mt-0 text-right">
                                                <p className="text-lg font-bold text-primary-600">
                                                    {formatPrice(order.totalPrice)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Items Preview */}
                                        <div className="flex items-center space-x-4 mb-4 overflow-x-auto pb-2">
                                            {order.items?.slice(0, 4).map((item, index) => (
                                                <div key={index} className="flex-shrink-0">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover rounded-2xl"
                                                            />
                                                        ) : (
                                                            <span className="text-2xl">📦</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {order.items?.length > 4 && (
                                                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 text-sm font-medium">
                                                    +{order.items.length - 4}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cancellation Reason */}
                                        {order.orderStatus === 'cancelled' && order.cancelReason && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-800 text-sm font-semibold">❗ Order Cancelled</p>
                                                <p className="text-red-700 text-xs mt-1">
                                                    <span className="font-medium">Reason:</span> {order.cancelReason}
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center space-x-2">
                                                {order.isPaid ? (
                                                    <span className="flex items-center text-green-600 text-sm">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-yellow-600 text-sm">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                        Payment Pending
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {canCancelOrder(order.orderStatus) ? (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        disabled={cancelling === order._id}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                                    >
                                                        {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                                                    </button>
                                                ) : !['cancelled'].includes(mapOrderStatus(order.orderStatus)) && (
                                                    <button
                                                        disabled={true}
                                                        className="text-gray-400 text-sm font-medium cursor-not-allowed"
                                                        title={`Cannot cancel - Order is ${mapOrderStatus(order.orderStatus)}`}
                                                    >
                                                        Cannot Cancel
                                                    </button>
                                                )}
                                                        {/* Cancel Order Confirmation Modal */}
                                                        <ConfirmCancelModal
                                                            open={showCancelModal}
                                                            onClose={() => {
                                                                setShowCancelModal(false);
                                                            }}
                                                            onConfirm={confirmCancelOrder}
                                                            loading={cancelling !== null}
                                                            darkMode={false}
                                                        />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center mt-8 space-x-2">
                                <button
                                    onClick={() => fetchOrders(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-600">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => fetchOrders(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-4 py-2 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Order Details Modal */}
                {console.log('Modal render check - showModal:', showModal, 'selectedOrder:', !!selectedOrder)}
                {showModal && selectedOrder && (
                    <div className="fixed inset-0 z-[9999] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedOrder(null);
                                }}
                            ></div>
                            <div className="relative bg-cream rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="sticky top-0 bg-cream border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Order {selectedOrder.orderNumber}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(selectedOrder.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedOrder(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-6">
                                    {/* Status */}
                                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-center">
                                            <span className="text-3xl mr-3">{getStatusIcon(selectedOrder.orderStatus)}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 capitalize">
                                                    {selectedOrder.orderStatus}
                                                </p>
                                                <p className="text-sm text-gray-500">Order Status</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                                            {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
                                        </span>
                                    </div>

                                    {/* Cancellation Reason in Modal */}
                                    {selectedOrder.orderStatus === 'cancelled' && selectedOrder.cancelReason && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                                            <div className="flex items-start">
                                                <span className="text-2xl mr-3">❗</span>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-red-900 mb-1">Order Cancelled</h4>
                                                    <p className="text-sm text-red-700">
                                                        <span className="font-medium">Reason:</span> {selectedOrder.cancelReason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Shipping Address */}
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                                        <div className="text-gray-600 bg-gray-50 p-4 rounded-2xl">
                                            <p>{selectedOrder.shippingAddress?.street}</p>
                                            <p>
                                                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}
                                            </p>
                                            <p>{selectedOrder.shippingAddress?.country}</p>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                                        <div className="space-y-4">
                                            {selectedOrder.items?.map((item, index) => {
                                                const productId = item.product?._id || item.product;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"
                                                    >
                                                        <div className="flex gap-4">
                                                            {/* Product Image */}
                                                            <Link 
                                                                to={`/product/${productId}`}
                                                                className="flex-shrink-0 group"
                                                            >
                                                                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                                                    {item.image ? (
                                                                        <img
                                                                            src={item.image}
                                                                            alt={item.name}
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <span className="text-3xl">📦</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Link>

                                                            {/* Product Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <Link 
                                                                    to={`/product/${productId}`}
                                                                    className="block group mb-2"
                                                                >
                                                                    <h4 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                                                                        {item.name}
                                                                    </h4>
                                                                </Link>

                                                                {/* Product Details Grid */}
                                                                <div className="space-y-2 text-sm mb-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-gray-500">Unit Price:</span>
                                                                        <span className="font-semibold text-gray-900">{formatPrice(item.price)}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-gray-500">Quantity:</span>
                                                                        <span className="font-semibold text-gray-900">{item.quantity}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                                        <span className="text-gray-700 font-medium">Subtotal:</span>
                                                                        <span className="text-lg font-bold text-primary-600">
                                                                            {formatPrice(item.quantity * item.price)}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* View Full Details Link */}
                                                                <Link
                                                                    to={`/product/${productId}`}
                                                                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                                                >
                                                                    View Full Product Details
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Subtotal</span>
                                                <span>{formatPrice(selectedOrder.itemsPrice)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Shipping</span>
                                                <span>
                                                    {selectedOrder.shippingPrice === 0 ? (
                                                        <span className="text-green-600">FREE</span>
                                                    ) : (
                                                        formatPrice(selectedOrder.shippingPrice)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tax</span>
                                                <span>{formatPrice(selectedOrder.taxPrice)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                                <span>Total</span>
                                                <span className="text-primary-600">{formatPrice(selectedOrder.totalPrice)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-gray-500">Payment Method</p>
                                                <p className="font-medium capitalize">{selectedOrder.paymentMethod}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Payment Status</p>
                                                <p className={`font-medium ${selectedOrder.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {selectedOrder.isPaid ? 'Paid' : 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 space-y-3">
                                        {['delivered'].includes(selectedOrder.orderStatus) && (
                                            <button
                                                onClick={() => setShowReviewModal(true)}
                                                className="w-full py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-medium transition-colors"
                                            >
                                                Write a Review
                                            </button>
                                        )}
                                        {canCancelOrder(selectedOrder.orderStatus) ? (
                                            <button
                                                onClick={() => handleCancelOrder(selectedOrder._id)}
                                                disabled={cancelling === selectedOrder._id}
                                                className="w-full py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 disabled:opacity-50 font-medium"
                                            >
                                                {cancelling === selectedOrder._id ? 'Cancelling...' : 'Cancel Order'}
                                            </button>
                                        ) : !['cancelled'].includes(mapOrderStatus(selectedOrder.orderStatus)) && (
                                            <button
                                                disabled={true}
                                                className="w-full py-3 bg-gray-400 text-white rounded-2xl cursor-not-allowed font-medium opacity-60"
                                                title={`Cannot cancel - Order is ${mapOrderStatus(selectedOrder.orderStatus)}`}
                                            >
                                                Cannot Cancel - Order {mapOrderStatus(selectedOrder.orderStatus)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Post Order Review Modal */}
                {showReviewModal && selectedOrder && (
                    <PostOrderReview
                        order={selectedOrder}
                        onClose={() => {
                            setShowReviewModal(false);
                            setSelectedOrder(null);
                        }}
                        onReviewSubmitted={() => {
                            fetchOrders(pagination.page);
                            setShowReviewModal(false);
                            setSelectedOrder(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Orders;

