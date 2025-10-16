import React from 'react';
import { Loader2 } from 'lucide-react';
import VehicleListItem from './VehicleListItem';
import type { VehicleListItem as VehicleListItemType } from '@/types/vehicles';

type Props = {
  vehicles: VehicleListItemType[];
  isLoadingVehicles: boolean;
  selectedVehicle?: VehicleListItemType | null;
  onSelectVehicle: (v: VehicleListItemType) => void;
  loadVehicleDetail: (id: string) => Promise<void>;
};

const StepChooseVehicle: React.FC<Props> = ({ vehicles, isLoadingVehicles, selectedVehicle, onSelectVehicle }) => {
  return (
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
          {vehicles.map((vehicle: VehicleListItemType) => (
            <VehicleListItem
              key={vehicle.sample_vehicle_id}
              vehicle={vehicle}
              isSelected={selectedVehicle?.sample_vehicle_id === vehicle.sample_vehicle_id}
              onSelect={onSelectVehicle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StepChooseVehicle;
