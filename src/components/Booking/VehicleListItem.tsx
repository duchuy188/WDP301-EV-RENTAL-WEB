import React from 'react';
import { Battery, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import type { VehicleListItem as VLI } from '@/types/vehicles';

type Props = {
  vehicle: VLI;
  isSelected?: boolean;
  onSelect?: (vehicle: VLI) => void;
};

const VehicleListItem: React.FC<Props> = ({ vehicle, isSelected, onSelect }) => {
  return (
    <Card
      key={vehicle.sample_vehicle_id}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-green-600 shadow-md' : ''
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
            {vehicle.stations.length > 0 ? vehicle.stations[0].name : 'Nhiều trạm'}
          </span>
        </div>
  <p className="text-lg font-bold text-green-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vehicle.price_per_day)}/ngày</p>
        <p className="text-sm text-gray-500">Còn lại: {vehicle.available_quantity} xe</p>
      </CardContent>
    </Card>
  );
};

export default VehicleListItem;
