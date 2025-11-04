
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle, Bike } from 'lucide-react';
import { authAPI } from '@/api/authAPI';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);


  // Nếu cần lấy email từ query string, có thể dùng URLSearchParams nếu muốn
  // const [searchParams] = useSearchParams();
  // const email = searchParams.get('email');

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setTokenValid(false);
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      return 'Vui lòng điền đầy đủ thông tin';
    }

    if (formData.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword({
        token: token || '',
        newPassword: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-12 text-white">
          <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center">
            <div className="mb-8">
              <svg className="w-24 h-24 mb-4 mx-auto animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.5V11a4 4 0 014-4h10a4 4 0 014 4v2.5a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 013 13.5z" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="16.5" cy="17.5" r="1.5" />
              </svg>
              <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent animate-fade-in">EV Rental</h1>
              <p className="text-xl text-center opacity-90">Tham gia cùng chúng tôi!</p>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-md mb-8">
              <div className="text-center">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h3 className="font-semibold">Thân thiện môi trường</h3>
                <p className="text-sm opacity-80">100% sạch, không khí thải</p>
              </div>
              <div className="text-center">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l2-2m0 0l7-7 7 7M5 11v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
                <h3 className="font-semibold">Đa dạng xe</h3>
                <p className="text-sm opacity-80">Nhiều loại xe điện hiện đại</p>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Link to="/forgot-password" className="group flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="text-sm font-semibold">Quay lại quên mật khẩu</span>
              </Link>
            </div>
          </div>
        </div>
        {/* Right panel - form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold text-red-600">Link không hợp lệ</CardTitle>
                <CardDescription className="text-center text-gray-500 dark:text-gray-400">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>Vui lòng yêu cầu link đặt lại mật khẩu mới.</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link to="/forgot-password" className="text-primary hover:underline">Quên mật khẩu</Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-12 text-white">
          <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center">
            <div className="mb-8 transform transition-all duration-500 ease-in-out">
              <Bike className="w-24 h-24 mb-4 mx-auto animate-bounce" />
              <h1 className="text-4xl font-bold mb-4 text-center transition-all duration-1000 ease-in-out">
                EV Rental
              </h1>
              <p className="text-xl text-center opacity-90 transition-all duration-1000 ease-in-out">
                Tham gia cùng chúng tôi!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-md mb-8">
              <div className="text-center">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h3 className="font-semibold">Thân thiện môi trường</h3>
                <p className="text-sm opacity-80">100% sạch, không khí thải</p>
              </div>
              <div className="text-center">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l2-2m0 0l7-7 7 7M5 11v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
                <h3 className="font-semibold">Đa dạng xe</h3>
                <p className="text-sm opacity-80">Nhiều loại xe điện hiện đại</p>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Link to="/login" className="group flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
            </div>
          </div>
        </div>
        {/* Right panel - form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-600">Đặt lại mật khẩu thành công</CardTitle>
                <CardDescription className="text-center text-gray-500 dark:text-gray-400">Mật khẩu của bạn đã được cập nhật thành công</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link to="/login" className="text-primary hover:underline">Đăng nhập ngay</Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-12 text-white">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center">
            <div className="mb-8 transform transition-all duration-500 ease-in-out">
              <Bike className="w-24 h-24 mb-4 mx-auto animate-bounce" />
              <h1 className="text-4xl font-bold mb-4 text-center transition-all duration-1000 ease-in-out">
                EV Rental
              </h1>
              <p className="text-xl text-center opacity-90 transition-all duration-1000 ease-in-out">
                Tham gia cùng chúng tôi!
              </p>
            </div>
          <div className="grid grid-cols-2 gap-6 max-w-md mb-8">
            <div className="text-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3 className="font-semibold">Thân thiện môi trường</h3>
              <p className="text-sm opacity-80">100% sạch, không khí thải</p>
            </div>
            <div className="text-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l2-2m0 0l7-7 7 7M5 11v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
              <h3 className="font-semibold">Đa dạng xe</h3>
              <p className="text-sm opacity-80">Nhiều loại xe điện hiện đại</p>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <Link to="/login" className="group flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-sm font-semibold">Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-green-600">Đặt lại mật khẩu</CardTitle>
              <CardDescription className="text-center text-gray-500 dark:text-gray-400">Đặt lại mật khẩu cho tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </Button>
              </form>
            </CardContent>
            
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
