import apiClient from './config';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  profile, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  UpdateProfileRequest
} from '@/types/auth';

// Auth API functions
export const authAPI = {
  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
 refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ success: boolean; data: profile }> => {
    try {
      const response = await apiClient.get('/auth/profile');
      
      // Kiểm tra nếu response.data là object user trực tiếp (không có success field)
      if (response.data && response.data.id) {
        return {
          success: true,
          data: response.data
        };
      }
      
      // Nếu có success field thì return như bình thường
      if (response.data.success !== undefined) {
        return response.data;
      }
      
      // Fallback: nếu có data thì coi như thành công
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  },

  // Update profile (luôn dùng FormData để tránh server mismatch, kể cả không đổi avatar)
  updateProfile: async (data: UpdateProfileRequest): Promise<{ success: boolean; message: string; data: profile }> => {
    const normalize = (payload: any) => {
      if (!payload) throw new Error('Response rỗng');
      if (payload.id && !payload.data && !payload.profile) {
        return { success: true, message: payload.message || 'OK', data: payload };
      }
      if (payload.data && payload.data.id) {
        return { success: payload.success !== false, message: payload.message || 'OK', data: payload.data };
      }
      if (payload.profile && payload.profile.id) {
        return { success: true, message: payload.message || 'OK', data: payload.profile };
      }
      throw new Error('Response không hợp lệ');
    };

    try {
      const formData = new FormData();
      if (data.fullname !== undefined) formData.append('fullname', data.fullname ?? '');
      if (data.phone !== undefined) formData.append('phone', data.phone ?? '');
      if (data.address !== undefined) formData.append('address', data.address ?? '');
      
      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar, data.avatar.name);
      } else if (typeof data.avatar === 'string' && data.avatar) {
        formData.append('avatar', data.avatar); // URL hiện tại
      }

      // DEBUG: log keys (chỉ ở dev build)
      if (import.meta.env.DEV) {
        const entries: Record<string, any> = {};
        formData.forEach((v, k) => {
          entries[k] = v instanceof File ? `File(name=${v.name}, size=${v.size})` : v;
        });
        // eslint-disable-next-line no-console
        console.log('[updateProfile] FormData entries:', entries);
      }

      const response = await apiClient.put('/auth/profile', formData);
      return normalize(response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      const raw = error?.response?.data;
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[updateProfile] error status:', status, 'raw:', raw);
      }
      let message = 'Cập nhật hồ sơ thất bại';
      if (typeof raw === 'string') {
        if (!raw.startsWith('<')) message = raw;
      } else if (raw?.message) {
        message = raw.message;
      } else if (status === 500 && raw?.error) {
        message = raw.error;
      }
      throw new Error(message + (status ? ` (HTTP ${status})` : ''));
    }
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      // Lấy token để gửi kèm nếu server cần
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      // Gửi request với token và refresh token nếu có
      const response = await apiClient.post('/auth/logout', {
        token,
        refreshToken
      });
      return response.data;
    } catch (error) {
      // Log error nhưng không throw để không làm crash logout process
      console.warn('Logout API error:', error);
      return { success: false, message: 'Logout API failed but local cleanup will continue' };
    }
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await apiClient.post(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Google login
  googleLogin: async (idToken: string) => {
  console.log('Gửi idToken lên backend:', idToken);
  const response = await apiClient.post('/auth/login/google', { idToken });
  return response.data;
  }
};
