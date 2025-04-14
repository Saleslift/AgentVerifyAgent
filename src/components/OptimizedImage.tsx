import React, { useState, memo, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

// Global image cache to prevent redundant loading
const imageCache = new Map<string, boolean>();

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  fallbackSrc = '/logo.png'
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(imageCache.has(src));
  const [error, setError] = useState(false);
  
  // Check if image is already in cache
  useEffect(() => {
    if (imageCache.has(src)) {
      setLoaded(true);
    }
  }, [src]);
  
  // Generate srcSet for responsive images
  const generateSrcSet = (url: string) => {
    if (!url) return '';
    
    // Skip for external URLs that don't support resizing
    if (url.includes('unsplash.com')) {
      // Only generate srcSet for larger screens
      return `${url}&w=480 480w, ${url}&w=800 800w`;
    }
    
    if (url.includes('supabase.co')) {
      // For Supabase Storage URLs, we can't easily add width parameters
      return '';
    }
    
    return '';
  };
  
  const handleLoad = () => {
    setLoaded(true);
    imageCache.set(src, true);
  };
  
  const handleError = () => {
    setError(true);
    setLoaded(true);
  };
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!loaded && !priority && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? 'eager' : 'lazy'} 
        onLoad={handleLoad}
        onError={handleError}
        srcSet={!error ? generateSrcSet(src) : undefined}
        sizes={sizes}
        width={width}
        height={height}
        decoding="async"
      />
    </div>
  );
});

export default OptimizedImage;