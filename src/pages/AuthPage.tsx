import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, User, Phone, Car, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Add fade-in CSS classes
const fadeInStyles = `
  .fade-in {
    animation: fadeIn 1s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = fadeInStyles;
  document.head.appendChild(style);
}

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginData.email || !loginData.password) {
      setError('Vui lòng điền đầy đủ thông tin');
      setLoading(false);
      return;
    }

    try {
      await login(loginData.email, loginData.password);
      navigate('/');
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!registerData.fullName || !registerData.email || !registerData.phone || 
        !registerData.password || !registerData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng');
      setLoading(false);
      return;
    }

    try {
      await registerUser({
        fullName: registerData.fullName,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password
      });
      navigate('/');
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile background for small screens */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-700 opacity-10"></div>
      
      {/* Image Panel - Fixed on the left */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="w-full relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white h-full">
            <div className="mb-8 transform transition-all duration-500 ease-in-out">
              <Car className="w-24 h-24 mb-4 mx-auto animate-bounce" />
              <h1 className="text-4xl font-bold mb-4 text-center transition-all duration-1000 ease-in-out">
                EV Rental
              </h1>
              <p className="text-xl text-center opacity-90 transition-all duration-1000 ease-in-out">
                Tham gia cùng chúng tôi!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div className="text-center transform transition-all duration-500 hover:scale-105">
                <Zap className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold">Thân thiện môi trường</h3>
                <p className="text-sm opacity-80">100% sạch, không khí thải</p>
              </div>
              <div className="text-center transform transition-all duration-500 hover:scale-105">
                <Car className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold">Đa dạng xe</h3>
                <p className="text-sm opacity-80">Nhiều loại xe điện hiện đại</p>
              </div>
            </div>
            
            {/* Back to Home button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate('/')}
                className="group flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1"
              >
                <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="text-sm font-semibold">Quay lại trang chủ</span>
              </button>
            </div>
            
            
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Auth Form Panel - Fixed on the right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md relative">
          {/* Toggle buttons - Positioned beautifully with fade effect */}
          <div className="flex justify-center mb-8 z-20">
            <div className="flex bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full p-1 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-700 ease-in-out transform ${
                  isLogin 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105 opacity-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-700 ease-in-out transform ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg scale-105 opacity-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              >
                Đăng ký
              </button>
            </div>
          </div>

          {/* Form Container with Fade Animation */}
          <div className="relative w-full">
            {/* Login Form */}
            <div 
              className={`transition-all duration-1000 ease-in-out ${
                isLogin ? 'opacity-100 visible' : 'opacity-0 invisible absolute top-0 left-0 w-full'
              }`}
            >
              <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Đăng nhập
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Nhập thông tin đăng nhập của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="example@email.com"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => navigate('/forgot-password')}
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transform transition-all duration-300 hover:scale-105 shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang đăng nhập...</span>
                        </div>
                      ) : (
                        'Đăng nhập'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Register Form */}
            <div 
              className={`transition-all duration-1000 ease-in-out ${
                !isLogin ? 'opacity-100 visible' : 'opacity-0 invisible absolute top-0 left-0 w-full'
              }`}
            >
              <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Đăng ký
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Tạo tài khoản mới để bắt đầu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-fullName">Họ và tên</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-fullName"
                          name="fullName"
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={registerData.fullName}
                          onChange={handleRegisterChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="example@email.com"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Số điện thoại</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-phone"
                          name="phone"
                          type="tel"
                          placeholder="0123456789"
                          value={registerData.phone}
                          onChange={handleRegisterChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirmPassword">Xác nhận mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        Tôi đồng ý với{' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => navigate('/terms')}
                        >
                          điều khoản sử dụng
                        </button>
                      </Label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transform transition-all duration-300 hover:scale-105 shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang đăng ký...</span>
                        </div>
                      ) : (
                        'Đăng ký'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;