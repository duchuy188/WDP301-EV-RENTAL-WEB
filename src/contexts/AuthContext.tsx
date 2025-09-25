import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { profile } from '@/types/auth';
import { authAPI } from '@/api/authAPI';

interface AuthContextType {
  user: profile | null;
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
  const [user, setUser] = useState<profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser && token) {
        try {
          // Sử dụng dữ liệu đã lưu trước
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Sau đó verify token và cập nhật thông tin mới nhất (không chặn UI)
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.data) {
              // Cập nhật thông tin mới nếu có
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          } catch (profileError) {
            // Nếu token không hợp lệ, xóa dữ liệu
            console.warn('Token verification failed, clearing auth data');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        } catch (parseError) {
          // Dữ liệu user không hợp lệ, xóa tất cả
          console.error('Invalid saved user data:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Gọi API login
      const response = await authAPI.login({ email, password });
      
      if (response.token) {
        const token = response.token;
        const refreshToken = response.refreshToken;
        
        // Lưu token trước
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        // Thử lấy user data từ response login trước
        let userData = null;
        
        // Kiểm tra xem response có chứa user data không
        if (response.data && response.data.user) {
          userData = response.data.user;
        } else if (response.user) {
          userData = response.user;
        }
        
        // Nếu có user data từ login response, sử dụng luôn
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Nếu không có, gọi API getProfile
          try {
            // Đợi một chút để đảm bảo token đã được set
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const profileResponse = await authAPI.getProfile();
            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
              localStorage.setItem('user', JSON.stringify(profileResponse.data));
            } else {
              throw new Error('Không thể lấy thông tin profile');
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            // Nếu không lấy được profile, tạo user data cơ bản từ thông tin login
            const basicUserData = {
              id: `user_${Date.now()}`, // Tạo ID duy nhất thay vì temp-id
              email: email,
              fullname: email.split('@')[0], // Lấy phần trước @ làm tên
              role: 'user',
              avatar: '',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setUser(basicUserData);
            localStorage.setItem('user', JSON.stringify(basicUserData));
            console.warn('Using basic user data due to profile fetch error');
          }
        }
        
      } else {
        console.error('Login failed: No token in response');
        throw new Error('Đăng nhập thất bại - không nhận được token');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      
      // Xóa token nếu có lỗi
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
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
      
      // Check if registration was successful
      // If response has success field, check it. Otherwise, if we get a response without error, consider it success
      if (response.success === false) {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
      
      // Registration successful - response.success is true or undefined (meaning success)
      // No need to set user or store tokens as user should login manually
      
    } catch (error: any) {
      console.error('Register error:', error);
      // Check if error has response data with message
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Đăng ký thất bại');
      }
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
      localStorage.removeItem('refreshToken');
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
