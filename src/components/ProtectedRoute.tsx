import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
          console.log('ProtectedRoute: Found user in localStorage:', {
            email: userData.email,
            provider: userData.provider || 'regular',
            hasGoogleId: !!userData.googleId
          });
          setLocalAuthCheck(true);
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

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute state update:', {
      pathname: location.pathname,
      isAuthenticated,
      isLoading,
      localAuthCheck,
      checkComplete,
      user: user?.email || 'null',
      userProvider: user?.provider || 'none',
      finalDecision: isAuthenticated || localAuthCheck,
      localStorage: {
        hasUser: !!localStorage.getItem('user'),
        hasToken: !!localStorage.getItem('token'),
        userEmail: (() => {
          try {
            return JSON.parse(localStorage.getItem('user') || '{}')?.email || 'none';
          } catch {
            return 'invalid';
          }
        })()
      }
    });
  }, [isAuthenticated, isLoading, localAuthCheck, checkComplete, user, location.pathname]);

  // Show loading while checking
  if (isLoading || !checkComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Đang xác thực...
          </p>
        </div>
      </div>
    );
  }

  // Combined authentication check
  const isUserAuthenticated = isAuthenticated || localAuthCheck;

  if (!isUserAuthenticated) {
    console.log('ProtectedRoute: Authentication failed, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Authentication successful, allowing access');
  return <>{children}</>;
};

export default ProtectedRoute;