import React, { useEffect, useState } from "react";
import { motion, easeInOut } from "framer-motion";
import { Check, Copy, ArrowRight } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatDateVN } from '@/lib/utils';
import { Booking as BookingType, BookingResponse } from '@/types/booking';
import { bookingAPI } from '@/api/bookingAPI';
import { toast } from '@/utils/toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const BookingSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedBooking, setFetchedBooking] = useState<BookingType | null>(null);

  const state = (location.state || {}) as any;
  const bookingResponse: BookingResponse = state.bookingResponse;
  const selectedVehicle = state.selectedVehicle;
  const bookingFromState: BookingType | undefined = bookingResponse?.booking;
  
  // Get booking code from query params (for payment callback flow)
  const bookingCodeFromUrl = searchParams.get('code') || searchParams.get('bookingCode');
  const holdingFeePaid = searchParams.get('holdingFeePaid') === 'true';

  // Fetch booking details if we have a code in URL but no booking data in state
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (bookingCodeFromUrl && !bookingFromState) {
        setIsLoading(true);
        try {
          // Try to find booking by code through the bookings list
          // Note: This is a workaround since we don't have a direct getBookingByCode API
          const bookingsData = await bookingAPI.getBookings({ limit: 100 });
          const foundBooking = bookingsData.bookings?.find(
            (b: BookingType) => b.code === bookingCodeFromUrl
          );
          
          if (foundBooking) {
            setFetchedBooking(foundBooking);
            if (holdingFeePaid) {
              toast.success('🎉 Thanh toán thành công! Booking đã được xác nhận.');
              
              // 📢 Gửi thông báo đến FloatingChat
              // Chỉ gửi nếu chưa được gửi từ VNPayCallback (kiểm tra bằng sessionStorage)
              const notificationSent = sessionStorage.getItem('payment_notification_sent');
              
              if (!notificationSent) {
                window.dispatchEvent(new CustomEvent('paymentNotification', {
                  detail: {
                    type: 'success',
                    bookingCode: bookingCodeFromUrl,
                    message: 'Booking đã được xác nhận. Xe đã được giữ chỗ cho bạn.',
                  }
                }));
                
                // Đánh dấu đã gửi notification
                sessionStorage.setItem('payment_notification_sent', 'true');
              }
            }
          } else {
            toast.error('Không tìm thấy booking. Vui lòng kiểm tra lịch sử đặt xe.');
            setTimeout(() => navigate('/history', { replace: true }), 2000);
          }
        } catch (error) {
          console.error('Error fetching booking:', error);
          toast.error('Không thể tải thông tin booking. Đang chuyển đến lịch sử...');
          setTimeout(() => navigate('/history', { replace: true }), 2000);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBookingDetails();
  }, [bookingCodeFromUrl, bookingFromState, holdingFeePaid, navigate]);

  // Use fetched booking if available, otherwise use booking from state
  const booking: BookingType | undefined = fetchedBooking || bookingFromState;

  // Use local formatting helpers (do not accept functions from location.state)
  const formatDateSafe = (s: string) => {
    if (!s) return 'Chưa có ngày';
    try {
      return formatDateVN(s);
    } catch (e) {
      try { return new Date(s).toLocaleDateString('vi-VN'); } catch (_){ return s; }
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const [copied, setCopied] = React.useState(false);
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: easeInOut },
    },
  };

  // Show loading state while fetching booking details
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Đang tải thông tin đặt xe..." />
      </div>
    );
  }

  // If no booking data provided, show fallback
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Không tìm thấy dữ liệu đặt xe</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Có vẻ như trang này được truy cập trực tiếp mà không có thông tin booking. Bạn có thể vào lịch sử đặt xe để xem chi tiết.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('/find-car')} className="px-4 py-2 rounded-lg border border-green-600 text-green-600">Đặt xe</button>
              <button onClick={() => navigate('/profile', { state: { activeTab: 'booking-history' } })} className="px-4 py-2 rounded-lg bg-green-600 text-white">Xem lịch sử</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="relative h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600" />
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.6, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 80 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-200/50 dark:shadow-green-900/50"
              >
                <Check className="h-12 w-12 text-white" strokeWidth={3} />
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-extrabold text-green-600 mb-1 leading-tight">
                Đặt xe thành công! <span className="inline-block ml-2">🎉</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Mã đặt xe và thông tin chi tiết đã được gửi tới email của bạn.
              </motion.p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 mb-6">
              <motion.div variants={itemVariants}>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mã đặt xe của bạn</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{booking.code}</p>
                  </div>
                  <button onClick={() => copyToClipboard(booking.code)} className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all shadow-sm">
                    <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-gray-600'}`} />
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-base text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  Chi tiết thuê xe
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      label: 'Xe',
                      value: booking.vehicle_id ? `${booking.vehicle_id.brand || ''} ${booking.vehicle_id.model || ''}` : selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'N/A',
                    },
                    ...(booking.vehicle_id?.color ? [{ label: 'Màu xe', value: booking.vehicle_id.color }] : []),
                    { label: 'Trạm nhận', value: booking.station_id?.name ?? 'N/A' },
                    { label: 'Giá/ngày', value: formatPrice(booking.price_per_day ?? 0) },
                    { label: 'Tổng ngày', value: `${booking.total_days ?? 0} ngày` },
                  ].map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-4">
                <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-base text-blue-600 dark:text-blue-400 mb-2">Thời gian thuê</h3>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Từ ngày</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDateSafe(booking.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Đến ngày</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDateSafe(booking.end_date)}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-300 dark:border-green-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tổng tiền</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatPrice(booking.total_price ?? 0)}</p>
                  {booking.deposit_amount != null && booking.deposit_amount > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Đặt cọc: <span className="font-semibold text-orange-600 dark:text-orange-400">{formatPrice(booking.deposit_amount)}</span></p>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-6" />

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/find-car')} className="flex-1 sm:flex-none px-6 py-2 rounded-lg border-2 border-green-600 text-green-600 font-semibold hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50">🚗 Đặt xe khác</button>
              <button onClick={() => navigate('/profile', { state: { activeTab: 'booking-history' } })} className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-xl hover:shadow-green-600/30 transition-all duration-200 flex items-center justify-center gap-2 group">📋 Xem lịch sử đặt xe <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;