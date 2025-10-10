import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Car, 
  Grid3X3,
  Map,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import VehicleImage from '@/components/VehicleImage';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { VehicleListItem, VehiclesResponse } from '@/types/vehicles';

const FindCar: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [carType, setCarType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response: VehiclesResponse = await vehiclesAPI.getVehicles();
        setVehicles(response.vehicles);
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu xe. Vui lòng thử lại sau.');
        console.error('Error fetching vehicles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const filteredCars = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.stations.some(station => 
                             station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             station.address.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      const matchesType = carType === 'all' || vehicle.type === carType;
      const matchesPrice = vehicle.price_per_day >= priceRange[0] && vehicle.price_per_day <= priceRange[1];
      
      return matchesSearch && matchesType && matchesPrice;
    });
  }, [vehicles, searchTerm, carType, priceRange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600 dark:text-gray-300">Đang tải dữ liệu xe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tìm xe phù hợp
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Chọn xe điện phù hợp cho chuyến đi của bạn
          </p>
        </motion.div>

        {/* Filter Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nhập địa điểm hoặc tên xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Car Type */}
            <div className="space-y-2">
              <Label htmlFor="carType">Loại xe</Label>
              <Select value={carType} onValueChange={setCarType}>
                <SelectTrigger id="carType">
                  <SelectValue placeholder="Chọn loại xe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="scooter">Xe tay ga</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Giá (VND/ngày)</Label>
              <div className="px-3">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Filter className="mr-2 h-4 w-4" />
                Áp dụng
              </Button>
            </div>
          </div>
        </motion.div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tìm thấy {filteredCars.length} xe
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Danh sách
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4 mr-2" />
              Bản đồ
            </Button>
          </div>
        </div>

        {/* Car List or Map */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.length > 0 ? (
              filteredCars.map((vehicle, index) => {
                return (
                  <motion.div
                    key={vehicle.sample_vehicle_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => navigate(`/vehicle/${vehicle.sample_vehicle_id}`)}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
                      {/* Header with name and price */}
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-gray-900 uppercase">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <div className="text-right">
                            <span className="text-xl font-bold text-red-500">
                              {formatPrice(vehicle.price_per_day).replace('₫', 'Đ/NGÀY')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Image */}
                      <div className="p-6 flex justify-center items-center min-h-[280px] bg-white">
                        <div className="w-full h-full max-w-sm">
                          <VehicleImage
                            src={vehicle.sample_image}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Speed */}
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">⚡</span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 uppercase font-medium">Tốc độ tối đa</div>
                              <div className="text-sm font-semibold">{vehicle.max_speed || 48} Km/h</div>
                            </div>
                          </div>

                          {/* Range */}
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">🔋</span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 uppercase font-medium">Km mỗi lần sạc</div>
                              <div className="text-sm font-semibold">{vehicle.max_range} Km</div>
                            </div>
                          </div>

                          {/* Power */}
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">#</span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 uppercase font-medium">Công suất</div>
                              <div className="text-sm font-semibold">{vehicle.power || 1200}W</div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">📅</span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 uppercase font-medium">Tình trạng</div>
                              <div className="text-sm font-semibold text-green-600">Có thể thuê</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-16"
              >
                <Car className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Không tìm thấy xe phù hợp
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Thử điều chỉnh bộ lọc để xem thêm kết quả
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCarType('all');
                    setPriceRange([0, 500000]);
                  }}
                >
                  Reset bộ lọc
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chế độ xem bản đồ
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tính năng bản đồ sẽ được cập nhật sớm
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FindCar;