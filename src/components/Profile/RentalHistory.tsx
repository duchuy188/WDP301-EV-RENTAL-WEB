import React, { useState, useEffect } from 'react';
import { Clock, Car, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { rentalAPI } from '@/api/rentalsAPI';
import { Rental, RentalsData } from '@/types/rentals';
import { toast } from '@/utils/toast';

const RentalHistory: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      setError('Không thể tải lịch sử đặt xe');
      toast.error('Không thể tải lịch sử đặt xe');
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
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (n?: number | null) => {
    if (n === null || n === undefined) return '-';
    try {
      return n.toLocaleString();
    } catch (e) {
      return String(n);
    }
  };

  const formatPercent = (n?: number | null) => {
    if (n === null || n === undefined) return '-';
    return `${n}%`;
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
          <p className="text-gray-500">Bạn chưa có lịch sử đặt xe nào</p>
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

      {/* Summary table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="p-2">Mã</th>
                  <th className="p-2">Xe</th>
                  <th className="p-2">Trạm</th>
                  <th className="p-2">Thời gian</th>
                  <th className="p-2">Trạng thái</th>
                  <th className="p-2">Tổng phí</th>
                  <th className="p-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2">{r.code}</td>
                    <td className="p-2">{typeof r.vehicle_id === 'string' ? r.vehicle_id : r.vehicle_id?.name ?? r.vehicle_id?.license_plate ?? '-'}</td>
                    <td className="p-2">{typeof r.station_id === 'string' ? r.station_id : r.station_id?.name ?? '-'}</td>
                    <td className="p-2">{formatDate(r.actual_start_time)}</td>
                    <td className="p-2"><Badge variant={getStatusVariant(r.status)}>{getStatusText(r.status)}</Badge></td>
                    <td className="p-2">{formatCurrency(r.total_fees ?? 0)}</td>
                    <td className="p-2">
                      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedRental(null); }}>
                        <DialogTrigger asChild>
                          <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => { setSelectedRental(r); setDialogOpen(true); }}>
                            Xem chi tiết
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Chi tiết đặt xe #{selectedRental?.code}</DialogTitle>
                            <DialogDescription>Thông tin chi tiết lượt thuê</DialogDescription>
                          </DialogHeader>
                          {/* Reuse the existing detailed layout inside dialog */}
                          {selectedRental ? (
                            <div className="mt-4">
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-lg">#{selectedRental.code}</h3>
                                    <p className="text-sm text-gray-500">Mã booking: {selectedRental.booking_id}</p>
                                  </div>
                                  <Badge variant={getStatusVariant(selectedRental.status)} className="flex items-center gap-1">
                                    {getStatusIcon(selectedRental.status)}
                                    {getStatusText(selectedRental.status)}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Bắt đầu</p>
                                    <p className="text-sm text-gray-600">{formatDate(selectedRental.actual_start_time)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">Kết thúc</p>
                                    <p className="text-sm text-gray-600">{formatDate(selectedRental.actual_end_time)}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Tình trạng xe lúc nhận</p>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p>Km: {formatNumber(selectedRental.vehicle_condition_before?.mileage)}</p>
                                      <p>Pin: {formatPercent(selectedRental.vehicle_condition_before?.battery_level)}</p>
                                      <p>Ngoại thất: {selectedRental.vehicle_condition_before?.exterior_condition ?? '-'}</p>
                                      <p>Nội thất: {selectedRental.vehicle_condition_before?.interior_condition ?? '-'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">Tình trạng xe lúc trả</p>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p>Km: {formatNumber(selectedRental.vehicle_condition_after?.mileage)}</p>
                                      <p>Pin: {formatPercent(selectedRental.vehicle_condition_after?.battery_level)}</p>
                                      <p>Ngoại thất: {selectedRental.vehicle_condition_after?.exterior_condition ?? '-'}</p>
                                      <p>Nội thất: {selectedRental.vehicle_condition_after?.interior_condition ?? '-'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* User / Vehicle / Station */}
                                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Người thuê</p>
                                    <p className="text-sm">{typeof selectedRental.user_id === 'string' ? selectedRental.user_id : selectedRental.user_id?.fullname ?? '-'}</p>
                                    <p className="text-xs text-muted">{typeof selectedRental.user_id === 'string' ? '' : selectedRental.user_id?.email ?? ''}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">Xe</p>
                                    <p className="text-sm">{typeof selectedRental.vehicle_id === 'string' ? selectedRental.vehicle_id : selectedRental.vehicle_id?.name ?? selectedRental.vehicle_id?.license_plate ?? '-'}</p>
                                    <p className="text-xs text-muted">{typeof selectedRental.vehicle_id === 'string' ? '' : selectedRental.vehicle_id?.model ?? ''}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">Trạm</p>
                                    <p className="text-sm">{typeof selectedRental.station_id === 'string' ? selectedRental.station_id : selectedRental.station_id?.name ?? '-'}</p>
                                    <p className="text-xs text-muted">{typeof selectedRental.station_id === 'string' ? '' : selectedRental.station_id?.address ?? ''}</p>
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <p className="text-sm font-medium mb-2">Phí</p>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>Tổng phí:</span>
                                      <span className="text-red-500">{formatCurrency(selectedRental.total_fees ?? 0)}</span>
                                    </div>
                                  </div>
                                </div>

                                {(selectedRental.staff_notes || selectedRental.customer_notes) && (
                                  <div className="border-t pt-4">
                                    <p className="text-sm font-medium mb-2">Ghi chú</p>
                                    <div className="space-y-2 text-sm text-gray-600">
                                      {selectedRental.staff_notes && (
                                        <div>
                                          <span className="font-medium">Nhân viên: </span>
                                          {selectedRental.staff_notes}
                                        </div>
                                      )}
                                      {selectedRental.customer_notes && (
                                        <div>
                                          <span className="font-medium">Khách hàng: </span>
                                          {selectedRental.customer_notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs text-gray-500 border-t pt-2">Tạo lúc: {formatDate(selectedRental.createdAt)}</div>
                              </div>
                            </div>
                          ) : (
                            <div>Không có dữ liệu</div>
                          )}
                          <div className="mt-4 text-right">
                            <DialogClose asChild>
                              <button className="px-4 py-2 bg-muted rounded">Đóng</button>
                            </DialogClose>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalHistory;
