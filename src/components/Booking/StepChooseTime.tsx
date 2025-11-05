import React, { useEffect } from 'react';
import { Calendar, Clock, Palette, MapPin, FileText, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Vehicle, VehicleListItem as VehicleListItemType } from '@/types/vehicles';

type Props = {
  selectedVehicle?: VehicleListItemType | null;
  selectedVehicleDetail?: Vehicle | null;
  selectedColor: string;
  setSelectedColor?: (c: string) => void;
  onColorChange?: (c: string) => void;
  selectedStation: string;
  setSelectedStation?: (s: string) => void;
  onStationChange?: (s: string) => void;
  bookingDate: string;
  setBookingDate?: (d: string) => void;
  onBookingDateChange?: (d: string) => void;
  endDate: string;
  setEndDate?: (d: string) => void;
  onEndDateChange?: (d: string) => void;
  startTime: string;
  setStartTime?: (t: string) => void;
  onStartTimeChange?: (t: string) => void;
  endTime: string;
  setEndTime?: (t: string) => void;
  onEndTimeChange?: (t: string) => void;
  specialRequests: string;
  setSpecialRequests?: (s: string) => void;
  onSpecialRequestsChange?: (s: string) => void;
  notes: string;
  setNotes?: (n: string) => void;
  onNotesChange?: (n: string) => void;
  isRebooking?: boolean;
  isEditMode?: boolean;
  stations?: any[];
  onColorChangeLoadVehicle?: (colorSampleVehicleId: string) => Promise<void>;
};

const StepChooseTime: React.FC<Props> = ({
  selectedVehicle,
  selectedVehicleDetail,
  selectedColor,
  setSelectedColor,
  onColorChange,
  selectedStation,
  setSelectedStation,
  onStationChange,
  bookingDate,
  setBookingDate,
  onBookingDateChange,
  endDate,
  setEndDate,
  onEndDateChange,
  startTime,
  setStartTime,
  onStartTimeChange,
  endTime,
  setEndTime,
  onEndTimeChange,
  specialRequests,
  setSpecialRequests,
  onSpecialRequestsChange,
  notes,
  setNotes,
  onNotesChange,
  isRebooking = false,
  isEditMode = false,
  stations,
  onColorChangeLoadVehicle,
}) => {
  // Handler for color change - load vehicle detail for the selected color
  const handleColorChange = async (newColor: string) => {
    if (setSelectedColor) setSelectedColor(newColor);
    if (onColorChange) onColorChange(newColor);
    
    // If onColorChangeLoadVehicle callback is provided and we have color info, load vehicle detail for this color
    if (onColorChangeLoadVehicle && selectedVehicleDetail?.available_colors) {
      const colorOption = selectedVehicleDetail.available_colors.find(c => c.color === newColor);
      if (colorOption?.sample_vehicle_id) {
        try {
          await onColorChangeLoadVehicle(colorOption.sample_vehicle_id);
        } catch (error) {
          console.error('Error loading vehicle detail for color:', error);
        }
      }
    }
  };
  // Auto compute end time: keep the same clock time as startTime by default
  useEffect(() => {
    if (startTime) {
      // when user changes startTime (or dates), set endTime to match startTime
      // Ensure parent state is updated so the parent validation that requires endTime passes.
      // Only set endTime when it's currently empty to avoid clobbering user's choice.
      try {
        if (!endTime) {
          if (setEndTime) setEndTime(startTime);
          if (onEndTimeChange) onEndTimeChange(startTime);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [startTime, bookingDate, endDate]);

  // Get available stations based on selected color
  const availableStations = React.useMemo(() => {
    // If a color is selected, try to get stations from that color's vehicle detail
    if (selectedColor && selectedVehicleDetail?.available_colors) {
      const colorOption = selectedVehicleDetail.available_colors.find(
        c => c.color === selectedColor
      );
      
      // If color option has its own stations, use them (color-specific stations)
      if (colorOption?.stations && colorOption.stations.length > 0) {
        return colorOption.stations;
      }
    }
    
    // Fallback: Return stations from vehicle detail or selected vehicle (all colors share same stations)
    return selectedVehicleDetail?.stations || selectedVehicle?.stations || [];
  }, [selectedVehicleDetail, selectedVehicle, selectedColor]);

  // Auto-select first station when color changes or stations list changes
  useEffect(() => {
    if (availableStations.length > 0) {
      // If current selected station is not in the new list, select the first one
      const isCurrentStationValid = availableStations.some(s => s._id === selectedStation);
      if (!isCurrentStationValid) {
        const newStation = availableStations[0]._id;
        if (setSelectedStation) setSelectedStation(newStation);
        if (onStationChange) onStationChange(newStation);
      }
    } else {
      // No stations available, clear selection
      if (setSelectedStation) setSelectedStation('');
      if (onStationChange) onStationChange('');
    }
  }, [availableStations, selectedColor]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Chọn thời gian</h2>
      </div>

      {/* Thời gian thuê */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 p-5 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Thời gian thuê xe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày bắt đầu</Label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              <Input
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  if (setBookingDate) setBookingDate(e.target.value);
                  if (onBookingDateChange) onBookingDateChange(e.target.value);
                }}
                className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-800 transition-all w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày kết thúc</Label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  if (setEndDate) setEndDate(e.target.value);
                  if (onEndDateChange) onEndDateChange(e.target.value);
                }}
                className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-800 transition-all w-full"
                min={bookingDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">Giờ nhận xe</Label>
          <div className="flex items-center gap-3 max-w-xs">
            <div className="relative group flex-1">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
              <Input 
                id="startTime" 
                type="time" 
                value={startTime} 
                onChange={(e) => {
                  if (setStartTime) setStartTime(e.target.value);
                  if (onStartTimeChange) onStartTimeChange(e.target.value);
                }} 
                min="06:00"
                max="22:00"
                className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-800 transition-all w-full" 
              />
            </div>
            {startTime && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {(() => {
                  const [hours] = startTime.split(':').map(Number);
                  if (hours < 12) return '🌅 Sáng (AM)';
                  if (hours === 12) return '☀️ Trưa (PM)';
                  return '🌆 Chiều/Tối (PM)';
                })()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Giờ hoạt động: 06:00 AM - 10:00 PM (6h sáng - 10h tối)</p>
        </div>
      </div>

      {/* Chi tiết xe */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-750 p-5 rounded-xl border border-purple-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Chi tiết xe
        </h3>
        <div className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="colorSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
              Chọn màu xe {isRebooking && <span className="text-xs text-gray-500">(đã khóa)</span>}
            </Label>
            {isRebooking ? (
              <div className="relative group">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <div className="pl-10 h-11 border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed px-3">
                  {selectedColor && selectedColor.trim() !== '' ? (
                    <span>{selectedColor}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">Không có thông tin màu</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative group">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 group-focus-within:text-purple-500 transition-colors" />
                <Select value={selectedColor} onValueChange={handleColorChange}>
                  <SelectTrigger className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-800 transition-all w-full">
                    <SelectValue placeholder="Chọn màu xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedVehicleDetail?.available_colors && selectedVehicleDetail.available_colors.length > 0 ? (
                      selectedVehicleDetail.available_colors.map((colorOption) => (
                        <SelectItem key={colorOption.color} value={colorOption.color}>
                          {colorOption.color} ({colorOption.available_quantity} xe)
                        </SelectItem>
                      ))
                    ) : selectedVehicle?.color ? (
                      <SelectItem value={selectedVehicle.color}>{selectedVehicle.color}</SelectItem>
                    ) : (
                      <SelectItem value="default-color" disabled>Không có màu</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stationSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-pink-500"></span>
              Chọn trạm {isRebooking && <span className="text-xs text-gray-500">(đã khóa)</span>}
            </Label>
            {isRebooking ? (
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <div className="pl-10 h-11 border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center text-gray-700 dark:text-gray-300 font-medium cursor-not-allowed px-3">
                  {(() => {
                    // Check all available stations (from vehicle data)
                    const allStations = selectedVehicle?.stations || [];
                    const station = allStations.find((s: any) => s._id === selectedStation);
                    if (station) {
                      return `${station.name} - ${station.address}`;
                    }
                    // Fallback: just show name if available
                    return selectedStation ? 'Trạm đã chọn' : 'Không có thông tin trạm';
                  })()}
                </div>
              </div>
            ) : (
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 group-focus-within:text-pink-500 transition-colors" />
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500 bg-white dark:bg-gray-800 transition-all w-full">
                    <SelectValue placeholder="Chọn trạm nhận xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStations.length > 0 ? (
                      availableStations.map((station: any) => (
                        <SelectItem key={station._id} value={station._id}>
                          {station.name} - {station.address}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-station" disabled>
                        {selectedColor ? 'Không có trạm nào cho màu này' : 'Vui lòng chọn màu xe trước'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yêu cầu & Ghi chú */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-750 p-5 rounded-xl border border-amber-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Thông tin thêm
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specialRequests" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Yêu cầu đặc biệt
            </Label>
            <Textarea 
              id="specialRequests" 
              placeholder="VD: Cần thêm mũ bảo hiểm, yêu cầu giao xe tận nơi..." 
              value={specialRequests} 
              onChange={(e) => {
                if (setSpecialRequests) setSpecialRequests(e.target.value);
                if (onSpecialRequestsChange) onSpecialRequestsChange(e.target.value);
              }} 
              rows={3} 
              className="border-gray-200 dark:border-gray-600 focus:border-amber-500 focus:ring-amber-500 bg-white dark:bg-gray-800 resize-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Ghi chú
            </Label>
            <Textarea 
              id="notes" 
              placeholder="VD: Tôi muốn nhận xe vào buổi sáng sớm..." 
              value={notes} 
              onChange={(e) => {
                if (setNotes) setNotes(e.target.value);
                if (onNotesChange) onNotesChange(e.target.value);
              }} 
              rows={3} 
              className="border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-gray-800 resize-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepChooseTime;
