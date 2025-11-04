import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Bike,
  MapPin,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { feedbackAPI } from '@/api/feedbackAPI';
import { toast } from '@/utils/toast';
import type { Feedback, RentalInfo } from '@/types/feedback';

const FeedbackHistory: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFeedbacks();
  }, [filterType, filterStatus, currentPage]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      // Build params object, only include non-default values
      const params: any = {};
      
      // Only add page and limit if not default
      if (currentPage !== 1) params.page = currentPage;
      if (10 !== 10) params.limit = 10; // Always use default 10
      
      if (filterType && filterType !== 'all') {
        params.type = filterType;
      }

      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await feedbackAPI.getFeedbacks(Object.keys(params).length > 0 ? params : undefined);

      if (response && response.success && response.data) {
        setFeedbacks(response.data.feedbacks || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        // No data or unsuccessful response
        setFeedbacks([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      
      // Set empty state on error
      setFeedbacks([]);
      setTotalPages(1);
      
      // Only show error toast if it's not a 404 or 400 (might be no data)
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 400) {
        toast.error('Không thể tải danh sách đánh giá');
      } else if (status === 400) {
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-md text-sm whitespace-nowrap">Đã giải quyết</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1 rounded-md text-sm whitespace-nowrap">Đang xử lý</Badge>;
      default:
        return <Badge variant="outline" className="px-2 py-1 rounded-md text-sm whitespace-nowrap">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'rating') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-md text-sm whitespace-nowrap">Đánh giá</Badge>;
    } else if (type === 'complaint') {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-md text-sm whitespace-nowrap">Khiếu nại</Badge>;
    }
    return <Badge variant="outline" className="px-2 py-1 rounded-md text-sm whitespace-nowrap">{type}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const renderRentalInfo = (rentalInfo: RentalInfo) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Bike className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {rentalInfo.vehicle_id.brand} {rentalInfo.vehicle_id.model}
              </p>
              <p className="text-xs text-gray-500">{rentalInfo.vehicle_id.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {rentalInfo.station_id.name}
              </p>
              <p className="text-xs text-gray-500">{rentalInfo.station_id.address}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Mã thuê: <span className="font-medium">{rentalInfo.code}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <p className="text-gray-500 dark:text-gray-400">Bắt đầu</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(rentalInfo.actual_start_time)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <p className="text-gray-500 dark:text-gray-400">Kết thúc</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(rentalInfo.actual_end_time)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderRatingDetails = (feedback: Feedback) => {
    if (feedback.type !== 'rating') return null;

    const ratings = [
      { label: 'Tổng thể', value: feedback.overall_rating },
      { label: 'Dịch vụ nhân viên', value: feedback.staff_service },
      { label: 'Tình trạng xe', value: feedback.vehicle_condition },
      { label: 'Vệ sinh trạm', value: feedback.station_cleanliness },
      { label: 'Quy trình nhận xe', value: feedback.checkout_process }
    ];

    return (
      <div className="space-y-2 mt-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Chi tiết đánh giá:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ratings.map((rating) => (
            rating.value ? (
              <div key={rating.label} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">{rating.label}</span>
                {renderRatingStars(rating.value)}
              </div>
            ) : null
          ))}
        </div>
        {feedback.comment && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Nhận xét:</p>
            <p className="text-sm text-blue-800 dark:text-blue-200">{feedback.comment}</p>
          </div>
        )}
      </div>
    );
  };

  const renderComplaintDetails = (feedback: Feedback) => {
    if (feedback.type !== 'complaint') return null;

    return (
      <div className="space-y-4">
        {/* Title */}
        {feedback.title && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Tiêu đề khiếu nại</p>
                <p className="text-sm text-red-800 dark:text-red-200">{feedback.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {feedback.description && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mô tả chi tiết:</p>
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{feedback.description}</p>
          </div>
        )}

        {/* Category */}
        {feedback.category && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Danh mục:</span>
            <Badge variant="outline">{(() => {
              switch (feedback.category.toLowerCase()) {
                case 'payment': return 'Thanh toán';
                case 'vehicle': return 'Xe';
                case 'staff': return 'Nhân viên';
                case 'service': return 'Dịch vụ';
                case 'other': return 'Khác';
                default: return feedback.category;
              }
            })()}</Badge>
          </div>
        )}

        {/* Staff Info - Show when category is staff */}
        {feedback.category === 'staff' && feedback.staff_role && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Vai trò nhân viên:</span>
                <Badge variant="secondary">
                  {feedback.staff_role === 'pickup' ? 'Nhận xe' : feedback.staff_role === 'return' ? 'Trả xe' : feedback.staff_role}
                </Badge>
              </div>
              {(() => {
                const rental = feedback.rental_id as RentalInfo;
                if (rental && typeof rental === 'object') {
                  const staffName = feedback.staff_role === 'pickup' 
                    ? (typeof rental.pickup_staff_id === 'object' && 'fullname' in rental.pickup_staff_id 
                        ? rental.pickup_staff_id.fullname 
                        : null)
                    : (typeof rental.return_staff_id === 'object' && 'fullname' in rental.return_staff_id 
                        ? rental.return_staff_id.fullname 
                        : null);
                  
                  if (staffName) {
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Nhân viên:</span>
                        <span className="text-sm text-blue-800 dark:text-blue-200">{staffName}</span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Comment/Note */}
        {feedback.comment && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Ghi chú:</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{feedback.comment}</p>
              </div>
            </div>
          </div>
        )}

        {/* Response */}
        {feedback.response && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">Phản hồi từ hệ thống:</p>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">{feedback.response}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!searchQuery) return true;
    
    const rental = feedback.rental_id as RentalInfo;
    const searchLower = searchQuery.toLowerCase();
    
    return (
      rental.code?.toLowerCase().includes(searchLower) ||
      rental.vehicle_id?.name?.toLowerCase().includes(searchLower) ||
      rental.vehicle_id?.brand?.toLowerCase().includes(searchLower) ||
      rental.vehicle_id?.model?.toLowerCase().includes(searchLower) ||
      feedback.title?.toLowerCase().includes(searchLower) ||
      feedback.description?.toLowerCase().includes(searchLower)
    );
  });

  const renderDetailDialog = () => {
    if (!selectedFeedback) return null;
    const rental = selectedFeedback.rental_id as RentalInfo;

    return (
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedFeedback.type === 'rating' ? (
                <>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Chi tiết đánh giá</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span>Chi tiết khiếu nại</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4" />
              {formatDate(selectedFeedback.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Rental Info */}
            <div>
              <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Bike className="w-5 h-5 text-green-600" />
                Thông tin chuyến thuê
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {renderRentalInfo(rental)}
              </div>
            </div>

            {/* Rating or Complaint Details */}
            {selectedFeedback.type === 'rating' && (
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Chi tiết đánh giá
                </h3>
                {renderRatingDetails(selectedFeedback)}
              </div>
            )}
            {selectedFeedback.type === 'complaint' && (
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  Nội dung khiếu nại
                </h3>
                {renderComplaintDetails(selectedFeedback)}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trạng thái:</span>
              {getStatusBadge(selectedFeedback.status)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Lịch sử đánh giá</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Xem và quản lý tất cả đánh giá và phản hồi của bạn
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo mã thuê, xe, nội dung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="rating">Đánh giá</SelectItem>
                  <SelectItem value="complaint">Khiếu nại</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="resolved">Đã giải quyết</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Đang tải...</p>
              </div>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chưa có đánh giá nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Các đánh giá và phản hồi của bạn sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <Table className="border border-gray-200 rounded-lg min-w-[820px]">
                  <TableHeader className="bg-gray-100 dark:bg-gray-800">
                    <TableRow>
                      <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Ngày</TableHead>
                      <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Loại</TableHead>
                      <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Mã thuê</TableHead>
                      <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Xe</TableHead>
                      <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Trạng thái</TableHead>
                      <TableHead className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback, index) => {
                      const rental = feedback.rental_id as RentalInfo;
                      
                      return (
                        <motion.tr
                          key={feedback._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <TableCell className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(feedback.createdAt)}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            {getTypeBadge(feedback.type)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                            {rental.code}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                            {rental.vehicle_id?.brand} {rental.vehicle_id?.model}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            {getStatusBadge(feedback.status)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <button
                              onClick={() => setSelectedFeedback(feedback)}
                              className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                              aria-label={`Xem chi tiết ${rental.code}`}
                            >
                              Xem chi tiết
                            </button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hiển thị trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {renderDetailDialog()}
    </div>
  );
};

export default FeedbackHistory;
