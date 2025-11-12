import React, { useState } from 'react';
import { Calendar, Clock, CreditCard, MapPin, Phone, Hash, Image as ImageIcon, Edit, RefreshCw } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Booking } from '@/types/booking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface ViewBookingProps {
  booking: Booking;
  onEdit?: () => void;
  canEdit?: boolean;
  editDisabledReason?: string;
  onRebook?: () => void;
  canRebook?: boolean;
}

const ViewBooking: React.FC<ViewBookingProps> = ({ booking, onEdit, canEdit = false, editDisabledReason, onRebook, canRebook = false }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Helper function to format date only (remove time part)
  const formatDateOnly = (dateString: string): string => {
    if (!dateString) return '—';
    // If format is "DD/MM/YYYY HH:MM:SS", extract only date part
    return dateString.split(' ')[0];
  };

  // Helper function to format time in Vietnam timezone
  const formatTimeVN = (timeString?: string, dateString?: string): string => {
    if (!timeString) return '—';
    
    try {
      // If timeString already looks like HH:MM format, return it directly
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeString)) {
        return timeString.substring(0, 5); // Return HH:MM only
      }
      
      // If we have a date, combine it with time to create a full datetime
      if (dateString) {
        // Handle DD/MM/YYYY format from API
        let isoDate = dateString;
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateString)) {
          const [day, month, year] = dateString.split('/');
          isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Create a date object from the date and time strings
        const datetime = new Date(`${isoDate}T${timeString}`);
        
        // Format the time in Vietnam timezone (GMT+7)
        return datetime.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Ho_Chi_Minh'
        });
      }
      
      // If no date provided, just return the time string as is
      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString || '—';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header với mã booking và trạng thái */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-100 uppercase tracking-wide font-medium mb-0.5">Mã đặt xe</p>
                <h3 className="font-bold text-xl text-white font-mono">{booking.code}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(booking.status)} text-sm px-3 py-1.5 font-semibold`}>
                {getStatusText(booking.status)}
              </Badge>
              {onEdit && (
                <Button
                  onClick={onEdit}
                  disabled={!canEdit}
                  title={!canEdit ? editDisabledReason : 'Chỉnh sửa đặt xe'}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Chỉnh sửa
                </Button>
              )}
              {onRebook && canRebook && (
                <Button
                  onClick={onRebook}
                  className="bg-white hover:bg-white/90 text-blue-600 border-white hover:border-blue-100"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Thuê lại
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Grid layout 3 cột với card hiện đại */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Thông tin xe */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <FaMotorcycle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Xe</h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Biển số xe</p>
                  <p className="font-bold text-base text-gray-900 dark:text-white font-mono">{booking.vehicle_id.license_plate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Model</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{booking.vehicle_id.brand} {booking.vehicle_id.model}</p>
                </div>
                {booking.vehicle_id.color && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Màu sắc</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{booking.vehicle_id.color}</p>
                  </div>
                )}
              </div>
              
              {booking.vehicle_id.images && booking.vehicle_id.images.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                  onClick={() => setImageModalOpen(true)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Xem ảnh xe
                </Button>
              )}
            </div>
          </div>

          {/* Card 2: Thời gian & Trạm */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Thời gian thuê</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Bắt đầu</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatDateOnly(booking.start_date)}</p>
                  </div>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Kết thúc</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatDateOnly(booking.end_date)}</p>
                  </div>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Giờ giao xe</p>
                    <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{formatTimeVN(booking.pickup_time, booking.start_date)}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Giờ nhận xe</p>
                    <p className="font-bold text-sm text-green-600 dark:text-green-400">{formatTimeVN(booking.return_time, booking.end_date)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Trạm thuê xe</h4>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{booking.station_id.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{booking.station_id.address}</p>
                </div>
                {booking.station_id.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-gray-700 dark:text-gray-300">{booking.station_id.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Thanh toán */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Thanh toán</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Giá/ngày:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(booking.price_per_day)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Số ngày:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{booking.total_days} ngày</span>
                </div>
                <Separator />
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-1 text-center">Tổng thanh toán</p>
                  <p className="font-bold text-2xl text-purple-600 dark:text-purple-400 text-center">
                    {formatPrice(booking.total_price)}
                  </p>
                </div>
                
                {/* Phí giữ chỗ (Holding Fee) */}
                {booking.holding_fee && (
                  <>
                    <Separator />
                    <div className="pt-2">
                      <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Phí giữ chỗ
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(booking.holding_fee.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                          <Badge className={`text-xs px-2 py-0.5 ${
                            booking.holding_fee.status === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                          }`}>
                            {booking.holding_fee.status === 'paid' ? 'Đã thanh toán' : booking.holding_fee.status}
                          </Badge>
                        </div>
                        {booking.holding_fee.payment_method && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Phương thức:</span>
                            <span className="font-medium text-gray-900 dark:text-white uppercase">{booking.holding_fee.payment_method}</span>
                          </div>
                        )}
                        {booking.holding_fee.paid_at && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(booking.holding_fee.paid_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        )}
                        {booking.holding_fee.payment_id?.transaction_id && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Mã GD:</span>
                            <span className="font-mono text-gray-700 dark:text-gray-300 text-[10px]">{booking.holding_fee.payment_id.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ghi chú và Yêu cầu đặc biệt */}
        {(booking.special_requests || booking.notes) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {booking.special_requests && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-orange-500">📝</span>
                  Yêu cầu đặc biệt
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{booking.special_requests}</p>
              </div>
            )}
            {booking.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-blue-500">📄</span>
                  Ghi chú
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Lý do hủy (nếu có) */}
        {booking.status === 'cancelled' && booking.cancellation_reason && (
          <div className="mt-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md border border-red-200 dark:border-red-800 p-4">
              <h4 className="font-semibold text-sm text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                <span>⚠️</span>
                Lý do hủy
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">{booking.cancellation_reason}</p>
              {booking.cancelled_at && (
                <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                  Hủy lúc: {booking.cancelled_at}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal ảnh xe */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {booking.vehicle_id.brand} {booking.vehicle_id.model}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {booking.vehicle_id.images && booking.vehicle_id.images.length > 0 && (
              <img
                src={booking.vehicle_id.images[0]}
                alt={`${booking.vehicle_id.brand} ${booking.vehicle_id.model}`}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-vehicle.jpg';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewBooking;
