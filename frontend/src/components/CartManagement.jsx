import React, { useState, useEffect, useCallback } from 'react';
import {
    getAllCarts,
    getCartSummary,
    clearUserCart,
} from '../services/cartService';
import { DEFAULT_SETTINGS, formatDateTimeWithSettings } from '../utils/settings';

const CartManagement = ({ darkMode, settings = DEFAULT_SETTINGS }) => {
    const [carts, setCarts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('updatedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedCart, setSelectedCart] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching cart data...');
            const [cartsData, summaryData] = await Promise.all([
                getAllCarts(),
                getCartSummary(),
            ]);
            console.log('Carts received:', cartsData);
            console.log('Summary received:', summaryData);
            
            // Extract carts from the response - try multiple extraction methods
            let extractedCarts = [];
            if (cartsData?.data?.carts) {
                extractedCarts = cartsData.data.carts;
                console.log('Extracted carts from data.carts:', extractedCarts);
            } else if (cartsData?.carts) {
                extractedCarts = cartsData.carts;
                console.log('Extracted carts from carts:', extractedCarts);
            } else if (Array.isArray(cartsData)) {
                extractedCarts = cartsData;
                console.log('Carts data is array:', extractedCarts);
            }
            
            // Extract summary from the response
            let extractedSummary = null;
            if (summaryData?.data?.summary) {
                extractedSummary = summaryData.data.summary;
                console.log('Extracted summary from data.summary:', extractedSummary);
            } else if (summaryData?.summary) {
                extractedSummary = summaryData.summary;
                console.log('Extracted summary from summary:', extractedSummary);
            } else if (summaryData?.data) {
                extractedSummary = summaryData.data;
                console.log('Extracted summary from data:', extractedSummary);
            }
            
            console.log('Final carts array:', extractedCarts);
            console.log('Final summary:', extractedSummary);
            setCarts(extractedCarts);
            setSummary(extractedSummary);
        } catch (err) {
            console.error('Error fetching cart data:', err);
            setError(err.message || 'Failed to fetch cart data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClearCart = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to clear the cart for ${userName}?`)) {
            return;
        }
        try {
            setActionLoading(true);
            await clearUserCart(userId);
            await fetchData();
            setShowModal(false);
            setSelectedCart(null);
        } catch (err) {
            setError(err.message || 'Failed to clear cart');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredCarts = carts
        .filter((cart) => {
            // Search filter
            const searchLower = searchTerm.toLowerCase();
            const userName = cart.user?.name?.toLowerCase() || '';
            const userEmail = cart.user?.email?.toLowerCase() || '';
            const matchesSearch =
                userName.includes(searchLower) || userEmail.includes(searchLower);

            // Status filter
            if (filterStatus === 'active') {
                return matchesSearch && cart.items.length > 0;
            }
            if (filterStatus === 'empty') {
                return matchesSearch && cart.items.length === 0;
            }
            if (filterStatus === 'saved') {
                return matchesSearch && cart.savedItems?.length > 0;
            }
            return matchesSearch;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'totalPrice':
                    comparison = a.totalPrice - b.totalPrice;
                    break;
                case 'itemCount':
                    comparison = a.itemCount - b.itemCount;
                    break;
                case 'updatedAt':
                default:
                    comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

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
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            },
            settings
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cart Management</h1>
                <p className="mt-2 text-indigo-600 font-medium">
                    View and manage all customer shopping carts
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-cream rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center min-w-0">
                        <div className="flex items-center w-full">
                            <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 21h14l-2-8H7zm0 0l-1.5-6M7 13l-.5 2" />
                                </svg>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">Total Carts</p>
                                <p className="text-2xl font-semibold text-gray-900 truncate">{summary.totalCarts}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cream rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center min-w-0">
                        <div className="flex items-center w-full">
                            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">Active Carts</p>
                                <p className="text-2xl font-semibold text-gray-900 truncate">{summary.cartsWithItems}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cream rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center min-w-0">
                        <div className="flex items-center w-full">
                            <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">Total Items</p>
                                <p className="text-2xl font-semibold text-gray-900 truncate">{summary.totalItems}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cream rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center min-w-0">
                        <div className="flex items-center w-full">
                            <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">Total Value</p>
                                <p className="text-2xl font-semibold text-gray-900 truncate">{formatPrice(summary.totalValue)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cream rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center min-w-0">
                        <div className="flex items-center w-full">
                            <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">Avg Cart Value</p>
                                <p className="text-2xl font-semibold text-gray-900 truncate">{formatPrice(summary.avgCartValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-cream rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by customer name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Carts</option>
                            <option value="active">Active Carts</option>
                            <option value="empty">Empty Carts</option>
                            <option value="saved">With Saved Items</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="updatedAt">Last Updated</option>
                            <option value="totalPrice">Cart Value</option>
                            <option value="itemCount">Item Count</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                        >
                            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                        </button>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 text-white rounded-lg transition-all duration-200"
                            style={{ backgroundColor: '#492273' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Carts Table */}
            <div className="bg-cream rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cart Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Saved Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Updated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-cream divide-y divide-gray-200">
                            {filteredCarts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 21h14l-2-8H7zm0 0l-1.5-6M7 13l-.5 2" />
                                        </svg>
                                        <p className="text-lg font-medium">No carts found</p>
                                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCarts.map((cart) => (
                                    <tr key={cart._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <span className="text-indigo-600 font-medium text-sm">
                                                            {cart.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {cart.user?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {cart.user?.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                cart.itemCount > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {cart.itemCount || 0} items
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatPrice(cart.totalPrice || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {cart.savedItems?.length > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    {cart.savedItems.length} saved
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(cart.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCart(cart);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-white font-medium px-4 py-1.5 rounded-lg transition-all duration-200"
                                                    style={{ backgroundColor: '#492273' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                                                >
                                                    View
                                                </button>
                                                {cart.items?.length > 0 && (
                                                    <button
                                                        onClick={() => handleClearCart(cart.user?._id, cart.user?.name)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cart Details Modal */}
            {showModal && selectedCart && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={() => {
                                setShowModal(false);
                                setSelectedCart(null);
                            }}
                        ></div>
                        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-cream shadow-xl rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Cart Details
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedCart(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-indigo-600 font-semibold text-lg">
                                            {selectedCart.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {selectedCart.user?.name || 'Unknown User'}
                                        </h4>
                                        <p className="text-sm text-gray-500">{selectedCart.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                    Cart Items ({selectedCart.items?.length || 0})
                                </h4>
                                {selectedCart.items?.length > 0 ? (
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {selectedCart.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        {item.product?.images?.[0]?.url ? (
                                                            <img
                                                                src={item.product.images[0].url.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product.images[0].url}`}
                                                                alt={item.product.name}
                                                                className="h-full w-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item.product?.name || 'Product'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Qty: {item.quantity} × {formatPrice(item.price)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatPrice(item.quantity * item.price)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No items in cart</p>
                                )}
                            </div>

                            {/* Saved Items */}
                            {selectedCart.savedItems?.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                                        Saved for Later ({selectedCart.savedItems.length})
                                    </h4>
                                    <div className="space-y-3 max-h-40 overflow-y-auto">
                                        {selectedCart.savedItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item.product?.name || 'Product'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatPrice(item.price)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cart Summary */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-indigo-600">
                                        {formatPrice(selectedCart.totalPrice || 0)}
                                    </span>
                                </div>
                                <div className="flex space-x-3">
                                    {selectedCart.items?.length > 0 && (
                                        <button
                                            onClick={() => handleClearCart(selectedCart.user?._id, selectedCart.user?.name)}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-2 bg-red-600 text-cream rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Clearing...' : 'Clear Cart'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedCart(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartManagement;
