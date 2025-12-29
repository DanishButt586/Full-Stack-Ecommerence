/**
 * Main Application Component
 * Entry point for the authentication prototype
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthSuccess from './components/auth/AuthSuccess';
import AuthFailure from './components/auth/AuthFailure';
import CompleteSignup from './components/auth/CompleteSignup';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import ShoppingCart from './components/ShoppingCart';
import { CartProvider } from './context/CartContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Function to check and load user from localStorage
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  useEffect(() => {
    // Check if user is already logged in on mount
    checkAuth();

    // Listen for storage changes (for OAuth redirects)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };

    // Custom event for same-tab localStorage updates
    const handleAuthUpdate = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authUpdate', handleAuthUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authUpdate', handleAuthUpdate);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData.user);
    setIsAuthenticated(true);
    // Store in localStorage for persistence
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Determine which dashboard to show based on user role
  const renderDashboard = () => {
    if (user?.role === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }
    return <Dashboard user={user} onLogout={handleLogout} />;
  };

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* OAuth callback routes */}
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/auth/failure" element={<AuthFailure />} />
            <Route path="/auth/complete-signup" element={<CompleteSignup />} />

            {/* Main routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <AuthContainer onLoginSuccess={handleLoginSuccess} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  renderDashboard()
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                isAuthenticated && user?.role === 'admin' ? (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Customer routes */}
            <Route
              path="/cart"
              element={
                isAuthenticated ? (
                  <ShoppingCart />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/checkout"
              element={
                isAuthenticated ? (
                  <Checkout />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/orders"
              element={
                isAuthenticated ? (
                  <Orders />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;