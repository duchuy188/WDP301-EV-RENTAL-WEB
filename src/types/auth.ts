export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullname: string;
  phone?: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  token: string;
  refreshToken?: string;
  [key: string]: any; // Để hỗ trợ các field khác từ response
  data?: {
    user: profile;
    token: string;
  };
}

export interface profile {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  role: string;
  avatar: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullname: string;
  phone: string;
  address: string;
  avatar?: string | File; // Có thể là string (URL) hoặc File object
}