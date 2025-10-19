import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Car, 
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RentalDetail from './RentalDetail';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { rentalAPI } from '@/api/rentalsAPI';
import { Rental } from '@/types/rentals';
import { toast } from '@/utils/toast';

interface RentalHistoryProps {
  className?: string;
}

const RentalHistory: React.FC<RentalHistoryProps> = ({ className }) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const itemsPerPage = 5;

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await rentalAPI.getRentals().catch((e) => {
          console.warn('Failed to fetch rentals', e);
          return null as any;
        });
        if (data && data.rentals) {
          setRentals(data.rentals);
        } else if (data && Array.isArray(data)) {
          // some APIs may return array directly
          setRentals(data as Rental[]);
        } else {
          setRentals([]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Không thể tải lịch sử thuê xe');
        setRentals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const formatTime = (dateString?: string | null) => {
    const d = parseBookingDate(dateString);
    if (d.getTime() === 0) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString?: string | null) => {
    const d = parseBookingDate(dateString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
    } catch (e) {
      return price + ' đ';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
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
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Only show allowed statuses in the listing
  const allowedStatuses = new Set(['active', 'pending_payment', 'completed']);

  // Filter and sort
  const filtered = rentals
    .filter((r) => (statusFilter === 'all' ? allowedStatuses.has(r.status) : r.status === statusFilter))
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return parseBookingDate(b.createdAt || b.actual_start_time).getTime() - parseBookingDate(a.createdAt || a.actual_start_time).getTime();
        case 'date-asc':
          return parseBookingDate(a.createdAt || a.actual_start_time).getTime() - parseBookingDate(b.createdAt || b.actual_start_time).getTime();
        case 'price-desc':
          return (b.total_fees ?? 0) - (a.total_fees ?? 0);
        case 'price-asc':
          return (a.total_fees ?? 0) - (b.total_fees ?? 0);
        default:
          return 0;
      }
    });

  const clientTotalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalTrips = rentals.length;
  const totalSpent = rentals.reduce((s, r) => s + (r.total_fees ?? 0), 0);
  const activeTrips = rentals.filter((r) => r.status === 'active' || r.status === 'confirmed').length;

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Lịch sử thuê xe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Car className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng lượt thuê</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chi tiêu</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang thuê</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{activeTrips}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table and filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử thuê xe</span>
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">--</SelectItem>
                    <SelectItem value="active">Đang thuê</SelectItem>
                    <SelectItem value="pending_payment">Chờ thanh toán</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Mới nhất</SelectItem>
                    <SelectItem value="date-asc">Cũ nhất</SelectItem>
                    <SelectItem value="price-desc">Giá cao nhất</SelectItem>
                    <SelectItem value="price-asc">Giá thấp nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginated.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="border border-gray-200 rounded-lg">
                    <TableHeader className="bg-gray-100 dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="text-left text-gray-600 dark:text-gray-300">Mã</TableHead>
                        <TableHead className="text-left text-gray-600 dark:text-gray-300">Xe</TableHead>
                        <TableHead className="text-left text-gray-600 dark:text-gray-300">Trạm</TableHead>
                        <TableHead className="text-left text-gray-600 dark:text-gray-300">Thời gian</TableHead>
                        <TableHead className="text-left text-gray-600 dark:text-gray-300">Trạng thái</TableHead>
                        <TableHead className="text-right text-gray-600 dark:text-gray-300">Tổng phí</TableHead>
                        <TableHead className="text-right text-gray-600 dark:text-gray-300">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((r) => (
                        <TableRow key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <TableCell className="text-gray-900 dark:text-white font-medium">{r.code ?? r._id}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white font-medium">{typeof r.vehicle_id === 'string' ? r.vehicle_id : r.vehicle_id?.name ?? r.vehicle_id?.license_plate ?? '-'}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{typeof r.station_id === 'string' ? r.station_id : r.station_id?.name ?? '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <div className="font-medium">{formatTime(r.actual_start_time ?? r.createdAt)}</div>
                              <div className="text-xs">{formatDate(r.actual_start_time ?? r.createdAt)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(r.status)} px-3 py-1 rounded-md text-sm`}>{getStatusText(r.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900 dark:text-white">{formatPrice(r.total_fees ?? 0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => { setSelectedRental(r); setDetailOpen(true); }}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                aria-label={`Xem chi tiết ${r.code}`}
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {clientTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} trong {filtered.length} kết quả</p>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                      </Button>
                      <span className="text-sm font-medium">Trang {currentPage} / {clientTotalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, clientTotalPages))} disabled={currentPage === clientTotalPages}>
                        Sau
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {rentals.length === 0 ? 'Bạn chưa có lịch sử thuê xe nào' : (statusFilter === 'all' ? 'Không có kết quả' : `Không có lượt thuê với trạng thái "${getStatusText(statusFilter)}"`) }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thử thay đổi bộ lọc để xem các lượt thuê khác.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết thuê xe</DialogTitle>
          </DialogHeader>
          {selectedRental ? <RentalDetail rental={selectedRental} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalHistory;
