import React, { useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
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
    <div>
      <h2 className="text-2xl font-bold mb-6">Chọn thời gian</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date">Ngày bắt đầu</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Ngày kết thúc</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
                min={bookingDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="colorSelect">Chọn màu xe</Label>
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn màu xe" />
              </SelectTrigger>
              <SelectContent>
                {selectedVehicleDetail?.available_colors && selectedVehicleDetail.available_colors.length > 0 ? (
                  selectedVehicleDetail.available_colors.map((colorOption) => (
                    <SelectItem key={colorOption.color} value={colorOption.color}>
                      {colorOption.color} ({colorOption.available_quantity} xe)
                    </SelectItem>
                  ))
                ) : selectedVehicle ? (
                  <SelectItem value={selectedVehicle?.color || ''}>{selectedVehicle?.color || ''}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stationSelect">Chọn trạm</Label>
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạm nhận xe" />
              </SelectTrigger>
              <SelectContent>
                {selectedVehicleDetail?.station ? (
                  <SelectItem value={selectedVehicleDetail.station._id}>{selectedVehicleDetail.station.name} - {selectedVehicleDetail.station.address}</SelectItem>
                ) : selectedVehicle?.stations.map((station: any) => (
                  <SelectItem key={station._id} value={station._id}>{station.name} - {station.address}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startTime">Giờ nhận xe</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="pl-10" />
            </div>
          </div>

          {/* Return time is intentionally hidden; it is auto-calculated from the pickup time */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialRequests">Yêu cầu đặc biệt</Label>
          <Textarea id="specialRequests" placeholder="Nhập yêu cầu đặc biệt (nếu có)..." value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Ghi chú</Label>
          <Textarea id="notes" placeholder="Nhập ghi chú thêm (nếu có)..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
    </div>
  );
};

export default StepChooseTime;
