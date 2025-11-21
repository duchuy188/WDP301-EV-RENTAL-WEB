import React from 'react';
import { Calendar, MapPin, FileText, AlertTriangle } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Station } from '@/types/station';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VehicleOption {
  model: string;
  color: string;
  brand: string;
  available_count?: number;
  price_per_day: number;
  isOriginalBooking?: boolean;
  available_colors?: Array<{
    color: string;
    available_quantity: number;
    price_per_day: number;
  }>
}

type Props = {
  bookingDate: string;
  setBookingDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  selectedStation: string;
  setSelectedStation: (s: string) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  reason: string;
  setReason: (r: string) => void;
  stations: Station[];
  vehicles: VehicleOption[];
  loadingVehicles?: boolean;
  originalBooking?: any;
};

const StepEditBooking: React.FC<Props> = ({
  bookingDate,
  setBookingDate,
  endDate,
  setEndDate,
  selectedStation,
  setSelectedStation,
  selectedModel,
  setSelectedModel,
  selectedColor,
  setSelectedColor,
  reason,
  setReason,
  stations,
  vehicles,
  loadingVehicles = false,
  originalBooking,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const calculateDays = () => {
    if (!bookingDate || !endDate) return 0;
    const start = new Date(bookingDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate deposit amount
  const calculateDeposit = () => {
    if (!bookingDate || !endDate || !selectedModel || !selectedColor) return { depositPercentage: 0, depositAmount: 0, totalPrice: 0 };
    
    const days = calculateDays();
    const selectedVeh = vehicles.find(v => v.model === selectedModel && v.color === selectedColor);
    const pricePerDay = selectedVeh?.price_per_day || 0;
    const totalPrice = days * pricePerDay;
    
    // Lấy deposit_percentage từ originalBooking nếu có
    const depositPercentage = originalBooking?.vehicle_id?.deposit_percentage || 0;
    const depositAmount = (totalPrice * depositPercentage) / 100;
    
    return { depositPercentage, depositAmount, totalPrice, pricePerDay, days };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Chỉnh sửa thông tin</h2>
      </div>

      {/* Dates Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border-2 border-green-200 dark:border-gray-700 p-6 shadow-md">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
          Thời gian thuê xe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ngày bắt đầu thuê
            </Label>
            <Input
              id="start-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="mt-2 h-11"
              required
            />
          </div>

          <div>
            <Label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ngày kết thúc thuê
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={bookingDate}
              className="mt-2 h-11"
              required
            />
          </div>
        </div>
        {bookingDate && endDate && selectedModel && selectedColor && (() => {
          const days = calculateDays();
          const { depositPercentage, depositAmount, totalPrice, pricePerDay } = calculateDeposit();
          
          if (!pricePerDay || pricePerDay <= 0) return null;
          
          return (
            <div className="mt-4 bg-white dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">Đơn giá:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(pricePerDay)}/ngày</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-900 dark:text-gray-100">Tổng cộng:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{formatPrice(totalPrice)}</span>
              </div>
              
              {depositPercentage > 0 && days >= 2 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <div className="flex items-center justify-between text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                    <span className="font-bold text-orange-700 dark:text-orange-400">Đặt cọc ({depositPercentage}%):</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{formatPrice(depositAmount)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Station Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border-2 border-blue-200 dark:border-gray-700 p-6 shadow-md">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Trạm thuê xe
        </h3>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Chọn trạm lấy xe <span className="text-red-500">*</span>
        </Label>
        <Select value={selectedStation} onValueChange={setSelectedStation}>
          <SelectTrigger className="mt-2 h-11 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <SelectValue placeholder="-- Chọn trạm --" />
          </SelectTrigger>
          <SelectContent>
            {stations.map((station) => (
              <SelectItem key={station._id} value={station._id}>
                <div className="flex flex-col">
                  <span className="font-medium">{station.name}</span>
                  <span className="text-xs text-gray-500">{station.address}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Selection */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border-2 border-purple-200 dark:border-gray-700 p-6 shadow-md">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <FaMotorcycle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Chọn xe tại trạm đã chọn
        </h3>
        {vehicles.length === 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {selectedStation ? 'Đang tải xe...' : 'Vui lòng chọn trạm trước'}
          </p>
        )}
        
        {loadingVehicles ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Đang tải danh sách xe..." />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
            <FaMotorcycle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              {selectedStation ? 'Trạm này chưa có xe' : 'Vui lòng chọn trạm trước'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Dropdown 1: Chọn Model */}
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bước 1: Chọn model xe <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedModel} 
                onValueChange={(value) => {
                  setSelectedModel(value);
                  // Reset màu khi đổi model
                  setSelectedColor('');
                }}
              >
                <SelectTrigger className="mt-2 h-11 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                  <SelectValue placeholder="-- Chọn model xe --" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    // Lấy danh sách model duy nhất
                    const uniqueModels = Array.from(new Set(vehicles.map(v => v.model)));
                    return uniqueModels.map((model) => {
                      const vehicleOfModel = vehicles.find(v => v.model === model);
                      return (
                        <SelectItem key={model} value={model}>
                          <div className="flex items-center justify-between w-full min-w-[300px]">
                            <span className="font-medium">
                              {vehicleOfModel?.brand} {model}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown 2: Chọn Màu (chỉ hiện khi đã chọn model) */}
            {selectedModel && (() => {
              // Tìm vehicle của model đã chọn
              const selectedVehicle = vehicles.find(v => v.model === selectedModel);
              const availableColors = selectedVehicle?.available_colors || [];
              
              // Nếu có available_colors từ API getVehicleById, dùng nó
              // Nếu không, fallback về cách cũ (filter vehicles)
              const colorOptions = availableColors.length > 0 
                ? availableColors 
                : vehicles.filter(v => v.model === selectedModel).map(v => ({
                    color: v.color,
                    available_quantity: v.available_count || 0,
                    price_per_day: v.price_per_day,
                  }));
              
              return (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bước 2: Chọn màu xe <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-gray-500">({colorOptions.length} màu có sẵn)</span>
                  </Label>
                  <Select 
                    value={selectedColor} 
                    onValueChange={setSelectedColor}
                  >
                    <SelectTrigger className="mt-2 h-11 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                      <SelectValue placeholder="-- Chọn màu --" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((colorOption, idx) => (
                        <SelectItem key={idx} value={colorOption.color}>
                          <div className="flex items-center justify-between w-full min-w-[300px]">
                            <span className="font-medium">
                              {colorOption.color}
                              {selectedVehicle?.isOriginalBooking && colorOption.color === selectedVehicle.color && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Xe đã đặt
                                </span>
                              )}
                              <span className="ml-2 text-xs text-gray-500">
                                (Còn {colorOption.available_quantity} xe)
                              </span>
                            </span>
                            <span className="text-green-600 font-semibold ml-4">
                              {formatPrice(colorOption.price_per_day)}/ngày
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border-2 border-amber-200 dark:border-gray-700 p-6 shadow-md">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Lý do chỉnh sửa
        </h3>
        <Label htmlFor="reason" className="text-sm text-gray-700 dark:text-gray-300">
          Vui lòng nhập lý do chỉnh sửa đặt xe <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ví dụ: Tôi có việc đột xuất ngày 15/11 nên cần đổi lịch..."
          rows={4}
          className="mt-2"
          required
        />
      </div>
    </div>
  );
};

export default StepEditBooking;

