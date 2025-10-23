import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, MapPin, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { VehicleListItem as VLI } from '@/types/vehicles';

type Props = {
  vehicle: VLI;
  isSelected?: boolean;
  onSelect?: (vehicle: VLI) => void;
};

const VehicleListItem: React.FC<Props> = ({ vehicle, isSelected, onSelect }) => {
  const navigate = useNavigate();

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vehicles/${vehicle.sample_vehicle_id}`);
  };

  return (
    <Card
      key={vehicle.sample_vehicle_id}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
        isSelected 
          ? 'ring-2 ring-green-600 shadow-md border-green-500' 
          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
      }`}
      onClick={() => onSelect && onSelect(vehicle)}
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
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {vehicle.brand} {vehicle.model}
          </h3>
          {isSelected && (
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            <p>Năm: <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.year}</span></p>
            <p>Loại: <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.type}</span></p>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <p>Màu: <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.color}</span></p>
            <p>Tầm xa: <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.max_range}km</span></p>
          </div>
        </div>

        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
          <MapPin className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-sm font-medium">
            {vehicle.stations.length > 0 ? vehicle.stations[0].name : 'Nhiều trạm'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vehicle.price_per_day)}
              <span className="text-sm font-normal text-gray-500">/ngày</span>
            </p>
            <p className="text-xs text-gray-500">Còn lại: {vehicle.available_quantity} xe</p>
          </div>
        </div>

        <Button
          onClick={handleViewDetail}
          variant="outline"
          className="w-full mt-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  );
};

export default VehicleListItem;
