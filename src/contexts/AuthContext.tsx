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

interface GoogleCredential {
  credential?: string;
  clientId?: string;
  select_by?: string;
  profileObj?: {
    email: string;
    name: string;
    imageUrl?: string;
    googleId?: string;
  };
  tokenObj?: {
    access_token: string;
    id_token: string;
  };
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
            if (response && response.data) {
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
            if (profileResponse && profileResponse.data) {
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

  const loginWithGoogle = async (googleCredential: any): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Received Google credential:', googleCredential);
      
      // Extract user info from Google credential
      let googleUserInfo: any = {};
      
      // Handle different possible formats
      if (typeof googleCredential === 'string') {
        // If it's just a credential string
        try {
          const base64Url = googleCredential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decoded = JSON.parse(jsonPayload);
          googleUserInfo = {
            email: decoded.email,
            name: decoded.name,
            imageUrl: decoded.picture,
            googleId: decoded.sub
          };
        } catch (decodeError) {
          console.error('Error decoding Google JWT string:', decodeError);
          throw new Error('Không thể xử lý thông tin từ Google');
        }
      } else if (googleCredential && googleCredential.credential) {
        // New Google Identity Services format with credential property
        try {
          const base64Url = googleCredential.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decoded = JSON.parse(jsonPayload);
          googleUserInfo = {
            email: decoded.email,
            name: decoded.name,
            imageUrl: decoded.picture,
            googleId: decoded.sub
          };
        } catch (decodeError) {
          console.error('Error decoding Google JWT from object:', decodeError);
          throw new Error('Không thể xử lý thông tin từ Google');
        }
      } else if (googleCredential && googleCredential.profileObj) {
        // Legacy Google Sign-In format
        googleUserInfo = {
          email: googleCredential.profileObj.email,
          name: googleCredential.profileObj.name,
          imageUrl: googleCredential.profileObj.imageUrl,
          googleId: googleCredential.profileObj.googleId
        };
      } else if (googleCredential && googleCredential.email) {
        // Direct user info format
        googleUserInfo = {
          email: googleCredential.email,
          name: googleCredential.name || googleCredential.displayName,
          imageUrl: googleCredential.imageUrl || googleCredential.photoURL,
          googleId: googleCredential.googleId || googleCredential.uid
        };
      } else {
        console.error('Unrecognized Google credential format:', googleCredential);
        throw new Error('Định dạng dữ liệu Google không hợp lệ');
      }

      console.log('Google user info:', googleUserInfo);

      // Attempt to call backend API for Google login
      try {
        // If you have a Google login API endpoint
        const response = await authAPI.loginWithGoogle({
          credential: googleCredential.credential || googleCredential,
          userInfo: googleUserInfo
        });
        
        if (response.token) {
          const token = response.token;
          const refreshToken = response.refreshToken;
          
          // Save tokens
          localStorage.setItem('token', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          
          // Get user data from response
          let userData = null;
          if (response.data && response.data.user) {
            userData = response.data.user;
          } else if (response.user) {
            userData = response.user;
          }
          
          if (userData) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Fallback to create user data from Google info
            const googleUserData = {
              id: `google_${googleUserInfo.googleId || Date.now()}`,
              email: googleUserInfo.email,
              fullname: googleUserInfo.name,
              role: 'user',
              avatar: googleUserInfo.imageUrl || '',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              provider: 'google',
              googleId: googleUserInfo.googleId
            };
            setUser(googleUserData);
            localStorage.setItem('user', JSON.stringify(googleUserData));
          }
        } else {
          throw new Error('Không nhận được token từ server');
        }

      } catch (apiError: any) {
        console.warn('Backend Google login API not available or failed:', apiError);
        
        // Fallback: Create user session locally
        // This is for demo purposes - in production, you should always verify with backend
        const fallbackToken = `google_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const googleUserData = {
          id: `google_${googleUserInfo.googleId || Date.now()}`,
          email: googleUserInfo.email,
          fullname: googleUserInfo.name,
          role: 'user',
          avatar: googleUserInfo.imageUrl || '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provider: 'google',
          googleId: googleUserInfo.googleId
        };

        // Save fallback data
        localStorage.setItem('token', fallbackToken);
        localStorage.setItem('user', JSON.stringify(googleUserData));
        setUser(googleUserData);
        
        console.warn('Using fallback Google login - ensure backend integration for production');
      }

    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Clean up on error
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

  const logout = () => {
    try {
      // Gọi API logout trong background, không chờ kết quả
      // vì việc dọn dẹp local storage là quan trọng nhất
      authAPI.logout().catch((error) => {
        console.warn('Logout API call failed, but continuing with local cleanup:', error);
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
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