import React from 'react';
import { Badge } from '@/components/ui/badge';
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
    <div>
      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{rental.code}</h3>
          </div>
          <Badge className={`${getStatusColor(rental.status)} flex items-center gap-1`}>{getStatusText(rental.status)}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Bắt đầu</p>
            <p className="text-sm text-gray-600">{formatDate(rental.actual_start_time)}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Kết thúc</p>
            <p className="text-sm text-gray-600">{formatDate(rental.actual_end_time)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Tình trạng xe lúc nhận</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Km: {rental.vehicle_condition_before?.mileage ?? '-'}</p>
              <p>Pin: {rental.vehicle_condition_before?.battery_level ?? '-'}%</p>
              <p>Ngoại thất: {rental.vehicle_condition_before?.exterior_condition ?? '-'}</p>
              <p>Nội thất: {rental.vehicle_condition_before?.interior_condition ?? '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Tình trạng xe lúc trả</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Km: {rental.vehicle_condition_after?.mileage ?? '-'}</p>
              <p>Pin: {rental.vehicle_condition_after?.battery_level ?? '-'}%</p>
              <p>Ngoại thất: {rental.vehicle_condition_after?.exterior_condition ?? '-'}</p>
              <p>Nội thất: {rental.vehicle_condition_after?.interior_condition ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Người thuê</p>
            <p className="text-sm">{typeof rental.user_id === 'string' ? rental.user_id : rental.user_id?.fullname ?? '-'}</p>
            <p className="text-xs text-muted">{typeof rental.user_id === 'string' ? '' : rental.user_id?.email ?? ''}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Xe</p>
            <p className="text-sm">{typeof rental.vehicle_id === 'string' ? rental.vehicle_id : rental.vehicle_id?.name ?? rental.vehicle_id?.license_plate ?? '-'}</p>
            <p className="text-xs text-muted">{typeof rental.vehicle_id === 'string' ? '' : rental.vehicle_id?.model ?? ''}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Trạm</p>
            <p className="text-sm">{typeof rental.station_id === 'string' ? rental.station_id : rental.station_id?.name ?? '-'}</p>
            <p className="text-xs text-muted">{typeof rental.station_id === 'string' ? '' : rental.station_id?.address ?? ''}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Phí</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tổng phí:</span>
              <span className="text-red-500">{formatPrice(rental.total_fees ?? 0)}</span>
            </div>
          </div>
        </div>

        {(rental.staff_notes || rental.customer_notes) && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Ghi chú</p>
            <div className="space-y-2 text-sm text-gray-600">
              {rental.staff_notes && (
                <div>
                  <span className="font-medium">Nhân viên: </span>
                  {rental.staff_notes}
                </div>
              )}
              {rental.customer_notes && (
                <div>
                  <span className="font-medium">Khách hàng: </span>
                  {rental.customer_notes}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-2">Tạo lúc: {formatDate(rental.createdAt)}</div>
      </div>
    </div>
  );
};

export default RentalDetail;
