import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BarChart3, TrendingUp, MapPin, AlertCircle, Award, Navigation, Lock } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockUser } from '@/data/mockData';
import { authAPI } from '@/api/personaAPI';
import { UserStatsData } from '@/types/perssonal';
import { formatDateVN, formatDateTimeVN } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import LoadingSpinner from '@/components/LoadingSpinner';

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
            <LoadingSpinner size="xl" />
          </div>
        ) : (
          <>
            {/* Main Stats Cards - Simplified 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-green-100 dark:border-green-900/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <FaMotorcycle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Tổng đặt xe</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalTrips}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 dark:border-green-900/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Quãng đường</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {userStats?.overview.total_distance || 0} km
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 dark:border-green-900/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Tổng chi tiêu</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {formatPrice(totalSpent)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 dark:border-green-900/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Số ngày thuê</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {userStats?.overview.total_days?.toFixed(1) || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Biểu đồ thống kê theo tháng */}
            <Card className="border-green-100 dark:border-green-900/20 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  Thống kê theo tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 flex items-end justify-between gap-1">
                  {monthlyBookings.map((item: any) => {
                    const maxCount = Math.max(...monthlyBookings.map((m: any) => m.count), 1);
                    const hasData = item.count > 0;
                    return (
                      <div key={item.month} className="flex flex-col items-center flex-1">
                        <div className="relative w-full flex items-end justify-center h-44">
                          {hasData ? (
                            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                              <span className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                                {item.count}
                              </span>
                              <div
                                className="bg-green-600 dark:bg-green-500 rounded-t w-full"
                                style={{ height: `${(item.count / maxCount) * 150}px` }}
                              />
                            </div>
                          ) : (
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-t w-full h-2" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Thống kê chi tiết */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Giờ thuê xe */}
              <Card className="border-green-100 dark:border-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-green-600" />
                    Giờ thuê xe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userStats?.peak_hours && userStats.peak_hours.length > 0 ? (
                      userStats.peak_hours.slice(0, 5).map((item: any, index: number) => {
                        const hour = item.hour ?? item._doc?.hour;
                        const count = safeCount(item);
                        const maxCount = Math.max(...userStats.peak_hours.map((h: any) => safeCount(h)), 1);
                        const percentage = (count / maxCount) * 100;
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-12 text-xs font-medium text-gray-600 dark:text-gray-400">
                              {String(hour).padStart(2, '0')}:00
                            </div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                              <div
                                className="h-full bg-green-600 dark:bg-green-500 flex items-center justify-end px-2"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-semibold text-white">{count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Chưa có dữ liệu</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ngày trong tuần */}
              <Card className="border-green-100 dark:border-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Ngày trong tuần
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userStats?.peak_days && userStats.peak_days.length > 0 ? (
                      userStats.peak_days.map((item: any, index: number) => {
                        const dayNum = safeDay(item);
                        const count = safeCount(item);
                        const dayName = item.dayName || dayNumberToName(dayNum);
                        const maxCount = Math.max(...userStats.peak_days.map((d: any) => safeCount(d)), 1);
                        const percentage = (count / maxCount) * 100;
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-16 text-xs font-medium text-gray-600 dark:text-gray-400">
                              {dayName}
                            </div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 dark:bg-blue-500 flex items-center justify-end px-2"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-semibold text-white">{count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Chưa có dữ liệu</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loại xe ưa thích */}
              <Card className="border-green-100 dark:border-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FaMotorcycle className="h-4 w-4 text-green-600" />
                    Loại xe ưa thích
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userStats?.vehicle_preferences && userStats.vehicle_preferences.length > 0 ? (
                      userStats.vehicle_preferences.map((item: any, index: number) => {
                        const total = userStats.vehicle_preferences.reduce((sum: number, v: any) => sum + (v.count || 0), 0);
                        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
                        
                        return (
                          <div key={index} className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.vehicle_type === 'scooter' ? 'Xe ga' : 
                                 item.vehicle_type === 'motorcycle' ? 'Xe số' : 
                                 item.vehicle_type}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{item.count}</span>
                                <span className="text-xs text-gray-500">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-full bg-green-600 dark:bg-green-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        <FaMotorcycle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Chưa có dữ liệu</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trạm thuê xe thường dùng */}
            <Card className="border-green-100 dark:border-green-900/20 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Trạm thuê xe thường dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userStats?.station_preferences && userStats.station_preferences.length > 0 ? (
                    userStats.station_preferences.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mt-0.5">
                            <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 truncate">
                              {item.station_id?.name || 'Unknown Station'}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {item.station_id?.address || 'No address'}
                            </p>
                            <div className="inline-flex px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs font-semibold text-green-700 dark:text-green-400">
                              {item.count} lần
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-gray-400 text-sm">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Chưa có dữ liệu trạm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thông tin thêm */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Thông tin thành viên */}
              <Card className="border-green-100 dark:border-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-green-600" />
                    Thông tin thành viên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thành viên từ</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateVN(memberSince)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lần thuê gần nhất</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userStats?.overview.last_rental_date ? formatDateVN(userStats.overview.last_rental_date) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">TB quãng đường</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userStats?.overview.avg_distance_per_rental || 0} km/chuyến
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">TB chi phí</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatPrice(averageTrip)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thông tin chi tiết */}
              {(computedInsights && computedInsights.length > 0 ? computedInsights : userStats?.insights) && (computedInsights.length > 0 ? computedInsights : (userStats?.insights || [])).length > 0 && (
                <Card className="border-green-100 dark:border-green-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      Thông tin chi tiết
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(computedInsights.length > 0 ? computedInsights : (userStats?.insights || [])).map((insight: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 py-2 text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                          <p className="text-gray-700 dark:text-gray-300 flex-1">{insight}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Cập nhật: {userStats?.last_updated ? formatDateTimeVN(userStats.last_updated) : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;