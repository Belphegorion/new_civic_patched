import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-6 w-6 border-2 sm:border-3',
    md: 'h-8 w-8 sm:h-12 sm:w-12 border-3 sm:border-4',
    lg: 'h-12 w-12 sm:h-16 sm:w-16 border-3 sm:border-4'
  };

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-gray-200 dark:border-gray-700`} style={{ borderStyle: 'solid' }}></div>
        {/* Spinning gradient ring */}
        <div 
          className={`${sizeClasses[size]} rounded-full border-transparent border-t-primary border-r-primary-light animate-spin absolute top-0 left-0`} 
          style={{ borderStyle: 'solid' }}
        ></div>
        {/* Inner pulsing dot */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${dotSizes[size]} bg-gradient-to-r from-primary to-primary-light rounded-full animate-pulse`}></div>
      </div>
      {text && (
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;