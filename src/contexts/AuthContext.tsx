import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { profile } from '@/types/auth';
import { authAPI } from '@/api/authAPI';

interface AuthContextType {
  user: profile | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleCredential: any) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUserProfile: (data: profile) => void; // cập nhật ngay lập tức context & localStorage
  refreshProfile: () => Promise<void>; // gọi API lấy profile mới nhất
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
          
          // Kiểm tra role ngay lập tức
          if (userData.role !== 'EV Renter') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          setUser(userData);
          
          // Sau đó verify token và cập nhật thông tin mới nhất (không chặn UI)
          try {
            const response = await authAPI.getProfile();
            if (response && response.data) {
              // Kiểm tra role từ API
              if (response.data.role !== 'EV Renter') {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                setUser(null);
              } else {
                // Cập nhật thông tin mới nếu có và role hợp lệ
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
              }
            }
          } catch (profileError) {
            // Nếu token không hợp lệ, xóa dữ liệu
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        } catch (parseError) {
          // Dữ liệu user không hợp lệ, xóa tất cả
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
          // Kiểm tra role trước khi set user
          if (userData.role !== 'EV Renter') {
            // Xóa token đã lưu
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            throw new Error('Bạn không có quyền truy cập vào hệ thống này. Chỉ tài khoản "EV Renter" mới được phép đăng nhập.');
          }
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Nếu không có, gọi API getProfile
          try {
            // Đợi một chút để đảm bảo token đã được set
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const profileResponse = await authAPI.getProfile();
            if (profileResponse && profileResponse.data) {
              userData = profileResponse.data;
              // Kiểm tra role
              if (userData.role !== 'EV Renter') {
                // Xóa token đã lưu
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                throw new Error('Bạn không có quyền truy cập vào hệ thống này. Chỉ tài khoản "EV Renter" mới được phép đăng nhập.');
              }
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            } else {
              throw new Error('Không thể lấy thông tin profile');
            }
          } catch (profileError: any) {
            // Nếu lỗi là do role, throw lên
            if (profileError.message && profileError.message.includes('quyền truy cập')) {
              throw profileError;
            }
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
          }
        }
        
      } else {
        throw new Error('Đăng nhập thất bại - không nhận được token');
      }
    } catch (error: any) {
      
      // Xóa token nếu có lỗi
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      throw new Error(error.response?.data?.message || error.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleCredential: any): Promise<void> => {
    setIsLoading(true);
    try {
      let idToken = '';
      if (typeof googleCredential === 'string') {
        idToken = googleCredential;
      } else if (googleCredential && (googleCredential as any).credential) {
        idToken = (googleCredential as any).credential;
      } else if (googleCredential && (googleCredential as any).tokenObj?.id_token) {
        idToken = (googleCredential as any).tokenObj.id_token;
      } else {
        throw new Error('Không lấy được idToken từ Google credential');
      }

      const response = await authAPI.googleLogin(idToken);
      if (response.token && response.user) {
        // Kiểm tra role trước khi lưu
        if (response.user.role !== 'EV Renter') {
          throw new Error('Bạn không có quyền truy cập vào hệ thống này. Chỉ tài khoản "EV Renter" mới được phép đăng nhập.');
        }
        localStorage.setItem('token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        throw new Error('Không nhận được token từ server');
      }
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw new Error(error.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // Ensure payload uses 'fullname' as expected by backend
      const payload = { ...userData, fullname: userData.fullName };
      delete (payload as any).fullName;
      const response = await authAPI.register(payload);
      
      // Kiểm tra nếu response có success field và nó là false
      if (response.success === false) {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
      
      // Nếu không có success field hoặc success = true, coi như thành công
      // Không cần làm gì thêm, chỉ cần return để component navigate đến login
    } catch (error: any) {
      let errorMessage = 'Đăng ký thất bại';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
      // Gọi API logout trong background, không chờ kết quả
      // vì việc dọn dẹp local storage là quan trọng nhất
      authAPI.logout().catch(() => {
      });
    
    // Dọn dẹp local storage ngay lập tức để đảm bảo user được logout
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const value: AuthContextType = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
    setUserProfile: (data: profile) => {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    },
    refreshProfile: async () => {
      try {
        const resp = await authAPI.getProfile();
        if (resp?.data) {
          setUser(resp.data);
          localStorage.setItem('user', JSON.stringify(resp.data));
        }
      } catch (e) {
        // silent
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};