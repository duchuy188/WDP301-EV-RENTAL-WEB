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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookingAPI } from '@/api/bookingAPI';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { authAPI } from '@/api/personaAPI';
import { UserStatsData } from '@/types/perssonal';
import { Booking as APIBooking } from '@/types/booking';
import { toast } from '@/utils/toast';

interface RentalHistoryProps {
  className?: string;
}

// Interface để map từ API response về UI
interface UIBooking {
  id: string;
  vehicleName: string;
  vehicleType: string;
  vehicleImage: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  pickupLocation: string;
}

const RentalHistory: React.FC<RentalHistoryProps> = ({ className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [bookings, setBookings] = useState<UIBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

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
          // Map API bookings to UI format
          const uiBookings: UIBooking[] = await Promise.all(
            bookingsResponse.bookings.map(async (booking: APIBooking) => {
              try {
                // Fetch vehicle details for each booking
                const vehicle = await vehiclesAPI.getVehicleById(booking.vehicle_id);
                
                return {
                  id: booking._id,
                  vehicleName: `${vehicle.brand} ${vehicle.model}`,
                  vehicleType: vehicle.type,
                  vehicleImage: vehicle.images?.[0] || '/placeholder-vehicle.jpg',
                  startDate: booking.start_date,
                  endDate: booking.end_date,
                  totalPrice: booking.final_amount,
                  status: booking.status,
                  createdAt: booking.created_at,
                  pickupLocation: vehicle.station?.name || 'Không xác định'
                };
              } catch (error) {
                console.error('Error fetching vehicle details:', error);
                // Return booking with default values if vehicle fetch fails
                return {
                  id: booking._id,
                  vehicleName: 'Xe không xác định',
                  vehicleType: 'car',
                  vehicleImage: '/placeholder-vehicle.jpg',
                  startDate: booking.start_date,
                  endDate: booking.end_date,
                  totalPrice: booking.final_amount,
                  status: booking.status,
                  createdAt: booking.created_at,
                  pickupLocation: 'Không xác định'
                };
              }
            })
          );
          
          setBookings(uiBookings);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching rental history:', error);
        toast.error('Không thể tải lịch sử thuê xe');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
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
      case 'completed':
        return 'Hoàn thành';
      case 'active':
        return 'Đang thuê';
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
    .filter((booking: UIBooking) => statusFilter === 'all' || booking.status === statusFilter)
    .sort((a: UIBooking, b: UIBooking) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-desc':
          return b.totalPrice - a.totalPrice;
        case 'price-asc':
          return a.totalPrice - b.totalPrice;
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
  const activeTrips = bookings.filter((booking: UIBooking) => booking.status === 'active').length;
  
  // Check if user has any rental history
  const hasRentalHistory = totalTrips > 0 || bookings.length > 0;
  const insights = userStats?.insights || [];

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
      {/* Display insights when no rental history */}
      {!hasRentalHistory && insights.length > 0 && (
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
                  Chào mừng đến với dịch vụ thuê xe!
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

      {/* Rental History Table */}
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
                Lịch sử thuê xe
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="active">Đang thuê</SelectItem>
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
                      {paginatedBookings.map((booking: UIBooking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={booking.vehicleImage}
                                alt={booking.vehicleName}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {booking.vehicleName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {booking.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDateTime(booking.createdAt)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {booking.pickupLocation}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(booking.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
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
                {!hasRentalHistory && insights.length > 0 ? (
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
                      {statusFilter === 'all' ? 'Chưa có lịch sử thuê xe' : `Không có chuyến đi nào với trạng thái "${getStatusText(statusFilter)}"`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {bookings.length === 0 ? 'Hãy bắt đầu thuê xe đầu tiên của bạn!' : 'Thử thay đổi bộ lọc để xem các chuyến đi khác.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RentalHistory;