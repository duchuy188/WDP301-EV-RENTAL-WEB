import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types/booking';

interface VideoBookingProps {
  bookings?: Booking[];
}

const VideoBooking: React.FC<VideoBookingProps> = ({ bookings = [] }) => {
  const [selected, setSelected] = useState<Booking | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Video Booking - Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between border-b py-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={b.vehicle_id.images?.[0] || '/placeholder-vehicle.jpg'}
                    alt={b.vehicle_id.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium">
                      {b.vehicle_id.name} ({b.vehicle_id.brand})
                    </div>
                    <div className="text-sm text-gray-500">{b.code} • {b.station_id.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium">{formatPrice(b.total_price)}</div>
                  <Button size="sm" onClick={() => setSelected((s) => (s?._id === b._id ? null : b))}>
                    {selected?._id === b._id ? 'Đóng' : 'Xem chi tiết'}
                  </Button>
                </div>
              </div>
            ))}

            {bookings.length === 0 && <div className="text-sm text-gray-500">Không có booking để hiển thị</div>}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đặt xe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Thông tin chính</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>Mã:</strong> {selected.code}</li>
                    <li><strong>Trạng thái:</strong> {selected.status}</li>
                    <li><strong>Xe:</strong> {selected.vehicle_id.name} ({selected.vehicle_id.brand})</li>
                    <li><strong>Biển số:</strong> {selected.vehicle_id.license_plate}</li>
                    <li><strong>Trạm:</strong> {selected.station_id.name}</li>
                    <li><strong>Thời gian:</strong> {selected.start_date} - {selected.end_date}</li>
                    <li><strong>Giờ lấy/ trả:</strong> {selected.pickup_time} / {selected.return_time}</li>
                    <li><strong>Giá:</strong> {formatPrice(selected.total_price)}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tất cả dữ liệu (interface)</h4>
                  <pre className="max-h-96 overflow-auto p-2 bg-gray-100 rounded text-xs">
                    <code>{JSON.stringify(selected, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VideoBooking;
