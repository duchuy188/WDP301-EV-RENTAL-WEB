import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, FileText } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * PaymentSuccess - Trang hiển thị sau khi thanh toán thành công
 * Backend redirect về: /payment-success?bookingCode=xxx&amount=xxx
 */
const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(8);

  const bookingCode = searchParams.get('bookingCode') || searchParams.get('booking_code') || 'N/A';
  const amount = searchParams.get('amount') || '50000';
  const transactionId = searchParams.get('transactionId') || searchParams.get('transaction_id');

  useEffect(() => {
    // 📢 Gửi thông báo đến FloatingChat khi trang load
    // Chỉ gửi nếu chưa được gửi từ VNPayCallback (kiểm tra bằng sessionStorage)
    const notificationSent = sessionStorage.getItem('payment_notification_sent');
    
    if (bookingCode && bookingCode !== 'N/A' && !notificationSent) {
      window.dispatchEvent(new CustomEvent('paymentNotification', {
        detail: {
          type: 'success',
          bookingCode: bookingCode,
          message: 'Đặt xe của bạn đã được xác nhận. Bạn sẽ nhận được email xác nhận kèm mã QR code trong vài phút.',
          amount: amount
        }
      }));
      
      // Đánh dấu đã gửi notification
      sessionStorage.setItem('payment_notification_sent', 'true');
    }
  }, [bookingCode, amount]);

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
        navigate('/history', { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [countdown, navigate]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 shadow-xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-white animate-bounce" />
                </div>
              </motion.div>
            </div>

            {/* Success Title */}
            <h1 className="text-3xl font-bold text-center mb-4 text-green-900 dark:text-green-100">
              🎉 Thanh toán thành công!
            </h1>

            {/* Success Message */}
            <p className="text-center text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Đặt xe của bạn đã được xác nhận. Bạn sẽ nhận được email xác nhận kèm mã QR code trong vài phút.
            </p>

            {/* Booking Code */}
            {bookingCode && bookingCode !== 'N/A' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border-2 border-green-300 dark:border-green-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 text-center">Mã đặt xe:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono text-center">
                  {bookingCode}
                </p>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Phí giữ chỗ đã thanh toán:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(amount)}
                </span>
              </div>
              
              {transactionId && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Mã giao dịch:</span>
                  <span className="font-mono text-sm">{transactionId}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                <span className="font-semibold">
                  {new Date().toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-700">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">📋 Bước tiếp theo:</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>✅ Xe đã được giữ chỗ cho bạn</li>
                <li>✅ Email xác nhận sẽ được gửi trong vài phút</li>
                <li>✅ Mang mã QR code khi đến nhận xe</li>
                <li>✅ Thanh toán số tiền còn lại khi nhận xe</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mb-4">
              <Button
                onClick={() => navigate('/history')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Xem lịch sử đặt xe
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
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FaMotorcycle className="h-4 w-4 animate-spin" />
              <span>Tự động chuyển đến lịch sử sau {countdown} giây...</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

