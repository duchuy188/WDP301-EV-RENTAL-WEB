import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import apiClient from '@/api/config';
import { toast } from '@/utils/toast';
import { PaymentCallbackResponse } from '@/types/booking';

/**
 * VNPayCallback - Trang xử lý callback từ VNPay sau khi thanh toán
 * 
 * Flow:
 * 1. User hoàn tất thanh toán trên VNPay
 * 2. VNPay redirect về /payment/callback với query params
 * 3. Component này GỌI API BACKEND ĐỂ VERIFY thanh toán
 * 4. Hiển thị thông báo thành công/thất bại DỰA VÀO KỐT QUẢ TỪ BACKEND
 * 5. Redirect đến trang phù hợp
 */
const VNPayCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'cancelled'>('success');
  const [bookingCode, setBookingCode] = useState<string>('');

  useEffect(() => {
    // Kiểm tra xem có query params từ VNPay không
    const responseCode = searchParams.get('vnp_ResponseCode');
    const transactionStatus = searchParams.get('vnp_TransactionStatus');
    const txnRef = searchParams.get('vnp_TxnRef');
    const amount = searchParams.get('vnp_Amount');
    const bankCode = searchParams.get('vnp_BankCode');

    // Nếu không có query params từ VNPay, redirect về find-car
    if (!responseCode && !transactionStatus) {
      console.warn('⚠️ No VNPay callback params found');
      navigate('/find-car', { 
        replace: true,
        state: { 
          message: 'Link thanh toán không hợp lệ.',
          type: 'error'
        }
      });
      return;
    }

    console.log('📥 VNPay callback params:', {
      responseCode,
      transactionStatus,
      txnRef,
      amount,
      bankCode,
    });

    // Verify payment với backend
    const verifyPayment = async () => {
      try {
        // Gọi API backend để verify payment holding fee
        // Backend sẽ kiểm tra chữ ký VNPay và xác nhận giao dịch
        const queryString = searchParams.toString();
        const response = await apiClient.get<PaymentCallbackResponse>(
          `/payments/holding-fee/callback?${queryString}`
        );

        console.log('✅ Backend verification response:', response.data);

        // Kiểm tra kết quả từ backend
        if (response.data.success) {
          setPaymentStatus('success');
          // Backend trả về booking code trong response.data.booking.code hoặc response.data.data.booking.code
          const bookingCode = 
            response.data.booking?.code || 
            response.data.data?.booking?.code || 
            txnRef || 
            '';
          setBookingCode(bookingCode);
          toast.success(response.data.message || 'Thanh toán thành công!');

          // 🔥 XÓA KHỎI LOCALSTORAGE sau khi thanh toán thành công
          console.log('🗑️ Cleaning up pending payment from localStorage');
          const pendingIds = JSON.parse(localStorage.getItem('pending_booking_ids') || '[]');
          pendingIds.forEach((id: string) => {
            localStorage.removeItem(`pending_payment_${id}`);
          });
          localStorage.removeItem('pending_booking_ids');

          // 📢 Gửi thông báo đến FloatingChat
          window.dispatchEvent(new CustomEvent('paymentNotification', {
            detail: {
              type: 'success',
              bookingCode: bookingCode,
              message: response.data.message || '',
              amount: amount
            }
          }));
          
          // Đánh dấu đã gửi notification để tránh gửi lại ở các trang khác
          sessionStorage.setItem('payment_notification_sent', 'true');
        } else {
          // Backend xác nhận thanh toán thất bại
          if (responseCode === '24') {
            setPaymentStatus('cancelled');
            toast.info('Bạn đã hủy thanh toán.');
            
            // 📢 Gửi thông báo hủy đến FloatingChat
            window.dispatchEvent(new CustomEvent('paymentNotification', {
              detail: {
                type: 'cancelled',
                message: response.data.message || 'Bạn đã hủy thanh toán.'
              }
            }));
            
            // Đánh dấu đã gửi notification
            sessionStorage.setItem('payment_notification_sent', 'true');
          } else {
            setPaymentStatus('failed');
            toast.error(response.data.message || 'Thanh toán thất bại. Vui lòng thử lại.');
            
            // 📢 Gửi thông báo thất bại đến FloatingChat
            window.dispatchEvent(new CustomEvent('paymentNotification', {
              detail: {
                type: 'failed',
                message: response.data.message || 'Thanh toán thất bại. Vui lòng thử lại.'
              }
            }));
            
            // Đánh dấu đã gửi notification
            sessionStorage.setItem('payment_notification_sent', 'true');
          }
        }
      } catch (error: any) {
        console.error('❌ Payment verification error:', error);
        
        // Nếu API backend lỗi, kiểm tra response code từ VNPay
        // (fallback, không khuyến khích - chỉ dùng khi backend down)
        if (responseCode === '00' && transactionStatus === '00') {
          console.warn('⚠️ Backend verification failed, but VNPay says success. Using VNPay status as fallback.');
          setPaymentStatus('success');
          setBookingCode(txnRef || '');
          toast.warning('Thanh toán thành công nhưng không thể xác thực với server. Vui lòng kiểm tra lịch sử.');
          
          // 📢 Gửi thông báo đến FloatingChat
          window.dispatchEvent(new CustomEvent('paymentNotification', {
            detail: {
              type: 'success',
              bookingCode: txnRef || '',
              message: 'Thanh toán thành công nhưng không thể xác thực với server. Vui lòng kiểm tra lịch sử.',
              amount: amount
            }
          }));
          
          // Đánh dấu đã gửi notification
          sessionStorage.setItem('payment_notification_sent', 'true');
        } else if (responseCode === '24') {
          setPaymentStatus('cancelled');
          toast.info('Bạn đã hủy thanh toán.');
          
          // 📢 Gửi thông báo hủy đến FloatingChat
          window.dispatchEvent(new CustomEvent('paymentNotification', {
            detail: {
              type: 'cancelled',
              message: 'Bạn đã hủy thanh toán.'
            }
          }));
          
          // Đánh dấu đã gửi notification
          sessionStorage.setItem('payment_notification_sent', 'true');
        } else {
          setPaymentStatus('failed');
          toast.error(error.response?.data?.message || 'Lỗi xác thực thanh toán.');
          
          // 📢 Gửi thông báo thất bại đến FloatingChat
          window.dispatchEvent(new CustomEvent('paymentNotification', {
            detail: {
              type: 'failed',
              message: error.response?.data?.message || 'Lỗi xác thực thanh toán.'
            }
          }));
          
          // Đánh dấu đã gửi notification
          sessionStorage.setItem('payment_notification_sent', 'true');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  // Separate useEffect for auto redirect
  useEffect(() => {
    if (!isProcessing) {
      const redirectTimer = setTimeout(() => {
        // Xóa payment state từ sessionStorage
        sessionStorage.removeItem('vnpay_payment_state');
        
        // Nếu thanh toán thành công, đảm bảo cleanup localStorage
        if (paymentStatus === 'success') {
          const pendingIds = JSON.parse(localStorage.getItem('pending_booking_ids') || '[]');
          pendingIds.forEach((id: string) => {
            localStorage.removeItem(`pending_payment_${id}`);
          });
          localStorage.removeItem('pending_booking_ids');
          
          // Xóa flag notification sau 1 giây để tránh gửi lại ở trang tiếp theo
          setTimeout(() => {
            sessionStorage.removeItem('payment_notification_sent');
          }, 1000);
          
          navigate('/history', { replace: true });
        } else {
          // Xóa flag notification sau 1 giây
          setTimeout(() => {
            sessionStorage.removeItem('payment_notification_sent');
          }, 1000);
          
          navigate('/find-car', { 
            replace: true,
            state: { 
              message: paymentStatus === 'cancelled' 
                ? 'Bạn đã hủy thanh toán. Vui lòng chọn xe khác.' 
                : 'Thanh toán thất bại. Vui lòng thử lại.',
              type: 'error'
            }
          });
        }
      }, 8000); // 8 seconds

      return () => clearTimeout(redirectTimer);
    }
  }, [isProcessing, paymentStatus, navigate]);

  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-20 w-20 text-blue-600 animate-spin" />;
    }
    
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle2 className="h-20 w-20 text-green-600 animate-bounce" />;
      case 'cancelled':
        return <XCircle className="h-20 w-20 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-20 w-20 text-red-600" />;
    }
  };

  const getStatusTitle = () => {
    if (isProcessing) {
      return 'Đang xử lý thanh toán...';
    }
    
    switch (paymentStatus) {
      case 'success':
        return '🎉 Thanh toán thành công!';
      case 'cancelled':
        return 'Đã hủy thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
    }
  };

  const getStatusMessage = () => {
    if (isProcessing) {
      return 'Vui lòng đợi trong giây lát...';
    }
    
    switch (paymentStatus) {
      case 'success':
        return 'Đặt xe của bạn đã được xác nhận. Bạn sẽ nhận được email xác nhận kèm mã QR code trong vài phút.';
      case 'cancelled':
        return 'Bạn đã hủy thanh toán. Xe đã được giữ chỗ sẽ được giải phóng sau ít phút.';
      case 'failed':
        return 'Giao dịch thanh toán không thành công. Vui lòng kiểm tra lại thông tin và thử lại.';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700';
      case 'cancelled':
        return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700';
      case 'failed':
        return 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700';
      default:
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`p-8 bg-gradient-to-br ${getStatusColor()} border-2 shadow-xl`}>
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>

            {/* Status Title */}
            <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
              {getStatusTitle()}
            </h1>

            {/* Status Message */}
            <p className="text-center text-gray-700 dark:text-gray-300 mb-6 text-lg">
              {getStatusMessage()}
            </p>

            {/* Booking Code */}
            {!isProcessing && paymentStatus === 'success' && bookingCode && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border-2 border-green-300 dark:border-green-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mã đặt xe:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                  {bookingCode}
                </p>
              </div>
            )}

            {/* Payment Details */}
            {!isProcessing && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Số tiền thanh toán:</span>
                  <span className="font-semibold">
                    {searchParams.get('vnp_Amount') 
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          parseInt(searchParams.get('vnp_Amount')!) / 100
                        )
                      : '50,000đ'}
                  </span>
                </div>
                {searchParams.get('vnp_BankCode') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Ngân hàng:</span>
                    <span className="font-semibold">{searchParams.get('vnp_BankCode')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                  <span className="font-semibold">
                    {new Date().toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isProcessing && (
              <div className="flex gap-3 justify-center">
                {paymentStatus === 'success' ? (
                  <>
                    <Button
                      onClick={() => {
                        sessionStorage.removeItem('vnpay_payment_state');
                        navigate('/history');
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Xem lịch sử đặt xe
                    </Button>
                    <Button
                      onClick={() => {
                        sessionStorage.removeItem('vnpay_payment_state');
                        navigate('/');
                      }}
                      variant="outline"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Về trang chủ
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        sessionStorage.removeItem('vnpay_payment_state');
                        navigate('/find-car');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Tìm xe khác
                    </Button>
                    <Button
                      onClick={() => {
                        sessionStorage.removeItem('vnpay_payment_state');
                        navigate('/');
                      }}
                      variant="outline"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Về trang chủ
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Auto redirect notice */}
            {!isProcessing && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Tự động chuyển hướng sau vài giây...
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VNPayCallback;

