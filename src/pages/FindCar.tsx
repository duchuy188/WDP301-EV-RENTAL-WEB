import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import VehicleImage from '@/components/VehicleImage';
import VehicleMap from '@/components/VehicleMap';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { stationAPI } from '@/api/stationAPI';
import { VehicleListItem, VehiclesResponse } from '@/types/vehicles';
import { Station } from '@/types/station';

const FindCar: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  // keep a stable map of initial prices by sample_vehicle_id to avoid UI showing changing prices
  const initialPriceMap = useRef<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [carType, setCarType] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Fetch vehicles and stations from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles
        const vehiclesResponse: VehiclesResponse = await vehiclesAPI.getVehicles();
        console.debug && console.debug('vehiclesAPI.getVehicles response (prices):', vehiclesResponse.vehicles.map(v => ({ id: v.sample_vehicle_id, price: v.price_per_day })));
        
        // Store initial prices into ref (only first time seen)
        vehiclesResponse.vehicles.forEach(v => {
          if (v.sample_vehicle_id && initialPriceMap.current[v.sample_vehicle_id] == null) {
            initialPriceMap.current[v.sample_vehicle_id] = v.price_per_day;
          }
        });
        setVehicles(vehiclesResponse.vehicles);
        
        // Fetch stations (all stations)
        const stationsResponse = await stationAPI.getStation({ limit: 100 });
        setStations(stationsResponse.stations || []);
        
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu xe. Vui lòng thử lại sau.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique models from vehicles
  const availableModels = useMemo(() => {
    const models = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.model) {
        models.add(vehicle.model);
      }
    });
    return Array.from(models).sort();
  }, [vehicles]);

  const filteredCars = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.stations.some(station => 
                             station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             station.address.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      const matchesType = !carType || vehicle.type.toLowerCase().includes(carType.toLowerCase());
      const matchesModel = !selectedModel || vehicle.model.toLowerCase().includes(selectedModel.toLowerCase());
      const matchesStation = !selectedStation || 
                            vehicle.stations.some(station => 
                              station.name.toLowerCase().includes(selectedStation.toLowerCase()) ||
                              station._id === selectedStation
                            );
      const matchesPrice = vehicle.price_per_day >= priceRange[0] && vehicle.price_per_day <= priceRange[1];
      
      return matchesSearch && matchesType && matchesModel && matchesStation && matchesPrice;
    });
  }, [vehicles, searchTerm, carType, selectedModel, selectedStation, priceRange]);



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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tìm kiếm
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nhập địa điểm hoặc tên xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Car Type */}
            <div className="space-y-2">
              <Label htmlFor="carType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loại xe
              </Label>
              <Input
                id="carType"
                list="carTypeList"
                placeholder="Tất cả"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <datalist id="carTypeList">
                <option value="scooter">Xe tay ga</option>
                <option value="motorcycle">Xe mô tô</option>
              </datalist>
            </div>

            {/* Model Filter */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mẫu xe
              </Label>
              <Input
                id="model"
                list="modelList"
                placeholder="Tất cả"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <datalist id="modelList">
                {availableModels.map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
            </div>

            {/* Station Filter */}
            <div className="space-y-2">
              <Label htmlFor="station" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trạm
              </Label>
              <Input
                id="station"
                list="stationList"
                placeholder="Tất cả trạm"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <datalist id="stationList">
                {stations.filter(s => s.status === 'active').map((station) => (
                  <option key={station._id} value={station.name} />
                ))}
              </datalist>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Giá (VND/ngày)
              </Label>
              <div className="px-2 pt-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                  <span>{priceRange[0].toLocaleString('vi-VN')} đ</span>
                  <span>{priceRange[1].toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
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
                    onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.sample_vehicle_id)}`, { state: { selectedVehicle: vehicle } })}
                  >
                    <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 bg-white rounded-xl">
                      {(() => { console.debug && console.debug('Rendering vehicle price', { id: vehicle.sample_vehicle_id, price: vehicle.price_per_day }); return null; })()}
                      {/* Header with stacked labels */}
                      <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            {vehicle.brand && (<div className="text-sm text-gray-600">Thương hiệu: <span className="font-semibold text-gray-900">{vehicle.brand}</span></div>)}
                            {vehicle.model && (<div className="text-sm text-gray-600">Mẫu: <span className="font-semibold text-gray-900">{vehicle.model}</span></div>)}
                          </div>
                          <div className="text-right">
                            {vehicle.year  && (<div className="text-sm text-gray-600">Năm: <span className="font-semibold text-gray-900">{vehicle.year}</span></div>)}
                            {(vehicle.price_per_day) && (
                              <div className="text-lg font-bold text-gray-900 mt-1">{(vehicle.price_per_day).toLocaleString('vi-VN') + ' đ/ngày'}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Image - larger padded area */}
                      <div className="p-6 bg-white flex items-center justify-center">
                        <div className="w-full max-w-lg h-44 md:h-52 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="w-[86%] h-[86%]">
                            {/* Prefer first color image if available */}
                            <VehicleImage
                              src={(() => {
                                if (vehicle.color_images && vehicle.color_images.length > 0) {
                                  const white = vehicle.color_images.find(ci => ci.color && ci.color.toLowerCase() === 'trắng');
                                  if (white && white.images && white.images.length > 0) return white.images[0];
                                }
                                return vehicle.sample_image || (vehicle.images && vehicle.images[0]);
                              })()}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-full h-full rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <CardContent className="px-6 pb-6 pt-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 items-start">
                          {vehicle.type && (
                            <div className="flex items-center space-x-4">
                              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
                                <span className="text-base">🚗</span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Loại</div>
                                <div className="text-base font-semibold text-gray-900">{vehicle.type}</div>
                              </div>
                            </div>
                          )}

                          {vehicle.max_range != null && (
                            <div className="flex items-center space-x-4">
                              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
                                <span className="text-base">�</span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Km mỗi lần sạc</div>
                                <div className="text-base font-semibold text-gray-900">{vehicle.max_range} Km</div>
                              </div>
                            </div>
                          )}

                          {vehicle.battery_capacity != null && (
                            <div className="flex items-center space-x-4">
                              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
                                <span className="text-base">🔋</span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Dung lượng pin</div>
                                <div className="text-base font-semibold text-gray-900">{vehicle.battery_capacity} kWh</div>
                              </div>
                            </div>
                          )}

                          {vehicle.max_speed != null && (
                            <div className="flex items-center space-x-4">
                              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
                                <span className="text-base">⚡</span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Tốc độ tối đa</div>
                                <div className="text-base font-semibold text-gray-900">{vehicle.max_speed} Km/h</div>
                              </div>
                            </div>
                          )}

                          {vehicle.deposit_percentage != null && (
                            <div className="flex items-center space-x-4">
                              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
                                <span className="text-base">💰</span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Đặt cọc</div>
                                <div className="text-base font-semibold text-gray-900">{vehicle.deposit_percentage}%</div>
                              </div>
                            </div>
                          )}

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
                    setCarType('');
                    setSelectedModel('');
                    setSelectedStation('');
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
          >
            <VehicleMap 
              vehicles={filteredCars}
              searchLocation={selectedStation || searchTerm || ''}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FindCar;