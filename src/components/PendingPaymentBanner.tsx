import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CreditCard, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PendingPayment {
  pendingBookingId: string;
  paymentUrl: string;
  expiresAt: string;
  createdAt: string;
  bookingData: {
    vehicleName: string;
    vehicleImage?: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
    returnTime: string;
    totalPrice: number;
    depositAmount: number;
  };
}

const PendingPaymentBanner: React.FC = () => {
  const navigate = useNavigate();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);

  const loadPendingPayments = () => {
    const pendingIds = JSON.parse(localStorage.getItem('pending_booking_ids') || '[]');
    const payments: PendingPayment[] = [];
    const now = new Date();

    pendingIds.forEach((id: string) => {
      const paymentData = localStorage.getItem(`pending_payment_${id}`);
      if (paymentData) {
        try {
          const payment = JSON.parse(paymentData) as PendingPayment;
          
          // Parse Vietnamese date format DD/MM/YYYY HH:mm:ss or ISO format
          let expiresAt: Date;
          if (payment.expiresAt.includes('/')) {
            const [datePart, timePart] = payment.expiresAt.split(' ');
            const [day, month, year] = datePart.split('/');
            const [hours, minutes, seconds] = (timePart || '00:00:00').split(':');
            expiresAt = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hours || '0'),
              parseInt(minutes || '0'),
              parseInt(seconds || '0')
            );
          } else {
            expiresAt = new Date(payment.expiresAt);
          }
          
          // Chỉ hiển thị nếu chưa hết hạn (còn trong 15 phút)
          if (expiresAt > now) {
            payments.push(payment);
          } else {
            // Xóa payment đã hết hạn
            console.log('🗑️ Removing expired payment:', id);
            localStorage.removeItem(`pending_payment_${id}`);
          }
        } catch (e) {
          console.error('Error parsing pending payment:', e);
          localStorage.removeItem(`pending_payment_${id}`);
        }
      }
    });

    // Cập nhật lại danh sách IDs (chỉ giữ những cái còn hạn)
    const validIds = payments.map(p => p.pendingBookingId);
    localStorage.setItem('pending_booking_ids', JSON.stringify(validIds));

    setPendingPayments(payments);
  };

  useEffect(() => {
    loadPendingPayments();

    // Refresh mỗi 30 giây để kiểm tra thời gian hết hạn
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleContinuePayment = (payment: PendingPayment) => {
    console.log('🔄 Continuing payment for:', payment.pendingBookingId);
    
    // Dùng lại payment URL đã có - KHÔNG CẦN GỌI API!
    navigate('/payment', {
      state: {
        pendingBookingId: payment.pendingBookingId,
        paymentUrl: payment.paymentUrl,
        expiresAt: payment.expiresAt,
        bookingData: payment.bookingData,
      },
    });
  };

  const handleDismiss = (pendingBookingId: string) => {
    console.log('❌ Dismissing payment:', pendingBookingId);
    
    // Xóa khỏi localStorage
    localStorage.removeItem(`pending_payment_${pendingBookingId}`);
    const pendingIds = JSON.parse(localStorage.getItem('pending_booking_ids') || '[]');
    const newIds = pendingIds.filter((id: string) => id !== pendingBookingId);
    localStorage.setItem('pending_booking_ids', JSON.stringify(newIds));
    
    setPendingPayments(prev => prev.filter(p => p.pendingBookingId !== pendingBookingId));
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    
    // Parse Vietnamese date format DD/MM/YYYY HH:mm:ss or ISO format
    let expires: Date;
    if (expiresAt.includes('/')) {
      const [datePart, timePart] = expiresAt.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes, seconds] = (timePart || '00:00:00').split(':');
      expires = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours || '0'),
        parseInt(minutes || '0'),
        parseInt(seconds || '0')
      );
    } else {
      expires = new Date(expiresAt);
    }
    
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, total: diff };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  if (pendingPayments.length === 0) return null;

  return (
    <AnimatePresence>
      {pendingPayments.map((payment) => {
        const timeRemaining = getTimeRemaining(payment.expiresAt);
        const isExpiringSoon = timeRemaining.minutes < 5;
        
        return (
          <motion.div
            key={payment.pendingBookingId}
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
                      <strong>{payment.bookingData.vehicleName}</strong> • {payment.bookingData.startDate} {payment.bookingData.pickupTime}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300 mb-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Còn <strong className={isExpiringSoon ? 'text-red-600 dark:text-red-400' : ''}>
                          {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
                        </strong> để thanh toán
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Tổng: <strong>{formatPrice(payment.bookingData.totalPrice)}</strong> • Phí giữ chỗ: <strong>50,000 đ</strong>
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
                      onClick={() => handleDismiss(payment.pendingBookingId)}
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

