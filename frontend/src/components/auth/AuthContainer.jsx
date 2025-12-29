/**
 * AuthContainer Component
 * Enterprise split-screen layout with visual branding and form container
 * Handles view switching between Login and Register
 */

import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthContainer = ({ onLoginSuccess }) => {
  // View state: 'login' or 'register'
  const [currentView, setCurrentView] = useState('login');

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = (userData) => {
    console.log('Authentication successful:', userData);
    // Pass authentication success to parent component
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white py-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-cream rounded-2xl flex items-center justify-center shadow-2xl">
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold mb-6 text-center">
            Welcome to ShopHub
          </h1>
          <p className="text-xl text-primary-100 text-center max-w-md mb-12">
            Your premium destination for quality products and exceptional
            shopping experiences.
          </p>

          {/* Features List */}
          <div className="space-y-6 max-w-md">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
                title: 'Secure Payments',
                desc: 'Bank-grade encryption for all transactions',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                ),
                title: 'Fast Delivery',
                desc: 'Express shipping on all orders',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
                title: 'Best Prices',
                desc: 'Competitive prices and exclusive deals',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 bg-cream bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-cream bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {feature.icon}
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-primary-100 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-cream opacity-5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary-300 opacity-10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Right Side - Authentication Form Section */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>

          {/* Form Container with Transition */}
          <div className="bg-cream rounded-2xl shadow-xl p-8 transition-all duration-300">
            {currentView === 'login' ? (
              <Login
                onSwitchToRegister={() => setCurrentView('register')}
                onLoginSuccess={handleAuthSuccess}
              />
            ) : (
              <Register
                onSwitchToLogin={() => setCurrentView('login')}
                onRegisterSuccess={() => setCurrentView('login')}
              />
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            © 2025 ShopHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
