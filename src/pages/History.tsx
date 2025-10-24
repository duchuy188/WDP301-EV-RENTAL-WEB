import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Car, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUser } from '@/data/mockData';
import { authAPI } from '@/api/personaAPI';
import { UserStatsData } from '@/types/perssonal';
import { formatDateVN, formatDateTimeVN } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const History: React.FC = () => {
  const { user: authUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-300">Xem lại thống kê cá nhân của bạn</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Car className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng đặt xe</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Thành viên từ</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDateVN(memberSince)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng quãng đường</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{userStats?.overview.total_distance || 0} km</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chi tiêu</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(totalSpent)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trung bình/đặt xe</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(averageTrip)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê theo tháng</CardTitle>
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
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </span>
                                <div
                                  className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm w-full transition-all duration-300 hover:from-green-700 hover:to-green-500"
                                  style={{ height: `${(item.count / maxCount) * 180}px` }}
                                />
                              </div>
                            )}
                            {!hasData && (
                              <div
                                className="bg-gray-200 dark:bg-gray-700 rounded-t-sm w-full"
                                style={{ height: '8px' }}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {(computedInsights && computedInsights.length > 0 ? computedInsights : userStats?.insights) && (computedInsights.length > 0 ? computedInsights : (userStats?.insights || [])).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {(computedInsights.length > 0 ? computedInsights : (userStats?.insights || [])).map((insight: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Cập nhật lần cuối: {userStats?.last_updated ? formatDateTimeVN(userStats.last_updated) : 'N/A'}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </>
        )}
      </div>
    </div>
  );
};

export default History;