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
  setSelectedColor: (c: string) => void;
  selectedStation: string;
  setSelectedStation: (s: string) => void;
  bookingDate: string;
  setBookingDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  startTime: string;
  setStartTime: (t: string) => void;
  endTime: string;
  setEndTime: (t: string) => void;
  specialRequests: string;
  setSpecialRequests: (s: string) => void;
  notes: string;
  setNotes: (n: string) => void;
};

const StepChooseTime: React.FC<Props> = ({
  selectedVehicle,
  selectedVehicleDetail,
  selectedColor,
  setSelectedColor,
  selectedStation,
  setSelectedStation,
  bookingDate,
  setBookingDate,
  endDate,
  setEndDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  
  
  specialRequests,
  setSpecialRequests,
  notes,
  setNotes,
}) => {
  // Auto compute end time: keep the same clock time as startTime by default
  useEffect(() => {
    if (startTime) {
      // when user changes startTime (or dates), set endTime to match startTime
      // Ensure parent state is updated so the parent validation that requires endTime passes.
      // Only set endTime when it's currently empty to avoid clobbering user's choice.
      try {
        if (!endTime) {
          setEndTime(startTime);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [startTime, bookingDate, endDate]);

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
                onChange={(e) => setBookingDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-800 transition-all w-full"
                min={bookingDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">Giờ nhận xe</Label>
          <div className="relative group max-w-xs">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <Input 
              id="startTime" 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-800 transition-all w-full" 
            />
          </div>
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
              Chọn màu xe
            </Label>
            <div className="relative group">
              <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 group-focus-within:text-purple-500 transition-colors" />
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-800 transition-all w-full">
                  <SelectValue placeholder="Chọn màu xe" />
                </SelectTrigger>
                <SelectContent>
                  {selectedVehicleDetail?.available_colors && selectedVehicleDetail.available_colors.length > 0 ? (
                    selectedVehicleDetail.available_colors.map((colorOption) => (
                      <SelectItem key={colorOption.color} value={colorOption.color}>
                        🎨 {colorOption.color} ({colorOption.available_quantity} xe)
                      </SelectItem>
                    ))
                  ) : selectedVehicle ? (
                    <SelectItem value={selectedVehicle?.color || ''}>🎨 {selectedVehicle?.color || ''}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stationSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-pink-500"></span>
              Chọn trạm
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 group-focus-within:text-pink-500 transition-colors" />
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger className="pl-10 h-11 border-gray-200 dark:border-gray-600 focus:border-pink-500 focus:ring-pink-500 bg-white dark:bg-gray-800 transition-all w-full">
                  <SelectValue placeholder="Chọn trạm nhận xe" />
                </SelectTrigger>
                <SelectContent>
                  {selectedVehicleDetail?.station ? (
                    <SelectItem value={selectedVehicleDetail.station._id}>
                      📍 {selectedVehicleDetail.station.name} - {selectedVehicleDetail.station.address}
                    </SelectItem>
                  ) : selectedVehicle?.stations.map((station: any) => (
                    <SelectItem key={station._id} value={station._id}>
                      📍 {station.name} - {station.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              onChange={(e) => setSpecialRequests(e.target.value)} 
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
              onChange={(e) => setNotes(e.target.value)} 
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
