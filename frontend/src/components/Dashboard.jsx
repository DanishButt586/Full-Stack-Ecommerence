/**
 * Dashboard Component
 * Enhanced user dashboard with collapsible sidebar navigation, profile, and modern UI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCatalog from './ProductCatalog';
import ProductDetails from './ProductDetails';
import CartItem from './CartItem';
import PhoneInput from './common/PhoneInput';
import CustomerNotificationDropdown from './CustomerNotificationDropdown';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/productService';
import { getMyOrders, cancelOrder, createOrder, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../services/checkoutService';
import ConfirmCancelModal from './ConfirmCancelModal';
import { deleteAccount as deleteAccountApi } from '../services/authService';
import { getUserReviews, getPendingReviews, createReview, updateReview, deleteReview } from '../services/reviewService';
import { countries } from '../data/countries';

const Dashboard = ({ user, onLogout }) => {
  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [cartBadgeAnimation, setCartBadgeAnimation] = useState('');
  const [wishlistBadgeAnimation, setWishlistBadgeAnimation] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [avatarError, setAvatarError] = useState(false);

  // Badge animation variants
  const badgeAnimations = ['badge-pop-animation', 'badge-shake-animation', 'badge-bounce-3d-animation'];
  
  // Helper to trigger badge animation with random variant
  const triggerBadgeAnimation = (setBadgeAnimation) => {
    const randomAnimation = badgeAnimations[Math.floor(Math.random() * badgeAnimations.length)];
    setBadgeAnimation(randomAnimation);
    setTimeout(() => setBadgeAnimation(''), 800);
  };

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    isDefault: false
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});
  const [topDiscountedProducts, setTopDiscountedProducts] = useState([]);
  const [discountedLoading, setDiscountedLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
    const [pendingReviews, setPendingReviews] = useState([]);
    
    // Review Modal state
    const handleOpenReviewModal = (item, existingReview = null) => {
      setCurrentReviewItem(item);
      setEditingReview(existingReview);
      
      if (existingReview) {
        setReviewForm({
          rating: existingReview.rating,
          title: existingReview.title || '',
          comment: existingReview.comment || '',
        });
      } else {
        setReviewForm({
          rating: 5,
          title: '',
          comment: '',
        });
      }
      
      setShowReviewModal(true);
    };
    
    const handleSubmitReview = async () => {
      try {
        if (!reviewForm.comment.trim()) {
          showNotification('Please write a comment', 'error');
          return;
        }
  
        if (editingReview) {
          // Update existing review
          await updateReview(editingReview._id, reviewForm);
          showNotification('Review updated successfully! Pending approval.', 'success');
        } else {
          // Create new review
          await createReview(
            currentReviewItem.product._id,
            reviewForm,
            currentReviewItem.orderId,
            currentReviewItem._id
          );
          showNotification('Review submitted successfully! Pending approval.', 'success');
        }
  
        setShowReviewModal(false);
        fetchReviews();
      } catch (err) {
        showNotification(err.message || 'Failed to submit review', 'error');
      }
    };
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentReviewItem, setCurrentReviewItem] = useState(null);
    const [reviewForm, setReviewForm] = useState({
      rating: 5,
      title: '',
      comment: '',
    });
    const [editingReview, setEditingReview] = useState(null);
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Address, 2: Payment, 3: Review, 4: Confirmation
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [orderNote, setOrderNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [cardType, setCardType] = useState('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [jazzcashPhone, setJazzcashPhone] = useState('');
  const [jazzcashTxn, setJazzcashTxn] = useState('');
  const [easypaisaPhone, setEasypaisaPhone] = useState('');
  const [easypaisaTxn, setEasypaisaTxn] = useState('');
  const [bankAccountName, setBankAccountName] = useState(user?.name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [stripeCardName, setStripeCardName] = useState(user?.name || '');
  const [stripeCardNumber, setStripeCardNumber] = useState('');
  const [stripeCardExpiry, setStripeCardExpiry] = useState('');
  const [stripeCardCvc, setStripeCardCvc] = useState('');
  const [stripePaymentProcessing, setStripePaymentProcessing] = useState(false);
  const [stripePaymentResult, setStripePaymentResult] = useState(null);
  const [stripeCardNameError, setStripeCardNameError] = useState('');
  const [stripeCardNumberError, setStripeCardNumberError] = useState('');
  const [stripeCardExpiryError, setStripeCardExpiryError] = useState('');
  const [stripeCardCvcError, setStripeCardCvcError] = useState('');
  const [stripePaymentModalOpen, setStripePaymentModalOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Settings state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [notificationPrefs, setNotificationPrefs] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    smsAlerts: false
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [contactForm, setContactForm] = useState({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
  
  // Header dropdowns state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef(null);
  
  // Notifications are now handled by CustomerNotificationDropdown component
  
  const mainContentRef = useRef(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  // Cart context
  const { cart, addItem, updateItem, removeItem, emptyCart, loading } = useCart();

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        const scrolled = mainContentRef.current.scrollTop;
        setParallaxOffset(scrolled * 0.5);
      }
    };

    const mainContent = mainContentRef.current;
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Show notification - defined early so other functions can use it
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    const confirmed = window.confirm('Are you sure? This will permanently delete your account.');
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      await deleteAccountApi();
      showNotification('Account deleted successfully', 'success');
      onLogout();
    } catch (err) {
      const message = err?.message || 'Failed to delete account. Please try again.';
      showNotification(message, 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleProfileUpdate = () => {
    showNotification('Profile updated successfully!', 'success');
  };

  const handlePasswordChange = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      showNotification('Please fill all password fields', 'error');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    showNotification('Password changed successfully!', 'success');
    setShowPasswordModal(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const toggleNotificationPref = (key) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    showNotification('Notification preferences updated', 'success');
  };

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    showNotification(twoFactorEnabled ? '2FA disabled' : '2FA enabled successfully!', 'success');
  };

  const handleQuickLink = (label) => {
    switch(label) {
      case 'Help Center':
        setShowHelpCenter(true);
        break;
      case 'Privacy Policy':
        setShowPrivacyPolicy(true);
        break;
      case 'Terms of Service':
        setShowTermsOfService(true);
        break;
      case 'Contact Support':
        setShowContactSupport(true);
        break;
      default:
        showNotification(`Opening ${label}...`, 'success');
    }
  };

  const handleContactSubmit = () => {
    if (!contactForm.subject || !contactForm.message) {
      showNotification('Please fill in subject and message', 'error');
      return;
    }
    showNotification('Support request submitted successfully!', 'success');
    setShowContactSupport(false);
    setContactForm({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
  };

  // Load addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await getAddresses();
        if (response.success && response.data) {
          setAddresses(response.data.addresses || []);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        // Fallback to empty array if error
        setAddresses([]);
      }
    };
    fetchAddresses();
  }, []);

  // Fetch products and find top discounted items
  useEffect(() => {
    const fetchTopDiscountedProducts = async () => {
      try {
        setDiscountedLoading(true);
        const response = await getProducts({ limit: 100 });
        if (response.success && response.data?.products) {
          // Calculate discount percentage for each product and filter those with discounts
          const productsWithDiscount = response.data.products
            .filter(product => product.comparePrice && product.comparePrice > product.price)
            .map(product => ({
              ...product,
              discountPercentage: Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
            }))
            .sort((a, b) => b.discountPercentage - a.discountPercentage)
            .slice(0, 4); // Get top 4 discounted products
          
          setTopDiscountedProducts(productsWithDiscount);
        }
      } catch (err) {
        console.error('Error fetching discounted products:', err);
      } finally {
        setDiscountedLoading(false);
      }
    };
    fetchTopDiscountedProducts();
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setOrdersLoading(true);
      const response = await getMyOrders(page, 10);
      // Handle response structure: { success, message, data: { orders, pagination } }
      const ordersData = response.data || response;
      setOrders(ordersData.orders || []);
      setOrdersPagination(ordersData.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Fetch user reviews
  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const response = await getUserReviews();
      const reviewsData = response.data || response;
      setUserReviews(reviewsData.reviews || []);

       // Fetch pending reviews
       const pendingResponse = await getPendingReviews();
       const pendingData = pendingResponse.data || pendingResponse;
       setPendingReviews(pendingData || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setUserReviews([]);
       setPendingReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, fetchReviews]);

  

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      showNotification('Review deleted successfully', 'success');
      fetchReviews();
    } catch (err) {
      showNotification(err.message || 'Failed to delete review', 'error');
    }
  };

  // Save address with validation
  const handleSaveAddress = async () => {
    // Validate form fields
    const errors = {};
    
    if (!addressForm.fullName || addressForm.fullName.trim() === '') {
      errors.fullName = 'Full name is required';
    }
    
    if (!addressForm.phone || addressForm.phone.trim() === '') {
      errors.phone = 'Phone number is required';
    } else {
      // Validate phone number has enough digits
      const digitCount = addressForm.phone.replace(/\D/g, '').length;
      if (digitCount < 7) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (!addressForm.address || addressForm.address.trim() === '') {
      errors.address = 'Street address is required';
    }
    
    if (!addressForm.city || addressForm.city.trim() === '') {
      errors.city = 'City is required';
    }

    // If there are errors, show them and return
    if (Object.keys(errors).length > 0) {
      setAddressFormErrors(errors);
      showNotification('Please fill in all required fields correctly', 'error');
      return;
    }

    // Clear any previous errors
    setAddressFormErrors({});

    try {
      const addressData = {
        addressType: addressForm.addressType || 'home',
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        street: addressForm.address,
        city: addressForm.city,
        state: addressForm.state || '',
        zipCode: addressForm.postalCode || '',
        country: addressForm.country || 'United States',
        isDefault: addressForm.isDefault || false
      };

      let response;
      
      if (editingAddress) {
        // Update existing address
        response = await updateAddress(editingAddress._id, addressData);
        showNotification('Address updated successfully', 'success');
      } else {
        // Add new address
        response = await addAddress(addressData);
        showNotification('Address added successfully', 'success');
      }

      if (response.success && response.data) {
        setAddresses(response.data.addresses || []);
      }

      setShowAddressModal(false);
      setEditingAddress(null);
      resetAddressForm();
    } catch (error) {
      console.error('Error saving address:', error);
      showNotification(error.message || 'Failed to save address', 'error');
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await deleteAddress(addressId);
      
      if (response.success && response.data) {
        setAddresses(response.data.addresses || []);
        showNotification('Address deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showNotification(error.message || 'Failed to delete address', 'error');
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await setDefaultAddress(addressId);
      
      if (response.success && response.data) {
        setAddresses(response.data.addresses || []);
        showNotification('Default address updated', 'success');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      showNotification(error.message || 'Failed to set default address', 'error');
    }
  };

  // Edit address
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      addressType: address.addressType || 'home',
      label: address.addressType ? address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1) : 'Home',
      fullName: address.fullName,
      phone: address.phone,
      address: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault
    });
    setShowAddressModal(true);
  };

  // Reset address form
  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      fullName: user?.name || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
      isDefault: false
    });
    setAddressFormErrors({});
  };

  // Open add address modal
  const openAddAddressModal = () => {
    setEditingAddress(null);
    resetAddressForm();
    setShowAddressModal(true);
  };

  // Load wishlist from localStorage
  useEffect(() => {
    const loadWishlist = () => {
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(saved);
    };
    loadWishlist();
    
    // Listen for storage changes (from other tabs or ProductDetails)
    window.addEventListener('storage', loadWishlist);
    
    // Also listen for custom wishlist update event
    const handleWishlistUpdate = () => loadWishlist();
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('storage', loadWishlist);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  // Load recently viewed products from localStorage
  useEffect(() => {
    const loadRecentlyViewed = () => {
      const saved = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setRecentlyViewed(saved);
    };
    loadRecentlyViewed();
    window.addEventListener('storage', loadRecentlyViewed);
    return () => window.removeEventListener('storage', loadRecentlyViewed);
  }, []);

  // Refresh wishlist when tab changes to wishlist
  useEffect(() => {
    if (activeTab === 'wishlist') {
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(saved);
    }
    if (activeTab === 'recently-viewed') {
      const saved = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setRecentlyViewed(saved);
    }
  }, [activeTab]);

  // Remove from wishlist
  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(item => item._id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlist(updated);
    showNotification('Removed from wishlist', 'success');
  };

  // Toggle wishlist (add/remove product)
  const handleWishlistToggle = (product) => {
    const isInWishlist = wishlist.some(item => item._id === product._id);
    let updated;
    
    if (isInWishlist) {
      updated = wishlist.filter(item => item._id !== product._id);
      showNotification('Removed from wishlist', 'success');
    } else {
      const productToSave = {
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category,
        ratings: product.ratings,
      };
      updated = [...wishlist, productToSave];
      
      // Trigger random badge animation
      triggerBadgeAnimation(setWishlistBadgeAnimation);
      
      showNotification('Added to wishlist!', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlist(updated);
  };

  // Remove from recently viewed
  const removeFromRecentlyViewed = (productId) => {
    const updated = recentlyViewed.filter(item => item._id !== productId);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    setRecentlyViewed(updated);
    showNotification('Removed from recently viewed', 'success');
  };

  // Track product view
  const trackProductView = (product) => {
    const productToSave = {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category,
      ratings: product.ratings,
      viewedAt: Date.now()
    };
    
    const existing = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = existing.filter(item => item._id !== product._id);
    const updated = [productToSave, ...filtered].slice(0, 20); // Keep last 20
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    setRecentlyViewed(updated);
  };

  // Add wishlist item to cart
  const addWishlistItemToCart = async (item) => {
    const result = await addItem(item._id, 1);
    if (result.success) {
      // Trigger random badge animation
      triggerBadgeAnimation(setCartBadgeAnimation);
      
      showNotification(`Added ${item.name} to cart!`, 'success');
    } else {
      showNotification(result.message || 'Failed to add to cart', 'error');
    }
  };
  
  // Store catalog state to preserve when navigating back from product details
  const catalogStateRef = useRef({
    currentPage: 1,
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'popularity',
    scrollPosition: 0,
  });

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleProductClick = (product) => {
    // Save scroll position before navigating to product details
    catalogStateRef.current.scrollPosition = window.scrollY;
    trackProductView(product);
    setSelectedProduct(product);
    setActiveTab('catalog');
  };
  
  // Scroll to top when product is selected
  useEffect(() => {
    if (selectedProduct) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0);
    }
  }, [selectedProduct]);
  
  // Handle catalog state changes
  const handleCatalogStateChange = (newState) => {
    catalogStateRef.current = { ...catalogStateRef.current, ...newState };
  };

  const handleAddToCart = async (product, quantity) => {
    const result = await addItem(product._id, quantity);
    if (result.success) {
      // Trigger random badge animation
      triggerBadgeAnimation(setCartBadgeAnimation);
      
      showNotification(`Added ${quantity}x ${product.name} to cart!`, 'success');
    } else {
      showNotification(result.message || 'Failed to add item to cart', 'error');
    }
  };

  // Format price helper
  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(price);
  }, []);

  // Handle quantity update from CartItem
  const handleUpdateQuantity = useCallback((itemId, quantity) => {
    updateItem(itemId, quantity);
  }, [updateItem]);

  // Handle remove item from CartItem
  const handleRemoveItem = useCallback((itemId) => {
    removeItem(itemId);
    showNotification('Item removed from cart', 'success');
  }, [removeItem]);

  // Navigation items for sidebar
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'catalog', label: 'Browse Products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'orders', label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', badge: wishlist.length > 0 ? wishlist.length : null },
    { id: 'cart', label: 'Shopping Cart', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', badge: cart.itemCount },
    { id: 'recently-viewed', label: 'Recently Viewed', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', badge: recentlyViewed.length > 0 ? recentlyViewed.length : null },
    { id: 'reviews', label: 'Reviews & Ratings', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { id: 'addresses', label: 'Addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'settings', label: 'Account Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  // Stats data - dynamic values
  const stats = [
    { 
      title: 'Cart Items', 
      value: cart.itemCount?.toString() || '0', 
      change: cart.itemCount > 0 ? 'Ready to checkout' : 'Start shopping', 
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', 
      color: 'blue', 
      bgColor: 'bg-primary-100', 
      textColor: 'text-primary-600',
      onClick: () => setActiveTab('cart')
    },
    { 
      title: 'Wishlist Items', 
      value: wishlist.length.toString(), 
      change: wishlist.length > 0 ? 'Check them out!' : 'Add items', 
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', 
      color: 'red', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-600',
      onClick: () => setActiveTab('wishlist')
    },
    { 
      title: 'Cart Total', 
      value: formatPrice(cart.totalPrice || 0), 
      change: `${cart.itemCount || 0} items`, 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
      color: 'green', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-600',
      onClick: () => setActiveTab('cart')
    },
    { 
      title: 'Member Since', 
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'New', 
      change: 'Welcome!', 
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
      color: 'yellow', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-600',
      onClick: () => setActiveTab('settings')
    },
  ];

  // Get current page title based on activeTab
  const getPageTitle = () => {
    const tab = navItems.find(item => item.id === activeTab);
    return tab ? tab.label : 'Dashboard';
  };

  // Render Overview Content
  const renderOverviewContent = () => (
    <>
      {/* Premium Welcome Banner with Full 3D Effects */}
      <div className="relative rounded-3xl mb-6 overflow-hidden perspective-container" style={{ minHeight: '240px' }}>
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 animate-gradient-shift"></div>
        
        {/* 3D Floating Spheres */}
        <div className="absolute top-8 right-10 w-24 h-24 bg-gradient-to-br from-primary-300/20 to-primary-500/30 rounded-full backdrop-blur-sm border border-cream/20 animate-float-sphere shadow-2xl transform-3d"></div>
        <div className="absolute top-28 right-32 w-16 h-16 bg-gradient-to-br from-cream/15 to-primary-400/25 rounded-full backdrop-blur-md border border-cream/20 animate-float-sphere shadow-2xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-16 right-20 w-20 h-20 bg-gradient-to-br from-primary-400/20 to-pink-500/20 rounded-full backdrop-blur-sm border border-cream/15 animate-float-sphere shadow-2xl" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-16 left-20 w-18 h-18 bg-gradient-to-br from-cream/20 to-primary-300/25 rounded-full backdrop-blur-sm border border-cream/20 animate-float-sphere shadow-2xl" style={{ animationDelay: '1s' }}></div>

        {/* Soft Neon Rings */}
        <div className="absolute top-12 left-16 w-32 h-32 rounded-full border-4 border-cream/30 animate-neon-ring" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full border-3 border-primary-300/40 animate-neon-ring" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-28 h-28 rounded-full border-4 border-cream/20 animate-rotate-ring"></div>
        <div className="absolute bottom-24 right-16 w-20 h-20 rounded-full border-3 border-primary-400/35 animate-neon-ring" style={{ animationDelay: '2.5s' }}></div>

        {/* Gradient Triangles */}
        <div className="absolute top-10 left-1/3 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent border-b-primary-400/20 animate-triangle-float backdrop-blur-sm"></div>
        <div className="absolute bottom-14 right-1/3 w-0 h-0 border-l-[25px] border-r-[25px] border-b-[40px] border-l-transparent border-r-transparent border-b-cream/15 animate-triangle-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-20 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-primary-300/18 animate-triangle-float" style={{ animationDelay: '3s' }}></div>

        {/* Floating Squiggles */}
        <svg className="absolute top-1/4 left-1/4 w-20 h-20 opacity-30 animate-squiggle" viewBox="0 0 100 100">
          <path d="M10,50 Q30,20 50,50 T90,50" stroke="rgba(255, 246, 233, 0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
        <svg className="absolute bottom-1/3 right-1/4 w-16 h-16 opacity-25 animate-squiggle" viewBox="0 0 100 100" style={{ animationDelay: '3s' }}>
          <path d="M10,50 Q30,80 50,50 T90,50" stroke="rgba(189, 168, 183, 0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
        <svg className="absolute top-1/2 left-12 w-18 h-18 opacity-28 animate-squiggle" viewBox="0 0 100 100" style={{ animationDelay: '1.5s' }}>
          <path d="M20,30 Q40,60 60,30 T100,30" stroke="rgba(255, 246, 233, 0.4)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>

        {/* Glow Dots */}
        <div className="absolute top-6 left-8 w-3 h-3 bg-cream/60 rounded-full animate-glow-pulse shadow-lg"></div>
        <div className="absolute top-16 right-40 w-2 h-2 bg-primary-300/70 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-12 left-1/3 w-2.5 h-2.5 bg-cream/50 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-28 right-14 w-2 h-2 bg-primary-200/60 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-14 w-3 h-3 bg-cream/70 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-20 left-1/2 w-2 h-2 bg-primary-400/65 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-cream/55 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '0.8s' }}></div>

        {/* Animated Curved Line Waves */}
        <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path fill="rgba(255, 246, 233, 0.1)">
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,80 Q360,40 720,80 T1440,80 L1440,200 L0,200 Z;
                M0,120 Q360,160 720,120 T1440,120 L1440,200 L0,200 Z;
                M0,80 Q360,40 720,80 T1440,80 L1440,200 L0,200 Z
              "
            />
          </path>
        </svg>
        <svg className="absolute bottom-0 left-0 w-full opacity-15" viewBox="0 0 1440 180" preserveAspectRatio="none">
          <path fill="rgba(189, 168, 183, 0.1)">
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,60 Q360,100 720,60 T1440,60 L1440,180 L0,180 Z;
                M0,100 Q360,60 720,100 T1440,100 L1440,180 L0,180 Z;
                M0,60 Q360,100 720,60 T1440,60 L1440,180 L0,180 Z
              "
            />
          </path>
        </svg>

        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(189, 168, 183, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255, 246, 233, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, rgba(59, 28, 50, 0.2) 0%, transparent 50%)`
        }}></div>

        {/* Glow Accent Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cream/50 to-transparent animate-shimmer"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-300/40 to-transparent animate-shimmer-delayed"></div>
        
        {/* Glassmorphism Content Card */}
        <div className="relative backdrop-blur-sm bg-cream/5 border border-cream/10 rounded-3xl shadow-2xl p-6 sm:p-8 m-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
            {/* Left Content with Animation */}
            <div className="flex-1 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-cream/10 backdrop-blur-md rounded-full border border-cream/20">
                <span className="text-xs font-medium text-cream/90 tracking-wide uppercase">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cream mb-3 drop-shadow-lg">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cream to-primary-100 animate-gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>!
              </h2>
              
              <p className="text-cream/80 text-sm sm:text-base max-w-md leading-relaxed drop-shadow-md">
                Check out today's deals and manage your orders from your personalized dashboard.
              </p>
              
              {/* Animated Stats Bar */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-2 text-cream/70 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow shadow-lg shadow-green-400/50"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2 text-cream/70 text-xs">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span>{cart.itemCount || 0} items in cart</span>
                </div>
              </div>
            </div>

            {/* Right Side - Premium Button & Quick Stats */}
            <div className="flex-shrink-0 flex flex-col items-center sm:items-end gap-4 animate-slide-in-right relative z-20">
              {/* Premium CTA Button */}
              <button
                onClick={() => setActiveTab('catalog')}
                className="group/btn relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cream to-primary-50 text-primary-800 font-bold rounded-2xl overflow-hidden shadow-2xl hover:shadow-cream/30 transition-all duration-500 hover:scale-110 hover:-translate-y-2 border-2 border-cream/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100 via-cream to-primary-100 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cream/50 to-transparent opacity-0 group-hover/btn:opacity-100 animate-shimmer"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-400/50 to-primary-600/50 rounded-2xl blur opacity-0 group-hover/btn:opacity-75 transition-opacity duration-500"></div>
                
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <svg className="w-6 h-6 group-hover/btn:rotate-12 group-hover/btn:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <div className="absolute inset-0 bg-primary-600/30 blur-lg group-hover/btn:bg-primary-400/50 transition-all duration-300"></div>
                  </div>
                  <span className="text-base sm:text-lg tracking-wide">Start Shopping</span>
                  <svg className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <div className="absolute top-1 right-1 w-1 h-1 bg-cream rounded-full opacity-0 group-hover/btn:opacity-100 animate-ping"></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-cream rounded-full opacity-0 group-hover/btn:opacity-100 animate-ping" style={{ animationDelay: '0.3s' }}></div>
              </button>
              
              {/* Floating Quick Stats */}
              <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="px-4 py-2 bg-gradient-to-br from-cream/10 to-primary-500/10 backdrop-blur-md rounded-xl border border-cream/20 text-cream text-xs font-medium shadow-lg hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>{cart.itemCount || 0} Items</span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gradient-to-br from-cream/10 to-primary-500/10 backdrop-blur-md rounded-xl border border-cream/20 text-cream text-xs font-medium shadow-lg hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatPrice(cart.totalPrice || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cream/10 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cream/10 rounded-br-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`relative overflow-hidden rounded-2xl shadow-lg p-4 sm:p-5 border transition-all duration-300 group cursor-pointer hover:scale-105 hover:shadow-xl ${darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream/90 backdrop-blur-sm border-gray-100'}`}
          >
            {/* Floating orb background */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity ${stat.bgColor}`}></div>
            <div className={`absolute -bottom-5 -left-5 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity ${stat.bgColor}`}></div>
            
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
              background: `linear-gradient(45deg, transparent, ${stat.textColor === 'text-primary-600' ? 'rgba(176, 31, 75, 0.1)' : stat.textColor === 'text-green-600' ? 'rgba(34, 197, 94, 0.1)' : stat.textColor === 'text-blue-600' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(202, 138, 4, 0.1)'}, transparent)`,
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite'
            }}></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className={`relative w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  {/* Icon glow */}
                  <div className="absolute inset-0 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" style={{
                    backgroundColor: stat.textColor === 'text-primary-600' ? 'rgba(176, 31, 75, 0.3)' : stat.textColor === 'text-green-600' ? 'rgba(34, 197, 94, 0.3)' : stat.textColor === 'text-blue-600' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(202, 138, 4, 0.3)'
                  }}></div>
                  <svg className={`relative w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-lg backdrop-blur-sm ${darkMode ? 'bg-dark-700/50 text-primary-200' : 'bg-gray-50 text-gray-400'}`}>{stat.change}</span>
              </div>
              <p className={`text-xs sm:text-sm font-medium mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
              <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{stat.value}</p>
            </div>

            {/* Decorative dots */}
            <div className="absolute top-2 right-2 w-1 h-1 bg-primary-300/50 rounded-full animate-glow-pulse"></div>
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-accent-400/40 rounded-full animate-glow-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Recent Orders */}
        <div className={`relative lg:col-span-2 rounded-2xl shadow-lg border overflow-hidden group ${darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream/90 backdrop-blur-sm border-gray-100'}`}>
          {/* Abstract floating shapes */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-primary-400/10 to-transparent rounded-full blur-2xl opacity-20"></div>
          
          <div className={`relative z-10 p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
            <h3 className={`text-base font-semibold flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
              <div className="relative mr-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="absolute inset-0 blur-md bg-primary-500/30 animate-pulse-slow"></div>
              </div>
              Your Cart ({cart.itemCount || 0} items)
            </h3>
            <button onClick={() => setActiveTab('cart')} className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">View Cart</button>
          </div>
          <div className={`relative z-10 divide-y ${darkMode ? 'divide-dark-700' : 'divide-gray-50'}`}>
            {cart.items.length === 0 ? (
              <div className="p-8 text-center">
                <svg className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-dark-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your cart is empty</p>
                <button onClick={() => setActiveTab('catalog')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Start Shopping →</button>
              </div>
            ) : (
              cart.items.slice(0, 3).map((item) => (
                <div key={item._id} className={`p-4 transition-colors ${darkMode ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${darkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
                        {item.product?.images?.[0]?.url ? (
                          <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className={`w-5 h-5 ${darkMode ? 'text-dark-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.product?.name || 'Product'}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Qty: {item.quantity} × {formatPrice(item.product?.price || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatPrice((item.product?.price || 0) * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {cart.items.length > 3 && (
              <div className={`p-3 text-center ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
                <button onClick={() => setActiveTab('cart')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  +{cart.items.length - 3} more items in cart
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`relative rounded-2xl shadow-lg border p-4 sm:p-5 overflow-hidden group ${darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream/90 backdrop-blur-sm border-gray-100'}`}>
          {/* Floating geometric shapes */}
          <div className="absolute top-5 right-5 w-16 h-16 border-2 border-primary-300/20 rounded-lg rotate-12 animate-float-sphere"></div>
          <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-gradient-to-br from-accent-500/10 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-2 w-2 h-2 bg-primary-400/50 rounded-full animate-glow-pulse"></div>
          
          <h3 className={`relative z-10 text-base font-semibold mb-4 flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
            <div className="relative mr-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute inset-0 blur-md bg-primary-500/30 animate-pulse-slow"></div>
            </div>
            Quick Actions
          </h3>
          <div className="relative z-10 space-y-2">
            {[ 
              { label: 'Browse Products', icon: 'SVG', color: 'bg-primary-50 hover:bg-primary-100 border-primary-100', tab: 'catalog' },
              { label: 'Track Orders', icon: 'PKG', color: 'bg-green-50 hover:bg-green-100 border-green-100', tab: 'orders' },
              { label: 'View Wishlist', icon: 'HEART', color: 'bg-red-50 hover:bg-red-100 border-red-100', tab: 'wishlist' },
              { label: 'Get Support', icon: 'CHAT', color: 'bg-purple-50 hover:bg-purple-100 border-purple-100', tab: null },
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.tab) {
                    setActiveTab(action.tab);
                  } else if (action.label === 'Get Support') {
                    setShowContactSupport(true);
                  }
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-2xl border transition-all
                  ${darkMode
                    ? 'bg-dark-700/70 border-dark-600 text-primary-100 hover:bg-dark-700'
                    : `${action.color} text-gray-900`}
                `}
              >
                {action.icon === 'SVG' && (
                  <svg className="w-5 h-5 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
                {action.icon === 'PKG' && (
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
                {action.icon === 'HEART' && (
                  <svg className="w-5 h-5 mr-3 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                {action.icon === 'CHAT' && (
                  <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-primary-100' : 'text-gray-700'
                }`}>{action.label}</span>
                <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wishlist Preview */}
      <div className={`rounded-xl shadow-md border overflow-hidden ${darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'}`}>
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
          <h3 className={`text-base font-semibold flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Your Wishlist ({wishlist.length})
          </h3>
          <button onClick={() => setActiveTab('wishlist')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View All
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {wishlist.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-sm text-gray-500 mb-3">No items in wishlist</p>
              <button onClick={() => setActiveTab('catalog')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Browse Products →</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {wishlist.slice(0, 4).map((product) => (
                <div
                  key={product._id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setActiveTab('catalog');
                  }}
                  className="group cursor-pointer bg-gray-50 rounded-2xl p-3 hover:bg-cream hover:shadow-md border border-transparent hover:border-blue-100 transition-all"
                >
                  <div className="relative aspect-square mb-2 rounded-2xl overflow-hidden bg-gray-100">
                    <img 
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/100'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <span className="absolute top-1 right-1 bg-red-500 p-1 rounded-full">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </span>
                  </div>
                  <h4 className={`text-xs font-medium mb-1 truncate ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>{product.name}</h4>
                  <span className="text-sm font-bold text-primary-600">{formatPrice(product.price)}</span>
                </div>
              ))}
            </div>
          )}
          {wishlist.length > 4 && (
            <div className="mt-3 text-center">
              <button onClick={() => setActiveTab('wishlist')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                +{wishlist.length - 4} more in wishlist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Discounted Products */}
      <div className={`rounded-xl shadow-md border overflow-hidden mt-6 ${darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'}`}>
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
          <h3 className={`text-base font-semibold flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Top Discounts
          </h3>
          <button onClick={() => setActiveTab('catalog')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View All
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {discountedLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading deals...</p>
            </div>
          ) : topDiscountedProducts.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-sm text-gray-500 mb-3">No discounted items available</p>
              <button onClick={() => setActiveTab('catalog')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Browse Products →</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topDiscountedProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setActiveTab('catalog');
                  }}
                  className="group cursor-pointer bg-gray-50 rounded-2xl p-3 hover:bg-cream hover:shadow-md border border-transparent hover:border-green-100 transition-all"
                >
                  <div className="relative aspect-square mb-2 rounded-2xl overflow-hidden bg-gray-100">
                    <img 
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/100'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-orange-500 text-cream text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      -{product.discountPercentage}%
                    </span>
                  </div>
                  <h4 className={`text-xs font-medium mb-1 truncate ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>{product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">{formatPrice(product.price)}</span>
                    <span className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render content based on activeTab
  const renderMainContent = () => {
    return (
      <>
        {/* Product Details - shown when a product is selected */}
        {selectedProduct && (
          <div>
            <ProductDetails
              product={selectedProduct}
              onBack={() => {
                setSelectedProduct(null);
                // Restore scroll position after a short delay
                setTimeout(() => {
                  window.scrollTo({ top: catalogStateRef.current.scrollPosition, behavior: 'smooth' });
                }, 50);
              }}
              onAddToCart={handleAddToCart}
              onRelatedProductClick={handleProductClick}
              isInWishlist={wishlist.some(p => p._id === selectedProduct._id)}
              onWishlistToggle={handleWishlistToggle}
            />
          </div>
        )}
        
        {/* Product Catalog - always mounted but hidden when viewing details */}
        <div style={{ display: activeTab === 'catalog' && !selectedProduct ? 'block' : 'none' }}>
          <ProductCatalog 
            onProductClick={handleProductClick} 
            onStateChange={handleCatalogStateChange}
            darkMode={darkMode}
          />
        </div>

        {/* Other tabs - only show when not viewing catalog or product details */}
        {!selectedProduct && activeTab !== 'catalog' && (
          <>
            {activeTab === 'overview' && renderOverviewContent()}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Orders Header */}
                <div className={`rounded-xl shadow-md border p-6 ${
                  darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className={`text-xl font-bold ${
                        darkMode ? 'text-primary-100' : 'text-gray-900'
                      }`}>My Orders</h2>
                      <p className={`text-sm mt-1 ${
                        darkMode ? 'text-primary-200/60' : 'text-gray-500'
                      }`}>Track and manage your orders</p>
                    </div>
                    <div className="flex gap-2">
                      <select className={`px-4 py-2 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-dark-700 border-dark-600 text-primary-100' : 'bg-cream border-gray-200 text-gray-900'
                      }`}>
                        <option value="all">All Orders</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {ordersLoading ? (
                  <div className={`rounded-xl shadow-md border p-12 text-center ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                  }`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className={`${
                      darkMode ? 'text-primary-100' : 'text-gray-600'
                    }`}>Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className={`rounded-xl shadow-md border p-12 text-center ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                  }`}>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      darkMode ? 'text-primary-100' : 'text-gray-900'
                    }`}>No orders yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">When you place an order, it will appear here for you to track and manage.</p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-6 py-2.5 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const getStatusColor = (status) => {
                        const colors = {
                          pending: 'bg-yellow-100 text-yellow-800',
                          processing: 'bg-blue-100 text-blue-800',
                          shipped: 'bg-purple-100 text-purple-800',
                          delivered: 'bg-green-100 text-green-800',
                          cancelled: 'bg-red-100 text-red-800',
                        };
                        return colors[status] || 'bg-gray-100 text-gray-800';
                      };

                      const orderStatus = order.orderStatus || order.status || 'pending';

                      return (
                        <div key={order._id} className={`rounded-xl shadow-md border overflow-hidden ${
                          darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                        }`}>
                          <div className={`p-4 sm:p-6 border-b ${
                            darkMode ? 'border-dark-700 bg-dark-700/50' : 'border-primary-100 bg-primary-50'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                                <div>
                                  <p className={`font-semibold ${
                                    darkMode ? 'text-primary-100' : 'text-gray-900'
                                  }`}>Order #{order.orderNumber || order._id?.slice(-8)}</p>
                                  <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(orderStatus)}`}>
                                  {orderStatus}
                                </span>
                                <span className={`text-lg font-bold ${
                                  darkMode ? 'text-primary-100' : 'text-gray-900'
                                }`}>{formatPrice(order.totalPrice || 0)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 sm:p-6">
                            <div className="space-y-4">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div key={item._id || index} className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                                    {item.image || item.product?.images?.[0]?.url ? (
                                      <img src={item.image || item.product?.images?.[0]?.url} alt={item.name || item.product?.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${
                                      darkMode ? 'text-primary-100' : 'text-gray-900'
                                    }`}>{item.name || item.product?.name || 'Product'}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatPrice(item.price || 0)}</p>
                                  </div>
                                  <p className={`font-semibold ${
                                    darkMode ? 'text-primary-100' : 'text-gray-900'
                                  }`}>{formatPrice((item.price || 0) * item.quantity)}</p>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-sm text-gray-500 text-center pt-2">+{order.items.length - 3} more items</p>
                              )}
                            </div>
                            {/* Always show Cancel button in card, below items */}
                            <div className="flex justify-center mt-6">
                              <button
                                onClick={() => {
                                  setCancelOrderId(order._id);
                                  setShowCancelModal(true);
                                }}
                                className="px-6 py-2 border border-red-200 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Cancel Order
                              </button>
                            </div>
                            
                            {/* Order Actions - Centered Cancel Button */}
                            {/* No longer needed: pending-only cancel button, handled above */}
                                {/* Cancel Order Confirmation Modal */}
                                <ConfirmCancelModal
                                  open={showCancelModal}
                                  darkMode={darkMode}
                                  loading={cancelLoading}
                                  onClose={() => {
                                    setShowCancelModal(false);
                                    setCancelOrderId(null);
                                  }}
                                  onConfirm={async () => {
                                    if (!cancelOrderId) return;
                                    setCancelLoading(true);
                                    try {
                                      await cancelOrder(cancelOrderId);
                                      try {
                                        const notificationService = await import('../services/notificationService');
                                        await notificationService.default.getNotifications();
                                        await notificationService.default.getNotifications('order_cancelled');
                                      } catch (err) {
                                        console.error('Failed to notify admin:', err);
                                      }
                                      fetchOrders();
                                      showNotification('Order cancelled successfully', 'success');
                                    } catch (err) {
                                      showNotification('Failed to cancel order', 'error');
                                    } finally {
                                      setCancelLoading(false);
                                      setShowCancelModal(false);
                                      setCancelOrderId(null);
                                    }
                                  }}
                                />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'wishlist' && (
              <div className={`rounded-xl shadow-md border p-6 ${
                darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>Wishlist</h2>
                  <span className="text-sm text-gray-500">{wishlist.length} items</span>
                </div>
                
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-6 py-2 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <div key={item._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div 
                          className="aspect-square bg-gray-100 rounded-2xl mb-3 overflow-hidden cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(item);
                            setActiveTab('catalog');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <img
                            src={item.images?.[0]?.url || 'https://via.placeholder.com/200'}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 
                          className={`font-semibold mb-1 truncate cursor-pointer hover:text-primary-600 transition-colors ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}
                          onClick={() => {
                            setSelectedProduct(item);
                            setActiveTab('catalog');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {item.name}
                        </h3>
                        <p className={`text-sm mb-2 ${
                          darkMode ? 'text-primary-200/80' : 'text-gray-500'
                        }`}>{item.category?.name || 'Uncategorized'}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-primary-600">{formatPrice(item.price)}</span>
                          {item.ratings?.average > 0 && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {item.ratings.average.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addWishlistItemToCart(item)}
                            className="flex-1 py-2 px-3 bg-primary-600 text-cream text-sm font-medium rounded-2xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromWishlist(item._id)}
                            className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 rounded-2xl hover:border-red-500 transition-colors"
                            title="Remove from wishlist"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'recently-viewed' && (
              <div className={`rounded-xl shadow-md border p-6 ${
                darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>Recently Viewed</h2>
                  <span className="text-sm text-gray-500">{recentlyViewed.length} items</span>
                </div>
                
                {recentlyViewed.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No recently viewed products</p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-6 py-2 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentlyViewed.map((item) => (
                      <div key={item._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div 
                          className="aspect-square bg-gray-100 rounded-2xl mb-3 overflow-hidden cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(item);
                            setActiveTab('catalog');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <img
                            src={item.images?.[0]?.url || 'https://via.placeholder.com/200'}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 
                          className={`font-semibold mb-1 truncate cursor-pointer hover:text-primary-600 transition-colors ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}
                          onClick={() => {
                            setSelectedProduct(item);
                            setActiveTab('catalog');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{item.category?.name || 'Uncategorized'}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-primary-600">{formatPrice(item.price)}</span>
                          {item.ratings?.average > 0 && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {item.ratings.average.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addWishlistItemToCart(item)}
                            className="flex-1 py-2 px-3 bg-primary-600 text-cream text-sm font-medium rounded-2xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromRecentlyViewed(item._id)}
                            className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 rounded-2xl hover:border-red-500 transition-colors"
                            title="Remove from history"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'cart' && (
              <div className={`rounded-xl shadow-md border p-6 ${
                darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>Shopping Cart</h2>
                  {cart.items.length > 0 && (
                    <button
                      onClick={async () => {
                        const result = await emptyCart();
                        if (result.success) {
                          showNotification('Cart cleared successfully', 'success');
                        }
                      }}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>
                
                {loading && cart.items.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                  </div>
                ) : cart.items.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-6 py-2 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items */}
                {cart.items.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    formatPrice={formatPrice}
                    darkMode={darkMode}
                  />
                ))}                    {/* Cart Summary */}
                    <div className={`pt-6 mt-6 rounded-2xl p-4 border ${darkMode ? 'border-dark-700 bg-dark-700/60' : 'border-gray-200 bg-cream'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className={darkMode ? 'text-primary-200/80' : 'text-gray-600'}>Subtotal ({cart.items.length} items)</span>
                        <span className={`font-bold text-xl ${
                          darkMode ? 'text-primary-100' : 'text-gray-900'
                        }`}>
                          {formatPrice(cart.totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-4 text-sm">
                        <span className={darkMode ? 'text-primary-200/70' : 'text-gray-500'}>Shipping</span>
                        <span className={darkMode ? 'text-primary-100' : 'text-gray-700'}>{cart.totalPrice >= 5000 ? 'Free' : 'Rs. 200'}</span>
                      </div>
                      <div className={`flex justify-between items-center pt-4 border-t ${darkMode ? 'border-dark-600' : 'border-gray-200'}`}>
                        <span className={`text-lg font-bold ${
                          darkMode ? 'text-primary-100' : 'text-gray-900'
                        }`}>Total</span>
                        <span className="font-bold text-2xl text-primary-600">
                          {formatPrice(cart.totalPrice >= 5000 ? cart.totalPrice : cart.totalPrice + 200)}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          // Auto-select default address if available
                          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                          setSelectedAddress(defaultAddr || null);
                          setCheckoutStep(1);
                          setShowCheckout(true);
                          setPromoCode('');
                          setPromoDiscount(0);
                          setPromoError('');
                          setOrderNote('');
                        }}
                        className="cta-button-3d cta-button-primary w-full mt-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-cream font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 shadow-lg transform-gpu"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !placingOrder && setShowCheckout(false)}></div>
                <div className={`relative rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col ${darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream'}`}>
                  
                  {/* Checkout Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-xl sm:text-2xl font-bold ${
                        darkMode ? 'text-primary-100' : 'text-gray-900'
                      }`}>
                        {checkoutStep === 4 ? 'Order Confirmed!' : 'Checkout'}
                      </h2>
                      {checkoutStep !== 4 && (
                        <button 
                          onClick={() => setShowCheckout(false)}
                          disabled={placingOrder}
                          className="p-2 hover:bg-gray-100 rounded-2xl transition-colors disabled:opacity-50"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {/* Progress Steps */}
                    {checkoutStep !== 4 && (
                      <div className="flex items-center justify-between">
                        {[
                          { step: 1, label: 'Address', icon: '' },
                          { step: 2, label: 'Payment', icon: '' },
                          { step: 3, label: 'Review', icon: '' },
                        ].map((item, index) => (
                          <div key={item.step} className="flex items-center flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base font-semibold transition-colors ${
                              checkoutStep >= item.step 
                                ? 'bg-primary-600 text-cream' 
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {checkoutStep > item.step ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="hidden sm:inline">{item.icon}</span>
                              )}
                              <span className="sm:hidden">{item.step}</span>
                            </div>
                            <span className={`ml-2 text-xs sm:text-sm font-medium hidden sm:inline ${
                              checkoutStep >= item.step 
                                ? darkMode ? 'text-primary-100' : 'text-gray-900'
                                : darkMode ? 'text-primary-300' : 'text-gray-400'
                            }`}>
                              {item.label}
                            </span>
                            {index < 2 && (
                              <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                                checkoutStep > item.step ? 'bg-primary-600' : 'bg-gray-200'
                              }`}></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Checkout Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    
                    {/* Step 1: Address Selection */}
                    {checkoutStep === 1 && (
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold mb-4 ${
                          darkMode ? 'text-primary-100' : 'text-gray-900'
                        }`}>Select Delivery Address</h3>
                        
                        {addresses.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-500 mb-4">No delivery address found</p>
                            <button
                              onClick={() => {
                                setShowCheckout(false);
                                setActiveTab('addresses');
                                setTimeout(() => openAddAddressModal(), 100);
                              }}
                              className="px-6 py-2 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors"
                            >
                              Add New Address
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {addresses.map((address) => (
                              <div
                                key={address._id}
                                onClick={() => setSelectedAddress(address)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  selectedAddress?._id === address._id
                                    ? (darkMode ? 'border-primary-500 bg-dark-700/80' : 'border-blue-500 bg-blue-50')
                                    : (darkMode ? 'border-dark-700 bg-dark-700/50 hover:border-primary-500/60' : 'border-gray-200 hover:border-gray-300 bg-cream')
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    selectedAddress?._id === address._id
                                      ? (darkMode ? 'border-primary-500 bg-primary-500' : 'border-blue-500 bg-blue-500')
                                      : (darkMode ? 'border-dark-500 bg-dark-700' : 'border-gray-300')
                                  }`}>
                                    {selectedAddress?._id === address._id && (
                                      <div className="w-2 h-2 bg-cream rounded-full"></div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`font-semibold ${
                                        darkMode ? 'text-primary-100' : 'text-gray-900'
                                      }`}>{address.addressType ? address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1) : 'Address'}</span>
                                      {address.isDefault && (
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${darkMode ? 'bg-green-500/20 text-green-200' : 'bg-green-100 text-green-700'}`}>Default</span>
                                      )}
                                    </div>
                                    <p className={`text-sm ${
                                      darkMode ? 'text-primary-100' : 'text-gray-900'
                                    }`}>{address.fullName}</p>
                                    <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>{address.street}</p>
                                    <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>{address.city}, {address.state} {address.postalCode}</p>
                                    <p className={`text-sm mt-1 ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Phone: {address.phone}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Add New Address Button */}
                            <button
                              onClick={() => {
                                setShowCheckout(false);
                                setActiveTab('addresses');
                                setTimeout(() => openAddAddressModal(), 100);
                              }}
                              className={`p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                                darkMode
                                  ? 'border-dark-600 text-primary-200 hover:border-primary-500 hover:bg-dark-700/70'
                                  : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:bg-blue-50/50'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add New Address
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2: Payment Method */}
                    {checkoutStep === 2 && (
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold mb-4 ${
                          darkMode ? 'text-primary-100' : 'text-gray-900'
                        }`}>Select Payment Method</h3>
                        
                        <div className="grid gap-3">
                          {[
                            { id: 'stripe', label: 'Stripe Payment', icon: '💳', desc: 'Secure payment with Stripe', badge: 'Recommended' },
                            { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive your order', badge: 'Popular' },
                            { id: 'card', label: 'Credit/Debit Card', icon: '💳', desc: 'Visa, Mastercard, UnionPay' },
                            { id: 'jazzcash', label: 'JazzCash', icon: '📱', desc: 'Pay with JazzCash mobile wallet' },
                            { id: 'easypaisa', label: 'EasyPaisa', icon: '📱', desc: 'Pay with EasyPaisa wallet' },
                            { id: 'bank', label: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer' },
                          ].map((method) => (
                            <div
                              key={method.id}
                              onClick={() => {
                                if (stripePaymentResult) {
                                  showNotification('Payment already completed. Cannot change payment method.', 'info');
                                  return;
                                }
                                setSelectedPayment(method.id);
                              }}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                stripePaymentResult
                                  ? 'cursor-not-allowed opacity-60'
                                  : selectedPayment === method.id
                                    ? (darkMode ? 'border-primary-500 bg-dark-700/80' : 'border-blue-500 bg-blue-50')
                                    : (darkMode ? 'border-dark-700 bg-dark-700/50 hover:border-primary-500/60' : 'border-gray-200 hover:border-gray-300 bg-cream')
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  selectedPayment === method.id
                                    ? (darkMode ? 'border-primary-500 bg-primary-500' : 'border-blue-500 bg-blue-500')
                                    : (darkMode ? 'border-dark-600 bg-dark-700' : 'border-gray-300')
                                }`}>
                                  {selectedPayment === method.id && (
                                    <div className="w-2 h-2 bg-cream rounded-full"></div>
                                  )}
                                </div>
                                <span className="text-2xl">{method.icon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${
                                      darkMode ? 'text-primary-100' : 'text-gray-900'
                                    }`}>{method.label}</span>
                                    {method.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>{method.badge}</span>
                                    )}
                                  </div>
                                  <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>{method.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Payment Status Indicator */}
                        {stripePaymentResult && selectedPayment === 'stripe' && (
                          <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex-shrink-0">
                              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${darkMode ? 'text-green-200' : 'text-green-800'}`}>Payment Completed ✓</h4>
                              <p className={`text-sm ${darkMode ? 'text-green-300/80' : 'text-green-700'}`}>Your payment has been processed successfully. Transaction ID: {stripePaymentResult.transactionId}</p>
                            </div>
                          </div>
                        )}

                        {selectedPayment === 'card' && (
                          <div className={`mt-4 p-4 rounded-xl border shadow-sm space-y-3 ${darkMode ? 'bg-dark-800/90 border-dark-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: 'visa', label: 'Visa' },
                                { id: 'mastercard', label: 'Mastercard' },
                                { id: 'unionpay', label: 'UnionPay' },
                              ].map((card) => (
                                <button
                                  key={card.id}
                                  onClick={() => setCardType(card.id)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                    cardType === card.id
                                      ? 'border-primary-500 text-primary-700 bg-primary-50'
                                      : darkMode
                                        ? 'border-dark-600 text-primary-100 hover:border-dark-500'
                                        : `border-gray-200 ${darkMode ? 'text-primary-100' : 'text-gray-700'} hover:border-gray-300`
                                  }`}
                                >
                                  {card.label}
                                </button>
                              ))}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Cardholder Name</label>
                                <input
                                  type="text"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="Name on card"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Card Number</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={19}
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, ''))}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="XXXX XXXX XXXX XXXX"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Expiry (MM/YY)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value.replace(/[^0-9/]/g, ''))}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="MM/YY"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>CVC</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  value={cardCvc}
                                  onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="3-4 digits"
                                />
                              </div>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Your card details are securely processed.</p>
                          </div>
                        )}

                        {selectedPayment === 'jazzcash' && (
                          <div className={`mt-4 p-4 rounded-xl border shadow-sm space-y-3 ${darkMode ? 'bg-dark-800/90 border-dark-700' : 'bg-white border-gray-200'}`}>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>JazzCash Phone</label>
                                <input
                                  type="tel"
                                  value={jazzcashPhone}
                                  onChange={(e) => setJazzcashPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="03XX-XXXXXXX"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Transaction ID</label>
                                <input
                                  type="text"
                                  value={jazzcashTxn}
                                  onChange={(e) => setJazzcashTxn(e.target.value.trim())}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="e.g. JC123456"
                                />
                              </div>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Confirm the JazzCash number and transaction reference.</p>
                          </div>
                        )}

                        {selectedPayment === 'easypaisa' && (
                          <div className={`mt-4 p-4 rounded-xl border shadow-sm space-y-3 ${darkMode ? 'bg-dark-800/90 border-dark-700' : 'bg-white border-gray-200'}`}>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>EasyPaisa Phone</label>
                                <input
                                  type="tel"
                                  value={easypaisaPhone}
                                  onChange={(e) => setEasypaisaPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="03XX-XXXXXXX"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Transaction ID</label>
                                <input
                                  type="text"
                                  value={easypaisaTxn}
                                  onChange={(e) => setEasypaisaTxn(e.target.value.trim())}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="e.g. EP123456"
                                />
                              </div>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Provide the EasyPaisa number and transaction reference.</p>
                          </div>
                        )}

                        {selectedPayment === 'bank' && (
                          <div className={`mt-4 p-4 rounded-xl border shadow-sm space-y-3 ${darkMode ? 'bg-dark-800/90 border-dark-700' : 'bg-white border-gray-200'}`}>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Account Holder Name</label>
                                <input
                                  type="text"
                                  value={bankAccountName}
                                  onChange={(e) => setBankAccountName(e.target.value)}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="Account name"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Account Number / IBAN</label>
                                <input
                                  type="text"
                                  value={bankAccountNumber}
                                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="e.g. PK00XXXX"
                                />
                              </div>
                              <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Payment Reference</label>
                                <input
                                  type="text"
                                  value={bankReference}
                                  onChange={(e) => setBankReference(e.target.value)}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                                  placeholder="Transfer reference or note"
                                />
                              </div>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Share the bank account details and transfer reference for verification.</p>
                          </div>
                        )}

                        {selectedPayment === 'stripe' && (
                          <div className={`mt-4 p-4 rounded-xl border shadow-sm space-y-3 ${darkMode ? 'bg-dark-800/90 border-dark-700' : 'bg-white border-gray-200'}`}>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {/* Cardholder Name */}
                              <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Cardholder Name *</label>
                                <input
                                  type="text"
                                  value={stripeCardName}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setStripeCardName(value);
                                    
                                    // Real-time validation
                                    if (!value.trim()) {
                                      setStripeCardNameError('Cardholder name is required');
                                    } else if (value.trim().length < 3) {
                                      setStripeCardNameError('Name must be at least 3 characters');
                                    } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                                      setStripeCardNameError('Name can only contain letters and spaces');
                                    } else {
                                      setStripeCardNameError('');
                                    }
                                  }}
                                  disabled={stripePaymentResult !== null}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                                    stripeCardNameError 
                                      ? `border-red-500 focus:ring-red-500 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}` 
                                      : `border-gray-200 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600' : ''}`
                                  } ${darkMode ? 'text-primary-100 placeholder-primary-300/60' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
                                  placeholder="John Doe"
                                />
                                {stripeCardNameError && (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.172l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l10.1-10.1z" clipRule="evenodd" />
                                    </svg>
                                    {stripeCardNameError}
                                  </p>
                                )}
                              </div>

                              {/* Card Number */}
                              <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Card Number *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={19}
                                  value={stripeCardNumber}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9 ]/g, '');
                                    // Add spaces every 4 digits
                                    const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                                    setStripeCardNumber(formatted);
                                    
                                    // Real-time validation
                                    const cleanNumber = value.replace(/\s/g, '');
                                    if (!cleanNumber) {
                                      setStripeCardNumberError('Card number is required');
                                    } else if (cleanNumber.length < 13) {
                                      setStripeCardNumberError(`Card number must be 13-19 digits (${cleanNumber.length}/13-19)`);
                                    } else if (cleanNumber.length > 19) {
                                      setStripeCardNumberError('Card number is too long');
                                    } else if (!/^[0-9]{13,19}$/.test(cleanNumber)) {
                                      setStripeCardNumberError('Card number can only contain digits');
                                    } else {
                                      // Luhn algorithm validation
                                      let sum = 0;
                                      let isEven = false;
                                      for (let i = cleanNumber.length - 1; i >= 0; i--) {
                                        let digit = parseInt(cleanNumber.charAt(i), 10);
                                        if (isEven) {
                                          digit *= 2;
                                          if (digit > 9) {
                                            digit -= 9;
                                          }
                                        }
                                        sum += digit;
                                        isEven = !isEven;
                                      }
                                      if (sum % 10 !== 0) {
                                        setStripeCardNumberError('Invalid card number (failed Luhn check)');
                                      } else {
                                        setStripeCardNumberError('');
                                      }
                                    }
                                  }}
                                  disabled={stripePaymentResult !== null}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 font-mono ${
                                    stripeCardNumberError 
                                      ? `border-red-500 focus:ring-red-500 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}` 
                                      : `border-gray-200 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600' : ''}`
                                  } ${darkMode ? 'text-primary-100 placeholder-primary-300/60' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
                                  placeholder="4242 4242 4242 4242"
                                />
                                {stripeCardNumberError && (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.172l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l10.1-10.1z" clipRule="evenodd" />
                                    </svg>
                                    {stripeCardNumberError}
                                  </p>
                                )}
                              </div>

                              {/* Expiry Date */}
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Expiry (MM/YY) *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={5}
                                  value={stripeCardExpiry}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/[^0-9/]/g, '');
                                    
                                    // Auto-format MM/YY
                                    if (value.length >= 2 && !value.includes('/')) {
                                      value = value.slice(0, 2) + '/' + value.slice(2);
                                    }
                                    setStripeCardExpiry(value);
                                    
                                    // Real-time validation
                                    if (!value) {
                                      setStripeCardExpiryError('Expiry date is required');
                                    } else if (!value.includes('/')) {
                                      setStripeCardExpiryError('Use format MM/YY');
                                    } else {
                                      const parts = value.split('/');
                                      if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
                                        setStripeCardExpiryError('Use format MM/YY');
                                      } else {
                                        const month = parseInt(parts[0], 10);
                                        const year = parseInt(parts[1], 10);
                                        
                                        if (isNaN(month) || isNaN(year)) {
                                          setStripeCardExpiryError('Month and year must be numbers');
                                        } else if (month < 1 || month > 12) {
                                          setStripeCardExpiryError('Month must be between 01-12');
                                        } else {
                                          const currentYear = new Date().getFullYear() % 100;
                                          const currentMonth = new Date().getMonth() + 1;
                                          
                                          if (year < currentYear || (year === currentYear && month < currentMonth)) {
                                            setStripeCardExpiryError('Card has expired');
                                          } else {
                                            setStripeCardExpiryError('');
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  disabled={stripePaymentResult !== null}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 font-mono ${
                                    stripeCardExpiryError 
                                      ? `border-red-500 focus:ring-red-500 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}` 
                                      : `border-gray-200 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600' : ''}`
                                  } ${darkMode ? 'text-primary-100 placeholder-primary-300/60' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
                                  placeholder="12/25"
                                />
                                {stripeCardExpiryError && (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.172l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l10.1-10.1z" clipRule="evenodd" />
                                    </svg>
                                    {stripeCardExpiryError}
                                  </p>
                                )}
                              </div>

                              {/* CVC */}
                              <div className="flex flex-col gap-1">
                                <label className={`text-xs font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>CVC *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  value={stripeCardCvc}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setStripeCardCvc(value);
                                    
                                    // Real-time validation
                                    if (!value) {
                                      setStripeCardCvcError('CVC is required');
                                    } else if (value.length < 3) {
                                      setStripeCardCvcError(`CVC must be 3-4 digits (${value.length}/3-4)`);
                                    } else if (value.length > 4) {
                                      setStripeCardCvcError('CVC is too long');
                                    } else if (!/^[0-9]{3,4}$/.test(value)) {
                                      setStripeCardCvcError('CVC must contain only digits');
                                    } else {
                                      setStripeCardCvcError('');
                                    }
                                  }}
                                  disabled={stripePaymentResult !== null}
                                  className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 font-mono text-center ${
                                    stripeCardCvcError 
                                      ? `border-red-500 focus:ring-red-500 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}` 
                                      : `border-gray-200 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600' : ''}`
                                  } ${darkMode ? 'text-primary-100 placeholder-primary-300/60' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
                                  placeholder="123"
                                />
                                {stripeCardCvcError && (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.172l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l10.1-10.1z" clipRule="evenodd" />
                                    </svg>
                                    {stripeCardCvcError}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Payment Info Notice */}
                            <div className={`p-3 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <p className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Your card details are securely encrypted and processed through Stripe's secure payment gateway.</p>
                            </div>

                            {/* Pay Now Button */}
                            <button
                              onClick={async () => {
                                // Validate all fields
                                if (stripeCardNameError || stripeCardNumberError || stripeCardExpiryError || stripeCardCvcError || 
                                    !stripeCardName.trim() || !stripeCardNumber.trim() || !stripeCardExpiry.trim() || !stripeCardCvc.trim()) {
                                  showNotification('Please fix all validation errors before proceeding', 'error');
                                  return;
                                }

                                // Process payment
                                setStripePaymentProcessing(true);
                                try {
                                  // Simulate payment processing
                                  await new Promise(resolve => setTimeout(resolve, 2500));
                                  
                                  // Generate transaction ID
                                  const transactionId = 'pi_' + Math.random().toString(36).substr(2, 24);
                                  
                                  // Store payment result
                                  const paymentData = {
                                    status: 'succeeded',
                                    gateway: 'Stripe',
                                    transactionId,
                                    cardholderName: stripeCardName,
                                    last4: stripeCardNumber.replace(/\s/g, '').slice(-4),
                                    timestamp: new Date().toISOString()
                                  };
                                  
                                  setStripePaymentResult(paymentData);
                                  setStripePaymentModalOpen(true);
                                } catch (error) {
                                  showNotification(error.message || 'Payment failed. Please try again.', 'error');
                                } finally {
                                  setStripePaymentProcessing(false);
                                }
                              }}
                              disabled={stripePaymentProcessing || stripePaymentResult !== null || !!stripeCardNameError || !!stripeCardNumberError || !!stripeCardExpiryError || !!stripeCardCvcError}
                              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                              {stripePaymentProcessing ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Processing Payment...
                                </>
                              ) : stripePaymentResult ? (
                                <>
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Payment Completed
                                </>
                              ) : (
                                <>
                                  💳 Pay Now
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Promo Code Section */}
                        <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-dark-800/90 border border-dark-700' : 'bg-gray-50'} ${stripePaymentResult ? 'opacity-60 pointer-events-none' : ''}`}>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-primary-100' : 'text-gray-700'
                          }`}>Have a promo code?</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => {
                                if (promoDiscount === 0 && !stripePaymentResult) {
                                  setPromoCode(e.target.value.toUpperCase());
                                  setPromoError('');
                                }
                              }}
                              placeholder={promoDiscount > 0 ? "Promo applied" : "Enter code"}
                              disabled={promoDiscount > 0 || stripePaymentResult !== null}
                              className={`flex-1 px-4 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                                promoDiscount > 0 || stripePaymentResult
                                  ? (darkMode ? 'bg-dark-700/60 border-dark-600 text-primary-200/70 cursor-not-allowed' : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed')
                                  : (darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200')
                              }`}
                            />
                            {promoDiscount > 0 ? (
                              <button
                                onClick={() => {
                                  if (!stripePaymentResult) {
                                    setPromoCode('');
                                    setPromoDiscount(0);
                                    setPromoError('');
                                    showNotification('Promo code removed', 'info');
                                  }
                                }}
                                disabled={stripePaymentResult !== null}
                                className={`px-4 py-2 rounded-2xl transition-colors ${stripePaymentResult ? 'opacity-60 cursor-not-allowed' : ''} ${darkMode ? 'bg-red-600 text-cream hover:bg-red-700' : 'bg-red-600 text-cream hover:bg-red-700'}`}
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (stripePaymentResult) return;
                                  const code = promoCode.toUpperCase();
                                  if (code === '233606DA') {
                                    setPromoDiscount(75);
                                    setPromoError('');
                                    showNotification('Promo code applied! 75% discount', 'success');
                                  } else if (code === '233544SA') {
                                    setPromoDiscount(50);
                                    setPromoError('');
                                    showNotification('Promo code applied! 50% discount', 'success');
                                  } else if (code === '233532RA') {
                                    setPromoDiscount(50);
                                    setPromoError('');
                                    showNotification('Promo code applied! 50% discount', 'success');
                                  } else if (code === '233586OW') {
                                    setPromoDiscount(40);
                                    setPromoError('');
                                    showNotification('Promo code applied! 40% discount', 'success');
                                  } else if (code === 'SAVE10') {
                                    setPromoDiscount(10);
                                    setPromoError('');
                                    showNotification('Promo code applied! 10% discount', 'success');
                                  } else if (code === 'FIRST20') {
                                    setPromoDiscount(20);
                                    setPromoError('');
                                    showNotification('Promo code applied! 20% discount', 'success');
                                  } else if (promoCode) {
                                    setPromoError('Invalid promo code');
                                    setPromoDiscount(0);
                                  }
                                }}
                                className={`px-4 py-2 rounded-2xl transition-colors ${darkMode ? 'bg-primary-700 text-cream hover:bg-primary-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                              >
                                Apply
                              </button>
                            )}
                          </div>
                          {promoError && <p className={`text-sm mt-2 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>{promoError}</p>}
                          {promoDiscount > 0 && (
                            <p className={`text-sm mt-2 flex items-center gap-1 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {promoDiscount}% discount applied! <span className={`text-xs ml-1 ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>(Code: {promoCode})</span>
                            </p>
                          )}
                        </div>

                        {/* Order Note */}
                        <div className="mt-4">
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-primary-100' : 'text-gray-700'
                          }`}>Order Note (Optional)</label>
                          <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="Add delivery instructions or special requests..."
                            rows={3}
                            className={`w-full px-4 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* Stripe Payment Success Modal */}
                    {stripePaymentModalOpen && stripePaymentResult && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className={`rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-auto ${darkMode ? 'bg-dark-800' : 'bg-white'}`}>
                          {/* Header */}
                          <div className={`p-6 text-center border-b ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-center mb-4">
                              <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
                                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Payment Successful!</h3>
                            <p className={`text-sm mt-2 ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Your payment has been securely processed</p>
                          </div>

                          {/* Body - Scrollable */}
                          <div className={`p-6 space-y-4 max-h-[60vh] overflow-y-auto ${darkMode ? 'bg-dark-800' : 'bg-white'}`}>
                            {/* Payment Details */}
                            <div className={`rounded-xl p-4 space-y-3 ${darkMode ? 'bg-dark-700/50 border border-dark-600' : 'bg-gray-50 border border-gray-200'}`}>
                              {/* Price Breakdown */}
                              <div className="flex justify-between items-start">
                                <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Subtotal</span>
                                <span className={`font-semibold text-right ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
                                  {formatPrice(cart.totalPrice)}
                                </span>
                              </div>

                              {/* Shipping Cost */}
                              <div className="flex justify-between items-start">
                                <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Shipping</span>
                                <span className={`font-semibold text-right ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
                                  {cart.totalPrice >= 5000 ? formatPrice(0) : formatPrice(200)}
                                </span>
                              </div>

                              {/* Promo Discount */}
                              {promoDiscount > 0 && (
                                <div className="flex justify-between items-start">
                                  <span className={`text-sm ${darkMode ? 'text-green-300/80' : 'text-green-700'}`}>Promo Discount ({promoDiscount}%)</span>
                                  <span className={`font-semibold text-right ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                                    -{formatPrice(cart.totalPrice * promoDiscount / 100)}
                                  </span>
                                </div>
                              )}

                              <div className="border-t border-gray-300/30"></div>

                              {/* Total Amount */}
                              <div className="flex justify-between items-start">
                                <span className={`text-sm font-semibold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Total Amount</span>
                                <span className={`font-bold text-lg text-right ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                                  {formatPrice((cart.totalPrice - (cart.totalPrice * promoDiscount / 100)) + (cart.totalPrice >= 5000 ? 0 : 200))}
                                </span>
                              </div>

                              <div className="border-t border-gray-300/30"></div>

                              {/* Transaction Details */}
                              <div className="flex justify-between items-start">
                                <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Transaction ID</span>
                                <span className={`text-sm font-mono break-all ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{stripePaymentResult.transactionId}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Card</span>
                                <span className={`text-sm font-mono ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>****{stripePaymentResult.last4}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Cardholder</span>
                                <span className={`text-sm ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{stripePaymentResult.cardholderName}</span>
                              </div>
                              <div className="border-t border-gray-300/30"></div>
                              <div className="flex justify-between items-center pt-2">
                                <span className={`text-sm font-semibold ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Status</span>
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-600">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Completed
                                </span>
                              </div>
                            </div>

                            {/* Info Message */}
                            <div className={`p-3 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <p className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Your payment has been securely processed through Stripe. You will receive a confirmation email shortly.</p>
                            </div>
                          </div>

                          {/* Footer - Sticky */}
                          <div className={`p-6 border-t sticky bottom-0 ${darkMode ? 'bg-dark-700/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
                            <button
                              onClick={() => {
                                setStripePaymentModalOpen(false);
                              }}
                              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
                            >
                              ✓ Okay
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Order Review */}
                    {checkoutStep === 3 && (
                      <div className="space-y-6">
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-primary-100' : 'text-gray-900'
                        }`}>Review Your Order</h3>
                        
                        {/* Order Items */}
                        <div className={`rounded-xl p-4 ${darkMode ? 'bg-dark-800/90 border border-dark-700' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-3 ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}>Order Items ({cart.items.length})</h4>
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {cart.items.map((item) => (
                              <div key={item._id} className={`flex items-center gap-3 p-3 rounded-2xl ${darkMode ? 'bg-dark-700/80 border border-dark-600' : 'bg-cream'}`}>
                                <img
                                  src={item.product?.images?.[0]?.url 
                                    ? (item.product.images[0].url.startsWith('http') 
                                      ? item.product.images[0].url 
                                      : `http://localhost:5000${item.product.images[0].url}`)
                                    : 'https://via.placeholder.com/50'}
                                  alt={item.product?.name}
                                  className="w-12 h-12 object-cover rounded-2xl"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium text-sm truncate ${
                                    darkMode ? 'text-primary-100' : 'text-gray-900'
                                  }`}>{item.product?.name}</p>
                                  <p className={`text-xs ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Qty: {item.quantity}</p>
                                </div>
                                <span className={`font-semibold text-sm ${
                                  darkMode ? 'text-primary-100' : 'text-gray-900'
                                }`}>
                                  {formatPrice((item.price || item.product?.price || 0) * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className={`rounded-xl p-4 ${darkMode ? 'bg-dark-800/90 border border-dark-700' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-2 ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}>Delivery Address</h4>
                          {selectedAddress ? (
                            <>
                              <div className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>
                                <p className={`font-medium ${
                                  darkMode ? 'text-primary-100' : 'text-gray-900'
                                }`}>{selectedAddress.fullName || 'N/A'}</p>
                                <p>{selectedAddress.address || selectedAddress.street || 'N/A'}</p>
                                <p>{selectedAddress.city || 'N/A'}, {selectedAddress.state || ''} {selectedAddress.postalCode || selectedAddress.zipCode || ''}</p>
                                <p className={`${darkMode ? 'text-primary-200/70' : 'text-gray-500'} mt-1`}>Phone: {selectedAddress.phone || 'N/A'}</p>
                                <p className={`${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Country: {selectedAddress.country || 'N/A'}</p>
                              </div>
                              
                              {/* Check for missing fields */}
                              {(!selectedAddress.fullName || !selectedAddress.phone || !selectedAddress.city || !selectedAddress.country || (!selectedAddress.address && !selectedAddress.street)) && (
                                <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <p className={`text-xs ${darkMode ? 'text-orange-200' : 'text-orange-800'}`}>Some address fields are incomplete. Please update your address to complete checkout.</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>No address selected</p>
                          )}
                        </div>

                        {/* Payment Method */}
                        <div className={`rounded-xl p-4 ${darkMode ? 'bg-dark-800/90 border border-dark-700' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-2 ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}>Payment Method</h4>
                          <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>
                            {selectedPayment === 'cod' && 'Cash on Delivery'}
                            {selectedPayment === 'card' && 'Credit/Debit Card'}
                            {selectedPayment === 'jazzcash' && 'JazzCash'}
                            {selectedPayment === 'easypaisa' && 'EasyPaisa'}
                            {selectedPayment === 'bank' && 'Bank Transfer'}
                          </p>
                        </div>

                        {/* Order Note */}
                        {orderNote && (
                          <div className={`rounded-xl p-4 ${darkMode ? 'bg-dark-800/90 border border-dark-700' : 'bg-gray-50'}`}>
                            <h4 className={`font-medium mb-2 ${
                              darkMode ? 'text-primary-100' : 'text-gray-900'
                            }`}>Order Note</h4>
                            <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>{orderNote}</p>
                          </div>
                        )}

                        {/* Price Summary */}
                        <div className={`rounded-xl p-4 border ${darkMode ? 'bg-dark-800/90 border-dark-700 backdrop-blur-sm' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={darkMode ? 'text-primary-200/80' : 'text-gray-600'}>Subtotal</span>
                              <span className={darkMode ? 'text-primary-100 font-medium' : 'font-medium'}>{formatPrice(cart.totalPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={darkMode ? 'text-primary-200/80' : 'text-gray-600'}>Shipping</span>
                              <span className={cart.totalPrice >= 5000 ? (darkMode ? 'text-green-300 font-medium' : 'text-green-600 font-medium') : (darkMode ? 'text-primary-100' : '')}>
                                {cart.totalPrice >= 5000 ? 'FREE' : formatPrice(200)}
                              </span>
                            </div>
                            {promoDiscount > 0 && (
                              <div className={`flex justify-between ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                                <span>Discount ({promoDiscount}%)</span>
                                <span>-{formatPrice(cart.totalPrice * promoDiscount / 100)}</span>
                              </div>
                            )}
                            <div className={`flex justify-between pt-2 text-lg font-bold ${darkMode ? 'border-t border-dark-600' : 'border-t border-blue-200'}`}>
                              <span className={darkMode ? 'text-primary-100' : 'text-gray-900'}>Total</span>
                              <span className={darkMode ? 'text-primary-200' : 'text-primary-600'}>
                                {formatPrice(
                                  (cart.totalPrice - (cart.totalPrice * promoDiscount / 100)) + 
                                  (cart.totalPrice >= 5000 ? 0 : 200)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Order Confirmation */}
                    {checkoutStep === 4 && orderPlaced && (
                      <div className={`text-center py-12 px-4 ${darkMode ? 'bg-dark-800' : 'bg-gradient-to-b from-green-50 to-white'}`}>
                        {/* Success Animation */}
                        <div className="relative mb-8">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-green-500/10 rounded-full animate-ping"></div>
                          </div>
                          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>

                        {/* Success Message */}
                        <h3 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Order Confirmed!</h3>
                        <p className={`text-lg mb-8 ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Your order has been placed successfully</p>
                        
                        {/* Order Details Card */}
                        <div className={`rounded-2xl p-6 max-w-md mx-auto mb-6 shadow-xl border ${darkMode ? 'bg-dark-700/50 border-dark-600' : 'bg-white border-gray-200'}`}>
                          {/* Order Number */}
                          <div className="mb-4">
                            <p className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Order Number</p>
                            <p className={`text-xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{orderPlaced.orderNumber}</p>
                          </div>
                          
                          <div className="border-t border-gray-300/30 my-4"></div>
                          
                          {/* Order Details Grid */}
                          <div className="space-y-3 text-left">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Order Date</span>
                              <span className={`text-sm font-medium ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{orderPlaced.date}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Payment Method</span>
                              <span className={`text-sm font-medium ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{orderPlaced.payment}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-600'}`}>Total Amount</span>
                              <span className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{orderPlaced.total}</span>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-300/30 my-4"></div>
                          
                          {/* Delivery Estimate */}
                          <div className={`p-3 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-left">
                              <p className={`text-xs ${darkMode ? 'text-blue-300/80' : 'text-blue-600'}`}>Estimated Delivery</p>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>3-5 business days</p>
                            </div>
                          </div>
                        </div>

                        {/* Email Notification */}
                        <div className={`max-w-md mx-auto mb-8 p-4 rounded-lg border flex items-start gap-3 ${darkMode ? 'bg-primary-500/5 border-primary-500/20' : 'bg-primary-50 border-primary-200'}`}>
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <p className={`text-sm text-left ${darkMode ? 'text-primary-200' : 'text-primary-700'}`}>
                            A confirmation email with order details has been sent to your registered email address.
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={async () => {
                              setShowCheckout(false);
                              setCheckoutStep(1);
                              setOrderPlaced(null);
                              setActiveTab('orders');
                              await fetchOrders();
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                          >
                            📦 View My Orders
                          </button>
                          <button
                            onClick={() => {
                              setShowCheckout(false);
                              setCheckoutStep(1);
                              setOrderPlaced(null);
                              setActiveTab('catalog');
                            }}
                            className={`px-8 py-3 rounded-xl transition-all font-semibold transform hover:scale-105 ${
                              darkMode ? 'bg-dark-700 text-primary-100 hover:bg-dark-600 border border-dark-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md'
                            }`}
                          >
                            🛍️ Continue Shopping
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checkout Footer */}
                  {checkoutStep !== 4 && (
                    <div className={`p-4 sm:p-6 flex-shrink-0 border-t ${darkMode ? 'bg-dark-800/90 border-dark-700' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between gap-4">
                        {checkoutStep > 1 ? (
                          <button
                            onClick={() => setCheckoutStep(checkoutStep - 1)}
                            disabled={placingOrder}
                            className={`px-4 sm:px-6 py-2.5 font-medium disabled:opacity-50 ${
                              darkMode ? 'text-primary-100 hover:text-primary-200' : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            ← Back
                          </button>
                        ) : (
                          <div></div>
                        )}
                        
                        <div className="text-right hidden sm:block">
                          <p className={`text-sm ${darkMode ? 'text-primary-200/70' : 'text-gray-500'}`}>Total</p>
                          <p className={`text-xl font-bold ${darkMode ? 'text-primary-100' : 'text-primary-600'}`}>
                            {formatPrice(
                              (cart.totalPrice - (cart.totalPrice * promoDiscount / 100)) + 
                              (cart.totalPrice >= 5000 ? 0 : 200)
                            )}
                          </p>
                        </div>

                        {checkoutStep === 1 && (
                          <button
                            onClick={() => selectedAddress && setCheckoutStep(2)}
                            disabled={!selectedAddress}
                            className="px-6 py-2.5 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            Continue to Payment →
                          </button>
                        )}

                        {checkoutStep === 2 && (
                          <button
                            onClick={() => setCheckoutStep(3)}
                            className="px-6 py-2.5 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors font-medium"
                          >
                            Review Order →
                          </button>
                        )}

                        {checkoutStep === 3 && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (placingOrder) {
                                return;
                              }
                              
                              setPlacingOrder(true);
                              
                              try {
                                // Validate cart and address
                                if (!cart.items || cart.items.length === 0) {
                                  throw new Error('Cart is empty');
                                }
                                
                                if (!selectedAddress) {
                                  throw new Error('Please select a shipping address');
                                }
                                
                                // Validate all required address fields
                                const requiredAddressFields = {
                                  fullName: selectedAddress.fullName,
                                  street: selectedAddress.address || selectedAddress.street,
                                  city: selectedAddress.city,
                                  country: selectedAddress.country,
                                  phone: selectedAddress.phone
                                };
                                
                                const missingFields = Object.entries(requiredAddressFields)
                                  .filter(([key, value]) => !value)
                                  .map(([key]) => key);
                                
                                if (missingFields.length > 0) {
                                  throw new Error(`Please complete your shipping address. Missing: ${missingFields.join(', ')}`);
                                }
                                
                                if (!selectedPayment) {
                                  throw new Error('Please select a payment method');
                                }

                                if (selectedPayment === 'card') {
                                  if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
                                    throw new Error('Please enter complete card details');
                                  }
                                }

                                if (selectedPayment === 'jazzcash') {
                                  if (!jazzcashPhone || !jazzcashTxn) {
                                    throw new Error('Please provide JazzCash phone and transaction ID');
                                  }
                                }

                                if (selectedPayment === 'easypaisa') {
                                  if (!easypaisaPhone || !easypaisaTxn) {
                                    throw new Error('Please provide EasyPaisa phone and transaction ID');
                                  }
                                }

                                if (selectedPayment === 'bank') {
                                  if (!bankAccountName || !bankAccountNumber || !bankReference) {
                                    throw new Error('Please provide bank account details and reference');
                                  }
                                }
                                
                                // Prepare order data
                                const orderData = {
                                  items: cart.items.map(item => ({
                                    product: item.product?._id || item.product,
                                    quantity: item.quantity,
                                    price: item.product?.price || item.price
                                  })),
                                  shippingAddress: {
                                    fullName: selectedAddress.fullName || '',
                                    street: selectedAddress.address || selectedAddress.street || '',
                                    city: selectedAddress.city || '',
                                    state: selectedAddress.state || '',
                                    zipCode: selectedAddress.postalCode || selectedAddress.zipCode || '',
                                    country: selectedAddress.country || '',
                                    phone: selectedAddress.phone || ''
                                  },
                                  paymentMethod: selectedPayment,
                                  paymentResult: selectedPayment === 'card'
                                    ? {
                                        status: 'initiated',
                                        cardType,
                                        last4: cardNumber.slice(-4)
                                      }
                                    : selectedPayment === 'stripe'
                                      ? {
                                          status: 'processing',
                                          gateway: 'Stripe',
                                          cardholderName: stripeCardName,
                                          last4: stripeCardNumber.slice(-4)
                                        }
                                      : selectedPayment === 'jazzcash'
                                        ? {
                                            status: 'pending',
                                            wallet: 'JazzCash',
                                            phone: jazzcashPhone,
                                            transactionId: jazzcashTxn
                                          }
                                        : selectedPayment === 'easypaisa'
                                          ? {
                                              status: 'pending',
                                              wallet: 'EasyPaisa',
                                              phone: easypaisaPhone,
                                              transactionId: easypaisaTxn
                                            }
                                          : selectedPayment === 'bank'
                                            ? {
                                                status: 'pending',
                                                method: 'Bank Transfer',
                                                accountName: bankAccountName,
                                                accountNumber: bankAccountNumber,
                                                reference: bankReference
                                              }
                                            : null,
                                  promoCode: promoCode || undefined,
                                  discount: promoDiscount,
                                  shippingCost: cart.totalPrice >= 5000 ? 0 : 200
                                };
                                
                                // Create order via API
                                const response = await createOrder(orderData);
                                
                                const paymentLabels = {
                                  cod: 'Cash on Delivery',
                                  card: 'Credit/Debit Card',
                                  stripe: 'Stripe Payment',
                                  jazzcash: 'JazzCash',
                                  easypaisa: 'EasyPaisa',
                                  bank: 'Bank Transfer'
                                };
                                
                                setOrderPlaced({
                                  orderNumber: response.order?.orderNumber || response.order?._id || 'ORD-' + Date.now(),
                                  date: new Date().toLocaleDateString('en-PK', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  }),
                                  payment: paymentLabels[selectedPayment],
                                  total: formatPrice(
                                    (cart.totalPrice - (cart.totalPrice * promoDiscount / 100)) + 
                                    (cart.totalPrice >= 5000 ? 0 : 200)
                                  )
                                });
                                
                                // Clear cart
                                await emptyCart();
                                
                                // Refresh orders list
                                await fetchOrders();
                                
                                setCheckoutStep(4);
                                showNotification('Order placed successfully!', 'success');
                              } catch (error) {
                                console.error('Error placing order:', error);
                                const errorMessage = error.message || 'Failed to place order. Please try again.';
                                showNotification(errorMessage, 'error');
                              } finally {
                                // Always reset placingOrder state to prevent button from being stuck
                                setPlacingOrder(false);
                              }
                            }}
                            disabled={placingOrder}
                            className="cta-button-3d cta-button-primary px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-2xl hover:from-primary-600 hover:to-primary-800 font-semibold shadow-lg transform-gpu disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {placingOrder ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Placing Order...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Place Order
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                {/* Address Modal */}
                {showAddressModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddressModal(false)}></div>
                    <div className={`relative rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream'}`}>
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-xl font-bold ${
                            darkMode ? 'text-primary-100' : 'text-gray-900'
                          }`}>
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                          </h3>
                          <button 
                            onClick={() => setShowAddressModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        {/* Address Label */}
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Address Label *</label>
                          <div className="flex gap-2">
                            {['Home', 'Office', 'Other'].map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setAddressForm({...addressForm, label, addressType: label.toLowerCase()})}
                                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                                  addressForm.label === label 
                                    ? 'bg-primary-600 text-cream' 
                                    : darkMode ? 'bg-dark-700 text-primary-100 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Full Name */}
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Full Name *</label>
                          <input
                            type="text"
                            value={addressForm.fullName}
                            onChange={(e) => {
                              setAddressForm({...addressForm, fullName: e.target.value});
                              if (addressFormErrors.fullName) {
                                setAddressFormErrors({...addressFormErrors, fullName: ''});
                              }
                            }}
                            className={`w-full px-4 py-2.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              addressFormErrors.fullName ? 'border-red-500' : 'border-gray-200'
                            }`}
                            placeholder="Enter full name"
                          />
                          {addressFormErrors.fullName && (
                            <p className="mt-1 text-sm text-red-500">{addressFormErrors.fullName}</p>
                          )}
                        </div>

                        {/* Phone Number */}
                        <div>
                          <PhoneInput
                            label="Phone Number"
                            name="phone"
                            value={addressForm.phone}
                            onChange={(e) => {
                              setAddressForm({...addressForm, phone: e.target.value});
                              if (addressFormErrors.phone) {
                                setAddressFormErrors({...addressFormErrors, phone: ''});
                              }
                            }}
                            onCountryChange={(country) => {
                              // Auto-set country when phone country is selected
                              setAddressForm(prev => ({...prev, country: country.name}));
                            }}
                            error={addressFormErrors.phone}
                            required
                          />
                        </div>

                        {/* Street Address */}
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Street Address *</label>
                          <textarea
                            value={addressForm.address}
                            onChange={(e) => {
                              setAddressForm({...addressForm, address: e.target.value});
                              if (addressFormErrors.address) {
                                setAddressFormErrors({...addressFormErrors, address: ''});
                              }
                            }}
                            rows={2}
                            className={`w-full px-4 py-2.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                              addressFormErrors.address ? 'border-red-500' : 'border-gray-200'
                            }`}
                            placeholder="House/Flat No., Building, Street, Area"
                          />
                          {addressFormErrors.address && (
                            <p className="mt-1 text-sm text-red-500">{addressFormErrors.address}</p>
                          )}
                        </div>

                        {/* City and State */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>City *</label>
                            <input
                              type="text"
                              value={addressForm.city}
                              onChange={(e) => {
                                setAddressForm({...addressForm, city: e.target.value});
                                if (addressFormErrors.city) {
                                  setAddressFormErrors({...addressFormErrors, city: ''});
                                }
                              }}
                              className={`w-full px-4 py-2.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                addressFormErrors.city ? 'border-red-500' : 'border-gray-200'
                              }`}
                              placeholder="City"
                            />
                            {addressFormErrors.city && (
                              <p className="mt-1 text-sm text-red-500">{addressFormErrors.city}</p>
                            )}
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>State/Province</label>
                            <input
                              type="text"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="State"
                            />
                          </div>
                        </div>

                        {/* Postal Code and Country */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Postal Code</label>
                            <input
                              type="text"
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="54000"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>
                              Country
                              <span className="text-xs text-gray-400 ml-1">(auto-set from phone)</span>
                            </label>
                            <div className={`w-full px-4 py-2.5 border rounded-2xl flex items-center gap-2 ${darkMode ? 'border-dark-600 bg-dark-700 text-primary-100' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                              {countries.find(c => c.name === addressForm.country)?.flag || ''}
                              <span>{addressForm.country}</span>
                            </div>
                          </div>
                        </div>

                        {/* Set as Default */}
                        {/* Only show "Set as default" option when there are existing addresses */}
                        {addresses.length > 0 && !editingAddress && (
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setAddressForm({...addressForm, isDefault: !addressForm.isDefault})}
                              className={`relative w-11 h-6 rounded-full transition-colors ${addressForm.isDefault ? 'bg-primary-600' : 'bg-gray-200'}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-cream rounded-full shadow transform transition-transform ${addressForm.isDefault ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                            <span className={`text-sm ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Set as default address</span>
                          </div>
                        )}
                        {addresses.length === 0 && (
                          <p className="text-sm text-primary-600 bg-blue-50 px-3 py-2 rounded-2xl">
                            ✓ This will be set as your default address
                          </p>
                        )}
                      </div>
                      <div className="p-6 border-t border-gray-100 flex gap-3">
                        <button
                          onClick={() => setShowAddressModal(false)}
                          className={`flex-1 py-2.5 border font-medium rounded-2xl transition-colors ${darkMode ? 'border-dark-600 text-primary-100 hover:bg-dark-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAddress}
                          className="flex-1 py-2.5 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700 transition-colors"
                        >
                          {editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Addresses Header */}
                <div className={`rounded-xl shadow-md border p-6 ${
                  darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className={`text-xl font-bold ${
                        darkMode ? 'text-primary-100' : 'text-gray-900'
                      }`}>My Addresses</h2>
                      <p className={`text-sm mt-1 ${
                        darkMode ? 'text-primary-200/60' : 'text-gray-500'
                      }`}>Manage your shipping and billing addresses ({addresses.length} saved)</p>
                    </div>
                    <button 
                      onClick={openAddAddressModal}
                      className="inline-flex items-center px-4 py-2.5 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Address
                    </button>
                  </div>
                </div>

                {/* Address Cards */}
                {addresses.length === 0 ? (
                  /* Empty State - No addresses yet */
                  <div className={`rounded-xl shadow-md border p-12 text-center ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                  }`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      darkMode ? 'bg-dark-700/80' : 'bg-blue-50'
                    }`}>
                      <svg className={`w-10 h-10 ${
                        darkMode ? 'text-primary-300' : 'text-blue-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>No addresses saved</h3>
                    <p className={`mb-6 max-w-sm mx-auto ${
                      darkMode ? 'text-primary-200/80' : 'text-gray-500'
                    }`}>Add your first delivery address to make checkout faster and easier.</p>
                    <button
                      onClick={openAddAddressModal}
                      className={`inline-flex items-center px-6 py-2.5 text-cream font-medium rounded-2xl transition-colors ${
                        darkMode
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                          : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div 
                        key={address._id} 
                        className={`rounded-xl shadow-md p-6 relative transition-colors ${
                          darkMode 
                            ? address.isDefault 
                              ? 'bg-dark-800/80 backdrop-blur-md border-2 border-primary-500' 
                              : 'bg-dark-800/80 backdrop-blur-md border border-dark-700 hover:border-dark-600'
                            : address.isDefault
                              ? 'bg-cream border-2 border-blue-500'
                              : 'bg-cream border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {address.isDefault && (
                          <div className="absolute top-4 right-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Default</span>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            address.addressType === 'home' ? 'bg-blue-100' : 
                            address.addressType === 'work' ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            <svg className={`w-6 h-6 ${
                              address.addressType === 'home' ? 'text-primary-600' : 
                              address.addressType === 'work' ? 'text-primary-600' : 'text-green-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {address.addressType === 'home' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              ) : address.addressType === 'work' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              )}
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>{address.addressType ? address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1) : 'Address'}</h3>
                            </div>
                            <p className={`font-medium ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>{address.fullName}</p>
                            <p className={`text-sm mt-1 ${
                              darkMode ? 'text-primary-200/80' : 'text-gray-600'
                            }`}>
                              {address.street}<br />
                              {address.city}{address.state ? `, ${address.state}` : ''}{address.zipCode ? ` ${address.zipCode}` : ''}<br />
                              {address.country}
                            </p>
                            <p className={`text-sm mt-2 ${
                              darkMode ? 'text-primary-200/80' : 'text-gray-500'
                            }`}>{address.phone}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors ${darkMode ? 'bg-dark-700 text-primary-200 hover:bg-dark-600' : 'text-primary-600 hover:bg-blue-50'}`}
                          >
                            Edit
                          </button>
                          {!address.isDefault && addresses.length > 1 && (
                            <button 
                              onClick={() => handleSetDefaultAddress(address._id)}
                              className={`flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors ${darkMode ? 'bg-dark-700 text-primary-200 hover:bg-dark-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                              Set as Default
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteAddress(address._id)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors ${darkMode ? 'bg-dark-700 text-red-400 hover:bg-dark-600' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add New Address Card */}
                    <div 
                      onClick={openAddAddressModal}
                      className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center min-h-[200px] transition-colors cursor-pointer ${
                        darkMode 
                          ? 'bg-dark-700/50 border-dark-600 hover:border-dark-500 hover:bg-dark-700' 
                          : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md mb-3 ${
                        darkMode ? 'bg-dark-600' : 'bg-cream'
                      }`}>
                        <svg className={`w-7 h-7 ${
                          darkMode ? 'text-primary-300' : 'text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className={`font-medium ${
                        darkMode ? 'text-primary-100' : 'text-gray-700'
                      }`}>Add New Address</p>
                      <p className={`text-sm mt-1 ${
                        darkMode ? 'text-primary-200/80' : 'text-gray-500'
                      }`}>Save a new delivery location</p>
                    </div>
                  </div>
                )}

                {/* Address Tips */}
                <div className={`rounded-xl p-6 ${
                  darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      darkMode ? 'bg-dark-700/80' : 'bg-blue-100'
                    }`}>
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${
                        darkMode ? 'text-primary-100' : 'text-gray-900'
                      }`}>Delivery Tips</h3>
                      <ul className={`text-sm space-y-1 ${
                        darkMode ? 'text-primary-200/80' : 'text-gray-600'
                      }`}>
                        <li>• Add complete address with landmarks for faster delivery</li>
                        <li>• Ensure phone number is correct for delivery updates</li>
                        <li>• Set your most used address as default for quick checkout</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviewsLoading && (
                  <div className={`rounded-xl shadow-md border p-12 text-center ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                  }`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className={`${darkMode ? 'text-primary-100' : 'text-gray-600'}`}>Loading reviews...</p>
                  </div>
                )}
                {/* Reviews Header */}
                <div className={`rounded-xl shadow-md border p-6 ${
                  darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                }`}>
                  <h2 className={`text-xl font-bold ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>My Reviews & Ratings</h2>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-primary-200/60' : 'text-gray-500'
                  }`}>Manage your product reviews and ratings</p>
                </div>

                 {/* Pending Reviews Section */}
                 {pendingReviews.length > 0 && (
                   <div className={`rounded-xl shadow-md border p-6 ${
                     darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                   }`}>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className={`text-lg font-semibold ${
                         darkMode ? 'text-primary-100' : 'text-gray-900'
                       }`}>
                         ⏳ Pending Reviews ({pendingReviews.length})
                       </h3>
                       <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                         Action Required
                       </span>
                     </div>
                     <div className="space-y-3">
                       {pendingReviews.map((item) => (
                         <div key={item._id} className={`rounded-xl border p-4 flex items-center gap-4 ${
                           darkMode ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                         }`}>
                           <img
                             src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'}
                             alt={item.product?.name}
                             className="w-16 h-16 rounded-lg object-cover"
                           />
                           <div className="flex-1">
                             <h4 className={`font-medium ${
                               darkMode ? 'text-primary-100' : 'text-gray-900'
                             }`}>{item.product?.name}</h4>
                             <p className={`text-xs mt-1 ${
                               darkMode ? 'text-primary-200/60' : 'text-gray-500'
                             }`}>
                               Order #{item.orderNumber} • Delivered on {new Date(item.deliveredAt).toLocaleDateString()}
                             </p>
                           </div>
                           <button
                             onClick={() => handleOpenReviewModal(item)}
                             className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                           >
                             Write Review
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Existing Reviews */}
                 {userReviews.length === 0 && pendingReviews.length === 0 ? (
                  <div className={`rounded-xl shadow-md border p-12 text-center ${
                    darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                  }`}>
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-gray-500 mb-2">No reviews yet</p>
                    <p className="text-sm text-gray-400 mb-4">Purchase and review products to share your experience</p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-6 py-2 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                 ) : userReviews.length > 0 ? (
                   <div>
                     <h3 className={`text-lg font-semibold mb-4 ${
                       darkMode ? 'text-primary-100' : 'text-gray-900'
                     }`}>
                       ✍️ Your Reviews ({userReviews.length})
                     </h3>
                  <div className="space-y-4">
                    {userReviews.map((review) => (
                       <div key={review._id} className={`rounded-xl shadow-md border p-6 ${
                        darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                      }`}>
                        <div className="flex items-start gap-4">
                          <img
                            src={review.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                            alt={review.product?.name}
                            className="w-20 h-20 rounded-2xl object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className={`font-semibold ${
                                  darkMode ? 'text-primary-100' : 'text-gray-900'
                                }`}>{review.product?.name}</h3>
                                 {review.title && (
                                   <p className={`text-sm font-medium mt-1 ${
                                     darkMode ? 'text-primary-200' : 'text-gray-700'
                                   }`}>{review.title}</p>
                                 )}
                                <div className="flex items-center gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                 <div className="flex items-center gap-2 mt-2">
                                   {review.isApproved ? (
                                     <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                       ✓ Approved
                                     </span>
                                   ) : (
                                     <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                       ⏳ Pending Approval
                                     </span>
                                   )}
                                   {review.isVerifiedPurchase && (
                                     <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                       ✓ Verified Purchase
                                     </span>
                                   )}
                                 </div>
                              </div>
                               <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                 {new Date(review.createdAt).toLocaleDateString()}
                               </span>
                            </div>
                             <p className={`text-sm mb-3 ${
                               darkMode ? 'text-primary-200/80' : 'text-gray-600'
                             }`}>{review.comment}</p>
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => {
                                   const item = {
                                     product: review.product,
                                     orderId: review.order?._id,
                                     orderNumber: review.order?.orderNumber,
                                   };
                                   handleOpenReviewModal(item, review);
                                 }}
                                 className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                               >
                                Edit Review
                              </button>
                              <span className="text-gray-300">•</span>
                               <button 
                                 onClick={() => handleDeleteReview(review._id)}
                                 className="text-sm text-red-500 hover:text-red-600 font-medium"
                               >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                   </div>
                 ) : null}

                {/* Review Stats */}
                <div className={`rounded-xl p-6 ${darkMode ? 'bg-dark-800/80 backdrop-blur-md border border-dark-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                  <h3 className={`font-semibold mb-4 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Your Review Activity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`rounded-2xl p-4 transition-all duration-200 cursor-default ${darkMode ? 'bg-dark-700/50 hover:bg-dark-700/70' : 'bg-white hover:bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-primary-300' : 'text-primary-600'}`}>{userReviews.length}</div>
                      <div className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Total Reviews</div>
                    </div>
                    <div className={`rounded-2xl p-4 transition-all duration-200 cursor-default ${darkMode ? 'bg-dark-700/50 hover:bg-dark-700/70' : 'bg-white hover:bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>
                        {userReviews.length > 0 
                          ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
                          : '0.0'
                        }
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Average Rating</div>
                    </div>
                    <div className={`rounded-2xl p-4 transition-all duration-200 cursor-default ${darkMode ? 'bg-dark-700/50 hover:bg-dark-700/70' : 'bg-white hover:bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {userReviews.filter(r => r.verified).length}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Verified Purchases</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Settings Header */}
                <div className={`rounded-xl shadow-md border p-6 ${
                  darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                }`}>
                  <h2 className={`text-xl font-bold ${
                    darkMode ? 'text-primary-100' : 'text-gray-900'
                  }`}>Account Settings</h2>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-primary-200/60' : 'text-gray-500'
                  }`}>Manage your account preferences and security</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Profile & Security */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Profile Information */}
                    <div className={`rounded-xl shadow-md border overflow-hidden ${
                      darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                    }`}>
                      <div className="p-6 border-b border-gray-100">
                        <h3 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
                          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Information
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                          <div className="relative">
                            {user?.avatar && !avatarError ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" 
                                referrerPolicy="no-referrer"
                                onError={() => setAvatarError(true)}
                              />
                            ) : (
                              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-primary-700 rounded-full flex items-center justify-center">
                                <span className="text-cream font-bold text-3xl">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                              </div>
                            )}
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-cream rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-semibold ${
                              darkMode ? 'text-primary-100' : 'text-gray-900'
                            }`}>{user?.name || 'User Name'}</h4>
                            <p className="text-gray-500">{user?.email || 'email@example.com'}</p>
                            <p className="text-sm text-gray-400 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'November 2024'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Full Name</label>
                            <input 
                              type="text" 
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Your full name"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Email Address</label>
                            <input 
                              type="email" 
                              value={user?.email || ''}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                              placeholder="your@email.com"
                              disabled
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Phone Number</label>
                            <input 
                              type="tel" 
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="+92 XXX XXXXXXX"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Date of Birth</label>
                            <input 
                              type="date" 
                              value={profileForm.dob}
                              onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button 
                            onClick={handleProfileUpdate}
                            className="px-6 py-2.5 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Security Settings */}
                    <div className={`rounded-xl shadow-md border overflow-hidden ${
                      darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                    }`}>
                      <div className="p-6 border-b border-gray-100">
                        <h3 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center mr-2 relative transform-gpu" style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 6px 12px rgba(16, 185, 129, 0.3), inset 0 -2px 6px rgba(0,0,0,0.2), inset 0 2px 6px rgba(255,255,255,0.3)'
                          }}>
                            <svg className="w-4 h-4 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          Security
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className={`flex items-center justify-between p-4 rounded-2xl ${
                          darkMode ? 'bg-dark-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative transform-gpu transition-transform hover:scale-110" style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3), inset 0 -2px 8px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.3)'
                            }}>
                              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                            <div>
                              <p className={`font-medium ${
                                darkMode ? 'text-primary-100' : 'text-gray-900'
                              }`}>Password</p>
                              <p className={`text-sm ${
                                darkMode ? 'text-primary-200/80' : 'text-gray-500'
                              }`}>Last changed 30 days ago</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowPasswordModal(true)}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-2xl transition-colors shadow-md ${
                              darkMode
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                                : 'bg-primary-600 hover:bg-primary-700'
                            }`}
                          >
                            Change
                          </button>
                        </div>
                        <div className={`flex items-center justify-between p-4 rounded-2xl ${
                          darkMode ? 'bg-dark-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative transform-gpu transition-transform hover:scale-110" style={{
                              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                              boxShadow: '0 8px 16px rgba(17, 153, 142, 0.3), inset 0 -2px 8px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.3)'
                            }}>
                              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <div>
                              <p className={`font-medium ${
                                darkMode ? 'text-primary-100' : 'text-gray-900'
                              }`}>Two-Factor Authentication</p>
                              <p className={`text-sm ${
                                darkMode ? 'text-primary-200/80' : 'text-gray-500'
                              }`}>Add extra security to your account</p>
                            </div>
                          </div>
                          <button 
                            onClick={handleToggle2FA}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-2xl transition-colors shadow-md ${
                              darkMode
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                                : 'bg-primary-600 hover:bg-primary-700'
                            }`}
                          >
                            {twoFactorEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        <div className={`flex items-center justify-between p-4 rounded-2xl ${
                          darkMode ? 'bg-dark-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative transform-gpu transition-transform hover:scale-110" style={{
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              boxShadow: '0 8px 16px rgba(240, 147, 251, 0.3), inset 0 -2px 8px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.3)'
                            }}>
                              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className={`font-medium ${
                                darkMode ? 'text-primary-100' : 'text-gray-900'
                              }`}>Active Sessions</p>
                              <p className={`text-sm ${
                                darkMode ? 'text-primary-200/80' : 'text-gray-500'
                              }`}>Manage devices logged into your account</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowSessionsModal(true)}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-2xl transition-colors shadow-md ${
                              darkMode
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                                : 'bg-primary-600 hover:bg-primary-700'
                            }`}
                          >
                            View All
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className={`rounded-xl shadow-md border overflow-hidden ${
                      darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                    }`}>
                      <div className="p-6 border-b border-gray-100">
                        <h3 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
                          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Notification Preferences
                        </h3>
                      </div>
                      <div className="p-6 space-y-3">
                        {[
                          { key: 'orderUpdates', label: 'Order Updates', desc: 'Receive updates about your orders' },
                          { key: 'promotions', label: 'Promotions', desc: 'Get notified about deals and discounts' },
                          { key: 'newsletter', label: 'Newsletter', desc: 'Monthly product and feature updates' },
                          { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Delivery and status alerts via SMS' },
                        ].map((pref) => (
                          <div key={pref.key} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
                            <div>
                              <p className={`${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{pref.label}</p>
                              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>{pref.desc}</p>
                            </div>
                            <button
                              onClick={() => toggleNotificationPref(pref.key)}
                              className={`px-4 py-2 text-sm font-medium rounded-2xl border transition-colors ${
                                notificationPrefs[pref.key]
                                  ? (darkMode ? 'border-primary-500 bg-primary-600 text-cream hover:bg-primary-700' : 'border-blue-500 bg-primary-600 text-cream hover:bg-primary-700')
                                  : (darkMode ? 'border-dark-600 text-primary-200 hover:bg-dark-700/60' : 'border-gray-300 text-gray-700 hover:bg-gray-100')
                              }`}
                            >
                              {notificationPrefs[pref.key] ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Preferences */}
                  <div className="space-y-6">
                    {/* Notification Preferences removed as requested */}

                    {/* Quick Links */}
                    <div className={`rounded-xl shadow-md border overflow-hidden ${
                      darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-gray-100'
                    }`}>
                      <div className="p-6 border-b border-gray-100">
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-primary-100' : 'text-gray-900'
                        }`}>Quick Links</h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[
                          { label: 'Help Center', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                          { label: 'Privacy Policy', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                          { label: 'Terms of Service', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                          { label: 'Contact Support', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                        ].map((item, index) => (
                          <button 
                            key={index} 
                            onClick={() => handleQuickLink(item.label)}
                              className={`w-full flex items-center justify-between p-4 transition-colors ${darkMode ? 'hover:bg-dark-700/70' : 'hover:bg-primary-50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className={`w-5 h-5 ${darkMode ? 'text-primary-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                              </svg>
                              <span className={`text-sm font-medium ${darkMode ? 'text-primary-200' : 'text-gray-700'}`}>{item.label}</span>
                            </div>
                            <svg className={`w-4 h-4 ${darkMode ? 'text-primary-200' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className={`rounded-xl shadow-md border overflow-hidden ${
                      darkMode ? 'bg-dark-800/80 backdrop-blur-md border-dark-700' : 'bg-cream border-red-100'
                    }`}>
                      <div className={`p-6 border-b ${
                        darkMode ? 'border-dark-700 bg-dark-700/80' : 'border-red-100 bg-red-50'
                      }`}>
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-red-400' : 'text-red-700'
                        }`}>Danger Zone</h3>
                      </div>
                      <div className="p-6">
                        <p className={`text-sm mb-4 ${
                          darkMode ? 'text-primary-200' : 'text-gray-600'
                        }`}>Once you delete your account, there is no going back. Please be certain.</p>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount}
                          className="w-full py-2.5 border-2 border-red-500 text-red-500 font-medium rounded-2xl hover:bg-red-500 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {deletingAccount ? 'Deleting...' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  // Password Change Modal
  const PasswordModal = () => {
    if (!showPasswordModal) return null;
    
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 ${
          darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${
              darkMode ? 'text-primary-100' : 'text-gray-900'
            }`}>Change Password</h3>
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Current Password</label>
              <input 
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>New Password</label>
              <input 
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Confirm New Password</label>
              <input 
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowPasswordModal(false)}
              className={`flex-1 px-4 py-2.5 border font-medium rounded-2xl transition-colors ${darkMode ? 'border-dark-600 text-primary-100 hover:bg-dark-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordChange}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Active Sessions Modal
  const SessionsModal = () => {
    if (!showSessionsModal) return null;
    
    const sessions = [
      { id: 1, device: 'Chrome on Windows', location: 'Karachi, Pakistan', current: true, lastActive: 'Active now' },
      { id: 2, device: 'Safari on iPhone', location: 'Lahore, Pakistan', current: false, lastActive: '2 hours ago' },
      { id: 3, device: 'Firefox on Mac', location: 'Islamabad, Pakistan', current: false, lastActive: '1 day ago' },
    ];
    
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className={`rounded-2xl shadow-2xl max-w-2xl w-full p-6 ${
          darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${
              darkMode ? 'text-primary-100' : 'text-gray-900'
            }`}>Active Sessions</h3>
            <button 
              onClick={() => setShowSessionsModal(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className={`p-4 rounded-2xl transition-colors border ${darkMode ? 'border-dark-700 bg-dark-700/50 hover:bg-dark-700/70' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-dark-600' : 'bg-primary-100'}`}>
                      <svg className={`w-5 h-5 ${darkMode ? 'text-primary-200' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{session.device}</p>
                        {session.current && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Current</span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>{session.location}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-primary-200/60' : 'text-gray-400'}`}>{session.lastActive}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button 
                      onClick={() => showNotification('Session terminated', 'success')}
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              showNotification('All other sessions terminated', 'success');
              setShowSessionsModal(false);
            }}
            className="w-full mt-4 px-4 py-2.5 border-2 border-red-500 text-red-500 font-medium rounded-2xl hover:bg-red-500 hover:text-white transition-colors"
          >
            Terminate All Other Sessions
          </button>
        </div>
      </div>
    );
  };

  // Help Center Modal
  const HelpCenterModal = () => {
    if (!showHelpCenter) return null;
    
    const faqs = [
      { q: 'How do I track my order?', a: 'Go to "My Orders" section and click on your order to see tracking details.' },
      { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery, Credit/Debit Cards, JazzCash, EasyPaisa, and Bank Transfer.' },
      { q: 'How can I return a product?', a: 'You can initiate a return within 7 days of delivery from the My Orders page.' },
      { q: 'Is there a warranty on products?', a: 'Yes, all products come with manufacturer warranty. Check product details for specifics.' },
      { q: 'How do I change my delivery address?', a: 'You can add/edit addresses in the Addresses section before placing an order.' },
    ];
    
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div className={`rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8 ${
          darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Help Center</h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Find answers to common questions</p>
            </div>
            <button 
              onClick={() => setShowHelpCenter(false)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'text-primary-200 hover:bg-dark-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h4 className={`font-semibold text-lg ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Frequently Asked Questions</h4>
            {faqs.map((faq, index) => (
              <div key={index} className={`p-4 rounded-2xl ${darkMode ? 'bg-dark-700/60 border border-dark-600' : 'bg-gray-50'}`}>
                <h5 className={`font-medium mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{faq.q}</h5>
                <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className={`mt-6 p-4 rounded-2xl ${darkMode ? 'bg-dark-700/70 border border-dark-600' : 'bg-blue-50'}`}>
            <p className={`text-sm mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Still need help?</p>
            <button
              onClick={() => {
                setShowHelpCenter(false);
                setShowContactSupport(true);
              }}
              className={`text-sm font-medium ${darkMode ? 'text-primary-200 hover:text-primary-100' : 'text-primary-600 hover:text-primary-700'}`}
            >
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Privacy Policy Modal
  const PrivacyPolicyModal = () => {
    if (!showPrivacyPolicy) return null;
    
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div className={`rounded-2xl shadow-2xl max-w-4xl w-full p-6 my-8 ${
          darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Privacy Policy</h3>
            <button 
              onClick={() => setShowPrivacyPolicy(false)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'text-primary-200 hover:bg-dark-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className={`prose prose-sm max-w-none space-y-4 max-h-[70vh] overflow-y-auto ${darkMode ? 'text-primary-200/80' : ''}`}>
            <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Last updated: December 7, 2025</p>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>1. Information We Collect</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We collect information you provide directly to us, including name, email address, phone number, shipping address, and payment information. We also automatically collect certain information about your device and how you interact with our platform.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>2. How We Use Your Information</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We use the information we collect to process your orders, communicate with you, personalize your experience, improve our services, and comply with legal obligations.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>3. Information Sharing</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We do not sell your personal information. We may share your information with service providers who assist us in operating our platform, processing payments, and delivering orders. We may also share information when required by law.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>4. Data Security</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>5. Your Rights</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>You have the right to access, update, or delete your personal information. You can manage your account settings or contact us to exercise these rights.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>6. Cookies</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>7. Changes to This Policy</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </section>
          </div>
        </div>
      </div>
    );
  };

  // Terms of Service Modal
  const TermsOfServiceModal = () => {
    if (!showTermsOfService) return null;
    
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div className={`rounded-2xl shadow-2xl max-w-4xl w-full p-6 my-8 ${
          darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Terms of Service</h3>
            <button 
              onClick={() => setShowTermsOfService(false)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'text-primary-200 hover:bg-dark-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className={`prose prose-sm max-w-none space-y-4 max-h-[70vh] overflow-y-auto ${darkMode ? 'text-primary-200/80' : ''}`}>
            <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>Last updated: December 7, 2025</p>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>1. Acceptance of Terms</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>By accessing and using ShopHub, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>2. User Accounts</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>3. Product Information and Pricing</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We strive to provide accurate product descriptions and pricing. However, errors may occur. We reserve the right to correct any errors and to cancel orders if pricing or product information is incorrect.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>4. Orders and Payment</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>All orders are subject to acceptance and product availability. We reserve the right to refuse or cancel any order. Payment must be made through our approved payment methods. You agree to pay all charges incurred by you or any users of your account.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>5. Shipping and Delivery</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Delivery times are estimates and not guaranteed. We are not liable for delays caused by circumstances beyond our control. Risk of loss passes to you upon delivery to the carrier.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>6. Returns and Refunds</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Products may be returned within 7 days of delivery in original condition. Refunds will be processed according to our return policy. Some products may not be eligible for return due to hygiene or safety reasons.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>7. Prohibited Conduct</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>You may not use our platform for any unlawful purpose or to violate any laws. You may not interfere with the security or proper functioning of the platform. Violation may result in account termination.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>8. Limitation of Liability</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>To the fullest extent permitted by law, ShopHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the platform.</p>
            </section>
            
            <section>
              <h4 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>9. Changes to Terms</h4>
              <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.</p>
            </section>
          </div>
        </div>
      </div>
    );
  };

  // Contact Support Modal
  // Main Dashboard View
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <PasswordModal />
      <SessionsModal />
      <HelpCenterModal />
      <PrivacyPolicyModal />
      <TermsOfServiceModal />
      
      {/* Contact Support Modal - Inline to prevent re-render issues */}
      {showContactSupport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 ${
            darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Contact Support</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>We're here to help! Send us a message.</p>
              </div>
              <button 
                onClick={() => setShowContactSupport(false)}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'text-primary-200 hover:bg-dark-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-dark-700/70 border border-dark-600' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className={`font-semibold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Email</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>support@shophub.com</p>
              </div>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-dark-700/70 border border-dark-600' : 'bg-green-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <h4 className={`font-semibold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>Phone</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>+92 300 1234567</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Name</label>
                  <input 
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Email</label>
                  <input 
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Subject</label>
                <input 
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                  placeholder="What can we help you with?"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-primary-100' : 'text-gray-700'}`}>Message</label>
                <textarea 
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={5}
                  className={`w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 resize-none ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60 focus:ring-primary-500' : 'border-gray-200 focus:ring-blue-500'}`}
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowContactSupport(false)}
                className={`flex-1 px-4 py-2.5 border font-medium rounded-2xl transition-colors ${darkMode ? 'border-dark-600 text-primary-100 hover:bg-dark-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleContactSubmit}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-cream font-medium rounded-2xl hover:bg-primary-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-cream shadow-primary-500/50' 
            : 'bg-gradient-to-r from-red-500 to-red-600 text-cream shadow-red-500/50'
        }`}>
          {notification.type === 'success' ? (
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 p-1 hover:bg-cream/20 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: slide in/out, Desktop: collapsible */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 shadow-2xl flex flex-col transition-all duration-300 ease-in-out
          ${darkMode ? 'bg-dark-800' : 'bg-cream'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}
      >
        {/* Logo Section */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-700 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}>
          <button 
            onClick={() => {
              setActiveTab('overview');
              setSelectedProduct(null);
              setSidebarOpen(false);
            }}
            className={`flex items-center cursor-pointer hover:opacity-80 transition-opacity ${sidebarCollapsed ? 'lg:hidden' : ''}`}
          >
            <div className="w-9 h-9 bg-cream rounded-2xl flex items-center justify-center shadow text-xl">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="ml-3 text-lg font-bold text-white">ShopHub</span>
          </button>
          {/* Collapsed Logo */}
          <button 
            onClick={() => {
              setActiveTab('overview');
              setSelectedProduct(null);
            }}
            className={`hidden ${sidebarCollapsed ? 'lg:flex' : ''} items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <div className="w-9 h-9 bg-cream rounded-2xl flex items-center justify-center shadow text-xl">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </button>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-1.5 text-white hover:bg-cream/20 rounded-2xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div className={`p-4 border-b ${darkMode ? 'border-dark-700' : 'border-gray-100'} ${sidebarCollapsed ? 'lg:px-2 lg:py-3' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center' : `p-3 rounded-xl ${darkMode ? 'bg-dark-700' : 'bg-gradient-to-r from-gray-50 to-blue-50'}`}`}>
            <div className="relative flex-shrink-0">
              {user?.avatar && !avatarError ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className={`rounded-full object-cover border-2 border-blue-400 ${sidebarCollapsed ? 'lg:w-10 lg:h-10' : 'w-11 h-11'}`}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className={`bg-gradient-to-br from-blue-500 to-primary-700 rounded-full flex items-center justify-center shadow-md ${sidebarCollapsed ? 'lg:w-10 lg:h-10' : 'w-11 h-11'}`}>
                  <span className={`text-cream font-bold ${sidebarCollapsed ? 'lg:text-sm' : 'text-base'}`}>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className={`ml-3 min-w-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <p className={`text-sm font-semibold truncate ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{user?.name || 'User'}</p>
              <p className={`text-xs truncate ${darkMode ? 'text-primary-200' : 'text-gray-500'}`}>{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'catalog') {
                  setSelectedProduct(null);
                }
                setSidebarOpen(false);
              }}
              title={sidebarCollapsed ? item.label : ''}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${activeTab === item.id 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-700 text-cream shadow-lg shadow-primary-500/25' 
                  : `${darkMode ? 'text-primary-200 hover:bg-dark-700 hover:text-primary-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            >
              <div className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center' : ''}`}>
                <svg className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  sidebarCollapsed ? 'lg:absolute lg:-top-1 lg:-right-1 lg:w-5 lg:h-5 lg:p-0 lg:flex lg:items-center lg:justify-center' : ''
                } ${
                  activeTab === item.id ? 'bg-cream text-primary-600' : 'bg-primary-100 text-primary-600'
                } ${
                  item.id === 'cart' ? cartBadgeAnimation : item.id === 'wishlist' ? wishlistBadgeAnimation : ''
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle & Logout */}
        <div className={`p-3 border-t space-y-2 ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex w-full items-center justify-center px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors ${sidebarCollapsed ? '' : 'justify-between'}`}
          >
            <span className={sidebarCollapsed ? 'hidden' : 'text-sm'}>Collapse</span>
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Logout Button */}
          <button
            onClick={onLogout}
            title={sidebarCollapsed ? 'Logout' : ''}
            className={`w-full flex items-center px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'justify-center'}`}
          >
            <svg className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Top Header */}
        <header
          className={`sticky top-0 z-30 backdrop-blur-sm border-b ${darkMode ? 'bg-dark-800/95 border-dark-700' : 'bg-cream/95 border-gray-200'}`}
          style={{ transform: `translateZ(0) translateY(${parallaxOffset * -0.02}px)` }}
        >
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-xl transition-colors ${
                  darkMode ? 'text-primary-300 hover:text-primary-100 hover:bg-dark-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{getPageTitle()}</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back, {user?.name?.split(' ')[0] || 'there'}!</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className={`hidden md:flex items-center rounded-xl px-3 py-2 ${darkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
                <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search..." className={`ml-2 bg-transparent border-none outline-none text-sm w-36 lg:w-48 ${darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`} />
              </div>


              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-primary-100 hover:text-primary-200 hover:bg-dark-700' : 'text-gray-900 hover:text-primary-700 hover:bg-gray-100'}`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>


              {/* Notifications */}
              <CustomerNotificationDropdown isDarkMode={darkMode} />


              {/* Cart */}
              <button 
                onClick={() => {
                  setActiveTab('cart');
                  setSelectedProduct(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative p-2 rounded-xl transition-colors ${darkMode ? 'text-primary-100 hover:text-primary-200 hover:bg-dark-700' : 'text-gray-900 hover:text-primary-700 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cart.itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-cream text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </span>
                )}
              </button>

              {/* User Avatar with Dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="hidden sm:flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {user?.avatar && !avatarError ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-400"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-cream font-bold text-sm">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className={`absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                    darkMode ? 'bg-dark-800 border-dark-700' : 'bg-cream border-gray-100'
                  }`}>
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-700 text-cream">
                      <div className="flex items-center gap-3">
                        {user?.avatar && !avatarError ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                            referrerPolicy="no-referrer"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-cream/20 rounded-full flex items-center justify-center">
                            <span className="text-cream font-bold text-lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{user?.name || 'User'}</p>
                          <p className="text-sm text-primary-100 truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className={`grid grid-cols-3 divide-x border-b ${
                      darkMode ? 'divide-dark-700 border-dark-700' : 'divide-gray-100 border-gray-100'
                    }`}>
                      <div className="p-3 text-center">
                        <p className={`text-lg font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{cart.itemCount || 0}</p>
                        <p className={`text-xs ${darkMode ? 'text-primary-200/60' : 'text-gray-500'}`}>Cart</p>
                      </div>
                      <div className="p-3 text-center">
                        <p className={`text-lg font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{wishlist.length}</p>
                        <p className={`text-xs ${darkMode ? 'text-primary-200/60' : 'text-gray-500'}`}>Wishlist</p>
                      </div>
                      <div className="p-3 text-center">
                        <p className={`text-lg font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>{addresses.length}</p>
                        <p className={`text-xs ${darkMode ? 'text-primary-200/60' : 'text-gray-500'}`}>Addresses</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {[
                        { label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', tab: 'settings' },
                        { label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', tab: 'orders' },
                        { label: 'My Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', tab: 'wishlist' },
                        { label: 'My Addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', tab: 'addresses' },
                        { label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', tab: 'settings' },
                      ].map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setActiveTab(item.tab);
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            darkMode 
                              ? 'text-primary-100 hover:bg-dark-700' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <svg className={`w-5 h-5 ${darkMode ? 'text-primary-200/60' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className={`p-2 border-t ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-2xl transition-colors ${
                          darkMode
                            ? 'text-red-400 hover:bg-red-900/30'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainContentRef} className="p-4 sm:p-6">
          {renderMainContent()}
        </main>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            ></div>
            <div
              className={`relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ${
                darkMode ? 'bg-dark-800/95 backdrop-blur-md border border-dark-700' : 'bg-cream border border-gray-100'
              }`}
            >
              <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-primary-100' : 'text-gray-900'}`}>
                    {editingReview ? 'Edit Your Review' : 'Write a Review'}
                  </h2>
                  <button onClick={() => setShowReviewModal(false)} className="p-2 rounded-2xl hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {/* Rating */}
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Rating</label>
                  <div className="flex items-center gap-1 mt-2">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-1"
                        title={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <svg className={`w-6 h-6 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className={`text-sm font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Title (optional)</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                    placeholder="Summarize your thoughts"
                  />
                </div>

                {/* Comment */}
                <div className="flex flex-col gap-1">
                  <label className={`text-sm font-medium ${darkMode ? 'text-primary-200/80' : 'text-gray-600'}`}>Comment</label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${darkMode ? 'bg-dark-700/70 border-dark-600 text-primary-100 placeholder-primary-300/60' : 'border-gray-200'}`}
                    placeholder="Share details about your experience"
                  />
                </div>
              </div>
              <div className={`p-4 sm:p-6 border-t flex justify-end gap-3 ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium border ${darkMode ? 'border-dark-600 text-primary-200 hover:bg-dark-700/70' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 rounded-2xl text-sm font-medium bg-primary-600 text-cream hover:bg-primary-700"
                >
                  {editingReview ? 'Save Changes' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// Review Modal Overlay
// Rendered at root level to avoid layout issues


