import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ViewBooking from '../Booking/ViewBooking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookingAPI } from '@/api/bookingAPI';
import { UserStatsData } from '@/types/perssonal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Booking } from '@/types/booking';
import { toast } from '@/utils/toast';

interface BookingHistoryProps {
  className?: string;
}

const BookingHistory: React.FC<BookingHistoryProps> = ({ className }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  // 'all' means no filter (show all)
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [userStats] = useState<UserStatsData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

  // For detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // For cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Note: Edit functionality now uses full page navigation to /booking/edit/:id

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats and bookings in parallel
        const bookingsResponse = await bookingAPI.getBookings({ page: 1, limit: 100 }).catch((error) => {
          console.warn('Failed to fetch bookings:', error);
          return null;
        });

        if (bookingsResponse && bookingsResponse.bookings) {
          // fetch detailed booking for each id in parallel (tolerate failures)
          const detailed = await Promise.allSettled(
            bookingsResponse.bookings.map((b) => bookingAPI.getBooking(b._id).catch((e) => {
              console.warn('Failed to fetch booking detail for', b._id, e);
              return null;
            }))
          );

          const merged = bookingsResponse.bookings.map((orig, idx) => {
            const res = detailed[idx];
            if (res && res.status === 'fulfilled' && res.value) {
              // API returns { booking: Booking } or booking directly; handle both
              const value = res.value as any;
              return value.booking ?? value;
            }
            return orig;
          });

          setBookings(merged);
        }

      } catch (error) {
        toast.error('Không thể tải lịch sử đặt xe');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // const formatPrice = (price: number) => {
  //   // Format as in screenshot: group thousands and append ' đ'
  //   try {
  //     return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  //   } catch (e) {
  //     return price + ' đ';
  //   }
  // };

  const formatTime = (dateString?: string | null) => {
    const d = parseBookingDate(dateString);
    if (d.getTime() === 0) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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

  // Helper function to check if booking can be edited
  const canEditBooking = (booking: Booking): { canEdit: boolean; reason?: string } => {
    // Điều kiện 1: Phải ở trạng thái 'pending' (chưa confirm)
    if (booking.status !== 'pending') {
      return { canEdit: false, reason: 'Chỉ có thể chỉnh sửa đặt xe ở trạng thái "Đang chờ"' };
    }

    // Điều kiện 2: CHỈ ĐƯỢC EDIT 1 LẦN DUY NHẤT (edit_count < 1) - áp dụng cho TẤT CẢ booking
    const editCount = booking.edit_count || 0;
    if (editCount >= 1) {
      return { canEdit: false, reason: 'Bạn đã sử dụng hết lượt chỉnh sửa (tối đa 1 lần)' };
    }

    // Điều kiện 3: Phải chỉnh sửa trước thời gian nhận xe ít nhất 24 giờ
    const startDate = parseBookingDate(booking.start_date);
    
    // Thêm pickup_time vào startDate để tính chính xác thời gian nhận xe
    if (booking.pickup_time) {
      const [hours, minutes] = booking.pickup_time.split(':').map(s => parseInt(s, 10));
      if (!isNaN(hours) && !isNaN(minutes)) {
        startDate.setHours(hours, minutes, 0, 0);
      } else {
        // Nếu không parse được giờ, mặc định là 9:00 sáng
        startDate.setHours(9, 0, 0, 0);
      }
    } else {
      // Nếu không có pickup_time, mặc định là 9:00 sáng
      startDate.setHours(9, 0, 0, 0);
    }
    
    const now = new Date();
    const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      const pickupTimeStr = booking.pickup_time || '09:00';
      const startDateStr = formatDate(booking.start_date);
      return { 
        canEdit: false, 
        reason: `Phải chỉnh sửa trước thời gian nhận xe ít nhất 24 giờ. Thời gian nhận xe: ${startDateStr} lúc ${pickupTimeStr}` 
      };
    }

    return { canEdit: true };
  };

  // Open edit page (navigate to full edit page instead of dialog)
  const openEditDialog = (booking: Booking) => {
    const { canEdit, reason } = canEditBooking(booking);
    
    if (!canEdit) {
      toast.error(reason || 'Không thể chỉnh sửa đặt xe này');
      return;
    }

    // Navigate to edit booking page with booking data
    navigate(`/booking/edit/${booking._id}`, { state: { booking } });
  };


  // Cancellation handled via API elsewhere; removed inline cancel action to match UI design

  // When opening detail modal, ensure we have full booking detail from API
  const openDetail = async (booking: Booking) => {
    try {
      setDetailOpen(true);
      // If the booking already contains detailed fields (e.g. price_per_day), use it; otherwise fetch
      const needsFetch = typeof booking.price_per_day === 'undefined' || !booking.vehicle_id || typeof booking.total_price === 'undefined';
      if (needsFetch) {
        const resp = await bookingAPI.getBooking(booking._id).catch((e) => {
          console.warn('Failed to fetch booking detail', e);
          return null;
        });
        if (resp && resp.booking) {
          setSelectedBooking(resp.booking as Booking);
          // update cached list
          setBookings((prev) => prev.map(b => b._id === resp.booking._id ? resp.booking : b));
          return;
        }
      }
      setSelectedBooking(booking);
    } catch (error) {
      toast.error('Không thể tải chi tiết đặt xe');
      setDetailOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
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
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  // Cancel booking handler
  const confirmCancel = async () => {
    if (!cancelingBooking) return;
    try {
      setCancelLoading(true);
      await bookingAPI.cancelBooking(cancelingBooking._id, cancelReason ? { reason: cancelReason } : {});
      // Update local state: mark as cancelled and update updatedAt/ status fields if present
      setBookings((prev) => prev.map((b) => (b._id === cancelingBooking._id ? { ...b, status: 'cancelled' } : b)));
      toast.success('Đã hủy đặt xe thành công');
    } catch (error) {
      toast.error('Hủy đặt xe thất bại');
    } finally {
      setCancelLoading(false);
      setCancelOpen(false);
      setCancelingBooking(null);
      setCancelReason('');
    }
  };

  // Handle "Book Again" - Navigate to booking page with pre-filled information
  const handleBookAgain = (booking: Booking) => {
    // Prepare vehicle data to pass to booking page
    const vehicleData = {
      _id: booking.vehicle_id._id,
      brand: booking.vehicle_id.brand,
      model: booking.vehicle_id.model,
      name: booking.vehicle_id.name,
      license_plate: booking.vehicle_id.license_plate,
      color: booking.vehicle_id.color,
      images: booking.vehicle_id.images || [],
      price_per_day: booking.price_per_day,
      deposit_percentage: (booking.deposit_amount / booking.total_price) * 100,
      // Add other required fields with default values
      year: 2024,
      type: 'electric',
      battery_capacity: '',
      max_range: '',
      max_speed: '',
      power: '',
      available_colors: booking.vehicle_id.color ? [{ color: booking.vehicle_id.color, price_per_day: booking.price_per_day }] : [],
      station: booking.station_id,
      stations: [booking.station_id],
    };

    // Navigate to booking page with pre-filled data
    // Only pass selectedColor if it's not empty to avoid Select component error
    const navigationState: any = {
      selectedVehicle: vehicleData,
      selectedStation: booking.station_id._id,
      isRebooking: true, // Flag to indicate this is a rebooking (lock vehicle/color/station)
      originalBooking: {
        code: booking.code,
        start_date: booking.start_date,
        end_date: booking.end_date,
        pickup_time: booking.pickup_time,
        return_time: booking.return_time,
      },
    };

    // Only add selectedColor if it exists and is not empty
    if (booking.vehicle_id.color && booking.vehicle_id.color.trim() !== '') {
      navigationState.selectedColor = booking.vehicle_id.color;
    }

    navigate('/booking', { state: navigationState });

    toast.success('Đang thuê lại xe - Chỉ cần chọn thời gian mới');
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

  // Check if user has any booking history
  const hasBookingHistory = bookings.length > 0;
  const insights = userStats?.insights || [];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaMotorcycle className="h-5 w-5" />
              Lịch sử đặt xe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="md" />
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
                <FaMotorcycle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
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
                <FaMotorcycle className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử đặt xe</span>
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
                    <SelectItem value="completed">Hoàn thành</SelectItem>
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
                  <Table className="border border-gray-200 rounded-lg">
                    <TableHeader className="bg-white dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Mã</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Xe</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Trạm</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Thời gian</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Trạng thái</TableHead>
                        <TableHead className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map((booking: Booking) => {
                        return (
                          <TableRow key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium truncate">
                              {booking.code ?? booking._id}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium truncate">
                              {booking.vehicle_id?.license_plate ?? booking.vehicle_id?.name ?? '-'}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate">
                              {booking.station_id?.name ?? '-'}
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                <div className="font-medium">{formatTime(booking.createdAt)}</div>
                                <div className="text-xs">{formatDate(booking.createdAt)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <Badge className={`${getStatusColor(booking.status)} px-2 py-1 rounded-md text-sm whitespace-nowrap`}> 
                                {getStatusText(booking.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => openDetail(booking)} aria-label={`Xem chi tiết ${booking.code}`}>
                                  Xem chi tiết
                                </Button>
                                {/* Show Cancel button only for pending status */}
                                {booking.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setCancelingBooking(booking);
                                      setCancelReason('');
                                      setCancelOpen(true);
                                    }}
                                    aria-label={`Hủy đặt xe ${booking.code}`}
                                  >
                                    Hủy
                                  </Button>
                                )}
                              </div>
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
                <FaMotorcycle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                      {statusFilter === 'all' ? 'Chưa có lịch sử đặt xe' : `Không có đặt xe nào với trạng thái "${getStatusText(statusFilter)}"`}
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
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
          {selectedBooking && (
            <ViewBooking 
              booking={selectedBooking} 
              onEdit={() => {
                setDetailOpen(false);
                openEditDialog(selectedBooking);
              }}
              canEdit={canEditBooking(selectedBooking).canEdit}
              editDisabledReason={canEditBooking(selectedBooking).reason}
              onRebook={() => {
                setDetailOpen(false);
                handleBookAgain(selectedBooking);
              }}
              canRebook={selectedBooking.status === 'completed'}
            />
          )}
        </DialogContent>  
      </Dialog>
      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận hủy đặt xe</DialogTitle>
            <DialogDescription>
              Xác nhận hủy đặt xe. Lưu ý: Hủy đặt xe sẽ không thể hoàn tiền lại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">Bạn có chắc muốn hủy đặt xe <span className="font-medium">{cancelingBooking?.code ?? cancelingBooking?._id}</span>?</p>
            <p className="text-gray-700"><span className="text-red-600 font-semibold">Lưu ý:</span> Hủy đặt xe sẽ không thể hoàn tiền lại.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do (tuỳ chọn)</label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelingBooking(null); setCancelReason(''); }} disabled={cancelLoading}>Huỷ</Button>
              <Button onClick={confirmCancel} disabled={cancelLoading}>{cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit booking is now handled by navigating to /booking/edit/:id page */}
    </div>
  );
};

export default BookingHistory;