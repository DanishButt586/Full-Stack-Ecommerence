/**
 * CouponManagement Component
 * Admin panel for managing coupons and discounts
 * Features:
 * - Real-time coupon creation with Socket.IO
 * - Real-time coupon updates (no page reload)
 * - Real-time coupon deletion
 * - Instant UI updates across all admin sessions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/couponService';
import { DEFAULT_SETTINGS, formatDateWithSettings } from '../utils/settings';
import { io } from 'socket.io-client';

const CouponManagement = ({ darkMode, settings = DEFAULT_SETTINGS }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [notification, setNotification] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [socket, setSocket] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscount: '',
        minOrderAmount: 0,
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        usagePerUser: 1,
        description: '',
        isActive: true,
    });

    const [formErrors, setFormErrors] = useState({});

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    // Fetch coupons
    const fetchCoupons = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await getAllCoupons(page, 10);
            if (response.success) {
                setCoupons(response.data.coupons);
                setPagination(response.data.pagination);
                setCurrentPage(page);
            }
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    // Initialize Socket.IO and setup listeners
    useEffect(() => {
        fetchCoupons(1);

        // Initialize Socket.IO connection for real-time updates
        const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => {
            console.log('Connected to Socket.IO for coupon updates');
        });

        // Listen for new coupon creation
        socketInstance.on('coupon:created', (newCoupon) => {
            setCoupons(prevCoupons => {
                // Add new coupon to the beginning of the list
                return [newCoupon, ...prevCoupons].slice(0, 10);
            });
            setPagination(prev => ({
                ...prev,
                total: (prev.total || 0) + 1,
            }));
            showNotification(`New coupon "${newCoupon.code}" added successfully!`, 'success');
        });

        // Listen for coupon updates
        socketInstance.on('coupon:updated', (updatedCoupon) => {
            setCoupons(prevCoupons =>
                prevCoupons.map(coupon =>
                    coupon._id === updatedCoupon._id ? updatedCoupon : coupon
                )
            );
            showNotification(`Coupon "${updatedCoupon.code}" updated successfully!`, 'success');
        });

        // Listen for coupon deletion
        socketInstance.on('coupon:deleted', (deletedCouponId) => {
            setCoupons(prevCoupons =>
                prevCoupons.filter(coupon => coupon._id !== deletedCouponId)
            );
            setPagination(prev => ({
                ...prev,
                total: Math.max(0, (prev.total || 1) - 1),
            }));
            showNotification('Coupon deleted successfully!', 'success');
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from Socket.IO');
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [fetchCoupons, showNotification]);

    const validateForm = () => {
        const errors = {};

        if (!formData.code.trim()) errors.code = 'Coupon code is required';
        if (formData.discountType === 'percentage' && (formData.discountValue < 0 || formData.discountValue > 100)) {
            errors.discountValue = 'Percentage must be between 0 and 100';
        }
        if (formData.discountValue < 0) errors.discountValue = 'Discount value cannot be negative';
        if (!formData.validFrom) errors.validFrom = 'Valid from date is required';
        if (!formData.validUntil) errors.validUntil = 'Valid until date is required';
        if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
            errors.validUntil = 'Valid until must be after valid from';
        }
        if (formData.minOrderAmount < 0) errors.minOrderAmount = 'Minimum order amount cannot be negative';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const openCreateModal = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: 0,
            maxDiscount: '',
            minOrderAmount: 0,
            validFrom: '',
            validUntil: '',
            usageLimit: '',
            usagePerUser: 1,
            description: '',
            isActive: true,
        });
        setFormErrors({});
        setShowCreateModal(true);
    };

    const openEditModal = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount || '',
            minOrderAmount: coupon.minOrderAmount,
            validFrom: coupon.validFrom.split('T')[0],
            validUntil: coupon.validUntil.split('T')[0],
            usageLimit: coupon.usageLimit || '',
            usagePerUser: coupon.usagePerUser,
            description: coupon.description || '',
            isActive: coupon.isActive,
        });
        setFormErrors({});
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const submitData = {
                code: formData.code,
                discountType: formData.discountType,
                discountValue: parseFloat(formData.discountValue),
                maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
                minOrderAmount: parseFloat(formData.minOrderAmount),
                validFrom: new Date(formData.validFrom).toISOString(),
                validUntil: new Date(formData.validUntil).toISOString(),
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                usagePerUser: parseInt(formData.usagePerUser),
                description: formData.description,
                isActive: formData.isActive,
            };

            if (editingCoupon) {
                const response = await updateCoupon(editingCoupon._id, submitData);
                if (socket) {
                    socket.emit('coupon:update', response.data);
                }
                showNotification('Coupon updated successfully', 'success');
            } else {
                const response = await createCoupon(submitData);
                if (socket) {
                    socket.emit('coupon:create', response.data);
                }
                showNotification('Coupon created successfully', 'success');
            }

            setShowCreateModal(false);
            // Don't fetch all coupons again - rely on socket event to update UI
            // fetchCoupons(currentPage);
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await deleteCoupon(id);
            if (socket) {
                socket.emit('coupon:delete', id);
            }
            showNotification('Coupon deleted successfully', 'success');
            // UI updates via socket event, no need to refetch
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const isCouponActive = (coupon) => {
        const now = new Date();
        return coupon.isActive && new Date(coupon.validFrom) <= now && new Date(coupon.validUntil) >= now;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Coupon & Discount Management
                    </h2>
                    <p className="text-sm text-indigo-600 mt-1 font-medium">
                        Create and manage discount coupons for your store
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
                    style={{ backgroundColor: '#492273' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                >
                    <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Coupon
                </button>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg ${notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {notification.message}
                </div>
            )}

            {/* Coupons Table */}
            <div className={`rounded-2xl shadow-md overflow-hidden ${darkMode ? 'bg-white border border-gray-200' : 'bg-white'}`}>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-r-transparent rounded-full"></div>
                        <p className="mt-4">Loading coupons...</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className={`text-lg font-medium ${darkMode ? 'text-gray-700' : 'text-gray-700'}`}>No coupons yet</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-600' : 'text-gray-500'} mt-2`}>Create your first coupon to get started</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`${darkMode ? 'bg-gray-50' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-200' : 'border-gray-200'}`}>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Discount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Valid Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Min. Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Usage</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-200' : 'divide-gray-200'}`}>
                                    {coupons.map((coupon) => (
                                        <tr key={coupon._id} className={`${darkMode ? 'hover:bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {coupon.code}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className={`px-3 py-1 rounded-full inline-block ${coupon.discountType === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `Rs. ${coupon.discountValue}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {formatDateWithSettings(coupon.validFrom, {}, settings)} to {formatDateWithSettings(coupon.validUntil, {}, settings)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                Rs. {coupon.minOrderAmount}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {coupon.timesUsed}/{coupon.usageLimit || '∞'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${isCouponActive(coupon) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {isCouponActive(coupon) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm space-x-2">
                                                <button
                                                    onClick={() => openEditModal(coupon)}
                                                    className="text-white font-medium px-4 py-1.5 rounded-lg transition-all duration-200"
                                                    style={{ backgroundColor: '#492273' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon._id)}
                                                    className="text-white font-medium px-4 py-1.5 rounded-lg transition-all duration-200"
                                                    style={{ backgroundColor: '#b31e28' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b1720'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b31e28'}
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
                            <div className={`flex items-center justify-center gap-2 p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => fetchCoupons(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => fetchCoupons(page)}
                                        className={`w-8 h-8 rounded-lg transition-colors ${
                                            currentPage === page
                                                ? 'text-gray-900'
                                                : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                        style={currentPage === page ? { backgroundColor: '#492273' } : undefined}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => fetchCoupons(currentPage + 1)}
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

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-white' : 'bg-white'}`}>
                        <div className={`sticky top-0 p-6 border-b flex items-center justify-between ${darkMode ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className={`text-2xl leading-none ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Coupon Code */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Coupon Code *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="e.g., SAVE50"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                        formErrors.validUntil ? 'border-red-500' : darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.code && <p className="text-red-600 text-sm mt-1">{formErrors.code}</p>}
                            </div>

                            {/* Discount Type & Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Discount Type *
                                    </label>
                                    <select
                                        name="discountType"
                                        value={formData.discountType}
                                        onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                    }`}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="amount">Fixed Amount (Rs)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Discount Value *
                                    </label>
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleInputChange}
                                        placeholder={formData.discountType === 'percentage' ? '0-100' : '0'}
                                        step={formData.discountType === 'percentage' ? '1' : '0.01'}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                            formErrors.discountValue ? 'border-red-500' : darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.discountValue && <p className="text-red-600 text-sm mt-1">{formErrors.discountValue}</p>}
                                </div>
                            </div>

                            {/* Max Discount (for percentage) */}
                            {formData.discountType === 'percentage' && (
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Maximum Discount (Rs) - Optional
                                    </label>
                                    <input
                                        type="number"
                                        name="maxDiscount"
                                        value={formData.maxDiscount}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 5000"
                                        step="0.01"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                            )}

                            {/* Minimum Order Amount */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Minimum Order Amount (Rs) *
                                </label>
                                <input
                                    type="number"
                                    name="minOrderAmount"
                                    value={formData.minOrderAmount}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                        formErrors.minOrderAmount ? 'border-red-500' : darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.minOrderAmount && <p className="text-red-600 text-sm mt-1">{formErrors.minOrderAmount}</p>}
                            </div>

                            {/* Valid Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Valid From *
                                    </label>
                                    <input
                                        type="date"
                                        name="validFrom"
                                        value={formData.validFrom}
                                        onChange={handleDateChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                            formErrors.validFrom ? 'border-red-500' : darkMode ? 'bg-dark-700 border-dark-600 text-white' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.validFrom && <p className="text-red-600 text-sm mt-1">{formErrors.validFrom}</p>}
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Valid Until *
                                    </label>
                                    <input
                                        type="date"
                                        name="validUntil"
                                        value={formData.validUntil}
                                        onChange={handleDateChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                            formErrors.validUntil ? 'border-red-500' : darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.validUntil && <p className="text-red-600 text-sm mt-1">{formErrors.validUntil}</p>}
                                </div>
                            </div>

                            {/* Usage Limits */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Total Usage Limit - Optional
                                    </label>
                                    <input
                                        type="number"
                                        name="usageLimit"
                                        value={formData.usageLimit}
                                        onChange={handleInputChange}
                                        placeholder="Unlimited"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Usage Per User *
                                    </label>
                                    <input
                                        type="number"
                                        name="usagePerUser"
                                        value={formData.usagePerUser}
                                        onChange={handleInputChange}
                                        placeholder="1"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                                            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Description - Optional
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe this coupon..."
                                    rows="3"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${
                                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 rounded"
                                />
                                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Activate this coupon
                                </label>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4 border-t" style={{ borderTopColor: darkMode ? '#374151' : '#e5e7eb' }}>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 flex-1"
                                    style={{ backgroundColor: '#492273' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
                                >
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 flex-1"
                                    style={{ backgroundColor: '#6b7280' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManagement;
