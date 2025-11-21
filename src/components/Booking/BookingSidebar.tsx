import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Clock, Zap, Battery, Wallet } from 'lucide-react';

type Vehicle = {
  brand?: string;
  model?: string;
  battery_capacity?: any;
  max_range?: any;
  sample_image?: string;
  price_per_day?: number;
  deposit_percentage?: number;
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
  depositPercentage?: number;
  depositAmount?: number;
  formatPrice: (p: number) => string;
  hideTimeAndPrice?: boolean; // Hide time and price sections
};

// Helper function to format time in Vietnam timezone
const formatTimeVN = (timeString?: string, dateString?: string): string => {
  if (!timeString) return '';
  
  try {
    // If we have a date, combine it with time to create a full datetime
    if (dateString) {
      // Create a date object from the date and time strings
      const datetime = new Date(`${dateString}T${timeString}`);
      
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
    return timeString || '';
  }
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
  depositPercentage,
  depositAmount,
  formatPrice,
  hideTimeAndPrice = false,
}) => {
  return (
    <Card className="shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          Tóm tắt đặt xe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {displayVehicle && (
          <>
            {/* Vehicle Info */}
            <div className="relative">
              <div className="overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md">
                <img
                  src={displayImage}
                  alt={`${displayVehicle.brand} ${displayVehicle.model}`}
                  className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-3 text-center space-y-2">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                  {displayVehicle.brand} {displayVehicle.model}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 py-2 px-3 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium">{displayStationName}</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                    <Battery className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">{displayBattery}mAh</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">{displayRange}km</span>
                  </div>
                </div>
              </div>
            </div>

            {!hideTimeAndPrice && (
              <>
                <Separator className="my-4" />

                {/* Rental Period */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Thời gian thuê
                  </h4>
                  {bookingDate ? (
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Từ:</span>
                        <span>{new Date(bookingDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {endDate && endDate !== bookingDate ? (
                        <>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4 text-red-600" />
                            <span className="font-medium">Đến:</span>
                            <span>{new Date(endDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 p-2 rounded-lg mt-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-semibold">Tổng: {numberOfDays} ngày</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 p-2 rounded-lg">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold">Thuê: {numberOfDays} ngày</span>
                        </div>
                      )}
                      {startTime && endTime && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{formatTimeVN(startTime, bookingDate)} - {formatTimeVN(endTime, endDate || bookingDate)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Chưa chọn thời gian</p>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Total Cost */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-750 p-5 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-sm">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Tổng chi phí
                  </h4>
                  <div className="text-center space-y-3">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {displayVehicle ? formatPrice(totalPrice || 0) : "0 đ"}
                      </p>
                    </div>
                    {displayVehicle && basePrice && basePrice > 0 ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 bg-white dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span>Đơn giá:</span>
                          <span className="font-semibold">{formatPrice(pricePerDay || 0)}/ngày</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Số ngày:</span>
                          <span className="font-semibold">{numberOfDays} ngày</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex items-center justify-between font-bold text-green-700 dark:text-green-400">
                          <span>Tổng cộng:</span>
                          <span>{formatPrice(totalPrice || 0)}</span>
                        </div>
                        {depositPercentage != null && depositPercentage > 0 && numberOfDays && numberOfDays >= 2 && (
                          <>
                            <Separator className="my-1" />
                            <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                              <span>Đặt cọc ({depositPercentage}%):</span>
                              <span className="font-bold">{formatPrice(depositAmount || 0)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 p-2 rounded-lg">
                        {displayVehicle ? `${formatPrice(pricePerDay || 0)}/ngày` : "Chọn xe để xem giá"}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingSidebar;
