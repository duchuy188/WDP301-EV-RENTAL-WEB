import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Car, User, MapPin, CreditCard, FileText, Clock, Gauge, Battery, Sparkles, Hash } from 'lucide-react';
import { Rental } from '@/types/rentals';

interface Props {
  rental: Rental;
}

const parseBookingDate = (dateString?: string | null) => {
  if (!dateString) return new Date(0);

  const ddmmyyyyMatch = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateString);
  if (ddmmyyyyMatch) {
    const [datePart, timePart] = dateString.split(' ');
    const [dayStr, monthStr, yearStr] = datePart.split('/');
    const day = Number(dayStr);
    const month = Number(monthStr) - 1;
    const year = Number(yearStr);
    let hour = 0;
    let minute = 0;
    let second = 0;
    if (timePart) {
      const parts = timePart.split(':').map((v) => Number(v));
      hour = parts[0] ?? 0;
      minute = parts[1] ?? 0;
      second = parts[2] ?? 0;
    }
    return new Date(year, month, day, hour, minute, second);
  }

  const asNumber = Number(dateString);
  if (!isNaN(asNumber)) return new Date(asNumber);

  const iso = new Date(dateString);
  if (!isNaN(iso.getTime())) return iso;

  return new Date(0);
};

const formatDate = (dateString?: string | null) => {
  const d = parseBookingDate(dateString);
  if (d.getTime() === 0) return '-';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPrice = (price?: number) => {
  try {
    return new Intl.NumberFormat('vi-VN').format(price ?? 0) + ' đ';
  } catch (e) {
    return (price ?? 0) + ' đ';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'pending_payment':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Đang thuê';
    case 'pending_payment':
      return 'Chờ thanh toán';
    case 'completed':
      return 'Hoàn thành';
    default:
      return status;
  }
};

const RentalDetail: React.FC<Props> = ({ rental }) => {
  return (
    <div className="space-y-3">
      {/* Header with Code and Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white font-mono">{rental.code}</h3>
          </div>
          <Badge className={`${getStatusColor(rental.status)} text-xs`}>{getStatusText(rental.status)}</Badge>
        </div>
      </div>

      {/* Thời gian thuê và Tổng phí */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-600 rounded">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">Thời gian thuê</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Bắt đầu: <span className="font-medium text-gray-900 dark:text-white">{formatDate(rental.actual_start_time)}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Kết thúc: <span className="font-medium text-gray-900 dark:text-white">{formatDate(rental.actual_end_time)}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-600 rounded">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Tổng phí</h4>
            </div>
          </div>
          <p className="font-bold text-xl text-purple-600 dark:text-purple-400 text-center">
            {rental.payments && rental.payments.length > 0 
              ? formatPrice(rental.payments.reduce((sum, p) => sum + (p.amount || 0), 0))
              : formatPrice(rental.total_fees ?? 0)
            }
          </p>
          {rental.payments && rental.payments.length > 0 && (
            <div className="mt-2 space-y-1">
              {rental.payments.map((payment, idx) => {
                const getPaymentMethodLabel = (method: string) => {
                  switch (method.toLowerCase()) {
                    case 'vnpay':
                      return 'VNPay';
                    case 'cash':
                      return 'Tiền mặt';
                    case 'momo':
                      return 'MoMo';
                    case 'bank_transfer':
                      return 'Chuyển khoản';
                    default:
                      return method;
                  }
                };
                
                return (
                  <div key={payment._id || idx} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded p-1.5 border border-purple-200 dark:border-purple-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      {getPaymentMethodLabel(payment.payment_method)}
                    </span>
                    <span className={`font-medium ${
                      payment.status === 'completed' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {formatPrice(payment.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tình trạng xe */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-orange-600 rounded">
            <Car className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100">Tình trạng xe</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded p-2 border border-orange-200 dark:border-orange-700">
            <p className="text-xs font-medium mb-2 text-orange-900 dark:text-orange-100 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Lúc nhận
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Gauge className="h-3 w-3" />Km:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.mileage ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Battery className="h-3 w-3" />Pin:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.battery_level ?? '-'}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.exterior_condition ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.interior_condition ?? '-'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-2 border border-orange-200 dark:border-orange-700">
            <p className="text-xs font-medium mb-2 text-orange-900 dark:text-orange-100 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Lúc trả
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Gauge className="h-3 w-3" />Km:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.mileage ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Battery className="h-3 w-3" />Pin:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.battery_level ?? '-'}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.exterior_condition ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.interior_condition ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-600 rounded">
            <User className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Thông tin chi tiết</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-1.5">
            <User className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Người thuê</p>
              <p className="font-medium text-sm text-gray-900 dark:text-white">{typeof rental.user_id === 'string' ? rental.user_id : rental.user_id?.fullname ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{typeof rental.user_id === 'string' ? '' : rental.user_id?.email ?? ''}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Car className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Xe</p>
              <p className="font-medium text-sm text-gray-900 dark:text-white">{typeof rental.vehicle_id === 'string' ? rental.vehicle_id : rental.vehicle_id?.name ?? rental.vehicle_id?.license_plate ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{typeof rental.vehicle_id === 'string' ? '' : rental.vehicle_id?.model ?? ''}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Trạm</p>
              <p className="font-medium text-sm text-gray-900 dark:text-white">{typeof rental.station_id === 'string' ? rental.station_id : rental.station_id?.name ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{typeof rental.station_id === 'string' ? '' : rental.station_id?.address ?? ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      {(rental.staff_notes || rental.customer_notes) && (
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-yellow-600 rounded">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">Ghi chú</h4>
          </div>
          <div className="space-y-2">
            {rental.staff_notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-yellow-200 dark:border-yellow-700">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Nhân viên</p>
                <p className="text-xs text-gray-900 dark:text-white">{rental.staff_notes}</p>
              </div>
            )}
            {rental.customer_notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-yellow-200 dark:border-yellow-700">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Khách hàng</p>
                <p className="text-xs text-gray-900 dark:text-white">{rental.customer_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer - Created time */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
        <Clock className="h-3 w-3" />
        <span>Tạo lúc: {formatDate(rental.createdAt)}</span>
      </div>
    </div>
  );
};

export default RentalDetail;
