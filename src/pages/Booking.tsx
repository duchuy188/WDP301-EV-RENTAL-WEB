import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// UI inputs used inside step components
import BookingSidebar from '@/components/Booking/BookingSidebar';
import StepChooseVehicle from '@/components/Booking/StepChooseVehicle';
import StepChooseTime from '@/components/Booking/StepChooseTime';
import StepConfirm from '@/components/Booking/StepConfirm';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { bookingAPI } from '@/api/bookingAPI';
import { getKYCStatus } from '@/api/kycAPI';
import { BookingRequest } from '@/types/booking';
import { VehicleListItem as VehicleListItemType, Vehicle, Station } from '@/types/vehicles';
import { KYCStatusResponseUnion } from '@/types/kyc';
import { canRentVehicles, getKYCStatusLabel } from '@/utils/kycUtils';
import { toast } from '@/utils/toast';

const Booking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicles, setVehicles] = useState<VehicleListItemType[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleListItemType | null>(null);
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
  
  // KYC Status
  const [kycStatus, setKycStatus] = useState<KYCStatusResponseUnion | null>(null);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);

  // Track if user came from VehicleDetail page (skip step 1)
  const [cameFromVehicleDetail, setCameFromVehicleDetail] = useState(false);

  const steps = [
    { number: 1, title: 'Chọn xe', description: 'Chọn xe phù hợp' },
    { number: 2, title: 'Chọn thời gian', description: 'Thời gian đặt xe' },
    { number: 3, title: 'Xác nhận', description: 'Chi phí & thanh toán' },
  ];

  // Load vehicles from API
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const response = await vehiclesAPI.getVehicles();
        const vehiclesArr = Array.isArray(response?.vehicles) ? response.vehicles : [];
        setVehicles(vehiclesArr);

        // Check if vehicle data was passed from VehicleDetail page
  const stateData = location.state as { selectedVehicle?: Vehicle; selectedColor?: any; selectedStation?: string } | null;
        if (stateData?.selectedVehicle) {
          // Convert Vehicle type to VehicleListItem type for consistency
          const vehicleFromDetail = stateData.selectedVehicle;
          const vehicleListItem: VehicleListItemType = {
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
            sample_image: (vehicleFromDetail.images && vehicleFromDetail.images[0]) || '',
            sample_vehicle_id: vehicleFromDetail._id,
            all_vehicle_ids: [vehicleFromDetail._id],
            // Preserve the full stations array if available; otherwise fallback to single station
            stations: (vehicleFromDetail.stations && vehicleFromDetail.stations.length > 0)
              ? vehicleFromDetail.stations
              : (vehicleFromDetail.station ? [vehicleFromDetail.station] : [])
            ,
            // required list fields - provide safe defaults
            total_available_quantity: 1,
            color_images: vehicleFromDetail.color_images || []
          };
          
          setSelectedVehicle(vehicleListItem);
          setSelectedVehicleDetail(vehicleFromDetail);
          
          // Set selected color if provided, otherwise use first available color
          if (stateData.selectedColor) {
            // stateData.selectedColor might be an object or a simple string
            const sc = stateData.selectedColor as any;
            setSelectedColor(typeof sc === 'string' ? sc : (sc?.color || vehicleFromDetail.color || ''));
          } else if (Array.isArray(vehicleFromDetail.available_colors) && vehicleFromDetail.available_colors.length > 0) {
            setSelectedColor(vehicleFromDetail.available_colors[0]?.color || vehicleFromDetail.color || '');
          } else {
            setSelectedColor(vehicleFromDetail.color || '');
          }
          
          // Set default station: use station from navigation state if provided, otherwise prefer the first from stations array, else fallback to vehicle.station
          if (stateData.selectedStation) {
            setSelectedStation(stateData.selectedStation);
          } else if (Array.isArray(vehicleFromDetail.stations) && vehicleFromDetail.stations.length > 0) {
            setSelectedStation(vehicleFromDetail.stations[0]?._id || '');
          } else if (vehicleFromDetail.station) {
            setSelectedStation((vehicleFromDetail.station as any)._id || '');
          }
          
          // Skip to step 2 since vehicle is already selected
          setCurrentStep(2);
          setCameFromVehicleDetail(true);
        } else if (vehiclesArr.length > 0) {
          setSelectedVehicle(vehiclesArr[0]);
          // Load detail for the first vehicle
          await loadVehicleDetail(vehiclesArr[0].sample_vehicle_id);
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
        const kycResponse = await getKYCStatus();
        setKycStatus(kycResponse);
      } catch (error: any) {
        console.error('Error loading KYC status:', error);
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
      if (Array.isArray(vehicleDetail.available_colors) && vehicleDetail.available_colors.length > 0) {
        setSelectedColor(vehicleDetail.available_colors[0]?.color || vehicleDetail.color || '');
      } else {
        setSelectedColor(vehicleDetail.color || '');
      }
      
      // Set default station
      // If the detail returns a stations array, prefer that and also attach it to `selectedVehicle` so UI list updates
      if (Array.isArray(vehicleDetail.stations) && vehicleDetail.stations.length > 0) {
        const detailStations: Station[] = vehicleDetail.stations as Station[];
        setSelectedStation(detailStations[0]?._id || '');
        // Also update selectedVehicle to include stations if it's set
        setSelectedVehicle(prev => prev ? ({ ...prev, stations: detailStations }) : prev);
      } else if (vehicleDetail.station) {
        setSelectedStation((vehicleDetail.station as any)?._id || '');
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

  // Use utility function for consistent date formatting via import when needed

  // Display helpers for sidebar summary: prefer selectedVehicleDetail (full detail) then selectedVehicle
  const displayVehicle = selectedVehicleDetail || selectedVehicle;

  const displayImage = (() => {
    if (!displayVehicle) return '/placeholder-vehicle.jpg';

    // If we have a selectedVehicleDetail and a selectedColor, prefer color images
    try {
      if (selectedVehicleDetail && selectedColor) {
        const colorOpt = selectedVehicleDetail.available_colors?.find(c => c.color === selectedColor);
        if (colorOpt) {
          if (Array.isArray(colorOpt.images) && colorOpt.images.length > 0) return colorOpt.images[0];
          if (Array.isArray(colorOpt.sample_images) && colorOpt.sample_images.length > 0) return colorOpt.sample_images[0];
          if (colorOpt.image) return colorOpt.image;
        }
      }
    } catch (e) {
      // ignore
    }

    if (selectedVehicleDetail && Array.isArray(selectedVehicleDetail.images) && selectedVehicleDetail.images.length > 0) return selectedVehicleDetail.images[0];
    return (selectedVehicle && selectedVehicle.sample_image) || '/placeholder-vehicle.jpg';
  })();

  const displayStationName = (() => {
    if (!displayVehicle) return 'Nhiều trạm';
    const stationsList: any[] = Array.isArray((selectedVehicleDetail as any)?.stations)
      ? (selectedVehicleDetail as any).stations
      : (selectedVehicle?.stations || []);

    if (selectedStation) {
      const found = stationsList.find(s => s._id === selectedStation);
      if (found) return found.name;
    }

    return stationsList && stationsList.length > 0 ? stationsList[0].name : 'Nhiều trạm';
  })();

  const displayBattery = displayVehicle ? (displayVehicle.battery_capacity || '') : '';
  const displayRange = displayVehicle ? (displayVehicle.max_range || '') : '';

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

    // Determine the specific vehicle id to book
    // Preference order: selected color's sample_vehicle_id -> selectedVehicleDetail._id -> selectedVehicle.sample_vehicle_id
    let vehicleIdToBook: string | undefined = undefined;
    try {
      if (selectedVehicleDetail?.available_colors && selectedColor) {
        const colorOpt = selectedVehicleDetail.available_colors.find(c => c.color === selectedColor);
        if (colorOpt && colorOpt.sample_vehicle_id) vehicleIdToBook = colorOpt.sample_vehicle_id;
      }
    } catch (e) {
      // ignore
    }
    if (!vehicleIdToBook) {
      vehicleIdToBook = selectedVehicleDetail?._id || selectedVehicle?.sample_vehicle_id;
    }

    // Validation đầy đủ
    if (!bookingDate || !startTime || !endTime || !selectedVehicle || !selectedColor || !selectedStation || !vehicleIdToBook) {
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
        vehicle_id: vehicleIdToBook,
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

      // Debug: log the raw response for troubleshooting
      console.log('postBooking response:', response);

      // Defensive: ensure response has booking
      if (!response || !response.booking) {
        console.error('Unexpected booking response:', response);
        toast.error('Đặt xe thành công nhưng máy chủ trả về dữ liệu không hợp lệ. Vui lòng kiểm tra lịch sử đặt xe.');
      } else {
        toast.success(`🎉 Tạo booking thành công! Mã booking: ${response.booking.code || 'N/A'}`);

          // Navigate to the success page. Do NOT pass functions in location.state because
          // history.pushState performs a structured clone which fails for functions.
          navigate('/booking-success', {
            state: {
              bookingResponse: response,
              selectedVehicle,
            },
          });
      }
    } catch (error: any) {
      console.error('Error during postBooking:', error);
      const serverMessage = error?.response?.data?.message || error?.message;
      // If validation or server error, surface it
      toast.error(serverMessage || 'Có lỗi xảy ra khi đặt xe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Đặt xe
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Hoàn tất đặt xe trong 3 bước đơn giản
              </p>
            </div>
          </div>
        </motion.div>

        {/* KYC Status Warning */}
        {!isLoadingKYC && kycStatus && !canRentVehicles(kycStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-5 shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    Cần hoàn tất xác thực để đặt xe
                  </h3>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <p>
                      Trạng thái KYC hiện tại: <span className="font-bold">{getKYCStatusLabel(kycStatus)}</span>
                    </p>
                    <p>
                      Bạn cần hoàn tất quá trình xác thực danh tính (KYC) trước khi có thể đặt xe.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/profile?tab=verification')}
                      className="bg-yellow-600 text-white border-0 hover:bg-yellow-700 shadow-md"
                    >
                      Xác thực ngay →
                    </Button>
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center animate-pulse">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-green-900 dark:text-green-100">
                    ✓ Xác thực hoàn tất! Bạn có thể đặt xe ngay bây giờ.
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-500 shadow-sm
                      ${currentStep >= step.number 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 text-white shadow-green-200 dark:shadow-green-900/50' 
                        : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-semibold transition-colors ${currentStep >= step.number ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-8 sm:w-16 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-500
                        ${currentStep > step.number 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : 'bg-gray-300 dark:bg-gray-600'}
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              {currentStep === 1 && (
                <StepChooseVehicle
                  vehicles={vehicles}
                  isLoadingVehicles={isLoadingVehicles}
                  selectedVehicle={selectedVehicle}
                  onSelectVehicle={(v) => {
                    setSelectedVehicle(v);
                    loadVehicleDetail(v.sample_vehicle_id);
                  }}
                  loadVehicleDetail={loadVehicleDetail}
                />
              )}

              {currentStep === 2 && (
                <StepChooseTime
                  selectedVehicle={selectedVehicle}
                  selectedVehicleDetail={selectedVehicleDetail}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  bookingDate={bookingDate}
                  setBookingDate={setBookingDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  specialRequests={specialRequests}
                  setSpecialRequests={setSpecialRequests}
                  notes={notes}
                  setNotes={setNotes}
                />
              )}

              {currentStep === 3 && (
                <StepConfirm
                  selectedVehicle={selectedVehicle}
                  selectedColor={selectedColor}
                  bookingDate={bookingDate}
                  endDate={endDate}
                  startTime={startTime}
                  endTime={endTime}
                  specialRequests={specialRequests}
                  notes={notes}
                  numberOfDays={numberOfDays}
                  pricePerDay={pricePerDay}
                  totalPrice={totalPrice}
                  formatPrice={formatPrice}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {/* Back Button - Only show if not at step 1, and if came from VehicleDetail, only show at step 3 */}
                {(currentStep > 1 && (!cameFromVehicleDetail || currentStep > 2)) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // If came from VehicleDetail and at step 3, go back to step 2
                      // Otherwise go to previous step but not below step 2 if came from VehicleDetail
                      const minStep = cameFromVehicleDetail ? 2 : 1;
                      setCurrentStep(Math.max(minStep, currentStep - 1));
                    }}
                    className="border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Quay lại
                  </Button>
                )}

                {/* Next/Submit Button */}
                <div className={currentStep === 1 ? 'w-full flex justify-end' : 'ml-auto'}>
                  {currentStep < 3 ? (
                    <Button
                      onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                      disabled={
                        (currentStep === 2 && (!bookingDate || !startTime || !endTime || !selectedColor || !selectedStation)) ||
                        (currentStep === 1 && !selectedVehicle)
                      }
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Tiếp tục
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConfirmBooking}
                      disabled={isLoading || !canRentVehicles(kycStatus)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!canRentVehicles(kycStatus) ? 'Cần hoàn tất xác thực KYC để đặt xe' : ''}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : !canRentVehicles(kycStatus) ? (
                        <>
                          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Cần xác thực KYC
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
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sticky top-24">
              <BookingSidebar
                displayVehicle={displayVehicle}
                displayImage={displayImage}
                displayStationName={displayStationName}
                displayBattery={displayBattery}
                displayRange={displayRange}
                bookingDate={bookingDate}
                endDate={endDate}
                startTime={startTime}
                endTime={endTime}
                numberOfDays={numberOfDays}
                pricePerDay={pricePerDay}
                basePrice={basePrice}
                totalPrice={totalPrice}
                formatPrice={formatPrice}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;