/**
 * CartItem Component
 * Individual cart item with instant quantity updates using local state
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove, formatPrice, darkMode }) => {
  // Local state for instant UI updates
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const debounceRef = useRef(null);
  const isRemoving = useRef(false);

  // Sync with prop when it changes from server
  useEffect(() => {
    if (!isRemoving.current) {
      setLocalQuantity(item.quantity);
    }
  }, [item.quantity]);

  // Debounced API call
  const debouncedUpdate = useCallback((newQuantity) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onUpdateQuantity(item._id, newQuantity);
    }, 300);
  }, [item._id, onUpdateQuantity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleDecrease = () => {
    if (localQuantity > 1) {
      const newQty = localQuantity - 1;
      setLocalQuantity(newQty);
      debouncedUpdate(newQty);
    } else {
      isRemoving.current = true;
      onRemove(item._id);
    }
  };

  const handleIncrease = () => {
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty);
    debouncedUpdate(newQty);
  };

  const handleRemove = () => {
    isRemoving.current = true;
    onRemove(item._id);
  };

  const price = item.price || item.product?.price || 0;

  return (
    <div className={`p-4 rounded-xl transition-all ${darkMode ? 'bg-dark-700/50 border border-dark-700' : 'bg-gray-50'}`}>
      {/* Mobile Layout */}
      <div className="flex gap-3 sm:gap-4">
        {/* Product Image */}
        <img
          src={item.product?.images?.[0]?.url 
            ? (item.product.images[0].url.startsWith('http') 
              ? item.product.images[0].url 
              : `http://localhost:5000${item.product.images[0].url}`)
            : 'https://via.placeholder.com/80'}
          alt={item.product?.name || 'Product'}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
        />
        
        {/* Product Info & Controls */}
        <div className="flex-1 min-w-0">
          {/* Product Name & Remove Button Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold text-sm sm:text-base line-clamp-2 sm:truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.product?.name || 'Unknown Product'}
              </h3>
              <p className={`text-xs sm:text-sm hidden sm:block ${darkMode ? 'text-primary-200/80' : 'text-gray-500'}`}>{item.product?.category || ''}</p>
            </div>
            {/* Remove Button - Desktop */}
            <button
              onClick={handleRemove}
              className={`hidden sm:block p-2 active:scale-95 transition-all flex-shrink-0 ${darkMode ? 'text-primary-200 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          {/* Price - Mobile shows original price here */}
          <p className={`font-bold text-sm sm:text-base mt-1 ${darkMode ? 'text-white' : 'text-primary-600'}`}>
            <span className="sm:hidden">{formatPrice(price)}</span>
            <span className="hidden sm:inline">{formatPrice(price)}</span>
          </p>
          
          {/* Quantity & Total Row */}
          <div className="flex items-center justify-between mt-3 sm:mt-2 gap-2">
            {/* Quantity Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleDecrease}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg active:scale-95 transition-transform select-none ${
                  darkMode
                    ? 'bg-dark-600 border border-dark-600 text-primary-200 hover:bg-dark-600'
                    : 'bg-cream border border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className={`w-8 sm:w-10 text-center font-semibold text-sm sm:text-base select-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>{localQuantity}</span>
              <button
                onClick={handleIncrease}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg active:scale-95 transition-transform select-none ${
                  darkMode
                    ? 'bg-dark-600 border border-dark-600 text-primary-200 hover:bg-dark-600'
                    : 'bg-cream border border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Item Total */}
            <div className="text-right">
              <p className={`font-bold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatPrice(price * localQuantity)}</p>
            </div>
            
            {/* Remove Button - Mobile */}
            <button
              onClick={handleRemove}
              className={`sm:hidden p-1.5 active:scale-95 transition-all flex-shrink-0 ${
                darkMode ? 'text-primary-200 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
