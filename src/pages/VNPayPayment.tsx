import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Clock, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { bookingAPI } from '@/api/bookingAPI';
import { toast } from 'sonner';

interface PaymentState {
  paymentUrl: string;
  pendingBookingId: string;
  expiresAt: string;
  bookingData: {
    vehicleName: string;
    vehicleImage: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
    returnTime: string;
    totalPrice: number;
    depositAmount: number;
  };
}

const VNPayPayment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // 15 phút tính bằng giây
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Lấy state từ location hoặc sessionStorage (để tránh mất data khi user back)
  const getPaymentState = (): PaymentState | null => {
    const locationState = location.state as PaymentState | null;
    
    if (locationState?.paymentUrl) {
      // Lưu state vào sessionStorage
      sessionStorage.setItem('vnpay_payment_state', JSON.stringify(locationState));
      return locationState;
    }
    
    // Nếu không có location.state, thử lấy từ sessionStorage
    const savedState = sessionStorage.getItem('vnpay_payment_state');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (error) {
        console.error('Failed to parse saved payment state:', error);
      }
    }
    
    return null;
  };

  const state = getPaymentState();

  useEffect(() => {
    // Nếu không có state, redirect về trang tìm xe
    if (!state?.paymentUrl) {
      navigate('/find-car', { replace: true });
      return;
    }

    // Parse date string từ backend (hỗ trợ nhiều format)
    const parseVietnameseDate = (dateString: string): Date => {
      if (!dateString) return new Date(Date.now() + 15 * 60 * 1000); // Default: +15 phút
      
      try {
        // Kiểm tra format: nếu có "/" thì là dd/mm/yyyy, nếu có "-" hoặc "T" thì là ISO
        if (dateString.includes('/')) {
          // Format: dd/mm/yyyy HH:mm:ss
          const [datePart, timePart] = dateString.split(' ');
          
          if (!datePart) {
            throw new Error('Invalid date format');
          }
          
          const [day, month, year] = datePart.split('/');
          const [hours, minutes, seconds] = (timePart || '00:00:00').split(':');
          
          // Tạo Date object (month is 0-indexed in JavaScript)
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,  // month is 0-indexed
            parseInt(day),
            parseInt(hours || '0'),
            parseInt(minutes || '0'),
            parseInt(seconds || '0')
          );
          
          // Kiểm tra date có hợp lệ không
          if (isNaN(date.getTime())) {
            console.error('❌ Invalid VN date format:', dateString);
            return new Date(Date.now() + 15 * 60 * 1000);
          }
          
          console.log('✅ Parsed as VN date:', dateString, '→', date.toLocaleString('vi-VN'));
          return date;
        } else {
          // Thử parse ISO format (yyyy-mm-ddTHH:mm:ss.xxxZ hoặc yyyy-mm-dd HH:mm:ss)
          const isoDate = new Date(dateString);
          
          if (isNaN(isoDate.getTime())) {
            console.error('❌ Invalid ISO date format:', dateString);
            return new Date(Date.now() + 15 * 60 * 1000);
          }
          
          console.log('✅ Parsed as ISO date:', dateString, '→', isoDate.toLocaleString('vi-VN'));
          return isoDate;
        }
      } catch (error) {
        console.error('❌ Error parsing date:', dateString, error);
        return new Date(Date.now() + 15 * 60 * 1000); // Default: +15 phút
      }
    };

    // Tính thời gian còn lại từ expiresAt
    const calculateTimeRemaining = () => {
      if (!state.expiresAt) return 15 * 60;
      
      const expiryTime = parseVietnameseDate(state.expiresAt).getTime();
      const currentTime = new Date().getTime();
      const secondsRemaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
      
      console.log('⏰ Timer info:', {
        expiresAt: state.expiresAt,
        expiryTime: new Date(expiryTime).toLocaleString('vi-VN'),
        currentTime: new Date(currentTime).toLocaleString('vi-VN'),
        secondsRemaining,
        minutesRemaining: Math.floor(secondsRemaining / 60)
      });
      
      return secondsRemaining;
    };

    // Set initial time
    setTimeRemaining(calculateTimeRemaining());

    // Đếm ngược thời gian
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Nếu hết thời gian, redirect về trang tìm xe
        if (newTime <= 0) {
          clearInterval(timer);
          console.warn('⏰ Payment time expired, redirecting to find-car...');
          setTimeout(() => {
            // Xóa state khỏi sessionStorage
            sessionStorage.removeItem('vnpay_payment_state');
            navigate('/find-car', { 
              replace: true,
              state: { 
                message: 'Thời gian thanh toán đã hết. Vui lòng đặt xe lại.',
                type: 'error'
              }
            });
          }, 2000);
        }
        
        return Math.max(0, newTime); // Đảm bảo không bao giờ âm
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, navigate]);

  const formatTime = (seconds: number): string => {
    // Xử lý trường hợp NaN hoặc số không hợp lệ
    if (isNaN(seconds) || seconds < 0) {
      return '00:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleProceedToPayment = () => {
    if (!state?.paymentUrl) return;
    
    setIsRedirecting(true);
    
    // Lưu thông tin vào sessionStorage trước khi redirect
    sessionStorage.setItem('vnpay_payment_state', JSON.stringify(state));
    
    // Redirect đến VNPay
    window.location.href = state.paymentUrl;
  };

  const handleCancel = async () => {
    if (!state?.pendingBookingId) return;
    
    try {
      setIsCancelling(true);
      
      console.log('🔄 Cancelling pending booking:', state.pendingBookingId);
      
      // Gọi API hủy pending booking
      const response = await bookingAPI.cancelPendingBooking(state.pendingBookingId);
      
      // Xóa state khỏi sessionStorage
      sessionStorage.removeItem('vnpay_payment_state');
      
      // Hiển thị thông báo thành công
      toast.success(response.message || 'Đã hủy đặt xe thành công');
      
      // Navigate về trang tìm xe
      navigate('/find-car', { replace: true });
    } catch (error: any) {
      console.error('Error cancelling pending booking:', error);
      
      // Hiển thị lỗi
      const errorMessage = error.response?.data?.message || 'Không thể hủy đặt xe. Vui lòng thử lại.';
      toast.error(errorMessage);
      
      // Nếu lỗi 400/404 (status không hợp lệ hoặc đã hết hạn), vẫn navigate về trang tìm xe
      if (error.response?.status === 400 || error.response?.status === 404) {
        sessionStorage.removeItem('vnpay_payment_state');
        navigate('/find-car', { replace: true });
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (!state) {
    return null;
  }

  const { bookingData } = state;
  const isExpiringSoon = timeRemaining <= 5 * 60; // Dưới 5 phút
  const isExpired = timeRemaining <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
            Thanh toán phí giữ chỗ
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Hoàn tất thanh toán để xác nhận đặt xe của bạn
          </p>
        </motion.div>

        {/* Timer Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`p-5 ${
            isExpired 
              ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700' 
              : isExpiringSoon
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700'
              : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isExpired
                  ? 'bg-red-500'
                  : isExpiringSoon
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-blue-500'
              }`}>
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  isExpired
                    ? 'text-red-900 dark:text-red-100'
                    : isExpiringSoon
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-blue-900 dark:text-blue-100'
                }`}>
                  {isExpired ? 'Hết thời gian thanh toán' : 'Thời gian còn lại'}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold font-mono ${
                    isExpired
                      ? 'text-red-600 dark:text-red-400'
                      : isExpiringSoon
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                {!isExpired && isExpiringSoon && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    ⚠️ Vui lòng thanh toán trước khi hết thời gian!
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thông tin booking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Thông tin đặt xe
                </h3>
                
                <div className="flex gap-4">
                  <img
                    src={bookingData.vehicleImage}
                    alt={bookingData.vehicleName}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">
                      {bookingData.vehicleName}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(bookingData.startDate).toLocaleDateString('vi-VN')} {bookingData.pickupTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(bookingData.endDate).toLocaleDateString('vi-VN')} {bookingData.returnTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Important Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <AlertCircle className="h-5 w-5" />
                  Lưu ý quan trọng
                </h3>
                <ul className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Xe được <strong>GIỮ NGAY</strong> khi bạn xác nhận đặt xe (không lo bị mất xe)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Phí giữ chỗ <strong>50,000đ KHÔNG được hoàn lại</strong> khi hủy booking
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Link thanh toán có hiệu lực <strong>15 phút</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Phí giữ chỗ sẽ được <strong>TRỪ vào tổng chi phí</strong> khi xác nhận thuê xe
                    </span>
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-24"
            >
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Chi tiết thanh toán</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Tổng chi phí thuê xe:</span>
                    <span className="font-semibold">{formatPrice(bookingData.totalPrice)}</span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-900 dark:text-green-100 font-medium">
                        Phí giữ chỗ (thanh toán ngay):
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        50,000đ
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                      * Sẽ được trừ vào tổng chi phí khi nhận xe
                    </p>
                  </div>

                  {bookingData.depositAmount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Tiền cọc (trả khi nhận xe):</span>
                      <span className="font-semibold">{formatPrice(bookingData.depositAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isExpired || isRedirecting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isRedirecting ? (
                      <>
                        <FaMotorcycle className="mr-2 h-4 w-4 animate-spin" />
                        Đang chuyển hướng...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Thanh toán ngay
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleCancel}
                    disabled={isRedirecting || isCancelling}
                    variant="outline"
                    className="w-full"
                  >
                    {isCancelling ? (
                      <>
                        <FaMotorcycle className="mr-2 h-4 w-4 animate-spin" />
                        Đang hủy...
                      </>
                    ) : (
                      'Hủy và quay lại'
                    )}
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Shield className="h-4 w-4" />
                    <span>Thanh toán an toàn qua VNPay</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VNPayPayment;

