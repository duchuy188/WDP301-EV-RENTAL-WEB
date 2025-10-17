import { toast as toastBase } from '@/hooks/use-toast';

// Toast notification utilities
export const toast = {
  // Success toast
  success: (message: string, description?: string) => {
    return toastBase({
      title: '✅ Thành công',
      description: description || message,
      variant: 'default',
      duration: 3000,
    });
  },

  // Error toast
  error: (message: string, description?: string) => {
    return toastBase({
      title: '❌ Thông báo',
      description: description || message,
      variant: 'destructive',
      duration: 5000,
    });
  },

  // Warning toast
  warning: (message: string, description?: string) => {
    return toastBase({
      title: '⚠️ Cảnh báo',
      description: description || message,
      variant: 'default',
      duration: 4000,
    });
  },

  // Info toast
  info: (message: string, description?: string) => {
    return toastBase({
      title: 'ℹ️ Thông tin',
      description: description || message,
      variant: 'default',
      duration: 3000,
    });
  },

  // Loading toast
  loading: (message: string = 'Đang xử lý...') => {
    return toastBase({
      title: '⏳ Đang tải',
      description: message,
      variant: 'default',
      duration: 0, // Won't auto-dismiss
    });
  },

  // Custom toast
  custom: (title: string, message: string, variant: 'default' | 'destructive' = 'default', duration: number = 3000) => {
    return toastBase({
      title,
      description: message,
      variant,
      duration,
    });
  },

  // Promise toast - useful for async operations
  promise: <T>(
    promise: Promise<T>,
    {
      loading = 'Đang xử lý...',
      success = 'Thành công!',
      error = 'Có lỗi xảy ra!',
    }: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
    }
  ) => {
    const loadingToast = toast.loading(loading);

    promise
      .then((data) => {
        loadingToast.dismiss();
        const successMessage = typeof success === 'function' ? success(data) : success;
        toast.success(successMessage);
        return data;
      })
      .catch((err) => {
        loadingToast.dismiss();
        const errorMessage = typeof error === 'function' ? error(err) : error;
        toast.error(errorMessage);
        throw err;
      });

    return promise;
  },
};

// Convenience methods for common use cases
export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showWarning = (message: string) => toast.warning(message);
export const showInfo = (message: string) => toast.info(message);
export const showLoading = (message?: string) => toast.loading(message);

// Export default
export default toast;