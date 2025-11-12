import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clearAllStorage } from '@/utils/clearStorage';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [localAuthCheck, setLocalAuthCheck] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  // Check localStorage for authentication data
  useEffect(() => {
    const checkLocalAuth = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        try {
          const userData = JSON.parse(savedUser);
          
          // Kiểm tra role
          if (userData.role !== 'EV Renter') {
            // Xóa dữ liệu không hợp lệ
            clearAllStorage();
            setLocalAuthCheck(false);
          } else {
            setLocalAuthCheck(true);
          }
        } catch (error) {
          console.error('ProtectedRoute: Invalid localStorage data:', error);
          setLocalAuthCheck(false);
        }
      } else {
        setLocalAuthCheck(false);
      }
      setCheckComplete(true);
    };

    checkLocalAuth();
  }, []);

  // Show loading while checking
  if (isLoading || !checkComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Đang xác thực..." />
      </div>
    );
  }

  // Combined authentication check
  const isUserAuthenticated = isAuthenticated || localAuthCheck;

  if (!isUserAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra role từ user context nếu có
  if (user && user.role !== 'EV Renter') {
    return <Navigate to="/login" state={{ from: location, message: 'Bạn không có quyền truy cập vào hệ thống này.' }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;