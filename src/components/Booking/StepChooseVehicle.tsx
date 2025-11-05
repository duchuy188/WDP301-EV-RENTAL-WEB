import React from 'react';
import { Search } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import VehicleListItem from './VehicleListItem';
import LoadingSpinner from '@/components/LoadingSpinner';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <FaMotorcycle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Chọn xe</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Chọn xe phù hợp với bạn hoặc xem chi tiết</p>
        </div>
      </div>

      {/* Info box */}
      {selectedVehicle && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                Đã chọn: {selectedVehicle.brand} {selectedVehicle.model}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Nhấn "Xem chi tiết" để xem thông tin đầy đủ hoặc chọn xe khác
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoadingVehicles ? (
        <div className="flex flex-col justify-center items-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
          <LoadingSpinner size="lg" text="Đang tải danh sách xe..." />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Không có xe nào khả dụng</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Vui lòng thử lại sau</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
