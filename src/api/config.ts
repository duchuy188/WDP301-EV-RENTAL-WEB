import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_REACT_APP_BASE_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If sending FormData, ensure we don't have a manually set Content-Type so the browser can add the boundary
    const isFormData = (val: any): val is FormData => typeof FormData !== 'undefined' && val instanceof FormData;
    if (config.headers) {
      if (isFormData(config.data)) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      } else {
        // For JSON payloads, set Content-Type only if not already specified
        if (!config.headers['Content-Type'] && !config.headers['content-type']) {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear local auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page to avoid an unnecessary reload/flash
      try {
        if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (e) {
        // In very rare environments window/location might be unavailable; ignore
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;