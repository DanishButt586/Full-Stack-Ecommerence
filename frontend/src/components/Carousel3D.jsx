/**
 * Carousel3D Component
 * Premium 3D rotating carousel for featured products
 */

import React, { useState, useEffect } from 'react';

const Carousel3D = ({ products = [], onProductClick }) => {
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || products.length === 0) return;

    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, products.length]);

  const getImageUrl = (product) => {
    if (product?.images?.[0]?.url) return product.images[0].url;
    return null;
  };

  const formatPKR = (price) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const itemCount = Math.min(products.length, 6);
  const angleStep = 360 / itemCount;

  return (
    <div 
      className="carousel-3d"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className="carousel-3d-container"
        style={{ 
          transform: `rotateY(${rotation}deg)`,
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      >
        {products.slice(0, itemCount).map((product, index) => {
          const angle = angleStep * index;
          const radius = 400;
          const x = Math.sin((angle * Math.PI) / 180) * radius;
          const z = Math.cos((angle * Math.PI) / 180) * radius;

          return (
            <div
              key={product._id}
              className="carousel-3d-item cursor-pointer group"
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${-angle}deg)`,
              }}
              onClick={() => onProductClick?.(product)}
            >
              <div className="bg-cream rounded-2xl shadow-2xl overflow-hidden h-full transform-gpu transition-all duration-500 hover:scale-105">
                <div className="relative h-60 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {getImageUrl(product) ? (
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  {/* Product Reflection */}
                  <div className="product-reflection"></div>
                </div>
                <div className="p-4 bg-cream">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-primary-600">
                    {formatPKR(product.price)}
                  </p>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <p className="text-xs text-gray-500 line-through">
                      {formatPKR(product.comparePrice)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel3D;
