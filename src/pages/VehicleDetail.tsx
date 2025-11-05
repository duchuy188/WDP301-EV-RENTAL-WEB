import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  
  MapPin,
  Calendar,
  Palette,
  Clock,
  Phone,
  Mail
} from 'lucide-react';
import { Zap, Hash } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
// Card component removed from VehicleDetail to use plain container for station list
import { Badge } from '@/components/ui/badge';
import VehicleImage from '@/components/VehicleImage';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { Vehicle, AvailableColor, Station } from '@/types/vehicles';
import { getVehicleTypeInVietnamese } from '@/utils/vehicleUtils';
import { useAuth } from '@/contexts/AuthContext';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [availableColors, setAvailableColors] = useState<AvailableColor[]>([]);
  const [fallbackStations, setFallbackStations] = useState<Station[]>([]);

  useEffect(() => {
    // reset selected image index when user changes selected color
    setSelectedImageIndex(0);
  }, [selectedColorIndex]);

  useEffect(() => {
    const fetchVehicle = async () => {
      // If vehicle was passed via navigation state, use it if it already contains full detail (available_colors)
      const stateVehicle = (location && (location.state as any)?.selectedVehicle) as any;
      // determine which id to fetch if needed
      const fetchId = id || (stateVehicle && stateVehicle.sample_vehicle_id) || undefined;

      if (stateVehicle && stateVehicle.available_colors) {
        setVehicle(stateVehicle as any);
        setAvailableColors(stateVehicle.available_colors || []);
        setSelectedColorIndex(0);
        setSelectedImageIndex(0);
        setLoading(false);
        return;
      }

      if (!fetchId) return;

      try {
        setLoading(true);
        const vehicleData = await vehiclesAPI.getVehicleById(fetchId);

        // Always set the vehicle data first
        setVehicle(vehicleData);
        
        // Set available colors - use empty array if not present
        if (vehicleData && Array.isArray(vehicleData.available_colors)) {
          setAvailableColors(vehicleData.available_colors);
        } else {
          setAvailableColors([]);
        }

        setError(null);

        // If vehicle detail doesn't include stations, try to fetch stations from the vehicles list endpoint
        try {
          const hasStations = (
            (vehicleData as any).stations && (vehicleData as any).stations.length > 0
          ) || ((vehicleData as any).station && Object.keys((vehicleData as any).station || {}).length > 0);

          if (!hasStations) {
            const listResp = await vehiclesAPI.getVehicles();
            const found = (listResp.vehicles || []).find((v: any) => {
              if (v.sample_vehicle_id && v.sample_vehicle_id === (vehicleData as any).sample_vehicle_id) return true;
              if (v.sample_vehicle_id && v.sample_vehicle_id === (vehicleData as any)._id) return true;
              if (Array.isArray(v.all_vehicle_ids) && (vehicleData as any)._id && v.all_vehicle_ids.includes((vehicleData as any)._id)) return true;
              return false;
            });

            if (found && Array.isArray(found.stations) && found.stations.length > 0) {
              setFallbackStations(found.stations);
            }
          }
        } catch (e) {
        }
      } catch (err) {
        setError('Không thể tải thông tin xe. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id, location]);

  // Normalize station list from multiple possible shapes returned by backend
  const stationList: Station[] = useMemo(() => {
    if (!vehicle) return [];

    // If stations is an array of station objects
    if (Array.isArray((vehicle as any).stations) && (vehicle as any).stations.length > 0) {
      const first = (vehicle as any).stations[0];
      // If array contains station objects ({ _id, name, address })
      if (first && typeof first === 'object' && (first._id || first.name)) {
        return (vehicle as any).stations as Station[];
      }

      // If array contains wrappers like { station: { ... } }
      if (first && typeof first === 'object' && first.station) {
        return (vehicle as any).stations.map((s: any) => s.station).filter(Boolean) as Station[];
      }

      // If array contains plain ids or unexpected shape, return empty
      return [];
    }

    // Single station object fallback
    if ((vehicle as any).station && typeof (vehicle as any).station === 'object') {
      return [(vehicle as any).station as Station];
    }

    // Some APIs may use 'branch' or 'branches'
    if ((vehicle as any).branch && typeof (vehicle as any).branch === 'object') {
      return [(vehicle as any).branch as Station];
    }

    if (Array.isArray((vehicle as any).branches) && (vehicle as any).branches.length > 0) {
      return (vehicle as any).branches as Station[];
    }

    // If no station data on vehicle, use fallbackStations collected from vehicles list
    if (fallbackStations && fallbackStations.length > 0) return fallbackStations;

    return [];
  }, [vehicle, fallbackStations]);

  

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };


  const handleBookNow = () => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!isAuthenticated) {
      // Chuyển hướng đến trang đăng nhập và lưu lại trang hiện tại
      navigate('/login', {
        state: {
          from: location.pathname,
          message: 'Vui lòng đăng nhập để đặt xe'
        }
      });
      return;
    }

    // Prepare a vehicle object enriched with the normalized station list and the current available colors
    const vehicleToPass = vehicle ? {
      ...vehicle,
      available_colors: colorSource,
      // ensure stations is an array so Booking can read stations directly
      stations: stationList && stationList.length > 0 ? stationList : (vehicle?.stations || (vehicle?.station ? [vehicle.station] : []))
    } : vehicle;

    const colorToPass = colorSource && colorSource.length > selectedColorIndex ? colorSource[selectedColorIndex] : null;

    // Navigate to booking page with vehicle data and the selected color
    navigate('/booking', {
      state: {
        selectedVehicle: vehicleToPass,
        selectedColor: colorToPass,
        // also pass a default selectedStation id so the booking form can pre-fill it
        selectedStation: (vehicleToPass?.stations && vehicleToPass.stations[0]?._id) || (vehicleToPass?.station && (vehicleToPass.station as any)?._id) || undefined
      }
    });
  };

  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Đang tải thông tin xe..." />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={() => navigate('/find-car')}>
            Quay lại danh sách xe
          </Button>
        </div>
      </div>
    );
  }

  // Determine color source: prefer availableColors state, fallback to vehicle.available_colors
  const colorSource: AvailableColor[] = (availableColors && availableColors.length > 0) 
    ? availableColors 
    : (vehicle.available_colors && vehicle.available_colors.length > 0 ? vehicle.available_colors : []);
  
  const selectedColor = colorSource && colorSource.length > selectedColorIndex ? colorSource[selectedColorIndex] : null;

  const colorImages: string[] = [];
  if (selectedColor) {
    if (selectedColor.images && selectedColor.images.length > 0) colorImages.push(...selectedColor.images);
    else if (selectedColor.sample_images && selectedColor.sample_images.length > 0) colorImages.push(...selectedColor.sample_images);
    else if (selectedColor.image) colorImages.push(selectedColor.image);
  }

  const thumbnails: string[] = [];
  colorImages.forEach(img => { if (!thumbnails.includes(img)) thumbnails.push(img); });
  (vehicle.images || []).forEach(img => { if (!thumbnails.includes(img)) thumbnails.push(img); });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="relative">
              <VehicleImage
                src={thumbnails[selectedImageIndex] ?? thumbnails[0] ?? undefined}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-96 rounded-lg shadow-lg"
              />
              <div className="absolute top-4 left-4">
                <Badge variant={vehicle.type === 'car' ? 'default' : 'secondary'}>
                  {getVehicleTypeInVietnamese(vehicle.type)}
                </Badge>
              </div>
            </div>
            
           
            {/* Color Selection Gallery */}
            {colorSource && colorSource.length > 0 ? (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Chọn màu xe ({colorSource.length} màu có sẵn):
                </h4>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {colorSource.map((c, idx) => {
                    const img = c.images?.[0] ?? c.sample_images?.[0] ?? c.image ?? undefined;
                    return (
                      <button
                        key={c.sample_vehicle_id ?? idx}
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedColorIndex === idx ? 'border-green-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        title={c.color || `Màu ${idx + 1}`}
                      >
                        {img ? (
                          <VehicleImage src={img} alt={c.color || `Màu ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-sm">
                            {c.color || '-'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Không có thông tin màu xe từ API. Vui lòng kiểm tra lại dữ liệu.
                </p>
              </div>
            )}
          </motion.div>

          {/* Vehicle Details (reordered): Specs -> Price -> Compact Name -> Booking */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Right column sections with explicit separators */}
            <div className="bg-transparent rounded-md overflow-hidden">
              {/* 1) Specifications block */}
              <div className="py-4 px-2">
                <h3 className="text-lg font-semibold mb-4">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <Zap className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-medium">
                      Tốc độ tối đa
                    </div>
                    <div className="font-semibold text-sm">{vehicle.max_speed || 48} km/h</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <MapPin className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-medium">
                      Km mỗi lần sạc
                    </div>
                    <div className="font-semibold text-sm">{vehicle.max_range} Km</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <Hash className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-medium">
                      Công suất
                    </div>
                    <div className="font-semibold text-sm">{vehicle.power || 1200}W</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <Clock className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-medium">
                      Tình trạng
                    </div>
                    <div className="font-semibold text-sm">Có sẵn để thuê</div>
                  </div>
                </div>
              </div>
              <hr className="my-4 border-t border-gray-200 dark:border-gray-700" />
              {/* 2) Price block */}
              <div className="py-4 px-2">
                <div className="text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center space-x-3">
                  <div>Giá Thuê</div>
                  <div className="text-lg text-red-600 font-bold">: {formatPrice(selectedColor?.price_per_day || vehicle.price_per_day)}<span className="text-sm text-gray-600 dark:text-gray-300">/ngày</span></div>
                </div>
                <div className="mt-2 text-sm text-gray-500">Đặt cọc: {selectedColor?.deposit_percentage ?? vehicle.deposit_percentage ?? 0}%</div>
              </div>
              <hr className="my-4 border-t border-gray-200 dark:border-gray-700" />
              {/* 3) Model / meta block */}
              <div className="py-4 px-2">
                <h1 className="text-xl md:text-2xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate max-w-full">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 text-sm mb-1 mt-1 md:mt-0">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">{vehicle.year}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span className="text-sm">{selectedColor?.color || vehicle.color}</span>
                  </div>
                </div>
              </div>
              <hr className="my-4 border-t border-gray-200 dark:border-gray-700" />
              {/* 4) Booking button block */}
              <div className="py-4 px-2">
                <Button
                  onClick={handleBookNow}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-md inline-flex items-center space-x-2 shadow-md"
                >
                  <Mail className="h-4 w-4" />
                  <span>Đặt Thuê Xe</span>
                </Button>
              </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Station Information - render only when stationList has data */}
        {stationList && stationList.length > 0 && (
          <>
            <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />
            <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            id="vehicle-stations"
            className="mt-12"
          >
            <div className="bg-transparent p-6 shadow-none rounded-none border-0">
              <h3 className="text-xl font-semibold mb-4">Thông tin trạm thuê xe</h3>
              <div className="grid grid-cols-1 gap-6">
                {stationList.map((station, idx) => (
                  <div key={(station as any)._id || idx} className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        {/* Make station name clickable and navigate to station detail page */}
                        <h4 className="font-semibold cursor-pointer text-blue-600 hover:underline" onClick={() => navigate(`/station/${(station as any)._id}`)}>{station?.name }</h4>
                        <p className="text-gray-600 dark:text-gray-300">{station?.address}</p>
                      </div>
                    </div>

                    {station?.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-green-600" />
                        <span>{station.phone}</span>
                      </div>
                    )}

                    {station?.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-green-600" />
                        <span>{station.email}</span>
                      </div>
                    )}

                    {(station?.opening_time || station?.closing_time) && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-semibold">Giờ hoạt động</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            {station.opening_time || '—'} - {station.closing_time || '—'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleDetail;