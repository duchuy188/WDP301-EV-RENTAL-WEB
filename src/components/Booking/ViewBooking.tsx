import React from 'react';
import { Car, Calendar, Clock, CreditCard, MapPin, Phone, Hash, Package } from 'lucide-react';
import { Booking } from '@/types/booking';
import { Badge } from '@/components/ui/badge';

interface ViewBookingProps {
  booking: Booking;
}

const ViewBooking: React.FC<ViewBookingProps> = ({ booking }) => {
  // Debug: Log booking data received
  console.log('📥 ViewBooking received:', {
    pickup_time: booking.pickup_time,
    return_time: booking.return_time,
    start_date: booking.start_date,
    end_date: booking.end_date
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
    <div className="space-y-3">
      {/* Thông tin xe */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Car className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-base text-blue-900 dark:text-blue-100">Thông tin xe</h4>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className="flex items-start gap-1.5">
            <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Tên xe</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{booking.vehicle_id.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Hãng</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{booking.vehicle_id.brand}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Model</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{booking.vehicle_id.model}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Biển số</p>
              <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{booking.vehicle_id.license_plate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin đặt xe */}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-green-600 rounded-lg">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-base text-green-900 dark:text-green-100">Thông tin đặt xe</h4>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className="flex items-start gap-1.5">
            <Hash className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Mã</p>
              <p className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">{booking.code}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Package className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Trạng thái</p>
              <Badge className={`${getStatusColor(booking.status)} text-xs px-1.5 py-0.5`}>
                {getStatusText(booking.status)}
              </Badge>
            </div>
          </div>
          <div className="flex items-start gap-1.5 col-span-2">
            <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Thời gian</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.start_date} - {booking.end_date}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Giờ lấy/ trả</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTimeVN(booking.pickup_time, booking.start_date)} / {formatTimeVN(booking.return_time, booking.end_date)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Giá</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">{formatPrice(booking.total_price)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin trạm */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-purple-600 rounded-lg">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-base text-purple-900 dark:text-purple-100">Thông tin trạm</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Tên trạm</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.station_id.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Địa chỉ</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.station_id.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Phone className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Số điện thoại</p>
              <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{booking.station_id.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBooking;
