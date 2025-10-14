import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Car, 
  ChevronLeft,
  ChevronRight,
  MapPin,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ViewBooking from './ViewBooking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookingAPI } from '@/api/bookingAPI';
import { authAPI } from '@/api/personaAPI';
import { UserStatsData } from '@/types/perssonal';
import { Booking } from '@/types/booking';
import { toast } from '@/utils/toast';

interface BookingHistoryProps {
  className?: string;
}

const RentalHistory: React.FC<BookingHistoryProps> = ({ className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  // 'all' means no filter (show all)
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

  // For detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats and bookings in parallel
        const [statsResponse, bookingsResponse] = await Promise.all([
          authAPI.getPersonal().catch((error) => {
            console.warn('Failed to fetch user stats:', error);
            return null;
          }),
          bookingAPI.getBookings({ page: 1, limit: 100 }).catch((error) => {
            console.warn('Failed to fetch bookings:', error);
            return null;
          })
        ]);

        if (statsResponse) {
          setUserStats(statsResponse.data);
        }

        if (bookingsResponse && bookingsResponse.bookings) {
          setBookings(bookingsResponse.bookings);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching booking history:', error);
        toast.error('Không thể tải lịch sử đặt xe');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Remove currentPage dependency since we're doing client-side pagination

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Parse dates returned by backend which may be in "DD/MM/YYYY HH:mm:ss" format
  const parseBookingDate = (dateString?: string | null) => {
    if (!dateString) return new Date(0);

    // Handle 'DD/MM/YYYY' or 'DD/MM/YYYY HH:mm:ss'
    const ddmmyyyyMatch = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateString);
    if (ddmmyyyyMatch) {
      const [datePart, timePart] = dateString.split(' ');
      const [dayStr, monthStr, yearStr] = datePart.split('/');
      const day = Number(dayStr);
      const month = Number(monthStr) - 1; // JS months are 0-based
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

    // Fallbacks: unix timestamp or ISO string
    const asNumber = Number(dateString);
    if (!isNaN(asNumber)) return new Date(asNumber);

    const iso = new Date(dateString);
    if (!isNaN(iso.getTime())) return iso;

    return new Date(0);
  };

  const formatDate = (dateString?: string | null) => {
    const d = parseBookingDate(dateString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleCancel = async (bookingId: string) => {
    const confirm = window.confirm('Bạn có chắc chắn muốn huỷ đặt xe này?');
    if (!confirm) return;

    try {
      setLoading(true);
      await bookingAPI.cancelBooking(bookingId);
      // Optimistically update UI by removing or marking cancelled
      setBookings((prev) => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled', cancelled_at: new Date().toISOString() } : b));
      toast.success('Huỷ đặt xe thành công');
    } catch (error: any) {
      console.error('Failed to cancel booking', error);
      toast.error(error?.response?.data?.message || 'Huỷ đặt xe không thành công');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((booking: Booking) => statusFilter === 'all' || booking.status === statusFilter)
    .sort((a: Booking, b: Booking) => {
      switch (sortBy) {
        case 'date-desc':
          return parseBookingDate(b.createdAt).getTime() - parseBookingDate(a.createdAt).getTime();
        case 'date-asc':
          return parseBookingDate(a.createdAt).getTime() - parseBookingDate(b.createdAt).getTime();
        case 'price-desc':
          return b.total_price - a.total_price;
        case 'price-asc':
          return a.total_price - b.total_price;
        default:
          return 0;
      }
    });

  // For client-side pagination (since we're doing filtering client-side)
  const clientTotalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Statistics from API or fallback to calculations
  const totalTrips = userStats?.overview.total_rentals ?? 0;
  const totalSpent = userStats?.overview.total_spent ?? 0;
  const activeTrips = bookings.filter((booking: Booking) => booking.status === 'active').length;
  
  // Check if user has any booking history
  const hasBookingHistory = totalTrips > 0 || bookings.length > 0;
  const insights = userStats?.insights || [];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Lịch sử đặt xe
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
      {/* Display insights when no booking history */}
      {!hasBookingHistory && insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Car className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Chào mừng đến với dịch vụ đặt xe!
                </h3>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <p key={index} className="text-gray-600 dark:text-gray-300">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Car className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chuyến</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chi tiêu</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(totalSpent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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

      {/* Booking History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Lịch sử đặt xe
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">--</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
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
            {paginatedBookings.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Xe</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Địa điểm</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map((booking: Booking) => {
                        return (
                          <TableRow key={booking._id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={booking.vehicle_id.images?.[0] || '/placeholder-vehicle.jpg'}
                                  alt={`${booking.vehicle_id.brand} ${booking.vehicle_id.model}`}
                                  className="h-12 w-12 rounded-lg object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNkM5IDI2IDkgMTYgMjQgMTZTMzkgMjYgMjQgMjZaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xNCAzMUgxOVYzNkgxNFYzMVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+YXRoIGQ9Ik0yOSAzMUgzNFYzNkgyOVYzMVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {booking.vehicle_id.name} ({booking.vehicle_id.brand})
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {booking.vehicle_id.license_plate}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                  {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {booking.pickup_time} - {booking.return_time}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                {booking.station_id.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-between w-full">
                                <Badge className={getStatusColor(booking.status)}>
                                  {getStatusText(booking.status)}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => { setSelectedBooking(booking); setDetailOpen(true); }}
                                    className="text-sm text-blue-600 hover:underline"
                                    aria-label={`Xem chi tiết ${booking.code}`}
                                  >
                                    Xem chi tiết
                                  </button>
                                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                    <button
                                      onClick={() => handleCancel(booking._id)}
                                      className="text-sm text-red-600 hover:underline ml-2"
                                      aria-label={`Huỷ đặt xe ${booking.code}`}
                                    >
                                      Huỷ
                                    </button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(booking.total_price)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {clientTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} trong {filteredBookings.length} kết quả
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                      </Button>
                      <span className="text-sm font-medium">
                        Trang {currentPage} / {clientTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, clientTotalPages))}
                        disabled={currentPage === clientTotalPages}
                      >
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
                {!hasBookingHistory && insights.length > 0 ? (
                  <div className="space-y-2">
                    {insights.map((insight, index) => (
                      <p key={index} className="text-gray-600 dark:text-gray-300">
                        {insight}
                      </p>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {statusFilter === '' ? 'Chưa có lịch sử đặt xe' : `Không có đặt xe nào với trạng thái "${getStatusText(statusFilter)}"`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {bookings.length === 0 ? 'Hãy bắt đầu đặt xe đầu tiên của bạn!' : 'Thử thay đổi bộ lọc để xem các đặt xe khác.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Modal for booking detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt xe</DialogTitle>
          </DialogHeader>
          {selectedBooking && <ViewBooking bookings={[selectedBooking]} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalHistory;