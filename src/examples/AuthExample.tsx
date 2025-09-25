import React, { useState } from 'react';
import { authAPI } from '@/api/authAPI';
import { LoginRequest, RegisterRequest } from '@/types/auth';

const AuthExample = () => {
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    email: '',
    password: '',
    fullname: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Example: Sử dụng API Login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login(loginForm);
      
      if (response.success) {
        setMessage(`Đăng nhập thành công! Welcome ${response.data.user.fullname}`);
        
        // Lưu token và user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('User data:', response.data.user);
        console.log('Token:', response.data.token);
      } else {
        setMessage(`Đăng nhập thất bại: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setMessage(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example: Sử dụng API Register
  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await authAPI.register(registerForm);
      
      if (response.success) {
        setMessage(`Đăng ký thành công! Welcome ${response.data.user.fullname}`);
        
        // Lưu token và user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('User data:', response.data.user);
        console.log('Token:', response.data.token);
      } else {
        setMessage(`Đăng ký thất bại: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Register error:', error);
      setMessage(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example: Lấy thông tin profile
  const handleGetProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProfile();
      
      if (response.success) {
        setMessage(`Profile loaded: ${response.data.fullname} - ${response.data.email}`);
        console.log('Profile data:', response.data);
      } else {
        setMessage('Không thể lấy thông tin profile');
      }
    } catch (error: any) {
      console.error('Get profile error:', error);
      setMessage(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Example: Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      setMessage('Đăng xuất thành công!');
      
      // Xóa dữ liệu local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error: any) {
      console.error('Logout error:', error);
      setMessage(`Lỗi đăng xuất: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Auth API Examples</h2>
      
      {/* Login Form */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Login</h3>
        <input
          type="email"
          placeholder="Email"
          value={loginForm.email}
          onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginForm.password}
          onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <button onClick={handleLogin} disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </div>

      {/* Register Form */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Register</h3>
        <input
          type="text"
          placeholder="Full Name"
          value={registerForm.fullname}
          onChange={(e) => setRegisterForm({...registerForm, fullname: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="email"
          placeholder="Email"
          value={registerForm.email}
          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="tel"
          placeholder="Phone (Optional)"
          value={registerForm.phone || ''}
          onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={registerForm.password}
          onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <button onClick={handleRegister} disabled={loading}>
          {loading ? 'Loading...' : 'Register'}
        </button>
      </div>

      {/* Other Actions */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Other Actions</h3>
        <button onClick={handleGetProfile} disabled={loading} style={{ margin: '5px' }}>
          Get Profile
        </button>
        <button onClick={handleLogout} disabled={loading} style={{ margin: '5px' }}>
          Logout
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          border: '1px solid #ccc',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthExample;