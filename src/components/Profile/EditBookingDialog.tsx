import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Booking, BookingUpdateRequest, AvailableAlternative } from '@/types/booking';
import { bookingAPI } from '@/api/bookingAPI';
import { toast } from '@/utils/toast';

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess: () => void;
}

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });
  
  // For alternative vehicles when edit fails
  const [availableAlternatives, setAvailableAlternatives] = useState<AvailableAlternative[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<AvailableAlternative | null>(null);
  const [failedEditMessage, setFailedEditMessage] = useState<string>('');

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
    } catch (e) {
      return price + ' đ';
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a short delay to avoid visual glitch
    setTimeout(() => {
      setFormData({ start_date: '', end_date: '', reason: '' });
      setAvailableAlternatives([]);
      setSelectedAlternative(null);
      setFailedEditMessage('');
    }, 200);
  };

  const handleConfirm = async () => {
    if (!booking) return;

    // Validate
    if (!formData.start_date || !formData.end_date) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Vui lòng nhập lý do chỉnh sửa');
      return;
    }

    // Check if start_date is before end_date
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    // Check if start_date is at least 24 hours from now - Kết hợp cả giờ nhận xe
    const startDate = new Date(formData.start_date);
    
    // Thêm pickup_time vào startDate để tính chính xác thời gian nhận xe
    if (booking?.pickup_time) {
      const [hours, minutes] = booking.pickup_time.split(':').map(s => parseInt(s, 10));
      if (!isNaN(hours) && !isNaN(minutes)) {
        startDate.setHours(hours, minutes, 0, 0);
      }
    }
    
    const now = new Date();
    const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      toast.error('Thời gian nhận xe phải ít nhất 24 giờ kể từ bây giờ');
      return;
    }

    try {
      setLoading(true);
      
      // Reset alternatives state
      setAvailableAlternatives([]);
      setSelectedAlternative(null);
      setFailedEditMessage('');
      
      const updateData: BookingUpdateRequest = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        station_id: typeof booking.station_id === 'string' 
          ? booking.station_id 
          : booking.station_id._id,
        model: selectedAlternative?.model || booking.vehicle_id.model,
        color: selectedAlternative?.color || booking.vehicle_id.color || '',
        reason: formData.reason,
      };

      await bookingAPI.updateBooking(booking._id, updateData);
      
      toast.success('Chỉnh sửa đặt xe thành công');
      handleClose();
      onSuccess(); // Callback to reload bookings
    } catch (error: any) {
      console.error('Edit failed', error);
      
      // Check if error response has available_alternatives
      const errorData = error.response?.data;
      
      if (errorData && !errorData.success && errorData.available_alternatives && errorData.available_alternatives.length > 0) {
        // Có xe thay thế available
        setAvailableAlternatives(errorData.available_alternatives);
        setFailedEditMessage(errorData.message || 'Model đã chọn không còn xe available');
        toast.warning('Model đã chọn không còn xe. Vui lòng chọn xe thay thế bên dưới.');
      } else {
        // Lỗi khác
        const errorMessage = error.response?.data?.message || error.message || 'Chỉnh sửa đặt xe thất bại';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-populate form when booking changes
  React.useEffect(() => {
    if (booking && open) {
      // Parse dates from booking
      const parseDate = (dateString: string) => {
        if (!dateString) return '';
        
        try {
          // If format is DD/MM/YYYY, convert to YYYY-MM-DD
          if (dateString.includes('/')) {
            const [datePart] = dateString.split(' ');
            const [day, month, year] = datePart.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          
          // If already YYYY-MM-DD or ISO format
          return dateString.split('T')[0];
        } catch (e) {
          return '';
        }
      };

      setFormData({
        start_date: parseDate(booking.start_date),
        end_date: parseDate(booking.end_date),
        reason: '',
      });
    }
  }, [booking, open]);

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${availableAlternatives.length > 0 ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đặt xe</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Lưu ý:</strong> Bạn chỉ được chỉnh sửa đặt xe <strong>1 lần duy nhất</strong>. 
              Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
            </p>
          </div>

          {/* Booking Info */}
          <div className="space-y-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mã đặt xe: <span className="font-bold text-gray-900 dark:text-white">{booking.code}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Xe hiện tại: <span className="font-medium text-gray-900 dark:text-white">{booking.vehicle_id.brand} {booking.vehicle_id.model} - {booking.vehicle_id.color}</span>
            </p>
            {selectedAlternative && (
              <p className="text-sm text-green-600 dark:text-green-400">
                → Xe mới: <span className="font-semibold">{selectedAlternative.brand} {selectedAlternative.model} - {selectedAlternative.color}</span>
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trạm: <span className="font-medium text-gray-900 dark:text-white">{booking.station_id.name}</span>
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-start-date">Ngày bắt đầu thuê</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">Phải ít nhất 24 giờ kể từ bây giờ</p>
            </div>

            <div>
              <Label htmlFor="edit-end-date">Ngày kết thúc thuê</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="edit-reason">Lý do chỉnh sửa <span className="text-red-500">*</span></Label>
              <Textarea
                id="edit-reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Vui lòng nhập lý do chỉnh sửa đặt xe..."
                rows={3}
              />
            </div>
          </div>
          
          {/* Available Alternatives */}
          {failedEditMessage && availableAlternatives.length > 0 && (
            <div className="space-y-3 border-t-2 border-yellow-200 dark:border-yellow-800 pt-4 mt-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200 font-semibold">
                      {failedEditMessage}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Vui lòng chọn một trong các xe available bên dưới và bấm "Xác nhận chỉnh sửa" lại:
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-semibold">🚗 Các xe có sẵn ({availableAlternatives.length}):</Label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableAlternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedAlternative(alt)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedAlternative === alt
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-base text-gray-900 dark:text-white">
                            {alt.brand} {alt.model}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              🎨 Màu: <span className="font-medium">{alt.color}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              📦 Còn <span className="font-semibold text-blue-600 dark:text-blue-400">{alt.available_count}</span> xe
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-green-600 dark:text-green-400">
                            {formatPrice(alt.price_per_day)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            /ngày
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-semibold">
                            = {formatPrice(alt.estimated_total)}
                          </p>
                        </div>
                      </div>
                      {selectedAlternative === alt && (
                        <div className="mt-3 pt-3 border-t-2 border-green-300 dark:border-green-700">
                          <p className="text-sm text-green-700 dark:text-green-400 font-semibold flex items-center gap-2">
                            <span className="text-lg">✓</span> Đã chọn xe này - Bấm "Xác nhận chỉnh sửa" để tiếp tục
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={loading || (availableAlternatives.length > 0 && !selectedAlternative)}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận chỉnh sửa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;

