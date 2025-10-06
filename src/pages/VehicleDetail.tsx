import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Battery,
  MapPin,
  Calendar,
  Palette,
  Clock,
  Phone,
  Mail,
  Star,
  Heart,
  Share2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VehicleImage from '@/components/VehicleImage';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { Vehicle } from '@/types/vehicles';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const vehicleData = await vehiclesAPI.getVehicleById(id);
        setVehicle(vehicleData);
        setError(null);
      } catch (err) {
        setError('Không thể tải thông tin xe. Vui lòng thử lại sau.');
        console.error('Error fetching vehicle:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getBatteryPercentage = (capacity: number, maxCapacity: number = 5.0) => {
    return Math.round((capacity / maxCapacity) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600 dark:text-gray-300">Đang tải thông tin xe...</p>
        </div>
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

  const batteryPercentage = getBatteryPercentage(vehicle.battery_capacity);
  const selectedColor = vehicle.available_colors && vehicle.available_colors.length > selectedColorIndex 
    ? vehicle.available_colors[selectedColorIndex] 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/find-car')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                src={vehicle.images && vehicle.images.length > selectedImageIndex ? vehicle.images[selectedImageIndex] : undefined}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-96 rounded-lg shadow-lg"
              />
              <div className="absolute top-4 left-4">
                <Badge variant={vehicle.type === 'car' ? 'default' : 'secondary'}>
                  {vehicle.type === 'car' ? 'Ô tô điện' : vehicle.type === 'scooter' ? 'Xe tay ga' : vehicle.type}
                </Badge>
              </div>
            </div>
            
            {/* Thumbnail Images */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {vehicle.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-green-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <VehicleImage
                      src={image}
                      alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                      className="w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Vehicle Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{vehicle.year}</span>
                </div>
                <div className="flex items-center">
                  <Palette className="h-4 w-4 mr-1" />
                  <span>{selectedColor?.color || vehicle.color}</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {formatPrice(selectedColor?.price_per_day || vehicle.price_per_day)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">/ ngày</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Đặt cọc: {selectedColor?.deposit_percentage || vehicle.deposit_percentage}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Color Selection */}
            {vehicle.available_colors && vehicle.available_colors.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Chọn màu sắc, khóa cá tính</h3>
                  <div className="space-y-3">
                    {vehicle.available_colors.map((colorOption, index) => (
                      <div
                        key={colorOption.sample_vehicle_id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedColorIndex === index
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedColorIndex(index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: colorOption.color.toLowerCase() }}
                          />
                          <span className="font-medium">{colorOption.color}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatPrice(colorOption.price_per_day)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Còn {colorOption.available_quantity} xe
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                    Klara S thêm nhiều màu hiện đại, thời trang và cá tính.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                        Tốc độ tối đa
                      </div>
                      <div className="font-semibold">{vehicle.max_speed || 48} km/h</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                        Công suất
                      </div>
                      <div className="font-semibold">{vehicle.power || 1200}W</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                        Tầm xa mỗi lần sạc
                      </div>
                      <div className="font-semibold">{vehicle.max_range} km</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                        Dung lượng pin
                      </div>
                      <div className="flex items-center space-x-2">
                        <Battery className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">{vehicle.battery_capacity} kWh</span>
                        <span className="text-sm text-green-600">({batteryPercentage}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Button */}
            <div className="space-y-4">
              <Button className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-semibold">
                Đặt xe ngay
              </Button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                Có thể thuê • Tình trạng: Có thể thuê
              </p>
            </div>
          </motion.div>
        </div>

        {/* Station Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Thông tin trạm thuê xe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">{vehicle.station.name}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{vehicle.station.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span>{vehicle.station.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <span>{vehicle.station.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-semibold">Giờ hoạt động</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {vehicle.station.opening_time} - {vehicle.station.closing_time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <span className="font-semibold">4.8</span>
                      <span className="text-gray-600 dark:text-gray-300 ml-1">(128 đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VehicleDetail;