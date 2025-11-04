import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, Home, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * PaymentFailed - Trang hiển thị khi thanh toán thất bại
 * Backend redirect về: /payment-failed?reason=xxx
 */
const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);

  const reason = searchParams.get('reason') || 'unknown_error';
  const message = searchParams.get('message') || '';
  const bookingId = searchParams.get('bookingId') || searchParams.get('booking_id');

  const getReasonMessage = (reasonCode: string): string => {
    const reasons: Record<string, string> = {
      'invalid_order': 'Đơn hàng không hợp lệ',
      'payment_timeout': 'Hết thời gian thanh toán (15 phút)',
      'insufficient_funds': 'Số dư không đủ',
      'card_expired': 'Thẻ đã hết hạn',
      'invalid_card': 'Thẻ không hợp lệ',
      'cancelled': 'Bạn đã hủy thanh toán',
      'bank_error': 'Lỗi từ ngân hàng',
      'network_error': 'Lỗi kết nối',
      'unknown_error': 'Lỗi không xác định',
      'vehicle_unavailable': 'Xe không còn khả dụng',
      'booking_expired': 'Booking đã hết hạn',
    };
    
    return reasons[reasonCode] || message || 'Giao dịch không thành công';
  };

  useEffect(() => {
    // 📢 Gửi thông báo đến FloatingChat khi trang load
    // Chỉ gửi nếu chưa được gửi từ VNPayCallback (kiểm tra bằng sessionStorage)
    const notificationSent = sessionStorage.getItem('payment_notification_sent');
    
    if (!notificationSent) {
      const failureType = reason === 'cancelled' ? 'cancelled' : 'failed';
      window.dispatchEvent(new CustomEvent('paymentNotification', {
        detail: {
          type: failureType,
          message: getReasonMessage(reason),
        }
      }));
      
      // Đánh dấu đã gửi notification
      sessionStorage.setItem('payment_notification_sent', 'true');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reason, message]);

  useEffect(() => {
    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  useEffect(() => {
    // Auto redirect khi countdown đạt 0
    if (countdown <= 0) {
      const redirectTimer = setTimeout(() => {
        // Xóa flag notification trước khi redirect
        sessionStorage.removeItem('payment_notification_sent');
        navigate('/find-car', { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [countdown, navigate]);

  const getReasonIcon = () => {
    if (reason === 'cancelled') {
      return '🚫';
    } else if (reason === 'payment_timeout' || reason === 'booking_expired') {
      return '⏰';
    } else if (reason === 'vehicle_unavailable') {
      return '🚗';
    }
    return '❌';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 shadow-xl">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center">
                  <XCircle className="h-16 w-16 text-white" />
                </div>
              </motion.div>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-center mb-4 text-red-900 dark:text-red-100">
              {getReasonIcon()} Thanh toán thất bại
            </h1>

            {/* Error Message */}
            <p className="text-center text-gray-700 dark:text-gray-300 mb-6 text-lg">
              {getReasonMessage(reason)}
            </p>

            {/* Error Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Mã lỗi:</span>
                <span className="font-mono text-sm text-red-600 dark:text-red-400">{reason}</span>
              </div>
              
              {bookingId && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
                  <span className="font-mono text-sm">{bookingId}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                <span className="font-semibold">
                  {new Date().toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* What happened */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    Điều gì đã xảy ra?
                  </h3>
                  <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                    {reason === 'payment_timeout' ? (
                      <>
                        <li>• Thời gian thanh toán 15 phút đã hết</li>
                        <li>• Xe đã được giải phóng (không còn giữ chỗ)</li>
                        <li>• Booking tạm thời đã bị xóa</li>
                      </>
                    ) : reason === 'cancelled' ? (
                      <>
                        <li>• Bạn đã hủy thanh toán</li>
                        <li>• Xe đã được giải phóng</li>
                        <li>• Bạn có thể thử lại</li>
                      </>
                    ) : reason === 'vehicle_unavailable' ? (
                      <>
                        <li>• Xe không còn khả dụng</li>
                        <li>• Xe có thể đã được đặt bởi người khác</li>
                        <li>• Vui lòng chọn xe khác</li>
                      </>
                    ) : (
                      <>
                        <li>• Giao dịch không thành công</li>
                        <li>• Xe đã được giải phóng</li>
                        <li>• Không có khoản phí nào bị trừ</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* What to do next */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-700">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Bạn có thể:</h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>✓ Tìm và chọn xe khác</li>
                <li>✓ Kiểm tra thông tin thẻ/tài khoản</li>
                <li>✓ Thử lại với xe khác hoặc thời gian khác</li>
                <li>✓ Liên hệ hỗ trợ nếu cần giúp đỡ</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mb-4">
              <Button
                onClick={() => navigate('/find-car')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tìm xe khác
              </Button>
              <Button
                onClick={() => navigate('/support')}
                variant="outline"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Liên hệ hỗ trợ
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </div>

            {/* Auto redirect notice */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Tự động chuyển về trang tìm xe sau {countdown} giây...
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentFailed;

