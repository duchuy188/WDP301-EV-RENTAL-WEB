import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/auth';
import { authAPI } from '@/api/authAPI';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser && token) {
        try {
          // Verify token và lấy thông tin user mới nhất
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Token không hợp lệ, xóa dữ liệu
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          // Lỗi khi verify token, sử dụng dữ liệu cũ hoặc xóa
          console.error('Auth check error:', error);
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Gọi API login thật
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.data.token);
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // Gọi API register thật
      const response = await authAPI.register({
        email: userData.email,
        password: userData.password,
        fullname: userData.fullName
      });
      
      if (response.success) {
        const newUser = response.data.user;
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', response.data.token);
      } else {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Gọi API logout
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Dọn dẹp local storage dù có lỗi hay không
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
