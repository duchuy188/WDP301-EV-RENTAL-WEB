import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin } from 'lucide-react';

type Vehicle = {
  brand?: string;
  model?: string;
  battery_capacity?: any;
  max_range?: any;
  sample_image?: string;
  price_per_day?: number;
};

type Props = {
  displayVehicle?: Vehicle | null;
  displayImage?: string;
  displayStationName?: string;
  displayBattery?: any;
  displayRange?: any;
  bookingDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  numberOfDays?: number;
  pricePerDay?: number;
  basePrice?: number;
  totalPrice?: number;
  formatPrice: (p: number) => string;
};

const BookingSidebar: React.FC<Props> = ({
  displayVehicle,
  displayImage,
  displayStationName,
  displayBattery,
  displayRange,
  bookingDate,
  endDate,
  startTime,
  endTime,
  numberOfDays,
  pricePerDay,
  basePrice,
  totalPrice,
  formatPrice,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tóm tắt đặt xe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayVehicle && (
          <>
            <div className="text-center">
              <img
                src={displayImage}
                alt={`${displayVehicle.brand} ${displayVehicle.model}`}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold">{displayVehicle.brand} {displayVehicle.model}</h3>
              <div className="flex items-center justify-center mt-2">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{displayStationName}</span>
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">Pin: {displayBattery}mAh | Tầm xa: {displayRange}km</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Thời gian thuê</h4>
              {bookingDate ? (
                <div className="text-sm space-y-1">
                  <p>📅 Từ: {new Date(bookingDate).toLocaleDateString('vi-VN')}</p>
                  {endDate && endDate !== bookingDate ? (
                    <>
                      <p>� Đến: {new Date(endDate).toLocaleDateString('vi-VN')}</p>
                      <p>⏱️ Tổng: {numberOfDays} ngày</p>
                    </>
                  ) : (
                    <p>⏱️ Thuê: {numberOfDays} ngày</p>
                  )}
                  {startTime && endTime && <p>�🕐 {startTime} - {endTime}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa chọn thời gian</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Tổng chi phí</h4>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{displayVehicle ? formatPrice(totalPrice || 0) : "0 đ"}</p>
                {displayVehicle && basePrice && basePrice > 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <p>{numberOfDays} ngày × {formatPrice(pricePerDay || 0)}</p>
                    <p className="text-xs">= {formatPrice(totalPrice || 0)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{displayVehicle ? `${formatPrice(pricePerDay || 0)}/ngày` : "Chọn xe để xem giá"}</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingSidebar;
