/**
 * ParticleBackground Component
 * Premium particle and spark animation system for hero sections
 */

import React, { useEffect, useRef } from 'react';

const ParticleBackground = ({ density = 30, sparkCount = 10 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles = [];
    const sparks = [];

    // Generate floating particles
    for (let i = 0; i < density; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `${Math.random() * 20}%`;
      particle.style.animationDuration = `${15 + Math.random() * 15}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      particles.push(particle);
      containerRef.current.appendChild(particle);
    }

    // Generate spark bursts
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'particle spark';
      spark.style.left = `${20 + Math.random() * 60}%`;
      spark.style.top = `${20 + Math.random() * 60}%`;
      spark.style.animationDuration = `${2 + Math.random() * 2}s`;
      spark.style.animationDelay = `${Math.random() * 3}s`;
      sparks.push(spark);
      containerRef.current.appendChild(spark);
    }

    // Cleanup
    return () => {
      particles.forEach(p => p.remove());
      sparks.forEach(s => s.remove());
    };
  }, [density, sparkCount]);

  return <div ref={containerRef} className="particle-container" />;
};

export default ParticleBackground;
