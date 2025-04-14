import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizes = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]'
  };
  
  return (
    <div className={`animate-spin rounded-full border-t-transparent border-black ${sizes[size]} ${className}`}></div>
  );
}

export default LoadingSpinner;