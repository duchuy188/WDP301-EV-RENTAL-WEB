import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Car, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { rentalAPI } from '@/api/rentalsAPI';
import { Rental, RentalsData } from '@/types/rentals';
import { toast } from '@/utils/toast';

const RentalHistory: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: RentalsData = await rentalAPI.getRentals();
      setRentals(data.rentals || []);
    } catch (err: any) {
      console.error('Error fetching rentals:', err);
      setError('Không thể tải lịch sử thuê xe');
      toast.error('Không thể tải lịch sử thuê xe');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'active':
        return 'Đang thuê';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (rentals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Bạn chưa có lịch sử thuê xe nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Lịch sử thuê xe ({rentals.length})
        </CardTitle>
      </CardHeader>

      {rentals.map((rental, index) => (
        <motion.div
          key={rental._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">#{rental.code}</h3>
                    <p className="text-sm text-gray-500">Mã booking: {rental.booking_id}</p>
                  </div>
                  <Badge variant={getStatusVariant(rental.status)} className="flex items-center gap-1">
                    {getStatusIcon(rental.status)}
                    {getStatusText(rental.status)}
                  </Badge>
                </div>

                {/* Time Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Bắt đầu</p>
                      <p className="text-sm text-gray-600">{formatDate(rental.actual_start_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Kết thúc</p>
                      <p className="text-sm text-gray-600">{formatDate(rental.actual_end_time)}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Tình trạng xe lúc nhận</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Km: {rental.vehicle_condition_before.mileage.toLocaleString()}</p>
                      <p>Pin: {rental.vehicle_condition_before.battery_level}%</p>
                      <p>Ngoại thất: {rental.vehicle_condition_before.exterior_condition}</p>
                      <p>Nội thất: {rental.vehicle_condition_before.interior_condition}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Tình trạng xe lúc trả</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Km: {rental.vehicle_condition_after.mileage.toLocaleString()}</p>
                      <p>Pin: {rental.vehicle_condition_after.battery_level}%</p>
                      <p>Ngoại thất: {rental.vehicle_condition_after.exterior_condition}</p>
                      <p>Nội thất: {rental.vehicle_condition_after.interior_condition}</p>
                    </div>
                  </div>
                </div>

                {/* Fees */}
                {(rental.late_fee > 0 || rental.damage_fee > 0 || rental.other_fees > 0) && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Phí phát sinh</p>
                    <div className="space-y-1 text-sm">
                      {rental.late_fee > 0 && (
                        <div className="flex justify-between">
                          <span>Phí trễ hạn:</span>
                          <span className="text-red-500">{formatCurrency(rental.late_fee)}</span>
                        </div>
                      )}
                      {rental.damage_fee > 0 && (
                        <div className="flex justify-between">
                          <span>Phí hỏng hóc:</span>
                          <span className="text-red-500">{formatCurrency(rental.damage_fee)}</span>
                        </div>
                      )}
                      {rental.other_fees > 0 && (
                        <div className="flex justify-between">
                          <span>Phí khác:</span>
                          <span className="text-red-500">{formatCurrency(rental.other_fees)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Tổng phí:</span>
                        <span className="text-red-500">{formatCurrency(rental.total_fees)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
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

                {/* Created Date */}
                <div className="text-xs text-gray-500 border-t pt-2">
                  Tạo lúc: {formatDate(rental.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default RentalHistory;
