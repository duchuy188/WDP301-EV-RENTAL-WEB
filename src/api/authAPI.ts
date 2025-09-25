import apiClient from './config';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  profile, 
  ForgotPasswordRequest, 
  ResetPasswordRequest 
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
  updateProfile: async (data: Partial<profile>) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
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
  }
};