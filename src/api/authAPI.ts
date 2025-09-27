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
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest): Promise<{ success: boolean; message: string; data: profile }> => {
    // Nếu có file avatar, sử dụng FormData
    if (data.avatar instanceof File) {
      const formData = new FormData();
      formData.append('fullname', data.fullname);
      formData.append('phone', data.phone);
      formData.append('address', data.address);
      formData.append('avatar', data.avatar);
      
      const response = await apiClient.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Nếu không có file, gửi JSON thông thường
      const response = await apiClient.put('/auth/profile', data);
      return response.data;
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
