/**
 * Reusable Button Component
 * Accessible button with loading states and variants
 */

import React from 'react';

const Button = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  icon: Icon,
  ariaLabel,
  className = '',
}) => {
  // Modern Minimal Variant styles with premium feel
  const variants = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-cream focus:ring-primary-500/50 disabled:bg-primary-400 shadow-lg shadow-gray-600/25 hover:shadow-xl hover:shadow-gray-600/30 hover:-translate-y-0.5',
    secondary:
      'bg-gray-600 hover:bg-gray-700 text-cream focus:ring-gray-500/50 disabled:bg-gray-400 shadow-lg shadow-gray-600/25 hover:shadow-xl hover:shadow-gray-600/30 hover:-translate-y-0.5',
    outline:
      'bg-cream hover:bg-primary-50 text-primary-700 border-2 border-primary-300 hover:border-primary-400 focus:ring-primary-500/50 disabled:bg-gray-100 shadow-md hover:shadow-lg hover:-translate-y-0.5',
    danger:
      'bg-red-600 hover:bg-red-700 text-cream focus:ring-red-500/50 disabled:bg-red-400 shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30 hover:-translate-y-0.5',
    success:
      'bg-green-600 hover:bg-green-700 text-cream focus:ring-green-500/50 disabled:bg-green-400 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5',
  };

  // Modern size styles with optimal padding - larger for auth pages
  const sizes = {
    sm: 'px-6 py-3 text-sm font-medium min-h-[44px]',
    md: 'px-8 py-4 text-base font-semibold min-h-[52px]',
    lg: 'px-10 py-5 text-lg font-semibold min-h-[60px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-2xl
        focus:outline-none focus:ring-3 focus:ring-offset-2
        transition-all duration-300 ease-out
        disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg
        flex items-center justify-center gap-2.5
        backdrop-blur-sm
        relative overflow-hidden
        group
        ${className}
      `}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content wrapper */}
      <div className="relative flex items-center gap-2.5">
        {/* Loading Spinner */}
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Icon */}
        {!loading && Icon && <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />}

        {/* Button Text */}
        <span className="tracking-wide">{loading ? 'Please wait...' : children}</span>
      </div>
    </button>
  );
};

export default Button;
