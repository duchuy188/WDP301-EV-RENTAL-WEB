import React from 'react';
import { Booking } from '@/types/booking';

interface ViewBookingProps {
  booking: Booking;
}

const ViewBooking: React.FC<ViewBookingProps> = ({ booking }) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold mb-2">Thông tin xe</h4>
        <ul className="text-sm space-y-1">
          <li><strong>Tên xe:</strong> {booking.vehicle_id.name}</li>
          <li><strong>Hãng:</strong> {booking.vehicle_id.brand}</li>
          <li><strong>Model:</strong> {booking.vehicle_id.model}</li>
          <li><strong>Biển số:</strong> {booking.vehicle_id.license_plate}</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Thông tin đặt xe</h4>
        <ul className="text-sm space-y-1">
          <li><strong>Mã:</strong> {booking.code}</li>
          <li><strong>Trạng thái:</strong> {booking.status}</li>
          <li><strong>Thời gian:</strong> {booking.start_date} - {booking.end_date}</li>
          <li><strong>Giờ lấy/ trả:</strong> {booking.pickup_time} / {booking.return_time}</li>
          <li><strong>Giá:</strong> {formatPrice(booking.total_price)}</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Thông tin trạm</h4>
        <ul className="text-sm space-y-1">
          <li><strong>Tên trạm:</strong> {booking.station_id.name}</li>
          <li><strong>Địa chỉ:</strong> {booking.station_id.address}</li>
          <li><strong>Số điện thoại:</strong> {booking.station_id.phone}</li>
        </ul>
      </div>
    </div>
  );
};

export default ViewBooking;
