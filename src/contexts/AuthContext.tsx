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
      
      // Dựa trên console log, response có token ở level đầu tiên
      if (response.token) {
        const token = response.token;
        const refreshToken = response.refreshToken;
        
        // Lấy user data từ response (tên field có thể thay đổi)
        let userData: any = null;
        
        // Thử các field có thể chứa user data
        for (const key in response) {
          if (key !== 'token' && key !== 'refreshToken' && typeof response[key] === 'object' && response[key] !== null) {
            userData = response[key];
            break;
          }
        }
        
        // Nếu không tìm thấy user data trong response, tạo một object user cơ bản
        if (!userData) {
          userData = {
            id: 'temp-id',
            email: email,
            fullname: 'User',
            role: 'user',
            avatar: '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        // Sau khi login thành công, có thể gọi API để lấy profile đầy đủ
        try {
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.data);
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
          }
        } catch (profileError) {
          // Could not fetch profile, using basic user data
        }
        
      } else {
        console.error('Login failed: No token in response');
        throw new Error('Đăng nhập thất bại - không nhận được token');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
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
      
      // Don't automatically log in the user after registration
      // Just check if registration was successful
      if (!response.success && !response.token) {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
      
      // Registration successful, no need to set user or store tokens
      // The user will be redirected to login page
      
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
