/**
 * Utility function để xóa sạch TẤT CẢ dữ liệu storage khi logout hoặc khi phát hiện lỗi authentication
 * Chỉ giữ lại theme preference của người dùng
 */
export const clearAllStorage = () => {
  // Lưu theme trước khi xóa
  const savedTheme = localStorage.getItem('theme');
  
  // Xóa toàn bộ localStorage
  localStorage.clear();
  
  // Khôi phục theme
  if (savedTheme) {
    localStorage.setItem('theme', savedTheme);
  }
  
  // Xóa toàn bộ sessionStorage
  sessionStorage.clear();
};

/**
 * Chỉ xóa dữ liệu authentication (dùng cho các trường hợp cụ thể)
 */
export const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

