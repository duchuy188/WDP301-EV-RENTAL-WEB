import React, { useState, useEffect, useCallback } from 'react';
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
import { feedbackAPI } from '@/api/feedbackAPI';
import FeedbackForm from './FeedbackForm';
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
  // feedback modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRentalId, setFeedbackRentalId] = useState<string | null>(null);
  // rentals that already have feedback
  const [ratedRentalIds, setRatedRentalIds] = useState<string[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  // Function to fetch data (extracted to allow refetching)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch rentals
      const data = await rentalAPI.getRentals().catch((e) => {
        console.warn('Failed to fetch rentals', e);
        return null as any;
      });
      
      // Fetch user's feedbacks to know which rentals were rated
      console.log('🔄 Fetching feedbacks...');
      const fdata = await feedbackAPI.getFeedbacks().catch((err) => {
        console.error('❌ Failed to fetch feedbacks:', err);
        return null;
      });
      
      console.log('📥 Raw feedback response:', fdata);
      
      // Handle different response formats
      let feedbackList: any[] = [];
      if (fdata) {
        if (Array.isArray(fdata)) {
          feedbackList = fdata;
        } else if (fdata && typeof fdata === 'object') {
          // Handle { success: true, data: { feedbacks: [...] } }
          if ((fdata as any).success && (fdata as any).data) {
            feedbackList = (fdata as any).data.feedbacks || [];
          } else {
            // Handle { feedbacks: [...] } or { data: [...] }
            feedbackList = (fdata as any).feedbacks || (fdata as any).data || [];
          }
        }
      }
      
      console.log('📋 Feedback list:', feedbackList, 'Count:', feedbackList.length);
      
      // Extract rental IDs from feedbacks
      const ratedIds: string[] = [];
      if (Array.isArray(feedbackList) && feedbackList.length > 0) {
        feedbackList.forEach((f: any) => {
          const rid = f.rental_id;
          console.log('  📌 Processing feedback:', {
            feedback_id: f._id,
            rental_id: rid,
            rental_id_type: typeof rid,
            type: f.type
          });
          
          if (!rid) return;
          
          // Handle different formats of rental_id
          let rentalId: string | null = null;
          if (typeof rid === 'string') {
            rentalId = rid;
          } else if (typeof rid === 'object' && rid !== null) {
            rentalId = rid._id || rid.id || null;
          }
          
          if (rentalId) {
            ratedIds.push(rentalId);
          }
        });
        
        const uniqueRatedIds = Array.from(new Set(ratedIds));
        console.log('✅ Rated rental IDs:', uniqueRatedIds);
        setRatedRentalIds(uniqueRatedIds);
      } else {
        console.log('⚠️ No feedbacks found');
        setRatedRentalIds([]);
      }
      
      // Set rentals data
      if (data && data.rentals) {
        setRentals(data.rentals);
        console.log('📦 Rentals loaded:', data.rentals.length);
      } else if (data && Array.isArray(data)) {
        setRentals(data as Rental[]);
        console.log('📦 Rentals loaded:', data.length);
      } else {
        setRentals([]);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('Không thể tải lịch sử thuê xe');
      setRentals([]);
      setRatedRentalIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
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
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border-2 border-emerald-600 dark:border-emerald-500';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-2 border-orange-600 dark:border-orange-500';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-500';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-2 border-red-600 dark:border-red-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-2 border-gray-600 dark:border-gray-500';
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
      {/* Table and filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                  <Table className="border border-gray-200 rounded-lg min-w-[820px]">
                    <TableHeader className="bg-gray-100 dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300 w-[90px]">Mã</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300 w-[110px]">Xe</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300 w-[200px]">Trạm</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300 w-[100px]">Trạng thái</TableHead>
                        <TableHead className="px-3 py-2 text-center text-gray-600 dark:text-gray-300 w-[120px]">Hành động</TableHead>
                        <TableHead className="px-3 py-2 text-center text-gray-600 dark:text-gray-300 w-[130px]">Đánh giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((r) => (
                        <TableRow key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium max-w-[90px] truncate">{r.code ?? r._id}</TableCell>
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium max-w-[110px] truncate">{typeof r.vehicle_id === 'string' ? r.vehicle_id : r.vehicle_id?.license_plate ?? r.vehicle_id?.name ?? '-'}</TableCell>
                          <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{typeof r.station_id === 'string' ? r.station_id : r.station_id?.name ?? '-'}</TableCell>
                          <TableCell className="px-3 py-2 max-w-[100px]">
                            <Badge className={`${getStatusColor(r.status)} px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap`}>{getStatusText(r.status)}</Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2 max-w-[120px]">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => { setSelectedRental(r); setDetailOpen(true); }}
                                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-xs font-semibold whitespace-nowrap border-2 border-green-700 dark:border-green-600"
                                aria-label={`Xem chi tiết ${r.code}`}
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2 max-w-[130px]">
                            <div className="flex items-center justify-center">
                              { (() => {
                                const isRated = ratedRentalIds.includes(r._id);
                                const isCompleted = r.status === 'completed';
                                
                                // Debug log
                                console.log(`Rental ${r._id} (${r.code}):`, {
                                  status: r.status,
                                  isRated,
                                  isCompleted,
                                  canRate: isCompleted && !isRated,
                                  ratedRentalIds
                                });
                                
                                // Chỉ cho đánh giá nếu rental đã hoàn thành VÀ chưa được đánh giá
                                if (!isCompleted) {
                                  // Không phải completed -> không hiện nút đánh giá
                                  return (
                                    <span className="px-2 py-1.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 whitespace-nowrap">
                                      Chưa hoàn thành
                                    </span>
                                  );
                                }
                                
                                if (isRated) {
                                  // Đã đánh giá
                                  return (
                                    <button
                                      disabled
                                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1.5 rounded-md cursor-not-allowed text-xs font-semibold whitespace-nowrap border-2 border-green-600 dark:border-green-500"
                                      aria-label={`Đã đánh giá ${r.code}`}
                                    >
                                      Đã đánh giá
                                    </button>
                                  );
                                }
                                
                                // Chưa đánh giá và đã hoàn thành -> hiện nút đánh giá
                                return (
                                  <button
                                    onClick={() => { setFeedbackRentalId(r._id); setFeedbackOpen(true); }}
                                    className="bg-yellow-500 text-white px-2 py-1.5 rounded-md hover:bg-yellow-600 text-xs font-semibold whitespace-nowrap border-2 border-yellow-600 dark:border-yellow-500"
                                    aria-label={`Đánh giá ${r.code}`}
                                  >
                                    Đánh giá
                                  </button>
                                );
                              })()}
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

      {/* Feedback modal */}
      <Dialog open={!!feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Đánh giá chuyến đi</DialogTitle>
          </DialogHeader>
          {feedbackRentalId ? (
            <FeedbackForm
              rentalId={feedbackRentalId}
              // pass staff ids from the rental if available
              staffIds={(() => {
                const r = rentals.find(x => x._id === feedbackRentalId);
                const ids: string[] = [];
                if (r) {
                  const pick = r.pickup_staff_id;
                  const ret = r.return_staff_id;
                  if (pick) ids.push(typeof pick === 'string' ? pick : (pick as any)._id ?? String(pick));
                  if (ret) ids.push(typeof ret === 'string' ? ret : (ret as any)._id ?? String(ret));
                }
                return ids.filter(Boolean);
              })()}
              onClose={() => setFeedbackOpen(false)}
              onSuccess={async (created) => {
                console.log('✅ Feedback created successfully:', created);
                console.log('Current rental ID:', feedbackRentalId);
                
                // Optimistic update: immediately mark this rental as rated
                if (feedbackRentalId) {
                  console.log('➕ Adding rental to rated list:', feedbackRentalId);
                  setRatedRentalIds(prev => {
                    const updated = Array.from(new Set([...prev, feedbackRentalId]));
                    console.log('Updated rated IDs (optimistic):', updated);
                    return updated;
                  });
                  
                  // Also try to extract rental_id from the created feedback response
                  const rentalIdFromResponse = (created as any).rental_id || 
                                               (created as any).rental?._id || 
                                               (created as any).rental?.id;
                  if (rentalIdFromResponse && String(rentalIdFromResponse) !== String(feedbackRentalId)) {
                    console.log('➕ Also adding rental ID from response:', rentalIdFromResponse);
                    setRatedRentalIds(prev => Array.from(new Set([...prev, String(rentalIdFromResponse)])));
                  }
                }
                
                // Close modal
                setFeedbackOpen(false);
                setFeedbackRentalId(null);
                
                // Show success message
                toast.success('Cảm ơn bạn đã đánh giá!');
                
                // Refetch in background to sync with server
                setTimeout(async () => {
                  console.log('🔄 Syncing with server...');
                  try {
                    const fdata = await feedbackAPI.getFeedbacks().catch(() => null);
                    
                    let feedbackList: any[] = [];
                    if (fdata) {
                      if (Array.isArray(fdata)) {
                        feedbackList = fdata;
                      } else if ((fdata as any).success && (fdata as any).data) {
                        feedbackList = (fdata as any).data.feedbacks || [];
                      } else {
                        feedbackList = (fdata as any).feedbacks || (fdata as any).data || [];
                      }
                    }
                    
                    if (feedbackList.length > 0) {
                      const ratedIds: string[] = [];
                      feedbackList.forEach((f: any) => {
                        const rid = f.rental_id;
                        if (!rid) return;
                        
                        let rentalId: string | null = null;
                        if (typeof rid === 'string') {
                          rentalId = rid;
                        } else if (typeof rid === 'object' && rid !== null) {
                          rentalId = rid._id || rid.id || null;
                        }
                        
                        if (rentalId) {
                          ratedIds.push(rentalId);
                        }
                      });
                      
                      const uniqueRatedIds = Array.from(new Set(ratedIds));
                      console.log('✅ Synced rated rental IDs from server:', uniqueRatedIds);
                      setRatedRentalIds(uniqueRatedIds);
                    }
                  } catch (error) {
                    console.warn('Failed to sync feedbacks:', error);
                    // Keep optimistic update even if refetch fails
                  }
                }, 500);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalHistory;
