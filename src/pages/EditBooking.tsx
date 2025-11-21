import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingSidebar from '@/components/Booking/BookingSidebar';
import StepEditBooking from '@/components/Booking/StepEditBooking';
import StepConfirm from '@/components/Booking/StepConfirm';
import { bookingAPI } from '@/api/bookingAPI';
import { stationAPI } from '@/api/stationAPI';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { Booking, BookingUpdateRequest, AvailableAlternative } from '@/types/booking';
import { VehicleListItem as VehicleListItemType, Station } from '@/types/vehicles';
import { toast } from '@/utils/toast';

const EditBooking: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const bookingFromState = location.state?.booking as Booking | undefined;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(bookingFromState || null);
  const [stations, setStations] = useState<Station[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Form data - CHỈ CÁC FIELD CẦN THIẾT
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleListItemType | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState(''); // Edit reason

  // Available alternatives when edit fails
  const [availableAlternatives, setAvailableAlternatives] = useState<AvailableAlternative[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<AvailableAlternative | null>(null);
  const [failedMessage, setFailedMessage] = useState('');

  const steps = [
    { number: 1, title: 'Chỉnh sửa', description: 'Thông tin mới' },
    { number: 2, title: 'Xác nhận', description: 'Kiểm tra & xác nhận' },
  ];

  // Fetch booking details and initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast.error('Không tìm thấy booking ID');
        navigate('/history');
        return;
      }

      try {
        setLoading(true);

        // Fetch booking if not in state
        let bookingData = booking;
        if (!bookingData) {
          const response = await bookingAPI.getBooking(id);
          bookingData = response.booking || response;
          setBooking(bookingData);
        }

        // Fetch stations and vehicles
        const [stationsResponse, vehiclesResponse] = await Promise.all([
          stationAPI.getStation({ limit: 100 }),
          vehiclesAPI.getVehicles(),
        ]);

        if (stationsResponse?.stations) {
          setStations(stationsResponse.stations as Station[]);
        }

        if (vehiclesResponse?.vehicles) {
          setVehicles(vehiclesResponse.vehicles);
        }

        // Pre-fill form from booking
        if (bookingData) {
          const parseDate = (dateString: string) => {
            if (!dateString) return '';
            try {
              if (dateString.includes('/')) {
                const [datePart] = dateString.split(' ');
                const [day, month, year] = datePart.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              return dateString.split('T')[0];
            } catch (e) {
              return '';
            }
          };

          setBookingDate(parseDate(bookingData.start_date));
          setEndDate(parseDate(bookingData.end_date));
          setSelectedStation(typeof bookingData.station_id === 'string' ? bookingData.station_id : bookingData.station_id._id);
          setSelectedModel(bookingData.vehicle_id.model);
          setSelectedColor(bookingData.vehicle_id.color || '');
          
          // Create vehicle object for sidebar display  
          const vehicleFromBooking: VehicleListItemType = {
            brand: bookingData.vehicle_id.brand,
            model: bookingData.vehicle_id.model,  
            year: bookingData.vehicle_id.year || 0,
            type: bookingData.vehicle_id.type || 'Xe máy điện',
            color: bookingData.vehicle_id.color || '',
            battery_capacity: bookingData.vehicle_id.battery_capacity || 0,
            max_range: bookingData.vehicle_id.max_range || 0,
            max_speed: bookingData.vehicle_id.max_speed || 0,
            power: bookingData.vehicle_id.power || 0,
            price_per_day: bookingData.price_per_day || 0,
            deposit_percentage: bookingData.vehicle_id.deposit_percentage || 0,
            available_quantity: 1,
            sample_image: bookingData.vehicle_id.images?.[0] || '',
            sample_vehicle_id: bookingData.vehicle_id._id,
            stations: [],
            total_available_quantity: 0,
            all_vehicle_ids: [],
            color_images: [],
          };
          setSelectedVehicle(vehicleFromBooking);
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast.error('Không thể tải thông tin booking');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Fetch vehicles filtered by selected station
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedStation) {
        setVehicles([]);
        return;
      }

      try {
        setLoadingVehicles(true);
        
        // Thử gọi API với station_id, nếu backend không hỗ trợ thì sẽ trả về tất cả
        const response = await vehiclesAPI.getVehicles({ station_id: selectedStation });

        if (response?.vehicles) {
          // Filter vehicles có station này trong array stations (phòng trường hợp backend không filter)
          const filteredVehicles = response.vehicles.filter((vehicle: any) => {
            // Nếu không có stations array, bỏ qua filter (backend đã filter rồi)
            if (!Array.isArray(vehicle.stations)) {
              return true;
            }
            // Check if selectedStation exists in vehicle.stations array
            const hasStation = vehicle.stations.some((s: any) => 
              (typeof s === 'string' ? s : s._id) === selectedStation
            );
            return hasStation;
          });
          


          // Group filtered vehicles by model and color - LƯU LẠI THÔNG TIN ẢNH
          const grouped = filteredVehicles.reduce((acc: any, vehicle: any) => {
            const key = `${vehicle.model}-${vehicle.color || 'default'}`;
            if (!acc[key]) {
              acc[key] = {
                model: vehicle.model,
                color: vehicle.color || 'Mặc định',
                brand: vehicle.brand,
                available_count: 1,
                price_per_day: vehicle.price_per_day || 0,
                // Lưu lại thông tin ảnh và các thông tin khác
                sample_image: vehicle.sample_image || vehicle.images?.[0] || '',
                battery_capacity: vehicle.battery_capacity || 0,
                max_range: vehicle.max_range || 0,
                max_speed: vehicle.max_speed || 0,
                power: vehicle.power || 0,
                deposit_percentage: vehicle.deposit_percentage || 0,
                sample_vehicle_id: vehicle.sample_vehicle_id || vehicle._id || '',
                year: vehicle.year || 0,
                type: vehicle.type || 'Xe máy điện',
              };
            } else {
              acc[key].available_count += 1;
            }
            return acc;
          }, {});

          // QUAN TRỌNG: Thêm xe gốc từ booking vào danh sách nếu chưa có
          // Để đảm bảo xe đã đặt luôn hiển thị trong dropdown (giống như trạm)
          if (booking && selectedModel && selectedColor) {
            const originalVehicleKey = `${selectedModel}-${selectedColor}`;
            if (!grouped[originalVehicleKey]) {
              grouped[originalVehicleKey] = {
                model: selectedModel,
                color: selectedColor,
                brand: booking.vehicle_id.brand,
                available_count: 0, // 0 để hiển thị là xe gốc (không còn available)
                price_per_day: booking.price_per_day || 0,
                sample_image: booking.vehicle_id.images?.[0] || '',
                battery_capacity: booking.vehicle_id.battery_capacity || 0,
                max_range: booking.vehicle_id.max_range || 0,
                max_speed: booking.vehicle_id.max_speed || 0,
                power: booking.vehicle_id.power || 0,
                deposit_percentage: booking.vehicle_id.deposit_percentage || 0,
                sample_vehicle_id: booking.vehicle_id._id,
                year: booking.vehicle_id.year || 0,
                type: booking.vehicle_id.type || 'Xe máy điện',
                isOriginalBooking: true, // Flag để biết đây là xe gốc
              };
            }
          }

          const groupedArray = Object.values(grouped);
          
          // QUAN TRỌNG: Fetch chi tiết từng xe để lấy available_colors
          // Giống như React Native code: expandedVehicles
          const vehiclesWithColors = await Promise.all(
            groupedArray.map(async (vehicle: any) => {
              try {
                if (vehicle.sample_vehicle_id) {
                  const details = await vehiclesAPI.getVehicleById(vehicle.sample_vehicle_id);
                  return {
                    ...vehicle,
                    available_colors: details.available_colors || [],
                  };
                }
              } catch (err) {
                console.error('Error loading vehicle details:', err);
              }
              return vehicle;
            })
          );
          
          setVehicles(vehiclesWithColors);
        }
      } catch (error) {
        console.error('❌ Failed to fetch vehicles:', error);
        toast.error('Không thể tải danh sách xe');
        setVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [selectedStation]);

  // Update selectedVehicle when model/color changes (CẬP NHẬT ẢNH KHI CHỌN XE MỚI)
  useEffect(() => {
    if (selectedModel && selectedColor && vehicles.length > 0) {
      // Tìm vehicle theo model
      const vehicleData = vehicles.find(v => v.model === selectedModel);
      
      if (vehicleData) {
        // Tìm màu đã chọn trong available_colors
        const colorData = vehicleData.available_colors?.find((c: any) => c.color === selectedColor);
        
        // Lấy ảnh từ colorData nếu có, nếu không dùng ảnh mặc định
        const colorImage = colorData?.sample_images?.[0] || colorData?.images?.[0] || colorData?.image || vehicleData.sample_image || '';
        const colorPrice = colorData?.price_per_day || vehicleData.price_per_day || 0;
        const colorDepositPercentage = colorData?.deposit_percentage || vehicleData.deposit_percentage || booking?.vehicle_id?.deposit_percentage || 0;
        const colorAvailableQuantity = colorData?.available_quantity || vehicleData.available_count || 1;
        
        const updatedVehicle: VehicleListItemType = {
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year || 0,
          type: vehicleData.type || 'Xe máy điện',
          color: selectedColor,
          battery_capacity: vehicleData.battery_capacity || 0,
          max_range: vehicleData.max_range || 0,
          max_speed: vehicleData.max_speed || 0,
          power: vehicleData.power || 0,
          price_per_day: colorPrice,
          deposit_percentage: colorDepositPercentage,
          available_quantity: colorAvailableQuantity,
          sample_image: colorImage,
          sample_vehicle_id: colorData?.sample_vehicle_id || vehicleData.sample_vehicle_id || '',
          stations: [],
          total_available_quantity: 0,
          all_vehicle_ids: [],
          color_images: [],
        };
        
        setSelectedVehicle(updatedVehicle);
      }
    }
  }, [selectedModel, selectedColor, vehicles, booking]);

  // Calculate price
  const calculateDays = () => {
    if (!bookingDate || !endDate) return 0;
    const start = new Date(bookingDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const numberOfDays = calculateDays();
  
  // Get price from selected alternative or selected vehicle from list
  const getPricePerDay = () => {
    if (selectedAlternative) return selectedAlternative.price_per_day;
    if (selectedVehicle) return selectedVehicle.price_per_day;
    
    // Fallback: find from vehicles list
    const vehicleOption = vehicles.find(v => v.model === selectedModel && v.color === selectedColor);
    return vehicleOption?.price_per_day || 0;
  };
  
  // Get deposit percentage from booking or selected vehicle
  const getDepositPercentage = () => {
    // First try to get from selected vehicle
    if (selectedVehicle?.deposit_percentage) return selectedVehicle.deposit_percentage;
    
    // Then try from vehicles list (when user selects a new vehicle)
    const vehicleOption = vehicles.find(v => v.model === selectedModel && v.color === selectedColor);
    if (vehicleOption?.deposit_percentage) return vehicleOption.deposit_percentage;
    
    // Finally fallback to original booking
    return booking?.vehicle_id?.deposit_percentage || 0;
  };
  
  const pricePerDay = getPricePerDay();
  const basePrice = numberOfDays * pricePerDay;
  const totalPrice = basePrice;
  const depositPercentage = getDepositPercentage();
  const depositAmount = (totalPrice * depositPercentage) / 100;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const displayVehicle = selectedVehicle;
  const displayImage = selectedVehicle?.sample_image || '/placeholder-vehicle.jpg';
  const displayStationName = stations.find(s => s._id === selectedStation)?.name || 'Chưa chọn';
  const displayBattery = selectedVehicle?.battery_capacity || '';
  const displayRange = selectedVehicle?.max_range || '';

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!bookingDate || !endDate) {
        toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
        return;
      }

      if (!selectedStation) {
        toast.error('Vui lòng chọn trạm thuê xe');
        return;
      }

      if (!selectedModel || !selectedColor) {
        toast.error('Vui lòng chọn xe (model và màu)');
        return;
      }

      if (!reason.trim()) {
        toast.error('Vui lòng nhập lý do chỉnh sửa');
        return;
      }

      // Check dates
      if (new Date(bookingDate) >= new Date(endDate)) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }

      // Check 24h rule - Kết hợp cả ngày và giờ nhận xe
      const startDate = new Date(bookingDate);
      
      // Thêm pickup_time vào startDate để tính chính xác thời gian nhận xe
      if (booking?.pickup_time) {
        const [hours, minutes] = booking.pickup_time.split(':').map(s => parseInt(s, 10));
        if (!isNaN(hours) && !isNaN(minutes)) {
          startDate.setHours(hours, minutes, 0, 0);
        } else {
          // Nếu không parse được giờ, mặc định là 9:00 sáng
          startDate.setHours(9, 0, 0, 0);
        }
      } else {
        // Nếu không có pickup_time, mặc định là 9:00 sáng
        startDate.setHours(9, 0, 0, 0);
      }
      
      const now = new Date();
      const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        const pickupTimeStr = booking?.pickup_time || '09:00';
        toast.error(
          `Phải chỉnh sửa trước thời gian nhận xe ít nhất 24 giờ. ` +
          `Thời gian nhận xe: ${bookingDate} lúc ${pickupTimeStr}. ` +
          `Vui lòng chọn ngày muộn hơn hoặc liên hệ hỗ trợ.`
        );
        return;
      }

      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmEdit = async () => {
    if (!booking) return;

    try {
      setSubmitting(true);
      setAvailableAlternatives([]);
      setSelectedAlternative(null);
      setFailedMessage('');

      const updateData: BookingUpdateRequest = {
        start_date: bookingDate,
        end_date: endDate,
        station_id: selectedStation,
        model: selectedAlternative?.model || selectedModel,
        color: selectedAlternative?.color || selectedColor,
        reason: reason,
      };

      await bookingAPI.updateBooking(booking._id, updateData);
      
      toast.success('Chỉnh sửa đặt xe thành công!');
      navigate('/profile', { state: { activeTab: 'booking-history' } });
    } catch (error: any) {
      console.error('Edit booking failed:', error);
      
      const errorData = error.response?.data;
      
      if (errorData && !errorData.success && errorData.available_alternatives && errorData.available_alternatives.length > 0) {
        setAvailableAlternatives(errorData.available_alternatives);
        setFailedMessage(errorData.message || 'Model đã chọn không còn xe available');
        toast.warning('Xe bạn chọn không còn. Vui lòng chọn xe khác bên dưới.');
        
        // Update vehicle in sidebar to show alternative if selected
        if (selectedAlternative) {
          updateVehicleFromAlternative(selectedAlternative);
        }
      } else {
        toast.error(error.response?.data?.message || 'Chỉnh sửa đặt xe thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateVehicleFromAlternative = (alt: AvailableAlternative) => {
    // Tìm ảnh và thông tin từ vehicles list nếu có
    const vehicleData = vehicles.find(v => v.model === alt.model && v.color === alt.color);
    
    // Get deposit percentage from vehicleData or fallback to booking
    const depositPercentage = vehicleData?.deposit_percentage || booking?.vehicle_id?.deposit_percentage || 0;
    
    const vehicleFromAlt: VehicleListItemType = {
      brand: alt.brand,
      model: alt.model,
      year: vehicleData?.year || 0,
      type: vehicleData?.type || 'Xe máy điện',
      color: alt.color,
      battery_capacity: vehicleData?.battery_capacity || 0,
      max_range: vehicleData?.max_range || 0,
      max_speed: vehicleData?.max_speed || 0,
      power: vehicleData?.power || 0,
      price_per_day: alt.price_per_day,
      deposit_percentage: depositPercentage,
      available_quantity: alt.available_count,
      sample_image: vehicleData?.sample_image || '',
      sample_vehicle_id: vehicleData?.sample_vehicle_id || '',
      stations: [],
      total_available_quantity: 0,
      all_vehicle_ids: [],
      color_images: [],
    };
    
    setSelectedVehicle(vehicleFromAlt);
    setSelectedModel(alt.model);
    setSelectedColor(alt.color);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Đang tải thông tin..." />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Chỉnh sửa đặt xe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mã booking: <span className="font-semibold">{booking.code}</span>
          </p>
        </motion.div>

        {/* Edit Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 shadow-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-base font-bold text-blue-900 dark:text-blue-100 mb-1">
                  Đang chỉnh sửa booking: {booking.vehicle_id.brand} {booking.vehicle_id.model}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Lưu ý:</strong> Bạn chỉ được chỉnh sửa <strong>1 lần duy nhất</strong>. 
                  Phải chỉnh sửa trước thời gian nhận xe ít nhất <strong>24 giờ</strong>.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

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
                <StepEditBooking
                  bookingDate={bookingDate}
                  setBookingDate={setBookingDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  reason={reason}
                  setReason={setReason}
                  stations={stations}
                  vehicles={vehicles}
                  loadingVehicles={loadingVehicles}
                  originalBooking={booking}
                />
              )}

              {currentStep === 2 && (
                <StepConfirm
                  selectedVehicle={selectedVehicle}
                  selectedColor={selectedColor}
                  selectedStation={selectedStation}
                  bookingDate={bookingDate}
                  endDate={endDate}
                  startTime={booking?.pickup_time || '09:00'}
                  endTime={booking?.return_time || '09:00'}
                  specialRequests={''}
                  notes={reason}
                  pricePerDay={pricePerDay}
                  totalPrice={totalPrice}
                  numberOfDays={numberOfDays}
                  depositAmount={depositAmount}
                  depositPercentage={depositPercentage}
                  stations={stations}
                  formatPrice={formatPrice}
                  isEditMode={true}
                  editReason={reason}
                  onEditReasonChange={setReason}
                  availableAlternatives={availableAlternatives}
                  selectedAlternative={selectedAlternative}
                  onSelectAlternative={(alt) => {
                    setSelectedAlternative(alt);
                    updateVehicleFromAlternative(alt);
                  }}
                  failedMessage={failedMessage}
                />
              )}
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mt-6"
            >
              <Button
                onClick={currentStep === 1 ? () => navigate('/history') : handleBack}
                variant="outline"
                className="gap-2"
                disabled={submitting}
              >
                <ChevronLeft className="h-4 w-4" />
                {currentStep === 1 ? 'Hủy' : 'Quay lại'}
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={submitting}
                >
                  Tiếp tục
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmEdit}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={submitting || !reason.trim() || (availableAlternatives.length > 0 && !selectedAlternative)}
                >
                  {submitting ? (
                    <>
                      <FaMotorcycle className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Xác nhận chỉnh sửa
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <BookingSidebar
                displayVehicle={displayVehicle}
                displayImage={displayImage}
                displayStationName={displayStationName}
                displayBattery={displayBattery}
                displayRange={displayRange}
                bookingDate={bookingDate}
                endDate={endDate}
                startTime={booking?.pickup_time || '09:00'}
                endTime={booking?.return_time || '09:00'}
                numberOfDays={numberOfDays}
                pricePerDay={pricePerDay}
                basePrice={basePrice}
                totalPrice={totalPrice}
                depositPercentage={depositPercentage}
                depositAmount={depositAmount}
                formatPrice={formatPrice}
                hideTimeAndPrice={false}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBooking;
