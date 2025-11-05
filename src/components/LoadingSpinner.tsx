import React from 'react';
import { FaMotorcycle } from 'react-icons/fa';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = ''
}) => {
  // Định nghĩa kích thước cho spinner và icon
  const sizeConfig = {
    sm: {
      spinner: 'h-8 w-8 border-b-2',
      icon: 'h-3 w-3',
      text: 'text-xs'
    },
    md: {
      spinner: 'h-12 w-12 border-b-2',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      spinner: 'h-16 w-16 border-b-4',
      icon: 'h-6 w-6',
      text: 'text-base'
    },
    xl: {
      spinner: 'h-32 w-32 border-b-4',
      icon: 'h-10 w-10',
      text: 'text-lg'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full ${config.spinner} border-green-600`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FaMotorcycle className={`${config.icon} text-green-600 animate-pulse`} />
        </div>
      </div>
      {text && (
        <p className={`mt-4 text-gray-600 dark:text-gray-300 ${config.text} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

