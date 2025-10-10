import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  Calendar, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Battery,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatDateVN } from '@/lib/utils';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { bookingAPI } from '@/api/bookingAPI';
import { getKYCStatus } from '@/api/kycAPI';
import { BookingRequest, BookingResponse } from '@/types/booking';
import { VehicleListItem, Vehicle } from '@/types/vehicles';
import { KYCStatusResponseUnion } from '@/types/kyc';
import { canRentVehicles, getKYCStatusLabel } from '@/utils/kycUtils';
import { toast } from '@/utils/toast';

const Booking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleListItem | null>(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<Vehicle | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null);
  
  // KYC Status
  const [kycStatus, setKycStatus] = useState<KYCStatusResponseUnion | null>(null);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);
  const [kycError, setKycError] = useState<string | null>(null);

  const steps = [
    { number: 1, title: 'Chọn xe', description: 'Chọn xe phù hợp' },
    { number: 2, title: 'Chọn thời gian', description: 'Thời gian thuê' },
    { number: 3, title: 'Xác nhận', description: 'Chi phí & thanh toán' },
  ];

  // Load vehicles from API
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const response = await vehiclesAPI.getVehicles();
        setVehicles(response.vehicles);
        
        // Check if vehicle data was passed from VehicleDetail page
        const stateData = location.state as { selectedVehicle?: Vehicle; selectedColor?: any } | null;
        if (stateData?.selectedVehicle) {
          // Convert Vehicle type to VehicleListItem type for consistency
          const vehicleFromDetail = stateData.selectedVehicle;
          const vehicleListItem: VehicleListItem = {
            brand: vehicleFromDetail.brand,
            model: vehicleFromDetail.model,
            year: vehicleFromDetail.year,
            type: vehicleFromDetail.type,
            color: vehicleFromDetail.color,
            battery_capacity: vehicleFromDetail.battery_capacity,
            max_range: vehicleFromDetail.max_range,
            max_speed: vehicleFromDetail.max_speed,
            power: vehicleFromDetail.power,
            price_per_day: vehicleFromDetail.price_per_day,
            deposit_percentage: vehicleFromDetail.deposit_percentage,
            available_quantity: 1, // Default since it's a specific vehicle
            sample_image: vehicleFromDetail.images[0] || '',
            sample_vehicle_id: vehicleFromDetail._id,
            all_vehicle_ids: [vehicleFromDetail._id],
            stations: [vehicleFromDetail.station]
          };
          
          setSelectedVehicle(vehicleListItem);
          setSelectedVehicleDetail(vehicleFromDetail);
          
          // Set selected color if provided, otherwise use first available color
          if (stateData.selectedColor) {
            setSelectedColor(stateData.selectedColor.color);
          } else if (vehicleFromDetail.available_colors && vehicleFromDetail.available_colors.length > 0) {
            setSelectedColor(vehicleFromDetail.available_colors[0].color);
          } else {
            setSelectedColor(vehicleFromDetail.color);
          }
          
          // Set default station
          if (vehicleFromDetail.station) {
            setSelectedStation(vehicleFromDetail.station._id);
          }
          
          // Skip to step 2 since vehicle is already selected
          setCurrentStep(2);
        } else if (response.vehicles.length > 0) {
          setSelectedVehicle(response.vehicles[0]);
          // Load detail for the first vehicle
          await loadVehicleDetail(response.vehicles[0].sample_vehicle_id);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
        toast.error("Không thể tải danh sách xe");
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, [toast, location.state]);

  // Load KYC status to check if user can book
  useEffect(() => {
    const loadKYCStatus = async () => {
      try {
        setIsLoadingKYC(true);
        setKycError(null);
        const kycResponse = await getKYCStatus();
        setKycStatus(kycResponse);
      } catch (error: any) {
        console.error('Error loading KYC status:', error);
        setKycError('Không thể tải trạng thái xác thực');
        toast.error("Không thể kiểm tra trạng thái xác thực");
      } finally {
        setIsLoadingKYC(false);
      }
    };

    loadKYCStatus();
  }, []);

  // Load vehicle detail when a vehicle is selected
  const loadVehicleDetail = async (vehicleId: string) => {
    try {
      const vehicleDetail = await vehiclesAPI.getVehicleById(vehicleId);
      setSelectedVehicleDetail(vehicleDetail);
      
      // Set default color to the first available color
      if (vehicleDetail.available_colors && vehicleDetail.available_colors.length > 0) {
        setSelectedColor(vehicleDetail.available_colors[0].color);
      } else {
        setSelectedColor(vehicleDetail.color);
      }
      
      // Set default station
      if (vehicleDetail.station) {
        setSelectedStation(vehicleDetail.station._id);
      }
    } catch (error) {
      console.error('Error loading vehicle detail:', error);
      toast.error("Không thể tải chi tiết xe");
    }
  };

  // Tính số ngày thuê
  const calculateDays = () => {
    if (!bookingDate || !endDate) {
      return 1; // Mặc định 1 ngày nếu chưa chọn ngày kết thúc
    }
    
    const start = new Date(bookingDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 0 ? 1 : diffDays; // Tối thiểu 1 ngày
  };

  const calculatePrice = () => {
    if (!selectedVehicle) return 0;
    
    const numberOfDays = calculateDays();
    const pricePerDay = getPricePerDay();
    return numberOfDays * pricePerDay;
  };

  const numberOfDays = calculateDays();
  
  // Lấy giá theo màu đã chọn
  const getPricePerDay = () => {
    if (!selectedVehicle) return 0;
    
    // Get price from selected color if available, otherwise use default vehicle price
    let pricePerDay = selectedVehicle.price_per_day;
    if (selectedVehicleDetail?.available_colors && selectedColor) {
      const selectedColorOption = selectedVehicleDetail.available_colors.find(
        color => color.color === selectedColor
      );
      if (selectedColorOption) {
        pricePerDay = selectedColorOption.price_per_day;
      }
    }
    
    return pricePerDay;
  };
  
  const pricePerDay = getPricePerDay();

  const basePrice = calculatePrice();
  const totalPrice = basePrice; // Chỉ tính giá thuê xe, không có phí phụ

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Use utility function for consistent date formatting
  const formatDateSafe = (dateString: string) => {
    try {
      if (!dateString) return 'Chưa có ngày';
      
      // Log để debug
      console.log('Formatting date:', dateString, 'type:', typeof dateString);
      
      const result = formatDateVN(dateString);
      console.log('Formatted result:', result);
      return result;
      
    } catch (error) {
      console.error('Error formatting date:', error, 'for date:', dateString);
      return `Lỗi parse ngày (${dateString})`;
    }
  };

  const handleConfirmBooking = async () => {
    // Kiểm tra KYC status trước khi đặt xe
    if (!canRentVehicles(kycStatus)) {
      const statusLabel = getKYCStatusLabel(kycStatus);
      toast.error(`Không thể đặt xe. Trạng thái KYC: ${statusLabel}. Vui lòng hoàn tất xác thực trước khi đặt xe.`);
      
      // Chuyển hướng đến trang profile để hoàn tất KYC
      setTimeout(() => {
        navigate('/profile?tab=verification');
      }, 2000);
      return;
    }

    // Validation đầy đủ
    if (!bookingDate || !startTime || !endTime || !selectedVehicle || !selectedColor || !selectedStation) {
      toast.error("Vui lòng điền đầy đủ thông tin (ngày, giờ, xe, màu, trạm)");
      return;
    }

    // Kiểm tra thời gian bắt đầu phải sau thời gian hiện tại
    const currentDateTime = new Date();
    const selectedDateTime = new Date(`${bookingDate}T${startTime}`);
    
    if (selectedDateTime <= currentDateTime) {
      toast.error("Thời gian bắt đầu phải sau thời điểm hiện tại");
      return;
    }

    setIsLoading(true);
    
    try {
      // Tạo booking data từ form (KHÔNG hardcode)
      const bookingData: BookingRequest = {
        brand: selectedVehicle.brand, // VD: "VinFast"
        model: selectedVehicle.model, // VD: "Evo 200"
        color: selectedColor, // Màu được chọn từ dropdown
        station_id: selectedStation, // Trạm được chọn từ dropdown
        start_date: bookingDate, // Ngày bắt đầu từ form
        end_date: endDate || bookingDate, // Ngày kết thúc từ form hoặc = ngày bắt đầu
        pickup_time: startTime, // Giờ nhận xe từ form
        return_time: endTime, // Giờ trả xe từ form
        special_requests: specialRequests || "", // Yêu cầu đặc biệt từ form
        notes: notes || "", // Ghi chú từ form
      };


      const response = await bookingAPI.postBooking(bookingData);
      
      
      setBookingResponse(response);
      setShowSuccess(true);
      toast.success(`🎉 Tạo booking thành công! Mã booking: ${response.booking.code || 'N/A'}`);

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đặt xe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Đặt xe
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Hoàn tất đặt xe trong 3 bước đơn giản
          </p>
        </motion.div>

        {/* KYC Status Warning */}
        {!isLoadingKYC && kycStatus && !canRentVehicles(kycStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Cần hoàn tất xác thực để đặt xe
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Trạng thái KYC hiện tại: <span className="font-semibold">{getKYCStatusLabel(kycStatus)}</span>
                    </p>
                    <p className="mt-1">
                      Bạn cần hoàn tất quá trình xác thực danh tính (KYC) trước khi có thể đặt xe.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/profile?tab=verification')}
                        className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                      >
                        Xác thực ngay
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* KYC Approved Success Message */}
        {!isLoadingKYC && kycStatus && canRentVehicles(kycStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                     Xác thực hoàn tất! Bạn có thể đặt xe ngay bây giờ.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                      ${currentStep >= step.number 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-gray-300 text-gray-300'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors duration-300
                        ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Chọn xe</h2>
                  
                  {isLoadingVehicles ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Đang tải danh sách xe...</span>
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có xe nào khả dụng</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicles.map((vehicle) => (
                        <Card
                          key={vehicle.sample_vehicle_id}
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            selectedVehicle?.sample_vehicle_id === vehicle.sample_vehicle_id 
                              ? 'ring-2 ring-green-600 shadow-md' 
                              : ''
                          }`}
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            loadVehicleDetail(vehicle.sample_vehicle_id);
                          }}
                        >
                          <div className="relative">
                            <img
                              src={vehicle.sample_image || '/placeholder-vehicle.jpg'}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-full h-32 object-cover rounded-t-lg"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                              <div className="flex items-center text-green-600 text-sm">
                                <Battery className="h-3 w-3 mr-1" />
                                {vehicle.battery_capacity}mAh
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{vehicle.brand} {vehicle.model}</h3>
                            <div className="text-gray-600 dark:text-gray-300 mb-2">
                              <p className="text-sm">Năm: {vehicle.year}</p>
                              <p className="text-sm">Loại: {vehicle.type}</p>
                              <p className="text-sm">Màu: {vehicle.color}</p>
                              <p className="text-sm">Tầm xa: {vehicle.max_range}km</p>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {vehicle.stations.length > 0 
                                  ? vehicle.stations[0].name 
                                  : 'Nhiều trạm'
                                }
                              </span>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                              {formatPrice(vehicle.price_per_day)}/ngày
                            </p>
                            <p className="text-sm text-gray-500">
                              Còn lại: {vehicle.available_quantity} xe
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Chọn thời gian</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="date">Ngày bắt đầu</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="date"
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="pl-10"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Ngày kết thúc</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10"
                            min={bookingDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="colorSelect">Chọn màu xe</Label>
                        <Select value={selectedColor} onValueChange={setSelectedColor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn màu xe" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedVehicleDetail?.available_colors && selectedVehicleDetail.available_colors.length > 0 ? (
                              selectedVehicleDetail.available_colors.map((colorOption) => (
                                <SelectItem key={colorOption.color} value={colorOption.color}>
                                  {colorOption.color} ({colorOption.available_quantity} xe)
                                </SelectItem>
                              ))
                            ) : selectedVehicle ? (
                              <SelectItem value={selectedVehicle.color}>
                                {selectedVehicle.color}
                              </SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stationSelect">Chọn trạm</Label>
                        <Select value={selectedStation} onValueChange={setSelectedStation}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạm nhận xe" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedVehicleDetail?.station ? (
                              <SelectItem value={selectedVehicleDetail.station._id}>
                                {selectedVehicleDetail.station.name} - {selectedVehicleDetail.station.address}
                              </SelectItem>
                            ) : selectedVehicle?.stations.map((station) => (
                              <SelectItem key={station._id} value={station._id}>
                                {station.name} - {station.address}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Giờ nhận xe</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="startTime"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            min={bookingDate === new Date().toISOString().split('T')[0] ? 
                              new Date().toTimeString().slice(0, 5) : undefined}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">Giờ trả xe</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="endTime"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">Yêu cầu đặc biệt</Label>
                      <Textarea
                        id="specialRequests"
                        placeholder="Nhập yêu cầu đặc biệt (nếu có)..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú</Label>
                      <Textarea
                        id="notes"
                        placeholder="Nhập ghi chú thêm (nếu có)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {bookingDate && startTime && endTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                        Thông tin thuê xe
                      </h3>
                      <p>Ngày bắt đầu: {new Date(bookingDate).toLocaleDateString('vi-VN')}</p>
                      {endDate && <p>Ngày kết thúc: {new Date(endDate).toLocaleDateString('vi-VN')}</p>}
                      <p>Giờ nhận xe: {startTime}</p>
                      <p>Giờ trả xe: {endTime}</p>
                      <p>Tổng thời gian: {Math.ceil(Math.abs(new Date(`2025-01-01T${endTime}:00`).getTime() - new Date(`2025-01-01T${startTime}:00`).getTime()) / (1000 * 60 * 60))} giờ</p>
                    </motion.div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Xác nhận & Thanh toán</h2>
                  <div className="space-y-6">
                    {/* Booking Summary */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Thông tin đặt xe</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Xe:</span>
                          <span>{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Chưa chọn'}</span>
                        </div>
                        {selectedColor && (
                          <div className="flex justify-between">
                            <span>Màu xe:</span>
                            <span>{selectedColor}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Ngày bắt đầu:</span>
                          <span>{new Date(bookingDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {endDate && (
                          <div className="flex justify-between">
                            <span>Ngày kết thúc:</span>
                            <span>{new Date(endDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Giờ nhận xe:</span>
                          <span>{startTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giờ trả xe:</span>
                          <span>{endTime}</span>
                        </div>
                        {specialRequests && (
                          <div className="flex justify-between">
                            <span>Yêu cầu đặc biệt:</span>
                            <span className="text-right max-w-[200px]">{specialRequests}</span>
                          </div>
                        )}
                        {notes && (
                          <div className="flex justify-between">
                            <span>Ghi chú:</span>
                            <span className="text-right max-w-[200px]">{notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Chi tiết chi phí</h3>
                      <div className="space-y-2 text-sm">
                        {selectedVehicle ? (
                          <>
                            <div className="flex justify-between">
                              <span>Số ngày thuê:</span>
                              <span>{numberOfDays} ngày</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Giá mỗi ngày:</span>
                              <span>{formatPrice(pricePerDay)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tính toán:</span>
                              <span>{numberOfDays} × {formatPrice(pricePerDay)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-base">
                              <span>Tổng cộng:</span>
                              <span className="text-green-600">{formatPrice(totalPrice)}</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-500">Chọn xe để xem chi phí</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>

                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    disabled={
                      (currentStep === 2 && (!bookingDate || !startTime || !endTime || !selectedColor || !selectedStation)) ||
                      (currentStep === 1 && !selectedVehicle)
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Tiếp tục
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isLoading || !canRentVehicles(kycStatus)}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canRentVehicles(kycStatus) ? 'Cần hoàn tất xác thực KYC để đặt xe' : ''}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : !canRentVehicles(kycStatus) ? (
                      <>
                        🔒 Cần xác thực KYC
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Tạo booking
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tóm tắt đặt xe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedVehicle && (
                    <>
                      <div className="text-center">
                        <img
                          src={selectedVehicle.sample_image || '/placeholder-vehicle.jpg'}
                          alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h3 className="font-semibold">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                        <div className="flex items-center justify-center mt-2">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {selectedVehicle.stations.length > 0 ? selectedVehicle.stations[0].name : 'Nhiều trạm'}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Pin: {selectedVehicle.battery_capacity}mAh | Tầm xa: {selectedVehicle.max_range}km
                          </div>
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
                            {startTime && endTime && (
                              <p>�🕐 {startTime} - {endTime}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Chưa chọn thời gian</p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">Tổng chi phí</h4>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedVehicle ? formatPrice(totalPrice) : "0 đ"}
                          </p>
                          {selectedVehicle && basePrice > 0 ? (
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <p>{numberOfDays} ngày × {formatPrice(pricePerDay)}</p>
                              <p className="text-xs">= {formatPrice(totalPrice)}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              {selectedVehicle ? `${formatPrice(pricePerDay)}/ngày` : "Chọn xe để xem giá"}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-lg w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Đặt xe thành công!
              </h3>
              
              {bookingResponse && (
                <div className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-lg mb-3">Thông tin đặt xe</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mã đặt xe:</span>
                      <span className="font-semibold text-green-600">{bookingResponse.booking.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Xe:</span>
                      <span>{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngày bắt đầu:</span>
                      <span>
                        {(() => {
                          const apiDate = formatDateSafe(bookingResponse.booking.start_date);
                          if (apiDate.includes('không hợp lệ') && bookingDate) {
                            return new Date(bookingDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            });
                          }
                          return apiDate;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngày kết thúc:</span>
                      <span>
                        {(() => {
                          const apiDate = formatDateSafe(bookingResponse.booking.end_date);
                          if (apiDate.includes('không hợp lệ') && (endDate || bookingDate)) {
                            return new Date(endDate || bookingDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            });
                          }
                          return apiDate;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giờ nhận:</span>
                      <span>{bookingResponse.booking.pickup_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giờ trả:</span>
                      <span>{bookingResponse.booking.return_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng tiền:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(bookingResponse.booking.final_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className="capitalize">{bookingResponse.booking.status}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Chúng tôi đã gửi thông tin chi tiết đến email của bạn
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setShowSuccess(false);
                    setBookingResponse(null);
                    // Reset form
                    setCurrentStep(1);
                    setBookingDate('');
                    setStartTime('');
                    setEndTime('');
                    setEndDate('');
                    setSpecialRequests('');
                    setNotes('');
                    setSelectedVehicle(null);
                    setSelectedColor('');
                    setSelectedStation('');
                  }}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Đặt xe khác
                </Button>
                <Button 
                  onClick={() => {
                    navigate('/profile', { state: { activeTab: 'booking-history' } });
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Xem lịch sử đặt xe
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Booking;