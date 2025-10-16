import React from "react";
import { motion, easeInOut } from "framer-motion";
import { Check, Copy, ArrowRight } from "lucide-react";

type Booking = any;

type Props = {
  visible: boolean;
  bookingResponse?: { booking: Booking } | null;
  selectedVehicle?: { brand?: string; model?: string } | null;
  formatDateSafe: (s: string) => string;
  formatPrice: (n: number) => string;
  onClose: () => void;
  onViewHistory: () => void;
};

const BookingSuccessModal: React.FC<Props> = ({
  visible,
  bookingResponse,
  selectedVehicle,
  formatDateSafe,
  formatPrice,
  onClose,
  onViewHistory,
}) => {
  if (!visible) return null;

  const booking = bookingResponse?.booking;
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: easeInOut },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        {/* Header với gradient */}
        <div className="relative h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600"></div>

        <div className="p-6 md:p-8">
          {/* Success Icon Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-200/50 dark:shadow-green-900/50"
          >
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </motion.div>

          {/* Title & Subtitle */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Đặt xe thành công! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Thông tin chi tiết đã được gửi tới email của bạn. Chuẩn bị cho chuyến hành trình tuyệt vời!
            </p>
          </motion.div>

          {/* Booking Details */}
          {booking && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 mb-6"
            >
              {/* Booking Code - Prominent */}
              <motion.div variants={itemVariants}>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mã đặt xe của bạn</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{booking.code}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(booking.code)}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all shadow-sm"
                  >
                    <Copy className={`w-4 h-4 ${copied ? "text-green-600" : "text-gray-600"}`} />
                  </button>
                </div>
              </motion.div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-base text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs">👤</span>
                    Thông tin khách hàng
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Họ tên", value: booking.user_id?.fullname ?? "N/A" },
                      { label: "Email", value: booking.user_id?.email ?? "N/A" },
                      { label: "Điện thoại", value: booking.user_id?.phone ?? "N/A" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Vehicle & Rental Info */}
                <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-base text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs">🚗</span>
                    Chi tiết thuê xe
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Xe",
                        value: booking.vehicle_id
                          ? `${booking.vehicle_id.brand || ""} ${booking.vehicle_id.model || ""}`
                          : selectedVehicle
                          ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                          : "N/A",
                      },
                      { label: "Trạm nhận", value: booking.station_id?.name ?? "N/A" },
                      { label: "Giá/ngày", value: formatPrice(booking.price_per_day ?? 0) },
                      { label: "Tổng ngày", value: `${booking.total_days ?? 0} ngày` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Dates & Total */}
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-base text-blue-600 dark:text-blue-400 mb-2">📅 Thời gian thuê</h3>
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
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">💰 Tổng tiền</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatPrice(booking.total_price ?? 0)}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-6"></div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 rounded-lg border-2 border-green-600 text-green-600 font-semibold hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50"
            >
              🚗 Đặt xe khác
            </button>
            <button
              onClick={onViewHistory}
              className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-xl hover:shadow-green-600/30 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              📋 Xem lịch sử đặt xe
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BookingSuccessModal;