import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Car, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUser } from '@/data/mockData';
import { authAPI } from '@/api/personaAPI';
import { bookingAPI } from '@/api/bookingAPI';
import { UserStatsData } from '@/types/perssonal';
import { formatDateVN, formatDateTimeVN } from '@/lib/utils';
import { Booking } from '@/types/booking';

const History: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi API lấy thống kê người dùng và bookings song song
        const [statsResponse, bookingsResponse] = await Promise.all([
          authAPI.getPersonal(),
          bookingAPI.getBookings({ page: 1, limit: 100 })
        ]);
        
        setUserStats(statsResponse.data);
        setBookings(bookingsResponse.bookings || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Nếu có lỗi, sử dụng dữ liệu rỗng
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Use utility functions for consistent date formatting
  // formatDate and formatDateTime functions removed - using formatDateVN and formatDateTimeVN from utils

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'returned':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'confirmed':
      case 'approved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
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
      case 'pending':
        return 'Chờ xử lý';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Đã từ chối';
      case 'in_progress':
        return 'Đang tiến hành';
      case 'returned':
        return 'Đã trả xe';
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-desc':
          return b.total_price - a.total_price;
        case 'price-asc':
          return a.total_price - b.total_price;
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Analytics data from API or fallback to mock data
  const monthlyBookings = userStats?.monthly_stats && userStats.monthly_stats.length > 0 
    ? userStats.monthly_stats.map((stat: any) => ({
        month: `T${stat.month}`,
        count: stat.rentals
      }))
    : [
        { month: 'T1', count: 0 },
        { month: 'T2', count: 0 },
        { month: 'T3', count: 0 },
        { month: 'T4', count: 0 },
        { month: 'T5', count: 0 },
        { month: 'T6', count: 0 },
  ];

  const totalTrips = userStats?.overview.total_rentals || 0;
  const totalSpent = userStats?.overview.total_spent || 0;
  const averageTrip = userStats?.overview.avg_spent_per_rental || 0;
  // Sử dụng last_rental_date từ API cho "Thành viên từ" hoặc fallback
  const memberSince = userStats?.overview.last_rental_date || mockUser.memberSince;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Lịch sử thuê xe
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Xem lại tất cả các chuyến đi của bạn
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Car className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chuyến</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
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
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Thành viên từ</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatDateVN(memberSince)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng quãng đường</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {userStats?.overview.total_distance || 0} km
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
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
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trung bình/chuyến</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(averageTrip)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Thống kê theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {monthlyBookings.map((item: any) => {
                  const maxCount = Math.max(...monthlyBookings.map((m: any) => m.count), 1); // Tránh chia cho 0
                  return (
                    <div key={item.month} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm w-full transition-all duration-300 hover:from-green-700 hover:to-green-500"
                        style={{
                          height: `${(item.count / maxCount) * 200}px`,
                          minHeight: '20px',
                        }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.month}</span>
                      <span className="text-xs text-gray-500">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Insights Section */}
        {userStats?.insights && userStats.insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {userStats?.insights?.map((insight: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{insight}</p>
                    </div>
                  )) || (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Không có dữ liệu thống kê</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Cập nhật lần cuối: {userStats?.last_updated ? formatDateTimeVN(userStats.last_updated) : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạng thái
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="active">Đang thuê</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Đã từ chối</SelectItem>
                    <SelectItem value="in_progress">Đang tiến hành</SelectItem>
                    <SelectItem value="returned">Đã trả xe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sắp xếp theo
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Ngày mới nhất</SelectItem>
                    <SelectItem value="date-asc">Ngày cũ nhất</SelectItem>
                    <SelectItem value="price-desc">Giá cao nhất</SelectItem>
                    <SelectItem value="price-asc">Giá thấp nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="mr-2 h-4 w-4" />
                  Xuất Excel
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
        >
          {paginatedBookings.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Xe</TableHead>
                    <TableHead>Ngày thuê</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking: Booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Car className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {booking.vehicle_id ? `Xe ID: ${booking.vehicle_id._id.slice(-6)}` : 'Xe không xác định'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.station_id ? `Trạm ID: ${booking.station_id._id.slice(-6)}` : 'Không xác định'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateVN(booking.createdAt)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDateVN(booking.start_date)} {booking.pickup_time}</p>
                          <p className="text-gray-500">{formatDateVN(booking.end_date)} {booking.return_time}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(booking.total_price)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} trong {filteredBookings.length} kết quả
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bạn chưa có chuyến nào
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Hãy bắt đầu chuyến đi đầu tiên của bạn
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Đặt xe ngay
              </Button>
            </div>
          )}
        </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;