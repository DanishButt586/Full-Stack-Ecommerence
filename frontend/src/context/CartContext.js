/**
 * Cart Context
 * Global cart state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../services/cartService';
import io from 'socket.io-client';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [], totalPrice: 0, itemCount: 0 });
    const [loading, setLoading] = useState(false);  // For initial load only
    const [updating, setUpdating] = useState(false); // For updates (no full spinner)
    const [error, setError] = useState(null);

    // Refs for debouncing quantity updates
    const pendingUpdates = useRef({});  // { itemId: { quantity, timeoutId } }
    const lastSyncedCart = useRef(null); // Store last synced cart for rollback

    // Fetch cart from server
    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCart({ items: [], totalPrice: 0, itemCount: 0 });
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await getCart();
            if (response.success && response.data) {
                const cartData = response.data;
                const newCart = {
                    items: cartData.items || [],
                    totalPrice: cartData.totalPrice || 0,
                    itemCount: cartData.items?.length || 0,
                };
                setCart(newCart);
                lastSyncedCart.current = newCart;
            } else if (response.success) {
                // Empty cart
                setCart({ items: [], totalPrice: 0, itemCount: 0 });
                lastSyncedCart.current = { items: [], totalPrice: 0, itemCount: 0 };
            }
        } catch (err) {
            console.error('Error fetching cart:', err);
            // Don't set error for 404 (no cart yet)
            if (!err.message?.includes('not found')) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load cart on mount and when token changes
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Socket connection for real-time cart updates
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) return;

        const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Cart socket connected');
            socket.emit('join_customer_room', userId);
        });

        // Listen for cart_cleared event from admin
        socket.on('cart_cleared', async (data) => {
            console.log('Cart cleared by admin:', data);
            // Clear cart immediately
            setCart({ items: [], totalPrice: 0, itemCount: 0 });
            lastSyncedCart.current = { items: [], totalPrice: 0, itemCount: 0 };

            // Trigger notification refresh if available
            if (window.refreshNotifications) {
                try {
                    await window.refreshNotifications();
                } catch (err) {
                    console.error('Error refreshing notifications:', err);
                }
            }

            // Show notification if available
            if (window.showNotification) {
                window.showNotification(data.message || 'Your cart has been cleared', 'info');
            }
        });

        socket.on('disconnect', () => {
            console.log('Cart socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Add item to cart
    const addItem = async (productId, quantity = 1) => {
        try {
            setUpdating(true);
            setError(null);
            const response = await addToCart(productId, quantity);
            if (response.success && response.data) {
                const cartData = response.data;
                setCart({
                    items: cartData.items || [],
                    totalPrice: cartData.totalPrice || 0,
                    itemCount: cartData.items?.length || 0,
                });
                return { success: true, message: 'Item added to cart!' };
            }
            return { success: false, message: response.message || 'Failed to add item' };
        } catch (err) {
            console.error('Error adding to cart:', err);
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setUpdating(false);
        }
    };

    // Helper to calculate total price
    const calculateTotalPrice = (items) => {
        return items.reduce((total, item) => {
            const price = item.price || item.product?.price || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    // Debounced API call for quantity updates
    const debouncedUpdateAPI = useCallback((itemId, quantity) => {
        // Clear any existing timeout for this item
        if (pendingUpdates.current[itemId]?.timeoutId) {
            clearTimeout(pendingUpdates.current[itemId].timeoutId);
        }

        // Set new timeout - only call API after 400ms of no changes
        const timeoutId = setTimeout(async () => {
            try {
                const response = await updateCartItem(itemId, quantity);
                if (response.success && response.data) {
                    // Sync with server response
                    const cartData = response.data;
                    lastSyncedCart.current = {
                        items: cartData.items || [],
                        totalPrice: cartData.totalPrice || 0,
                        itemCount: cartData.items?.length || 0,
                    };
                    setCart(lastSyncedCart.current);
                }
            } catch (err) {
                console.error('Error syncing cart:', err);
                // Rollback to last synced state on error
                if (lastSyncedCart.current) {
                    setCart(lastSyncedCart.current);
                }
            } finally {
                // Clean up pending update
                delete pendingUpdates.current[itemId];
            }
        }, 400);

        pendingUpdates.current[itemId] = { quantity, timeoutId };
    }, []);

    // Update item quantity (instant UI update + debounced API call)
    const updateItem = (itemId, quantity) => {
        // Instant UI update
        setCart(prevCart => {
            const updatedItems = prevCart.items.map(item =>
                item._id === itemId ? { ...item, quantity } : item
            );
            return {
                ...prevCart,
                items: updatedItems,
                totalPrice: calculateTotalPrice(updatedItems),
            };
        });

        // Debounced API call
        debouncedUpdateAPI(itemId, quantity);

        return { success: true };
    };

    // Remove item from cart (optimistic update)
    const removeItem = async (itemId) => {
        // Store previous state for rollback
        const previousCart = { ...cart };

        // Optimistic update - remove item immediately
        setCart(prevCart => {
            const updatedItems = prevCart.items.filter(item => item._id !== itemId);
            return {
                ...prevCart,
                items: updatedItems,
                totalPrice: calculateTotalPrice(updatedItems),
                itemCount: updatedItems.length,
            };
        });

        try {
            setError(null);
            const response = await removeFromCart(itemId);
            if (response.success && response.data) {
                // Sync with server response
                const cartData = response.data;
                setCart({
                    items: cartData.items || [],
                    totalPrice: cartData.totalPrice || 0,
                    itemCount: cartData.items?.length || 0,
                });
                return { success: true };
            }
            // Rollback on failure
            setCart(previousCart);
            return { success: false };
        } catch (err) {
            console.error('Error removing from cart:', err);
            // Rollback on error
            setCart(previousCart);
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // Clear entire cart (optimistic update)
    const emptyCart = async () => {
        // Store previous state for rollback
        const previousCart = { ...cart };

        // Optimistic update - clear immediately
        setCart({ items: [], totalPrice: 0, itemCount: 0 });

        try {
            setError(null);
            const response = await clearCart();
            if (response.success) {
                return { success: true };
            }
            // Rollback on failure
            setCart(previousCart);
            return { success: false };
        } catch (err) {
            console.error('Error clearing cart:', err);
            // Rollback on error
            setCart(previousCart);
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // Check if item is in cart
    const isInCart = (productId) => {
        return cart.items.some(item => item.product?._id === productId || item.product === productId);
    };

    // Get item quantity in cart
    const getItemQuantity = (productId) => {
        const item = cart.items.find(item => item.product?._id === productId || item.product === productId);
        return item ? item.quantity : 0;
    };

    const value = {
        cart,
        loading,
        updating,
        error,
        addItem,
        updateItem,
        removeItem,
        emptyCart,
        fetchCart,
        isInCart,
        getItemQuantity,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
