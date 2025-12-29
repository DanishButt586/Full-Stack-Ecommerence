import React from 'react';

/**
 * Premium Banner Component with 3D Effects and Animations
 * Features: Floating spheres, neon rings, gradient triangles, squiggles, glow dots, animated waves
 */
const PremiumBanner = ({ 
  title, 
  subtitle, 
  icon, 
  children,
  theme = 'primary', // 'primary', 'gradient', 'dark'
  className = ''
}) => {
  const themeClasses = {
    primary: 'from-primary-600 via-primary-700 to-primary-900',
    gradient: 'from-primary-600 via-purple-600 to-pink-600',
    dark: 'from-gray-800 via-gray-900 to-black'
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden perspective-container ${className}`} style={{ minHeight: '220px' }}>
      {/* Animated Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${themeClasses[theme]} animate-gradient-shift`}></div>
      
      {/* Animated Curved Waves */}
      <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path 
          fill="rgba(255, 246, 233, 0.1)" 
          d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          className="animate-wave-slow"
        >
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
              M0,160L48,144C96,128,192,96,288,96C384,96,480,128,576,144C672,160,768,160,864,144C960,128,1056,96,1152,96C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
              M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z
            "
          />
        </path>
      </svg>

      {/* 3D Floating Spheres */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-gradient-to-br from-primary-300/20 to-primary-500/30 rounded-full backdrop-blur-sm border border-cream/20 animate-float-sphere shadow-2xl transform-3d"></div>
      <div className="absolute top-32 right-32 w-16 h-16 bg-gradient-to-br from-cream/15 to-primary-400/25 rounded-full backdrop-blur-md border border-cream/20 animate-float-sphere shadow-2xl" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-br from-primary-400/20 to-pink-500/20 rounded-full backdrop-blur-sm border border-cream/15 animate-float-sphere shadow-2xl" style={{ animationDelay: '4s' }}></div>

      {/* Soft Neon Rings */}
      <div className="absolute top-16 left-16 w-32 h-32 rounded-full border-4 border-cream/30 animate-neon-ring" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-24 left-1/4 w-24 h-24 rounded-full border-3 border-primary-300/40 animate-neon-ring" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-28 h-28 rounded-full border-4 border-cream/20 animate-rotate-ring"></div>

      {/* Gradient Triangles */}
      <div className="absolute top-12 left-1/3 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent border-b-primary-400/20 animate-triangle-float backdrop-blur-sm"></div>
      <div className="absolute bottom-16 right-1/3 w-0 h-0 border-l-[25px] border-r-[25px] border-b-[40px] border-l-transparent border-r-transparent border-b-cream/15 animate-triangle-float" style={{ animationDelay: '2s' }}></div>

      {/* Floating Squiggles */}
      <svg className="absolute top-1/4 left-1/4 w-20 h-20 opacity-30 animate-squiggle" viewBox="0 0 100 100">
        <path d="M10,50 Q30,20 50,50 T90,50" stroke="rgba(255, 246, 233, 0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
      <svg className="absolute bottom-1/3 right-1/4 w-16 h-16 opacity-25 animate-squiggle" viewBox="0 0 100 100" style={{ animationDelay: '3s' }}>
        <path d="M10,50 Q30,80 50,50 T90,50" stroke="rgba(189, 168, 183, 0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Glow Dots */}
      <div className="absolute top-8 left-8 w-3 h-3 bg-cream/60 rounded-full animate-glow-pulse shadow-lg"></div>
      <div className="absolute top-20 right-40 w-2 h-2 bg-primary-300/70 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-16 left-1/3 w-2.5 h-2.5 bg-cream/50 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 right-16 w-2 h-2 bg-primary-200/60 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-16 w-3 h-3 bg-cream/70 rounded-full animate-glow-pulse shadow-lg" style={{ animationDelay: '2s' }}></div>

      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(189, 168, 183, 0.15) 0%, transparent 50%),
                         radial-gradient(circle at 80% 80%, rgba(255, 246, 233, 0.15) 0%, transparent 50%),
                         radial-gradient(circle at 40% 20%, rgba(59, 28, 50, 0.2) 0%, transparent 50%)`
      }}></div>

      {/* Glow Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cream/50 to-transparent animate-shimmer"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-300/40 to-transparent animate-shimmer-delayed"></div>

      {/* Glassmorphism Content Card */}
      <div className="relative backdrop-blur-sm bg-cream/5 border border-cream/10 rounded-3xl shadow-2xl p-6 sm:p-8 m-4">
        <div className="relative z-10">
          {/* Icon Badge */}
          {icon && (
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 bg-cream/10 backdrop-blur-md rounded-full border border-cream/20 animate-fade-in">
              <span className="text-3xl">{icon}</span>
            </div>
          )}
          
          {/* Title */}
          {title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cream mb-3 drop-shadow-lg animate-slide-in-left">
              {title}
            </h2>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-cream/80 text-sm sm:text-base max-w-2xl leading-relaxed drop-shadow-md animate-fade-in mb-4" style={{ animationDelay: '0.2s' }}>
              {subtitle}
            </p>
          )}
          
          {/* Custom Children Content */}
          {children}
        </div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cream/10 rounded-tl-3xl"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cream/10 rounded-br-3xl"></div>
    </div>
  );
};

export default PremiumBanner;
