import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle, Loader2, Shield } from 'lucide-react';
import { authAPI } from '@/api/authAPI';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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
    setLoading(true);
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Định dạng email không hợp lệ. Vui lòng kiểm tra lại.');
      setLoading(false);
      return;
    }

    try {
      // Call forgot password API
      const response = await authAPI.forgotPassword({ email });
      
      if (response.success) {
        setSent(true);
        setResendCountdown(60); // 60 seconds countdown
        toast.success("Email đặt lại mật khẩu đã được gửi thành công!");
      } else {
        setError(response.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại.');
      }
      
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
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

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call forgot password API again
      const response = await authAPI.forgotPassword({ email });
      
      if (response.success) {
        setResendCountdown(60); // Reset countdown
        toast.success("Email đặt lại mật khẩu đã được gửi lại thành công!");
      } else {
        setError(response.message || 'Có lỗi xảy ra khi gửi lại email. Vui lòng thử lại.');
      }
      
    } catch (err: any) {
      console.error('Resend email error:', err);
      
      // Handle different types of errors
      if (err.response) {
        const errorMessage = err.response.data?.message || 'Có lỗi xảy ra từ phía server.';
        if (err.response.status === 429) {
          setError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
        } else {
          setError(errorMessage);
        }
      } else if (err.request) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Có lỗi xảy ra khi gửi lại email. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setSent(false);
    setEmail('');
    setError('');
    setResendCountdown(0);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md animate-in fade-in-50 duration-500">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in-95 duration-500" />
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Email đã được gửi thành công!
            </CardTitle>
            <CardDescription className="text-base">
              Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Vui lòng kiểm tra email <strong className="font-semibold">{email}</strong> và làm theo hướng dẫn để đặt lại mật khẩu.
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium text-sm">Lưu ý bảo mật</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Link đặt lại mật khẩu sẽ hết hạn sau 15 phút để đảm bảo an toàn tài khoản của bạn.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col gap-3">
              <div className="text-sm text-center text-muted-foreground">
                Không nhận được email?{' '}
                <button
                  onClick={handleResendEmail}
                  disabled={loading || resendCountdown > 0}
                  className={`text-primary underline hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                    resendCountdown > 0 ? 'text-muted-foreground' : ''
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Đang gửi...
                    </span>
                  ) : resendCountdown > 0 ? (
                    `Gửi lại sau ${resendCountdown}s`
                  ) : (
                    'Gửi lại'
                  )}
                </button>
              </div>
              
              <div className="text-sm text-center text-muted-foreground">
                Email không đúng?{' '}
                <button
                  onClick={handleBackToForm}
                  className="text-primary underline hover:no-underline font-medium"
                >
                  Thay đổi email
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="flex items-center text-sm text-primary hover:underline font-medium">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại đăng nhập
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md animate-in fade-in-50 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập địa chỉ email của bạn để nhận link đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Địa chỉ email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={handleInputChange}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  required
                  autoComplete="email"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email này
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full transition-all duration-200 hover:scale-[1.02]" 
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </span>
              ) : (
                'Gửi link đặt lại mật khẩu'
              )}
            </Button>
          </form>
          
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">hoặc</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="flex items-center text-sm text-primary hover:underline transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
