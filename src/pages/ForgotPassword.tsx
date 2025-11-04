import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, Loader2, Bike } from 'lucide-react';
import { authAPI } from '@/api/authAPI';
import { toast } from '@/utils/toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const MAX_ATTEMPTS = 3;

  // Reset hasSubmitted after successful send to allow next attempt
  useEffect(() => {
    if (hasSubmitted && !sent && attemptCount < MAX_ATTEMPTS) {
      const timer = setTimeout(() => {
        setHasSubmitted(false);
      }, 3000); // Allow next attempt after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [hasSubmitted, sent, attemptCount, MAX_ATTEMPTS]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if max attempts reached
    if (attemptCount >= MAX_ATTEMPTS) {
      setError('Bạn đã vượt quá giới hạn 3 lần gửi email. Vui lòng thử lại sau 15 phút.');
      return;
    }

    // Prevent multiple submissions
    if (hasSubmitted || loading) {
      return;
    }

    setLoading(true);
    setError('');
    setHasSubmitted(true); // Mark as submitted immediately
    setAttemptCount(prev => prev + 1); // Increment attempt count

    // Basic validation
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      setLoading(false);
      setHasSubmitted(false); // Reset if validation fails
      setAttemptCount(prev => prev - 1); // Revert attempt count on validation error
      return;
    }

    if (!validateEmail(email)) {
      setError('Định dạng email không hợp lệ. Vui lòng kiểm tra lại.');
      setLoading(false);
      setHasSubmitted(false); // Reset if validation fails
      setAttemptCount(prev => prev - 1); // Revert attempt count on validation error
      return;
    }

    try {
      // Call forgot password API
      const response = await authAPI.forgotPassword({ email });

      if (response.success) {
        setSent(true);
        toast.success("Email đặt lại mật khẩu đã được gửi thành công!");
        // Keep hasSubmitted as true - don't reset
      } else {
        setError(response.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại.');
        // Only allow retry if we haven't reached max attempts
        if (attemptCount < MAX_ATTEMPTS) {
          setHasSubmitted(false);
        }
      }

    } catch (err: any) {
      console.error('Forgot password error:', err);

      // Only reset hasSubmitted if we haven't reached max attempts
      if (attemptCount < MAX_ATTEMPTS) {
        setHasSubmitted(false);
      }

      // Handle different types of errors
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || 'Có lỗi xảy ra từ phía server.';
        if (err.response.status === 404) {
          setError('Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.');
        } else if (err.response.status === 429) {
          setError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
        } else {
          setError(errorMessage);
        }
      } else if (err.request) {
        // Network error
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Other errors
        setError('Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleBackToForm = () => {
    setSent(false);
    setEmail('');
    setError('');
    setLoading(false); // Reset loading state
    setHasSubmitted(false); // Reset submission state
    setAttemptCount(0); // Reset attempt count
  };

  if (sent) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-12 text-white">
          <div className="w-full max-w-lg mx-auto flex flex-col justify-center items-center">
            <div className="mb-8">
              <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11V7a5 5 0 0110 0v4m-1 4v2a2 2 0 11-4 0v-2m-7 0h18" /></svg>
              <h1 className="text-4xl font-bold mb-4 text-center transition-all duration-1000 ease-in-out">
                EV Rental
              </h1>
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
              <Link to="/" className="group flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="text-sm font-semibold">Quay lại trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
        {/* Right panel - form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold text-green-600">Email đã được gửi!</CardTitle>
                <CardDescription className="text-base">Link đặt lại mật khẩu đã được gửi đến email của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Email đặt lại mật khẩu đã được gửi đến <strong className="font-semibold">{email}</strong>.
                    Vui lòng kiểm tra hộp thư đến và thư mục spam của bạn.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Lưu ý quan trọng:</span>
                    </div>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• Link đặt lại mật khẩu có hiệu lực trong 15 phút</li>
                      <li>• Nếu không thấy email, hãy kiểm tra thư mục spam</li>
                      <li>• Chỉ có thể gửi email một lần để đảm bảo bảo mật</li>
                    </ul>
                  </div>
                  <div className="text-sm text-center text-muted-foreground">
                    Nhập sai email?{' '}
                    <button
                      onClick={handleBackToForm}
                      className="text-primary underline hover:no-underline font-medium"
                    >
                      Thử lại với email khác
                    </button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-muted-foreground">
                  Đã nhớ mật khẩu?{' '}
                  <Link to="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
                </div>
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
              <CardTitle className="text-2xl font-bold text-center text-green-600">Quên mật khẩu</CardTitle>
              <CardDescription className="text-center text-gray-500 dark:text-gray-400">
                Nhập địa chỉ email của bạn để nhận link đặt lại mật khẩu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@domain.com"
                      value={email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email này.
                    <strong className="text-orange-600"> Tối đa 3 lần gửi.</strong>
                    {attemptCount > 0 && (
                      <span className="text-blue-600"> ({attemptCount}/{MAX_ATTEMPTS} lần đã sử dụng)</span>
                    )}
                  </p>
                  {hasSubmitted && !sent && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Email đã được gửi thành công đến địa chỉ này
                    </div>
                  )}
                  {attemptCount >= MAX_ATTEMPTS && (
                    <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ Bạn đã hết lượt gửi email. Vui lòng thử lại sau 15 phút hoặc liên hệ hỗ trợ.
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className={`w-full ${attemptCount >= MAX_ATTEMPTS
                      ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed'
                      : hasSubmitted
                        ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed'
                        : ''
                    }`}
                  disabled={loading || !email.trim() || hasSubmitted || attemptCount >= MAX_ATTEMPTS}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang gửi...
                    </span>
                  ) : attemptCount >= MAX_ATTEMPTS ? (
                    '🚫 Đã hết lượt gửi'
                  ) : hasSubmitted ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Email đã được gửi
                    </span>
                  ) : attemptCount > 0 ? (
                    `Gửi lại (còn ${MAX_ATTEMPTS - attemptCount} lần)`
                  ) : (
                    'Gửi link đặt lại mật khẩu'
                  )}
                </Button>
              </form>
            </CardContent>

          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
