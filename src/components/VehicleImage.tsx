import React from 'react';

interface VehicleImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

const VehicleImage: React.FC<VehicleImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'Không có hình ảnh' 
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  if (!src || imageError) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 flex flex-col items-center justify-center rounded-lg ${className}`}>
        <div className="text-4xl mb-2">🚗</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {fallbackText}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default VehicleImage;