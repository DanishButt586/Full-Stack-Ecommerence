/**
 * Admin Dashboard Component
 * Dashboard for admin/seller portal with inventory management
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ProductManagement from './ProductManagement';
import CartManagement from './CartManagement';
import CouponManagement from './CouponManagement';
import ReviewManagement from './ReviewManagement';
import OrderManagement from './OrderManagement';
import Settings from './Settings';
import SalesReportModal from './SalesReportModal';
import InventoryReportModal from './InventoryReportModal';
import CustomerReportModal from './CustomerReportModal';
import NotificationDropdown from './NotificationDropdown';
import notificationService from '../services/notificationService';
import { getCustomers, getCustomerStats } from '../services/customerService';
import { getInventorySummary } from '../services/productService';
import { getAllCoupons } from '../services/couponService';
import { getAllOrdersAdmin } from '../services/checkoutService';
import { DEFAULT_SETTINGS, formatDateWithSettings, persistSettings, useUserSettings } from '../utils/settings';

const AdminDashboard = ({ user, onLogout }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const storedSettings = useUserSettings();
  const [userSettings, setUserSettings] = useState(DEFAULT_SETTINGS);
  const profileRef = useRef(null);

  // Stats state
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    coupons: 0,
    activeCoupons: 0
  });

  const [overviewLoading, setOverviewLoading] = useState(false);

  // Customer state
  const [customers, setCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState({ total: 0, newThisMonth: 0, newThisWeek: 0 });
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPagination, setCustomerPagination] = useState({ total: 0, pages: 1 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerError, setCustomerError] = useState(null);

  // Report Modal States
  const [showSalesReportModal, setShowSalesReportModal] = useState(false);
  const [showInventoryReportModal, setShowInventoryReportModal] = useState(false);
  const [showCustomerReportModal, setShowCustomerReportModal] = useState(false);

  // Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const merged = { ...DEFAULT_SETTINGS, ...storedSettings };
    setUserSettings(merged);
    setDarkMode((merged.theme || DEFAULT_SETTINGS.theme) === 'dark');
  }, [storedSettings]);

  // Handle navigation from notification - switch to orders tab
  useEffect(() => {
    if (location.state?.activeTab) {
      console.log('Setting activeTab to:', location.state.activeTab);
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  const handleSettingsChange = (nextSettings) => {
    const merged = persistSettings({ ...userSettings, ...nextSettings });
    setUserSettings(merged);
    setDarkMode(merged.theme === 'dark');
  };

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Refresh unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchCustomers = useCallback(async () => {
    console.log('🔄 ========== FETCH CUSTOMERS START ==========');
    console.log('Page:', customerPage, 'Search:', customerSearch);
    
    setCustomersLoading(true);
    setCustomerError(null);
    
    try {
      const response = await getCustomers(customerPage, 100, customerSearch);
      console.log('📦 Full Response:', JSON.stringify(response, null, 2));
      
      // Multiple extraction methods to ensure we get the data
      let customersArray = [];
      
      // Method 1: Standard format
      if (response?.success && response?.data?.customers && Array.isArray(response.data.customers)) {
        customersArray = response.data.customers;
        console.log('✅ Method 1 SUCCESS: Got', customersArray.length, 'customers from response.data.customers');
      }
      // Method 2: Direct array in response
      else if (Array.isArray(response?.customers)) {
        customersArray = response.customers;
        console.log('✅ Method 2 SUCCESS: Got', customersArray.length, 'customers from response.customers');
      }
      // Method 3: Response itself is array
      else if (Array.isArray(response)) {
        customersArray = response;
        console.log('✅ Method 3 SUCCESS: Got', customersArray.length, 'customers from response array');
      }
      
      // Validate we got actual customer objects
      if (customersArray.length > 0) {
        console.log('👥 Customer Names:', customersArray.map(c => c?.name || 'Unknown').join(', '));
        console.log('📧 Customer Emails:', customersArray.map(c => c?.email || 'Unknown').join(', '));
        console.log('🆔 Customer IDs:', customersArray.map(c => c?._id || 'Unknown').slice(0, 3).join(', '));
        
        setCustomers(customersArray);
        setCustomerPagination(response?.data?.pagination || { 
          total: customersArray.length, 
          page: 1, 
          pages: 1 
        });
        
        console.log('✅ STATE UPDATED: Set', customersArray.length, 'customers in state');
      } else {
        const errorMsg = 'No customers found in API response';
        console.error('❌ NO CUSTOMERS FOUND IN RESPONSE');
        console.error('Response structure:', Object.keys(response || {}));
        console.error('Response.data:', response?.data);
        console.error('Response.success:', response?.success);
        
        setCustomerError(errorMsg + '. Check console for details.');
        setCustomers([]);
      }
      
    } catch (error) {
      const errorMsg = error?.message || 'Unknown error occurred';
      console.error('❌ EXCEPTION in fetchCustomers:');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      setCustomerError(errorMsg);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
      console.log('🏁 ========== FETCH CUSTOMERS END ==========\n');
    }
  }, [customerPage, customerSearch]);

  const fetchCustomerStats = useCallback(async () => {
    try {
      const response = await getCustomerStats();
      if (response.success) {
        setCustomerStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  }, []);

  const fetchOverviewStats = useCallback(async () => {
    setOverviewLoading(true);

    try {
      const [inventoryRes, ordersRes, couponsRes, customerStatsRes] = await Promise.all([
        getInventorySummary(),
        getAllOrdersAdmin(1, 50, 'all'),
        getAllCoupons(1, 50),
        getCustomerStats()
      ]);

      const inventory = inventoryRes?.data?.overall || {};
      const orderStats = ordersRes?.data?.stats || {};
      const orderPaginationTotal = ordersRes?.data?.pagination?.total;
      const ordersList = ordersRes?.data?.orders || [];
      const couponsData = couponsRes?.data || {};
      const couponsList = couponsData.coupons || [];
      const activeCoupons = couponsList.filter((coupon) => coupon.isActive).length;
      const couponsTotal = couponsData.pagination?.total ?? couponsList.length;
      const customerStatsData = customerStatsRes?.data?.stats || customerStatsRes?.data || {};

      const pendingOrders = ordersList.filter((order) => {
        const status = (order.orderStatus || '').toLowerCase();
        const isPendingStatus = ['pending', 'processing', 'confirmed', 'shipping', 'shipped'].includes(status);
        return isPendingStatus || (!order.isPaid && status !== 'delivered' && status !== 'cancelled');
      }).length;

      setStats((prev) => ({
        ...prev,
        products: inventory.totalProducts || 0,
        activeProducts: inventory.activeProducts || 0,
        lowStockProducts: inventory.lowStock || 0,
        orders: orderPaginationTotal ?? orderStats.totalOrders ?? 0,
        revenue: orderStats.totalRevenue || 0,
        pendingOrders,
        coupons: couponsTotal || 0,
        activeCoupons: activeCoupons || 0
      }));

      setCustomerStats({
        total: customerStatsData.totalCustomers || customerStatsData.total || 0,
        newThisMonth: customerStatsData.newCustomers || customerStatsData.newThisMonth || 0,
        newThisWeek: customerStatsData.recentCustomers || customerStatsData.newThisWeek || 0
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Fetch customers when tab changes to customers
  useEffect(() => {
    if (activeTab === 'customers') {
      console.log('🎯 Customer tab activated - triggering fetch');
      // Force a small delay to ensure component is mounted
      const timer = setTimeout(() => {
        fetchCustomers();
        fetchCustomerStats();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchCustomers, fetchCustomerStats]);

  // Fetch overview stats when landing on overview
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewStats();
    }
  }, [activeTab, fetchOverviewStats]);

  // Auto-refresh customer list periodically while on Customers tab
  useEffect(() => {
    if (activeTab !== 'customers') return;

    const interval = setInterval(() => {
      fetchCustomers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeTab, fetchCustomers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on mobile when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar menu items
  const menuItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    { 
      id: 'carts', 
      label: 'Carts', 
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
    },
    { 
      id: 'coupons', 
      label: 'Coupons & Discounts', 
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
    },
    { 
      id: 'reviews', 
      label: 'Reviews & Feedback', 
      icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
    },
    { 
      id: 'customers', 
      label: 'Customers', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    },
  ];

  // Get page title based on active tab
  const getPageTitle = () => {
    const titles = {
      overview: 'Dashboard Overview',
      products: 'Product Management',
      orders: 'Order Management',
      carts: 'Cart Management',
      coupons: 'Coupon & Discount Management',
      reviews: 'Reviews & Feedback Management',
      customers: 'Customer Management',
      analytics: 'Analytics & Reports',
      settings: 'Settings',
    };
    return titles[activeTab] || 'Dashboard';
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductManagement darkMode={darkMode} settings={userSettings} />;
      case 'carts':
        return <CartManagement darkMode={darkMode} settings={userSettings} />;
      case 'coupons':
        return <CouponManagement darkMode={darkMode} settings={userSettings} />;
      case 'reviews':
        return <ReviewManagement darkMode={darkMode} />;
      case 'orders':
        return <OrderManagement darkMode={darkMode} settings={userSettings} initialOrderId={location.state?.selectedOrderId} />;
      case 'customers':
        return renderCustomersContent();
      case 'analytics':
        return renderAnalyticsContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderOverviewContent();
    }
  };

  // Overview content
  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Welcome Banner - Modern Aesthetic Style */}
      <div className={`relative rounded-3xl overflow-hidden shadow-2xl min-h-[280px] ${darkMode ? 'opacity-95' : ''}`} style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #23255a 0%, #3a225d 100%)' 
            : 'linear-gradient(135deg, #171d57 0%, #5e1954 100%)'
        }}>
        
        {/* Left Side Decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none">
          {/* 3D Sphere with Neon Glow */}
          <div className="absolute top-1/4 -left-16 w-32 h-32 rounded-full opacity-40" style={{
            background: 'radial-gradient(circle at 30% 30%, #a5b4fc, #6366f1)',
            boxShadow: '0 0 60px rgba(99, 102, 241, 0.6), inset -10px -10px 30px rgba(0, 0, 0, 0.3)',
            filter: 'blur(1px)',
            animation: 'float-sphere 6s ease-in-out infinite'
          }}></div>
          
          {/* Abstract Curved Shape */}
          <svg className="absolute bottom-0 left-0 w-48 h-48 opacity-30" viewBox="0 0 200 200" style={{ animation: 'wave 8s ease-in-out infinite' }}>
            <path fill="url(#grad1)" d="M47.5,-57.9C59.6,-47.3,66.6,-31.4,69.8,-14.8C73,1.8,72.4,19.1,64.5,33.3C56.6,47.5,41.4,58.6,24.8,64.1C8.2,69.6,-9.8,69.5,-26.2,64.3C-42.6,59.1,-57.4,48.8,-65.3,34.8C-73.2,20.8,-74.2,3.1,-70.5,-12.9C-66.8,-28.9,-58.4,-43.2,-46.3,-53.8C-34.2,-64.4,-18.1,-71.3,-0.8,-70.3C16.5,-69.3,35.4,-68.5,47.5,-57.9Z" transform="translate(100 100)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Floating Ring */}
          <div className="absolute top-1/2 left-8 w-20 h-20 border-4 rounded-full opacity-20" style={{
            borderColor: '#a5b4fc',
            borderStyle: 'dashed',
            animation: 'rotate-ring 12s linear infinite'
          }}></div>
        </div>

        {/* Right Side Decorations */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none">
          {/* Mesh Gradient Sphere */}
          <div className="absolute top-1/3 -right-20 w-40 h-40 rounded-full opacity-30" style={{
            background: 'radial-gradient(circle at 60% 40%, #c4b5fd, #8b5cf6, #5e1954)',
            boxShadow: '0 0 80px rgba(139, 92, 246, 0.5), inset 10px 10px 40px rgba(0, 0, 0, 0.4)',
            animation: 'float-sphere 7s ease-in-out infinite reverse'
          }}></div>
          
          {/* Neon Wave Lines */}
          <svg className="absolute top-0 right-0 w-56 h-56 opacity-25" viewBox="0 0 200 200">
            <path fill="none" stroke="url(#grad2)" strokeWidth="3" d="M10,100 Q50,50 100,100 T190,100" style={{ animation: 'wave-path 4s ease-in-out infinite' }} />
            <path fill="none" stroke="url(#grad2)" strokeWidth="2" d="M10,120 Q50,70 100,120 T190,120" opacity="0.6" style={{ animation: 'wave-path 4s ease-in-out infinite 0.5s' }} />
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#a5b4fc', stopOpacity: 0 }} />
                <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#c4b5fd', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Abstract Triangles */}
          <div className="absolute bottom-1/4 right-12 w-16 h-16 opacity-20" style={{
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
            animation: 'triangle-float 5s ease-in-out infinite'
          }}></div>
        </div>

        {/* Curved Wave Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,50 C300,100 600,0 900,50 L900,120 L0,120 Z" fill="url(#wave-gradient)" />
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#a5b4fc' }} />
                <stop offset="100%" style={{ stopColor: '#c4b5fd' }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Glassmorphism Content Card */}
        <div className="relative backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 m-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
            {/* Left Content with Animation */}
            <div className="flex-1 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-xs font-medium text-white/90 tracking-wide uppercase">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                Welcome back, <span className="text-transparent bg-clip-text animate-gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #a5b4fc, #c4b5fd)' }}>{user?.name?.split(' ')[0] || 'Admin'}</span>!
              </h2>
              
              <p className="text-white/80 text-sm sm:text-base max-w-md leading-relaxed drop-shadow-md">
                Manage your store, products, and orders from your admin dashboard.
              </p>
              
              {/* Animated Stats Bar */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow shadow-lg shadow-green-400/50"></div>
                  <span>System Active</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span>{customerStats.total || 0} Total Customers</span>
                </div>
              </div>
            </div>

            {/* Right Side - Premium CTA Button & Quick Stats */}
            <div className="flex-shrink-0 flex flex-col items-center sm:items-end gap-4 animate-slide-in-right relative z-20">
              {/* Premium CTA Button */}
              <button
                onClick={() => setActiveTab('products')}
                className="group relative px-6 py-3 bg-white/15 backdrop-blur-md hover:bg-white/25 border border-white/30 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-white font-semibold text-sm">Add Product</span>
                </div>
              </button>

              {/* Quick Stats Cards */}
              <div className="flex gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 shadow-lg">
                  <div className="text-xs text-white/70 mb-0.5">Products</div>
                  <div className="text-xl font-bold text-white">156</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 shadow-lg">
                  <div className="text-xs text-white/70 mb-0.5">Orders</div>
                  <div className="text-xl font-bold text-white">1.2K</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with 3D Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { title: 'Total Products', value: overviewLoading ? '—' : stats.products.toLocaleString(), changeLine1: 'Manage', changeLine2: 'inventory', color: 'purple', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', onClick: () => setActiveTab('products') },
          { title: 'Total Orders', value: overviewLoading ? '—' : stats.orders.toLocaleString(), changeLine1: 'Track', changeLine2: 'orders', color: 'purple', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', onClick: () => setActiveTab('orders') },
          { title: 'Active Coupons', value: overviewLoading ? '—' : stats.activeCoupons.toLocaleString(), changeLine1: 'Manage', changeLine2: 'discounts', color: 'purple', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', onClick: () => setActiveTab('coupons') },
          { title: 'Total Customers', value: overviewLoading ? '—' : (customerStats.total || 0).toLocaleString(), changeLine1: `${customerStats.newThisWeek}`, changeLine2: 'this week', color: 'purple', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', onClick: () => setActiveTab('customers') },
        ].map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`relative overflow-hidden rounded-3xl shadow-2xl p-5 sm:p-6 border-2 transition-all duration-500 group cursor-pointer hover:shadow-2xl transform hover:-translate-y-2 ${darkMode ? 'border-opacity-20 border-indigo-400' : 'border-opacity-10 border-gray-300 bg-white'}`}
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              background: darkMode 
                ? `linear-gradient(135deg, rgba(30, 20, 60, 0.8), rgba(50, 30, 80, 0.6))`
                : `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248, 249, 250, 0.8))`
            }}
          >
            {/* 3D Background with gradient */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to bottom right, #492273, #5a2d87)' }}></div>
            
            {/* Floating orbs with enhanced glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-all duration-500" style={{ backgroundColor: '#492273' }}></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-500" style={{ backgroundColor: '#492273' }}></div>
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
              background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
              animation: 'shimmer 3s infinite'
            }}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center group-hover:scale-125 group-hover:-rotate-6 transition-all duration-300 shadow-xl flex-shrink-0"
                  style={{
                    backgroundColor: '#e9d5f5',
                    boxShadow: '0 20px 40px rgba(73, 34, 115, 0.3)'
                  }}>
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#492273' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <span className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-2xl backdrop-blur-lg text-center leading-tight ${darkMode ? 'bg-white/10 text-white border border-white/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200'}`}>
                  <div>{stat.changeLine1}</div>
                  <div>{stat.changeLine2}</div>
                </span>
              </div>
              <p className={`text-xs sm:text-sm font-semibold mb-2 tracking-wide uppercase ${darkMode ? 'text-gray-300 opacity-70' : 'text-black'}`}>{stat.title}</p>
              <p className="text-2xl sm:text-3xl font-black" style={{ color: '#aa8db0' }}>
                {stat.value}
              </p>
            </div>

            {/* Pulse dots */}
            <div className="absolute top-3 right-3 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>
        ))}
      </div>

      {/* Quick Actions with 3D Enhanced Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Actions Card */}
        <div className={`relative group overflow-hidden rounded-3xl shadow-2xl p-6 border-2 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-3xl ${darkMode ? 'bg-white' : 'bg-white'}`}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            background: darkMode 
              ? `linear-gradient(135deg, rgba(80, 30, 100, 0.8), rgba(90, 50, 120, 0.6))`
              : `linear-gradient(135deg, rgba(250,245,255,0.95), rgba(245,240,255,0.8))`,
            borderColor: '#492273',
            borderOpacity: darkMode ? 0.2 : 0.1
          }}>
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to bottom right, #492273, #5a2d87)' }}></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-all duration-500" style={{ backgroundColor: '#492273' }}></div>
          
          <div className="relative z-10">
            <h3 className={`text-xl font-bold mb-5 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mr-3 shadow-xl group-hover:scale-125 group-hover:-rotate-6 transition-all"
                style={{ backgroundColor: '#e9d5f5', boxShadow: '0 20px 40px rgba(73, 34, 115, 0.3)' }}>
                <svg className="w-7 h-7" style={{ color: '#492273' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              Products
            </h3>
            <div className="space-y-3">
              <button onClick={() => setActiveTab('products')} className="w-full px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group/btn transform hover:scale-[1.05] border"
                style={{
                  backgroundColor: darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5',
                  color: darkMode ? '#e9d5f5' : '#492273',
                  borderColor: darkMode ? 'rgba(73, 34, 115, 0.3)' : '#492273'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.3)' : '#d4b3e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5'}>
                <div className="flex items-center justify-between">
                  <span>📊 Manage Products</span>
                  <svg className="w-5 h-5 opacity-0 group-hover/btn:opacity-100 transition-opacity transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
              <button onClick={() => setActiveTab('products')} className="w-full px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group/btn transform hover:scale-[1.05] border"
                style={{
                  backgroundColor: darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5',
                  color: darkMode ? '#e9d5f5' : '#492273',
                  borderColor: darkMode ? 'rgba(73, 34, 115, 0.3)' : '#492273'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.3)' : '#d4b3e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5'}>
                <div className="flex items-center justify-between">
                  <span>➕ Add New Product</span>
                  <svg className="w-5 h-5 opacity-0 group-hover/btn:opacity-100 transition-opacity transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
              {stats.lowStockProducts > 0 && (
                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${darkMode ? 'bg-orange-500/10 border-orange-400/40 text-orange-300' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 text-orange-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-sm">{stats.lowStockProducts} Low Stock Items</p>
                      <p className="text-xs opacity-75">Reorder soon</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Actions Card */}
        <div className={`relative group overflow-hidden rounded-3xl shadow-2xl p-6 border-2 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-3xl ${darkMode ? 'bg-white' : 'bg-white'}`}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            background: darkMode 
              ? `linear-gradient(135deg, rgba(80, 30, 100, 0.8), rgba(90, 50, 120, 0.6))`
              : `linear-gradient(135deg, rgba(250,245,255,0.95), rgba(245,240,255,0.8))`,
            borderColor: '#492273',
            borderOpacity: darkMode ? 0.2 : 0.1
          }}>
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to bottom right, #492273, #5a2d87)' }}></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-all duration-500" style={{ backgroundColor: '#492273' }}></div>
          
          <div className="relative z-10">
            <h3 className={`text-xl font-bold mb-5 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mr-3 shadow-xl group-hover:scale-125 group-hover:-rotate-6 transition-all"
                style={{ backgroundColor: '#e9d5f5', boxShadow: '0 20px 40px rgba(73, 34, 115, 0.3)' }}>
                <svg className="w-7 h-7" style={{ color: '#492273' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Orders
            </h3>
            <div className="space-y-3">
              <button onClick={() => setActiveTab('orders')} className="w-full px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group/btn transform hover:scale-[1.05] border"
                style={{
                  backgroundColor: darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5',
                  color: darkMode ? '#e9d5f5' : '#492273',
                  borderColor: darkMode ? 'rgba(73, 34, 115, 0.3)' : '#492273'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.3)' : '#d4b3e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5'}>
                <div className="flex items-center justify-between">
                  <span>📦 View All Orders</span>
                  <svg className="w-5 h-5 opacity-0 group-hover/btn:opacity-100 transition-opacity transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
              {stats.pendingOrders > 0 && (
                <button className={`w-full px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group/btn transform hover:scale-[1.05] ${darkMode ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/30' : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 hover:from-red-100 hover:to-pink-100 border border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <span>⏳ {stats.pendingOrders} Pending Orders</span>
                    <svg className="w-5 h-5 opacity-0 group-hover/btn:opacity-100 transition-opacity transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Coupon & Revenue Card */}
        <div className={`relative group overflow-hidden rounded-3xl shadow-2xl p-6 border-2 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-3xl ${darkMode ? 'bg-white' : 'bg-white'}`}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            background: darkMode 
              ? `linear-gradient(135deg, rgba(80, 30, 100, 0.8), rgba(90, 50, 120, 0.6))`
              : `linear-gradient(135deg, rgba(250,245,255,0.95), rgba(245,240,255,0.8))`,
            borderColor: '#492273',
            borderOpacity: darkMode ? 0.2 : 0.1
          }}>
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to bottom right, #492273, #5a2d87)' }}></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-all duration-500" style={{ backgroundColor: '#492273' }}></div>
          
          <div className="relative z-10">
            <h3 className={`text-xl font-bold mb-5 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mr-3 shadow-xl group-hover:scale-125 group-hover:-rotate-6 transition-all"
                style={{ backgroundColor: '#e9d5f5', boxShadow: '0 20px 40px rgba(73, 34, 115, 0.3)' }}>
                <svg className="w-7 h-7" style={{ color: '#492273' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              Discounts
            </h3>
            <div className="space-y-3">
              <button onClick={() => setActiveTab('coupons')} className="w-full px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group/btn transform hover:scale-[1.05] border"
                style={{
                  backgroundColor: darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5',
                  color: darkMode ? '#e9d5f5' : '#492273',
                  borderColor: darkMode ? 'rgba(73, 34, 115, 0.3)' : '#492273'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.3)' : '#d4b3e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(73, 34, 115, 0.2)' : '#e9d5f5'}>
                <div className="flex items-center justify-between">
                  <span>🎁 Manage Coupons</span>
                  <svg className="w-5 h-5 opacity-0 group-hover/btn:opacity-100 transition-opacity transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
              <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${darkMode ? 'bg-indigo-500/10 border-indigo-400/40 text-indigo-300' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-indigo-700'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="font-semibold text-sm">{stats.activeCoupons} Active Coupons</p>
                    <p className="text-xs opacity-75">Boost sales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`relative overflow-hidden rounded-2xl shadow-lg p-6 border transition-all duration-300 ${darkMode ? '' : 'bg-cream/90 backdrop-blur-sm border-gray-100'}`}
        style={darkMode ? { backgroundColor: 'rgba(13, 4, 61, 0.6)', backdropFilter: 'blur(12px)', borderColor: 'rgba(99, 102, 241, 0.2)' } : {}}>
        {/* Floating orb background */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="relative w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-2 shadow-md">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Recent Activity
            </h3>
            <span className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-gray-100 text-gray-500'}`}>Live</span>
          </div>
          <div className="text-center py-12">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20 animate-pulse"></div>
              <div className={`relative w-16 h-16 ${darkMode ? '' : 'bg-gray-100'} rounded-full flex items-center justify-center`}
                style={darkMode ? { backgroundColor: 'rgba(99, 102, 241, 0.1)' } : {}}>
                <svg className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No recent activity</p>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Activity will appear here as you manage your store</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Customers content placeholder
  const renderCustomersContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Customer Management</h2>
          <p className="text-sm text-indigo-600 mt-1 font-medium">
            View and manage all registered customers
          </p>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{customerStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">New This Month</p>
              <p className="text-2xl font-bold text-green-600 mt-1">+{customerStats.newThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">New This Week</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">+{customerStats.newThisWeek}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomerPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchCustomers}
            className="px-4 py-2.5 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: '#492273' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a2d87'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#492273'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Customer List</h3>
        </div>

        {customersLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading customers...</p>
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
            <p className="text-gray-500 text-sm mb-2">
              {customerSearch ? 'Try a different search term' : 'Unable to load customers'}
            </p>
            {customerError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
                <p className="text-sm text-red-700 font-mono">{customerError}</p>
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('🔄 Manual retry triggered');
                  fetchCustomers();
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔄 Retry Loading Customers
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Open browser console (F12) to see detailed error information
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
                              background: 'linear-gradient(to bottom right, #171d57, #5e1954)'
                            }}>
                            {customer.avatar ? (
                              <img
                                src={customer.avatar.startsWith('http') ? customer.avatar : `http://localhost:5000${customer.avatar}`}
                                alt={customer.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              className="text-white font-bold text-sm"
                              style={{ display: customer.avatar ? 'none' : 'flex' }}
                            >
                              {customer.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">ID: {customer._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateWithSettings(customer.createdAt, {}, userSettings)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {customers.map((customer) => (
                <div key={customer._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                          background: 'linear-gradient(to bottom right, #171d57, #5e1954)'
                        }}>
                        {customer.avatar ? (
                          <img
                            src={customer.avatar.startsWith('http') ? customer.avatar : `http://localhost:5000${customer.avatar}`}
                            alt={customer.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span
                          className="text-white font-bold"
                          style={{ display: customer.avatar ? 'none' : 'flex' }}
                        >
                          {customer.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Joined {formatDateWithSettings(customer.createdAt, {}, userSettings)}
                    </span>
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-purple-600 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {customerPagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {customerPage} of {customerPagination.pages} ({customerPagination.total} customers)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCustomerPage(prev => Math.max(1, prev - 1))}
                    disabled={customerPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCustomerPage(prev => Math.min(customerPagination.pages, prev + 1))}
                    disabled={customerPage === customerPagination.pages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Customer Profile */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{
                    background: 'linear-gradient(to bottom right, #171d57, #5e1954)'
                  }}>
                  {selectedCustomer.avatar ? (
                    <img
                      src={selectedCustomer.avatar.startsWith('http') ? selectedCustomer.avatar : `http://localhost:5000${selectedCustomer.avatar}`}
                      alt={selectedCustomer.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="text-white font-bold text-2xl"
                    style={{ display: selectedCustomer.avatar ? 'none' : 'flex' }}
                  >
                    {selectedCustomer.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h4>
                  <p className="text-gray-500">{selectedCustomer.email}</p>
                </div>
              </div>

              {/* Customer Info Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Customer ID</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer._id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedCustomer.role}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateWithSettings(selectedCustomer.createdAt, {
                        month: 'long'
                      }, userSettings)}
                    </p>
                  </div>
                </div>

                {/* Addresses */}
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Addresses</h5>
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((addr, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-600 uppercase">{addr.addressType}</span>
                            {addr.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Analytics content placeholder
  const renderAnalyticsContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analytics & Reports</h2>
          <p className="text-sm text-indigo-600 mt-1 font-medium">
            Track your store performance and generate insights
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `PKR ${(stats.revenue / 1000000).toFixed(2)}M`, change: '+23.5%', trend: 'up', color: 'green' },
          { label: 'Orders This Month', value: '89', change: '+12.3%', trend: 'up', color: 'blue' },
          { label: 'Average Order Value', value: 'PKR 12,450', change: '+8.1%', trend: 'up', color: 'purple' },
          { label: 'Conversion Rate', value: '3.2%', change: '-0.5%', trend: 'down', color: 'orange' }
        ].map((metric, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl shadow-md p-5 border border-gray-100 bg-white transition-all duration-300 hover:shadow-lg">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${metric.color}-100 rounded-full blur-2xl opacity-20`}></div>
            <div className="relative z-10">
              <p className="text-xs font-medium mb-1 text-gray-500">{metric.label}</p>
              <p className="text-2xl font-bold mb-2 text-gray-900">{metric.value}</p>
              <div className="flex items-center gap-1">
                {metric.trend === 'up' ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                <span className={`text-xs font-medium ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{metric.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg p-6 border border-gray-100 bg-white">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Sales Overview
            </h3>
            <div className="h-64 flex items-end justify-around gap-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                const height = Math.random() * 100 + 50;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer" style={{ height: `${height}px` }}></div>
                    <span className="text-xs text-gray-600">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg p-6 border border-gray-100 bg-white">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-20"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Top Selling Products
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Premium Headphones', sales: 145, revenue: 'PKR 725K', percentage: 85 },
                { name: 'Wireless Mouse', sales: 128, revenue: 'PKR 384K', percentage: 72 },
                { name: 'Mechanical Keyboard', sales: 96, revenue: 'PKR 576K', percentage: 54 },
                { name: 'USB-C Hub', sales: 82, revenue: 'PKR 246K', percentage: 46 },
                { name: 'Laptop Stand', sales: 67, revenue: 'PKR 201K', percentage: 38 }
              ].map((product, index) => (
                <div key={index} className="p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    <span className="text-xs text-purple-600 font-semibold">{product.revenue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500" style={{ width: `${product.percentage}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{product.sales}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Sales Report', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', color: 'blue', key: 'sales' },
          { title: 'Inventory Report', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'green', key: 'inventory' },
          { title: 'Customer Report', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'purple', key: 'customer' }
        ].map((report, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl shadow-lg p-6 border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl cursor-pointer group">
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${report.color}-100 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
            <div className="relative z-10">
              <div className={`w-12 h-12 bg-${report.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <svg className={`w-6 h-6 text-${report.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={report.icon} />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900">{report.title}</h4>
              <p className="text-sm mb-4 text-gray-600">Generate detailed {report.title.toLowerCase()}</p>
              <button 
                onClick={() => {
                  if (report.key === 'sales') setShowSalesReportModal(true);
                  else if (report.key === 'inventory') setShowInventoryReportModal(true);
                  else if (report.key === 'customer') setShowCustomerReportModal(true);
                }}
                className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group-hover:scale-105 bg-${report.color}-50 text-${report.color}-700 hover:bg-${report.color}-100`}>
                Generate Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Modals */}
      <SalesReportModal 
        isOpen={showSalesReportModal} 
        onClose={() => setShowSalesReportModal(false)}
        settings={userSettings}
      />
      <InventoryReportModal 
        isOpen={showInventoryReportModal} 
        onClose={() => setShowInventoryReportModal(false)}
        settings={userSettings}
      />
      <CustomerReportModal 
        isOpen={showCustomerReportModal} 
        onClose={() => setShowCustomerReportModal(false)}
        settings={userSettings}
      />
    </div>
  );

  // Settings content placeholder
  const renderSettingsContent = () => (
    <Settings
      darkMode={darkMode}
      user={user}
      settings={userSettings}
      onSettingsChange={handleSettingsChange}
    />
  );

  return (
    <div className={`admin-panel min-h-screen flex ${darkMode ? '' : 'bg-gray-50'}`} style={darkMode ? { background: '#0d043d' } : {}}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        ${darkMode ? '' : ''}
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `} style={darkMode ? { background: '#0d043d' } : { background: 'linear-gradient(to bottom, #312b4f, #1f1a3a)' }}>
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xl" style={{
                  background: 'linear-gradient(to bottom right, #ffffff, rgba(255, 255, 255, 0.1))'
                }}>
                <svg className="w-6 h-6" style={{ color: '#312b4f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-white">ShopHub</h1>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Admin Panel</p>
                </div>
              )}
            </button>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:text-white"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const colorGradients = {
              'overview': 'from-blue-600 to-cyan-500',
              'products': 'from-green-600 to-emerald-500',
              'orders': 'from-purple-600 to-pink-500',
              'carts': 'from-yellow-600 to-orange-500',
              'coupons': 'from-indigo-600 to-purple-500',
              'reviews': 'from-rose-600 to-red-500',
              'customers': 'from-violet-600 to-purple-500',
              'analytics': 'from-cyan-600 to-blue-500',
              'settings': 'from-slate-600 to-gray-500'
            };
            const gradient = colorGradients[item.id] || 'from-indigo-600 to-purple-500';
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group overflow-hidden ${
                  isActive 
                    ? 'text-white shadow-2xl' 
                    : 'hover:text-white'
                }`}
                style={{
                  ...(isActive && {
                    background: `linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))`,
                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                  }),
                  ...(!isActive && {
                    color: 'rgba(255, 255, 255, 0.6)'
                  })
                }}
                title={sidebarCollapsed ? item.label : ''}
              >
                {/* Gradient overlay on hover/active */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 bg-gradient-to-br ${gradient} ${
                  isActive ? 'opacity-20' : 'group-hover:opacity-10'
                }`}></div>
                
                {/* Icon with glow */}
                <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg blur-md opacity-50" style={{
                      background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                      filter: 'blur(6px)'
                    }}></div>
                  )}
                  <svg className="relative w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                
                {!sidebarCollapsed && <span className="font-semibold relative z-10">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden lg:block p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>

        {/* Admin Profile in Sidebar */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 shadow-lg" style={{
                background: 'linear-gradient(to bottom right, #171d57, #5e1954)',
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }}>
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Administrator</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`shadow-sm border-b sticky top-0 z-30 ${darkMode ? '' : 'bg-white border-gray-200'}`}
          style={darkMode ? { backgroundColor: 'rgba(13, 4, 61, 0.8)', borderColor: 'rgba(99, 102, 241, 0.2)' } : {}}>
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            {/* Left: Mobile menu + Page title */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-xl transition-all duration-300 group ${darkMode ? 'text-indigo-300 hover:text-white hover:bg-indigo-500/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{getPageTitle()}</h1>
                <p className={`text-xs hidden sm:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Icon */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchUnreadCount();
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-indigo-500/20 text-indigo-300' : 'hover:bg-indigo-50 text-indigo-600'}`}
                  title="Notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 ${darkMode ? 'bg-purple-600' : 'bg-purple-500'} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown 
                  darkMode={darkMode}
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  onRefreshCount={fetchUnreadCount}
                />
              </div>

              {/* Dark Mode Toggle */}
              <button 
                onClick={() => {
                  const nextTheme = darkMode ? 'light' : 'dark';
                  handleSettingsChange({ ...userSettings, theme: nextTheme });
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-indigo-500/20 text-indigo-300' : 'hover:bg-indigo-50 text-indigo-600'}`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`flex items-center gap-2 p-1 rounded-xl transition-colors ${darkMode ? 'hover:bg-indigo-500/20' : 'hover:bg-gray-100'}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
                    darkMode 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                  }`}>
                    <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                  </div>
                  <svg className={`w-4 h-4 hidden sm:block transition-transform ${showProfileDropdown ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-50 ${darkMode ? '' : 'bg-white border-gray-100'}`}
                    style={darkMode ? { backgroundColor: 'rgba(13, 4, 61, 0.95)', borderColor: 'rgba(99, 102, 241, 0.2)' } : {}}>
                    <div className={`p-3 border-b ${darkMode ? 'border-indigo-800/30 bg-gradient-to-r from-indigo-600 to-purple-600' : 'border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
                      <p className="font-semibold text-white">{user?.name || 'Admin'}</p>
                      <p className={`text-xs ${darkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>{user?.email || 'admin@shophub.com'}</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => { setActiveTab('settings'); setShowProfileDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 group ${darkMode ? 'text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'}`}
                      >
                        <svg className={`w-4 h-4 group-hover:scale-125 group-hover:rotate-180 transition-all ${darkMode ? 'text-gray-400 group-hover:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                    </div>
                    <div className={`border-t ${darkMode ? 'border-dark-700' : 'border-gray-100'}`}>
                      <button 
                        onClick={onLogout}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 group ${darkMode ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        <svg className="w-4 h-4 group-hover:scale-125 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
