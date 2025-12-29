/**
 * Toast Notification Component
 * Custom notification system with admin theme support
 */

import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000, darkMode = false }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: darkMode ? 'bg-purple-900/90' : 'bg-purple-50',
          border: darkMode ? 'border-purple-600' : 'border-purple-400',
          icon: (
            <svg className="w-6 h-6" style={{ color: '#492273' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: darkMode ? 'text-purple-100' : 'text-purple-900',
        };
      case 'error':
        return {
          bg: darkMode ? 'bg-red-900/90' : 'bg-red-50',
          border: darkMode ? 'border-red-600' : 'border-red-400',
          icon: (
            <svg className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: darkMode ? 'text-red-100' : 'text-red-800',
        };
      case 'warning':
        return {
          bg: darkMode ? 'bg-yellow-900/90' : 'bg-yellow-50',
          border: darkMode ? 'border-yellow-600' : 'border-yellow-400',
          icon: (
            <svg className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          text: darkMode ? 'text-yellow-100' : 'text-yellow-800',
        };
      case 'info':
      default:
        return {
          bg: darkMode ? 'bg-blue-900/90' : 'bg-blue-50',
          border: darkMode ? 'border-blue-600' : 'border-blue-400',
          icon: (
            <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: darkMode ? 'text-blue-100' : 'text-blue-800',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className={`${styles.bg} ${styles.border} border-2 rounded-2xl shadow-2xl backdrop-blur-lg p-4 min-w-[320px] max-w-md transform transition-all duration-300 hover:scale-105`}
        style={{
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{styles.icon}</div>
          <div className="flex-1">
            <p className={`${styles.text} font-semibold text-sm leading-relaxed`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
