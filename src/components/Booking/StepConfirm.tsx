import React from 'react';
// import { Separator } from '@/components/ui/separator';
// import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Palette, FileText, MessageSquare, Calculator, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { AvailableAlternative } from '@/types/booking';

type Props = {
  selectedVehicle?: any;
  selectedColor?: string;
  selectedStation?: string;
  bookingDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  specialRequests?: string;
  notes?: string;
  numberOfDays?: number;
  pricePerDay?: number;
  totalPrice?: number;
  depositPercentage?: number;
  depositAmount?: number;
  formatPrice: (p: number) => string;
  stations?: any[];
  // Edit mode props
  isEditMode?: boolean;
  editReason?: string;
  onEditReasonChange?: (reason: string) => void;
  availableAlternatives?: AvailableAlternative[];
  selectedAlternative?: AvailableAlternative | null;
  onSelectAlternative?: (alt: AvailableAlternative) => void;
  failedMessage?: string;
};

// Helper function to format time in Vietnam timezone
const formatTimeVN = (timeString?: string, dateString?: string): string => {
  if (!timeString) return '—';
  
  try {
    // If we have a date, combine it with time to create a full datetime
    if (dateString) {
      // Create a date object from the date and time strings
      const datetime = new Date(`${dateString}T${timeString}`);
      
      // Format the time in Vietnam timezone (GMT+7)
      return datetime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      });
    }
    
    // If no date provided, just return the time string as is
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString || '—';
  }
};

const StepConfirm: React.FC<Props> = ({
  selectedVehicle,
  selectedColor,
  // selectedStation,
  bookingDate,
  endDate,
  startTime,
  endTime,
  specialRequests,
  notes,
  numberOfDays,
  pricePerDay,
  totalPrice,
  depositPercentage,
  depositAmount,
  formatPrice,
  // stations,
  isEditMode = false,
  editReason = '',
  // onEditReasonChange,
  availableAlternatives = [],
  selectedAlternative = null,
  onSelectAlternative,
  failedMessage = '',
}) => {
  const formatPrice2 = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {isEditMode ? 'Xác nhận chỉnh sửa' : 'Xác nhận & Thanh toán'}
        </h2>
      </div>

      {/* Thông tin đặt xe */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border-2 border-blue-200 dark:border-gray-700 p-6 shadow-md">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <FaMotorcycle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Thông tin đặt xe
        </h3>
        <div className="space-y-4">
          {/* Vehicle Info */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FaMotorcycle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Xe:</span>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Chưa chọn'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {selectedColor && (
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Màu xe:</span>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{selectedColor}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ngày bắt đầu:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {bookingDate ? new Date(bookingDate).toLocaleDateString('vi-VN') : '—'}
                  </p>
                </div>
              </div>
            </div>

            {endDate && (
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ngày kết thúc:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Giờ nhận xe:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimeVN(startTime, bookingDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Giờ trả xe:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimeVN(endTime, endDate || bookingDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests & Notes */}
          {(specialRequests || notes) && (
            <div className="space-y-3">
              {specialRequests && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Yêu cầu đặc biệt:</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{specialRequests}</p>
                    </div>
                  </div>
                </div>
              )}

              {notes && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ghi chú:</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chi tiết chi phí */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border-2 border-green-200 dark:border-green-700 p-6 shadow-md">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
          Chi tiết chi phí
        </h3>
        {selectedVehicle ? (
          <div className="space-y-4">
            {/* Calculation Details */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Số ngày thuê:</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{numberOfDays} ngày</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Giá mỗi ngày:</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(pricePerDay || 0)}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Tính toán:</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {numberOfDays} × {formatPrice(pricePerDay || 0)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg text-white">Tổng cộng:</span>
                </div>
                <span className="font-bold text-2xl text-white">{formatPrice(totalPrice || 0)}</span>
              </div>
            </div>

            {/* Deposit Amount - Only show when renting for 2 or more days */}
            {depositPercentage != null && depositPercentage > 0 && numberOfDays && numberOfDays >= 2 && (
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white">Đặt cọc ({depositPercentage}%):</span>
                  </div>
                  <span className="font-bold text-2xl text-white">{formatPrice(depositAmount || 0)}</span>
                </div>
              </div>
            )}

            {/* Deposit Fee Notice - Only show in create mode */}
            {!isEditMode && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-5 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold text-lg text-white">Phí giữ chỗ (thanh toán ngay):</span>
                    </div>
                    <span className="font-bold text-2xl text-white">50,000đ</span>
                  </div>
                  <div className="bg-white/10 rounded p-3 text-white text-sm space-y-1">
                    <p>✓ Xe được <strong>GIỮ NGAY</strong> khi xác nhận</p>
                    <p>✓ Thanh toán qua VNPay (15 phút)</p>
                    <p>✓ Phí sẽ được <strong>TRỪ vào tổng chi phí</strong> khi nhận xe</p>
                    <p className="text-yellow-200">⚠️ <strong>KHÔNG hoàn lại</strong> khi hủy booking</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Edit Mode Notice */}
            {isEditMode && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-5 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white">Chỉnh sửa booking</span>
                  </div>
                  <div className="bg-white/10 rounded p-3 text-white text-sm space-y-1">
                    <p>✓ <strong>Không cần thanh toán lại</strong> phí giữ chỗ</p>
                    <p>✓ Thay đổi sẽ được áp dụng ngay khi xác nhận</p>
                    <p>✓ Bạn chỉ được chỉnh sửa <strong>1 lần duy nhất</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-700 rounded-lg p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Chọn xe để xem chi phí</p>
          </div>
        )}
      </div>

      {/* Edit Mode: Reason Display (read-only) */}
      {isEditMode && editReason && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-700 p-6 shadow-md">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Lý do chỉnh sửa
          </h3>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{editReason}</p>
          </div>
        </div>
      )}

      {/* Edit Mode: Available Alternatives */}
      {isEditMode && failedMessage && availableAlternatives.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 p-6 shadow-md">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                {failedMessage}
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Vui lòng chọn một trong các xe available bên dưới và bấm "Xác nhận chỉnh sửa" lại:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-900 dark:text-white">
              🚗 Các xe có sẵn ({availableAlternatives.length}):
            </Label>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {availableAlternatives.map((alt, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectAlternative?.(alt)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedAlternative === alt
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm bg-white dark:bg-gray-800'
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
                        {formatPrice2(alt.price_per_day)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/ngày</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-semibold">
                        = {formatPrice2(alt.estimated_total)}
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
    </div>
  );
};

export default StepConfirm;
