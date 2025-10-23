import React from 'react';
import { Car, Calendar, Clock, CreditCard, MapPin, Phone, Hash, Package } from 'lucide-react';
import { Booking } from '@/types/booking';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ViewBookingProps {
  booking: Booking;
}

const ViewBooking: React.FC<ViewBookingProps> = ({ booking }) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
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
    <div className="space-y-6">
      {/* Thông tin xe */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Car className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100">Thông tin xe</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tên xe</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.vehicle_id.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Car className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Hãng</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.vehicle_id.brand}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Model</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.vehicle_id.model}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Biển số</p>
              <p className="font-mono font-bold text-gray-900 dark:text-white">{booking.vehicle_id.license_plate}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Thông tin đặt xe */}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-semibold text-lg text-green-900 dark:text-green-100">Thông tin đặt xe</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mã</p>
              <p className="font-mono font-medium text-gray-900 dark:text-white">{booking.code}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Trạng thái</p>
              <Badge className={`${getStatusColor(booking.status)} mt-1`}>
                {getStatusText(booking.status)}
              </Badge>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Thời gian</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.start_date} - {booking.end_date}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Giờ lấy/ trả</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.pickup_time} / {booking.return_time}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Giá</p>
              <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatPrice(booking.total_price)}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Thông tin trạm */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-semibold text-lg text-purple-900 dark:text-purple-100">Thông tin trạm</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tên trạm</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.station_id.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Địa chỉ</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.station_id.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Số điện thoại</p>
              <p className="font-mono font-medium text-gray-900 dark:text-white">{booking.station_id.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBooking;
