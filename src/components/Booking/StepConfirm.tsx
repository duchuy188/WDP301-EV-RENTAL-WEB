import React from 'react';
import { Separator } from '@/components/ui/separator';

type Props = {
  selectedVehicle?: any;
  selectedColor?: string;
  bookingDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  specialRequests?: string;
  notes?: string;
  numberOfDays?: number;
  pricePerDay?: number;
  totalPrice?: number;
  formatPrice: (p: number) => string;
};

const StepConfirm: React.FC<Props> = ({
  selectedVehicle,
  selectedColor,
  bookingDate,
  endDate,
  startTime,
  endTime,
  specialRequests,
  notes,
  numberOfDays,
  pricePerDay,
  totalPrice,
  formatPrice,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Xác nhận & Thanh toán</h2>
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Thông tin đặt xe</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Xe:</span>
              <span>{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Chưa chọn'}</span>
            </div>
            {selectedColor && (
              <div className="flex justify-between">
                <span>Màu xe:</span>
                <span>{selectedColor}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Ngày bắt đầu:</span>
              <span>{bookingDate ? new Date(bookingDate).toLocaleDateString('vi-VN') : ''}</span>
            </div>
            {endDate && (
              <div className="flex justify-between">
                <span>Ngày kết thúc:</span>
                <span>{new Date(endDate).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Giờ nhận xe:</span>
              <span>{startTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Giờ trả xe:</span>
              <span>{endTime}</span>
            </div>
            {specialRequests && (
              <div className="flex justify-between">
                <span>Yêu cầu đặc biệt:</span>
                <span className="text-right max-w-[200px]">{specialRequests}</span>
              </div>
            )}
            {notes && (
              <div className="flex justify-between">
                <span>Ghi chú:</span>
                <span className="text-right max-w-[200px]">{notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Chi tiết chi phí</h3>
          <div className="space-y-2 text-sm">
            {selectedVehicle ? (
              <>
                <div className="flex justify-between">
                  <span>Số ngày thuê:</span>
                  <span>{numberOfDays} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá mỗi ngày:</span>
                  <span>{formatPrice(pricePerDay || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tính toán:</span>
                  <span>{numberOfDays} × {formatPrice(pricePerDay || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Tổng cộng:</span>
                  <span className="text-green-600">{formatPrice(totalPrice || 0)}</span>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Chọn xe để xem chi phí</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepConfirm;
