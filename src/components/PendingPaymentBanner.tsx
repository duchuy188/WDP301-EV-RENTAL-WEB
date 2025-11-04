import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CreditCard, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { bookingAPI } from '@/api/bookingAPI';
import { MyPendingBookingItem } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';

const PendingPaymentBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<MyPendingBookingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPendingPayments = async () => {
    // Chỉ load khi user đã đăng nhập
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const response = await bookingAPI.getMyPendingBookings();
      
      if (response.success && response.pending_bookings) {
        setPendingPayments(response.pending_bookings);
      }
    } catch (error) {
      console.error('Error loading pending bookings:', error);
      // Không hiển thị lỗi cho user, chỉ log để debug
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ load khi user đã đăng nhập
    if (!isAuthenticated) {
      return;
    }

    loadPendingPayments();

    // Refresh mỗi 30 giây để cập nhật thời gian
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleContinuePayment = (payment: MyPendingBookingItem) => {
    console.log('🔄 Continuing payment for:', payment.temp_id);
    
    const vehicleImage = payment.booking_data.vehicle.image?.[0] || '';
    
    // Navigate với thông tin từ API
    navigate('/payment', {
      state: {
        pendingBookingId: payment.temp_id,
        paymentUrl: payment.vnpay_url,
        expiresAt: payment.expires_at,
        bookingData: {
          vehicleName: payment.booking_data.vehicle.name,
          vehicleImage: vehicleImage,
          startDate: payment.booking_data.start_date,
          endDate: payment.booking_data.end_date,
          pickupTime: payment.booking_data.pickup_time,
          returnTime: payment.booking_data.return_time,
          totalPrice: payment.booking_data.total_price,
          depositAmount: payment.holding_fee_amount,
        },
      },
    });
  };

  const handleDismiss = async (tempId: string) => {
    console.log('❌ Dismissing payment:', tempId);
    
    try {
      // Gọi API hủy pending booking
      await bookingAPI.cancelPendingBooking(tempId);
      
      // Xóa khỏi danh sách hiển thị
      setPendingPayments(prev => prev.filter(p => p.temp_id !== tempId));
      
      // Hiển thị thông báo
      // toast.success('Đã hủy đặt xe'); // Không hiển thị toast để tránh làm phiền user
    } catch (error) {
      console.error('Error dismissing pending booking:', error);
      // Vẫn xóa khỏi UI ngay cả khi API fail (có thể đã hết hạn)
      setPendingPayments(prev => prev.filter(p => p.temp_id !== tempId));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  if (loading || pendingPayments.length === 0) return null;

  return (
    <AnimatePresence>
      {pendingPayments.map((payment) => {
        const isExpiringSoon = payment.time_left.is_urgent || payment.time_left.minutes < 5;
        
        return (
          <motion.div
            key={payment.temp_id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <Card className={`${
              isExpiringSoon 
                ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700'
                : 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-300 dark:border-orange-700'
            }`}>
              <div className="p-4">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <div className={`p-2 rounded-full ${isExpiringSoon ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold mb-1 ${isExpiringSoon ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}`}>
                      {isExpiringSoon ? '⚠️ Sắp hết thời gian thanh toán!' : 'Bạn có đặt xe chưa hoàn tất thanh toán'}
                    </h3>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                      <strong>{payment.booking_data.vehicle.name}</strong> • {formatDate(payment.booking_data.start_date)} {payment.booking_data.pickup_time}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300 mb-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Còn <strong className={isExpiringSoon ? 'text-red-600 dark:text-red-400' : ''}>
                          {payment.time_left.formatted}
                        </strong> để thanh toán
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Tổng: <strong>{formatPrice(payment.booking_data.total_price)}</strong> • Phí giữ chỗ: <strong>{formatPrice(payment.holding_fee_amount)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleContinuePayment(payment)}
                      className={`flex-1 sm:flex-none ${
                        isExpiringSoon 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      } text-white`}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Thanh toán ngay
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(payment.temp_id)}
                      className="hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

export default PendingPaymentBanner;

