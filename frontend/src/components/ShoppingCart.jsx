import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    saveCartForLater,
    getSavedCart,
    restoreSavedCart,
} from '../services/cartService';

const ShoppingCart = () => {
    const [cart, setCart] = useState(null);
    const [savedItems, setSavedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [cartData, savedData] = await Promise.all([
                getCart(),
                getSavedCart().catch(() => ({ savedItems: [] })),
            ]);
            setCart(cartData.cart || { items: [], totalPrice: 0 });
            setSavedItems(savedData.savedItems || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch cart');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            setUpdating(itemId);
            setError(null);
            await updateCartItem(itemId, newQuantity);
            await fetchCart();
        } catch (err) {
            setError(err.message || 'Failed to update quantity');
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            setUpdating(itemId);
            setError(null);
            await removeFromCart(itemId);
            await fetchCart();
            showSuccess('Item removed from cart');
        } catch (err) {
            setError(err.message || 'Failed to remove item');
        } finally {
            setUpdating(null);
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your cart?')) return;
        try {
            setLoading(true);
            await clearCart();
            await fetchCart();
            showSuccess('Cart cleared successfully');
        } catch (err) {
            setError(err.message || 'Failed to clear cart');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveForLater = async () => {
        try {
            setLoading(true);
            await saveCartForLater();
            await fetchCart();
            showSuccess('Cart saved for later');
        } catch (err) {
            setError(err.message || 'Failed to save cart');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreSaved = async () => {
        try {
            setLoading(true);
            await restoreSavedCart();
            await fetchCart();
            showSuccess('Saved items restored to cart');
        } catch (err) {
            setError(err.message || 'Failed to restore saved items');
        } finally {
            setLoading(false);
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

    if (loading && !cart) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const cartItems = cart?.items || [];
    const subtotal = cart?.totalPrice || 0;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Ambient floating background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 -left-24 w-96 h-96 bg-primary-600/10 blur-3xl rounded-full animate-float-sphere" />
                <div className="absolute -bottom-36 right-10 w-[26rem] h-[26rem] bg-primary-500/10 blur-3xl rounded-full ambient-float" />
                <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-white/5 border border-white/10 rounded-full rotate-12 animate-spin-slow" />
            </div>
            {/* Header with floating cart background */}
            <div className="relative flex items-center justify-between mb-8 overflow-hidden">
                {/* Floating cart icon background - Enhanced */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none">
                    <div className="relative w-full h-full">
                        {/* Outer glow circle */}
                        <div 
                            className="absolute inset-0 rounded-full animate-pulse"
                            style={{
                                background: 'radial-gradient(circle, rgba(202, 45, 95, 0.3) 0%, rgba(202, 45, 95, 0.1) 70%, transparent 100%)',
                            }}
                        />
                        {/* Floating cart icon with 3D effect */}
                        <svg 
                            className="w-full h-full text-primary-600 animate-float-sphere animate-cart-drift" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth={0.3}
                            style={{
                                filter: 'drop-shadow(0 20px 40px rgba(202, 45, 95, 0.4))',
                                opacity: 0.15
                            }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {/* Sparkle effects */}
                        <div 
                            className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full animate-pulse"
                            style={{
                                background: 'rgba(202, 45, 95, 0.6)',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }}
                        />
                        <div 
                            className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 rounded-full"
                            style={{
                                background: 'rgba(202, 45, 95, 0.4)',
                                animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s'
                            }}
                        />
                    </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent flex items-center relative z-10">
                    <div 
                        className="w-10 h-10 mr-3 rounded-2xl flex items-center justify-center animate-float-sphere"
                        style={{
                            background: 'linear-gradient(135deg, #ca2d5f 0%, #b01f4b 100%)',
                            boxShadow: '0 10px 30px rgba(202, 45, 95, 0.4), inset -2px -2px 5px rgba(0, 0, 0, 0.2), inset 2px 2px 5px rgba(255, 255, 255, 0.1)',
                            transform: 'perspective(1000px) rotateX(5deg) rotateY(-5deg)'
                        }}
                    >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    Your Cart
                </h1>
                <Link
                    to="/products"
                    className="text-primary-600 hover:text-primary-800 flex items-center font-medium transition-all hover:scale-105 relative z-10"
                >
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Continue Shopping
                </Link>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {cartItems.length === 0 && savedItems.length === 0 ? (
                <div className="relative text-center py-20 bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl shadow-2xl border-2 border-primary-200 overflow-hidden"
                    style={{
                        perspective: '1000px',
                        transformStyle: 'preserve-3d'
                    }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-primary-600/10"></div>
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-300 rounded-full blur-3xl opacity-20 animate-float-sphere"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary-400 rounded-full blur-3xl opacity-20 animate-float-sphere" style={{ animationDelay: '1s' }}></div>
                    <div className="relative z-10">
                        <div 
                            className="mx-auto w-24 h-24 mb-6 rounded-3xl flex items-center justify-center animate-float-sphere"
                            style={{
                                background: 'linear-gradient(135deg, #ca2d5f 0%, #b01f4b 100%)',
                                boxShadow: '0 20px 50px rgba(202, 45, 95, 0.5), inset -2px -2px 6px rgba(0, 0, 0, 0.25), inset 2px 2px 6px rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            <svg className="h-12 w-12 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
                        <p className="text-gray-600 mb-8 text-lg">Looks like you haven't added anything to your cart yet.</p>
                    <Link
                        to="/products"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-cream font-bold rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        style={{ boxShadow: '0 10px 30px rgba(202, 45, 95, 0.4)' }}
                    >
                        🛍️ Start Shopping
                    </Link>
                    </div>
                </div>
            ) : (
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-8">
                        {cartItems.length > 0 && (
                            <div className="relative bg-dark-800/80 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-dark-700 overflow-hidden mb-6"
                                style={{
                                    perspective: '1000px',
                                    transformStyle: 'preserve-3d'
                                }}>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-400/5 to-primary-600/5"></div>
                                <div className="relative z-10 px-6 py-4 border-b border-dark-700 flex items-center justify-between bg-dark-700/50">
                                    <h2 className="text-xl font-bold text-white flex items-center">
                                        <div className="relative w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg hover:scale-110 transition-all"
                                            style={{ boxShadow: '0 10px 25px rgba(202, 45, 95, 0.3)' }}>
                                            <svg className="w-6 h-6 text-white animate-float-sphere" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        Cart Items ({cartItems.length})
                                    </h2>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleSaveForLater}
                                            className="text-sm text-primary-200 hover:text-primary-100 font-medium transition-all hover:scale-105"
                                        >
                                            💾 Save for Later
                                        </button>
                                        <button
                                            onClick={handleClearCart}
                                            className="text-sm text-red-400 hover:text-red-300 font-medium transition-all hover:scale-105"
                                        >
                                            🗑️ Clear Cart
                                        </button>
                                    </div>
                                </div>
                                <ul className="divide-y divide-dark-700/60">
                                    {cartItems.map((item) => (
                                        <li key={item._id} className="group relative p-6">
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-600/10 via-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                                            <div className="absolute inset-[1px] rounded-2xl border border-dark-700/80 group-hover:border-primary-500/40 transition-colors duration-500" />
                                            <div
                                                className="relative flex items-center gap-4 bg-dark-700/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all duration-500 transform group-hover:-translate-y-1 group-hover:rotate-1"
                                                style={{ transformStyle: 'preserve-3d' }}
                                            >
                                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-dark-700 shadow-inner">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60" />
                                                    {item.product?.image ? (
                                                        <img
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="h-full w-full object-cover object-center"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white">
                                                                <Link
                                                                    to={`/products/${item.product?._id}`}
                                                                    className="hover:text-primary-200"
                                                                >
                                                                    {item.product?.name || 'Product'}
                                                                </Link>
                                                            </h3>
                                                            <p className="mt-1 text-sm text-primary-200/80">
                                                                {item.product?.category?.name || 'Uncategorized'}
                                                            </p>
                                                            <p className="mt-1 text-lg font-semibold text-white">
                                                                {formatPrice(item.price)}
                                                            </p>
                                                        </div>
                                                        <p className="text-lg font-semibold text-white">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                                                        <div className="flex items-center rounded-2xl border border-dark-600 bg-dark-800/50 shadow-inner">
                                                            <button
                                                                onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                                                disabled={updating === item._id || item.quantity <= 1}
                                                                className="px-3 py-2 text-primary-200 hover:text-primary-100 hover:bg-dark-700 rounded-l-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                                </svg>
                                                            </button>
                                                            <span className="px-4 py-2 text-white font-medium bg-dark-700/80 min-w-[48px] text-center rounded-none">
                                                                {updating === item._id ? (
                                                                    <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    item.quantity
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                                                disabled={updating === item._id}
                                                                className="px-3 py-2 text-primary-200 hover:text-primary-100 hover:bg-dark-700 rounded-r-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveItem(item._id)}
                                                            disabled={updating === item._id}
                                                            className="text-red-400 hover:text-red-300 flex items-center disabled:opacity-40 transition-colors"
                                                        >
                                                            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Saved Items */}
                        {savedItems.length > 0 && (
                            <div className="relative bg-dark-800/80 backdrop-blur-md rounded-3xl shadow-2xl border border-dark-700 overflow-hidden mt-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-primary-500/5 to-transparent"></div>
                                <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between bg-dark-700/50 relative z-10">
                                    <h2 className="text-lg font-semibold text-white flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                        Saved for Later ({savedItems.length})
                                    </h2>
                                    <button
                                        onClick={handleRestoreSaved}
                                        className="text-sm text-primary-200 hover:text-primary-100 font-medium transition-colors"
                                    >
                                        Restore All to Cart
                                    </button>
                                </div>
                                <ul className="divide-y divide-dark-700 relative z-10">
                                    {savedItems.map((item, index) => (
                                        <li key={index} className="p-4 flex items-center bg-dark-700/50 hover:bg-dark-700/70 transition-all">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-white/10 border border-white/10">
                                                {item.product?.image ? (
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="text-sm font-medium text-white">
                                                    {item.product?.name || 'Product'}
                                                </h3>
                                                <p className="text-sm text-primary-200/80">
                                                    Qty: {item.quantity} × {formatPrice(item.price)}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-white">
                                                {formatPrice(item.quantity * item.price)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    {cartItems.length > 0 && (
                        <div className="lg:col-span-4 mt-8 lg:mt-0">
                            <div
                                className="relative bg-dark-800/80 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-dark-700 p-6 sticky top-6 overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1"
                                style={{
                                    perspective: '1000px',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                {/* Floating Cart Icon */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 opacity-10">
                                    <svg className="w-full h-full text-primary-600 animate-float-sphere animate-cart-drift" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-20 animate-float-sphere" style={{ animationDelay: '1.5s' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-700/5"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center mb-6">
                                        <div className="relative w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mr-3 shadow-xl"
                                            style={{ boxShadow: '0 15px 30px rgba(202, 45, 95, 0.3)' }}>
                                            <svg className="w-7 h-7 text-white animate-float-sphere" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text text-transparent">Order Summary</h2>
                                    </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-primary-200/80">
                                        <span>Subtotal ({cartItems.length} items)</span>
                                        <span className="font-medium text-white">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-primary-200/80">
                                        <span>Shipping</span>
                                        <span className="font-medium text-white">
                                            {shipping === 0 ? (
                                                <span className="text-green-400">FREE</span>
                                            ) : (
                                                formatPrice(shipping)
                                            )}
                                        </span>
                                    </div>
                                    {shipping > 0 && (
                                        <p className="text-xs text-primary-200/80">
                                            Add {formatPrice(Math.max(50 - subtotal, 0))} more for free shipping
                                        </p>
                                    )}
                                    <div className="flex justify-between text-primary-200/80">
                                        <span>Estimated Tax</span>
                                        <span className="font-medium text-white">{formatPrice(tax)}</span>
                                    </div>
                                    <div className="border-t border-dark-700 pt-4">
                                        <div className="flex justify-between text-lg font-semibold text-white">
                                            <span>Total</span>
                                            <span className="text-2xl bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    to="/checkout"
                                    className="mt-6 w-full bg-gradient-to-r from-primary-600 to-primary-700 text-cream py-4 px-4 rounded-2xl font-bold hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all text-center block shadow-lg hover:shadow-2xl hover:scale-105 transform"
                                    style={{ boxShadow: '0 10px 30px rgba(202, 45, 95, 0.4)' }}
                                >
                                    <span className="flex items-center justify-center">
                                        🛒 Proceed to Checkout
                                    </span>
                                </Link>
                                <div className="mt-4 flex items-center justify-center text-sm text-primary-200/80">
                                    <svg className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Secure Checkout
                                </div>
                                <div className="mt-6 border-t border-dark-700 pt-4">
                                    <p className="text-xs text-primary-200/80 text-center">
                                        We accept all major credit cards
                                    </p>
                                    <div className="flex justify-center space-x-2 mt-2">
                                        <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                        <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                        <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                        <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;

