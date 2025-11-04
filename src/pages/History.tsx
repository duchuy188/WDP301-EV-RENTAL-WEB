import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Bike, BarChart3, TrendingUp, MapPin, AlertCircle, Award, Navigation, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockUser } from '@/data/mockData';
import { authAPI } from '@/api/personaAPI';
import { UserStatsData } from '@/types/perssonal';
import { formatDateVN, formatDateTimeVN } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';

const History: React.FC = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!isAuthenticated) {
      toast.warning("Yêu cầu đăng nhập", "Bạn phải đăng nhập để xem thống kê");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await authAPI.getPersonal();
        setUserStats(resp.data);
      } catch (err) {
        console.error('Failed to load personal analytics:', err);
        setUserStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const dayNumberToName = (d: number | undefined | null) => {
    if (d === undefined || d === null) return 'N/A';
    const map: Record<number, string> = {
      0: 'Chủ nhật',
      1: 'Thứ 2',
      2: 'Thứ 3',
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7',
    };
    return map[d] ?? `Thứ ${d}`;
  };

  const safeCount = (item: any) => {
    if (!item) return 0;
    return item.count ?? item._doc?.count ?? (Array.isArray(item.__parentArray) && typeof item.__index === 'number' ? item.__parentArray[item.__index]?.count : 0) ?? 0;
  };

  const safeDay = (item: any) => {
    if (!item) return undefined;
    if (item.day !== undefined) return item.day;
    if (item._doc?.day !== undefined) return item._doc.day;
    if (Array.isArray(item.__parentArray) && typeof item.__index === 'number') {
      return item.__parentArray[item.__index]?.day;
    }
    return undefined;
  };

  const computedInsights: string[] = [];
  if (userStats) {
    computedInsights.push(`Bạn đã thuê xe ${userStats.overview?.total_rentals ?? 0} lần`);
    computedInsights.push(`Tổng quãng đường: ${userStats.overview?.total_distance ?? 0} km`);
    computedInsights.push(`Tổng chi phí: ${userStats.overview?.total_spent ?? 0} VND`);

    if (Array.isArray(userStats.peak_hours) && userStats.peak_hours.length > 0) {
      const topHour = userStats.peak_hours.reduce((prev: any, cur: any) => (safeCount(cur) > safeCount(prev) ? cur : prev), userStats.peak_hours[0]);
      const hour = topHour.hour ?? topHour._doc?.hour;
      const count = safeCount(topHour);
      if (hour !== undefined && count > 0) {
        const hh = String(hour).padStart(2, '0');
        computedInsights.push(`Giờ thuê nhiều nhất: ${hh}:00 (${count} lần)`);
      }
    }

    if (Array.isArray(userStats.peak_days) && userStats.peak_days.length > 0) {
      const topDay = userStats.peak_days.reduce((prev: any, cur: any) => (safeCount(cur) > safeCount(prev) ? cur : prev), userStats.peak_days[0]);
      const dayNum = safeDay(topDay);
      const dayCount = safeCount(topDay);
      const dayName = topDay.dayName ? topDay.dayName : dayNumberToName(dayNum);
      
      if (dayName && dayCount > 0) {
        computedInsights.push(`Ngày thuê nhiều nhất: ${dayName} (${dayCount} lần)`);
      }
    }
  }

  // Create array for all 12 months and fill with data from API
  const monthlyBookings = Array.from({ length: 12 }).map((_, i) => {
    const monthNum = i + 1;
    const monthLabel = `T${monthNum}`;
    
    // Find data for this month from API
    const monthData = userStats?.monthly_stats?.find((stat: any) => stat.month === monthNum);
    
    return {
      month: monthLabel,
      count: monthData?.rentals ?? 0
    };
  });

  const totalTrips = userStats?.overview.total_rentals ?? 0;
  const totalSpent = userStats?.overview.total_spent ?? 0;
  const averageTrip = userStats?.overview.avg_spent_per_rental ?? 0;
  // Use createdAt from auth user, fallback to last_rental_date or mockUser
  const memberSince = authUser?.createdAt || userStats?.overview.last_rental_date || mockUser.memberSince;

  // Hiển thị thông báo yêu cầu đăng nhập nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-green-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <Card className="border-green-100 dark:border-green-900/20 shadow-xl max-w-md mx-auto">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                      <Lock className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      Yêu cầu đăng nhập
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Bạn phải đăng nhập để xem thống kê cá nhân
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Đăng nhập ngay
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      Về trang chủ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-green-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Thống Kê Cá Nhân
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Xem lại hành trình của bạn</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-green-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Bike className="h-10 w-10 text-green-600 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                        <Bike className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng đặt xe</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{totalTrips}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                        <Navigation className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quãng đường</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {userStats?.overview.total_distance || 0} km
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chi tiêu</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatPrice(totalSpent)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                        <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Số ngày thuê</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {userStats?.overview.total_days?.toFixed(1) || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">TB/chuyến</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatPrice(averageTrip)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Stats Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5 }}
              >
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Thống kê theo tháng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-1">
                      {monthlyBookings.map((item: any) => {
                        const maxCount = Math.max(...monthlyBookings.map((m: any) => m.count), 1);
                        const hasData = item.count > 0;
                        return (
                          <div key={item.month} className="flex flex-col items-center flex-1 group">
                            <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                              {hasData && (
                                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                                  <span className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.count}
                                  </span>
                                  <div
                                    className="bg-gradient-to-t from-green-600 via-green-500 to-emerald-400 rounded-t-md w-full transition-all duration-300 hover:from-green-700 hover:via-green-600 hover:to-emerald-500 shadow-lg shadow-green-200/50 dark:shadow-green-900/50"
                                    style={{ height: `${(item.count / maxCount) * 180}px` }}
                                  />
                                </div>
                              )}
                              {!hasData && (
                                <div
                                  className="bg-green-100 dark:bg-green-900/20 rounded-t-md w-full"
                                  style={{ height: '8px' }}
                                />
                              )}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Peak Hours Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.55 }}
              >
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      Giờ thuê xe phổ biến
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userStats?.peak_hours && userStats.peak_hours.length > 0 ? (
                        userStats.peak_hours.slice(0, 5).map((item: any, index: number) => {
                          const hour = item.hour ?? item._doc?.hour;
                          const count = safeCount(item);
                          const maxCount = Math.max(...userStats.peak_hours.map((h: any) => safeCount(h)), 1);
                          const percentage = (count / maxCount) * 100;
                          
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {String(hour).padStart(2, '0')}:00
                              </div>
                              <div className="flex-1 bg-green-100/50 dark:bg-green-900/20 rounded-full h-8 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-end pr-3 shadow-md"
                                >
                                  <span className="text-xs font-bold text-white">{count}</span>
                                </motion.div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Peak Days & Vehicle Preferences */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Peak Days */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.6 }}
              >
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Ngày trong tuần phổ biến
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userStats?.peak_days && userStats.peak_days.length > 0 ? (
                        userStats.peak_days.map((item: any, index: number) => {
                          const dayNum = safeDay(item);
                          const count = safeCount(item);
                          const dayName = item.dayName || dayNumberToName(dayNum);
                          const maxCount = Math.max(...userStats.peak_days.map((d: any) => safeCount(d)), 1);
                          const percentage = (count / maxCount) * 100;
                          
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {dayName}
                              </div>
                              <div className="flex-1 bg-green-100/50 dark:bg-green-900/20 rounded-full h-8 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.8, delay: 0.65 + index * 0.1 }}
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-end pr-3 shadow-md"
                                >
                                  <span className="text-xs font-bold text-white">{count}</span>
                                </motion.div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Vehicle Preferences */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.65 }}
              >
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bike className="h-5 w-5 text-green-600" />
                      Loại xe ưa thích
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userStats?.vehicle_preferences && userStats.vehicle_preferences.length > 0 ? (
                        userStats.vehicle_preferences.map((item: any, index: number) => {
                          const total = userStats.vehicle_preferences.reduce((sum: number, v: any) => sum + (v.count || 0), 0);
                          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                          
                          return (
                            <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/20">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Bike className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                                    {item.vehicle_type === 'scooter' ? 'Xe ga' : 
                                     item.vehicle_type === 'motorcycle' ? 'Xe số' : 
                                     item.vehicle_type}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{item.count}</div>
                                  <div className="text-xs text-gray-500">{percentage}%</div>
                                </div>
                              </div>
                              <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                                  className="h-full bg-gradient-to-r from-green-600 to-emerald-500"
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Bike className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Station Preferences */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Trạm thuê xe thường dùng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userStats?.station_preferences && userStats.station_preferences.length > 0 ? (
                      userStats.station_preferences.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.75 + index * 0.1 }}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/20 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mt-1">
                              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {item.station_id?.name || 'Unknown Station'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {item.station_id?.address || 'No address'}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                  <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                    {item.count} lần
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Chưa có dữ liệu trạm</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Insights & Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Insights */}
              {(computedInsights && computedInsights.length > 0 ? computedInsights : userStats?.insights) && (computedInsights.length > 0 ? computedInsights : (userStats?.insights || [])).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.75 }}
                >
                  <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        Thông tin chi tiết
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(computedInsights.length > 0 ? computedInsights : (userStats?.insights || [])).map((insight: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-900/20"
                          >
                            <div className="w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{insight}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-green-100 dark:border-green-900/20">
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Cập nhật lần cuối: {userStats?.last_updated ? formatDateTimeVN(userStats.last_updated) : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Member Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.8 }}
              >
                <Card className="border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Thông tin thành viên
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Thành viên từ</span>
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {formatDateVN(memberSince)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Lần thuê gần nhất</span>
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {userStats?.overview.last_rental_date ? formatDateVN(userStats.overview.last_rental_date) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10">
                        <span className="text-sm text-gray-600 dark:text-gray-400">TB quãng đường/chuyến</span>
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {userStats?.overview.avg_distance_per_rental || 0} km
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-900/30">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tổng số ngày thuê</span>
                        <span className="text-xl font-bold text-green-700 dark:text-green-400">
                          {userStats?.overview.total_days?.toFixed(1) || 0} ngày
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;