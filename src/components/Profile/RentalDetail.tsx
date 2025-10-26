import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Car, User, MapPin, CreditCard, FileText, Clock, Gauge, Battery, Sparkles, Hash, Download, Eye, Star, MessageSquare, AlertCircle } from 'lucide-react';
import { Rental } from '@/types/rentals';
import { Contract } from '@/types/contracts';
import { Feedback } from '@/types/feedback';
import { contractAPI } from '@/api/constractAPI';
import { feedbackAPI } from '@/api/feedbackAPI';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ContractViewer from './ContractViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/utils/toast';

interface Props {
  rental: Rental;
}

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

const formatDate = (dateString?: string | null) => {
  const d = parseBookingDate(dateString);
  if (d.getTime() === 0) return '-';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPrice = (price?: number) => {
  try {
    return new Intl.NumberFormat('vi-VN').format(price ?? 0) + ' đ';
  } catch (e) {
    return (price ?? 0) + ' đ';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
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
    default:
      return status;
  }
};

const RentalDetail: React.FC<Props> = ({ rental }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  // Expansion states
  const [showContractDetail, setShowContractDetail] = useState(false);
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);

  // Fetch contract related to this rental
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoadingContract(true);
        console.log('🔍 Fetching contracts for rental:', rental._id, rental.code);
        // Try to fetch contracts and find the one matching this rental ID
        const response = await contractAPI.getContracts({ limit: 100 });
        console.log('📥 Contract API response:', response);
        
        if (response.success && response.data.contracts) {
          console.log('📋 Total contracts found:', response.data.contracts.length);
          
          // Find contract that matches this rental ID
          const matchedContract = response.data.contracts.find((c) => {
            const isMatch = c.rental._id === rental._id;
            console.log(`  🔸 Contract ${c.code}: rental_id=${c.rental._id}, match=${isMatch}`);
            return isMatch;
          });
          
          console.log('✅ Matched contract:', matchedContract ? `Found (${matchedContract.code})` : 'None');
          setContract(matchedContract || null);
        } else {
          console.log('⚠️ No contracts data in response');
          setContract(null);
        }
      } catch (error) {
        console.error('❌ Failed to fetch contract for rental:', error);
        setContract(null);
      } finally {
        setLoadingContract(false);
      }
    };

    fetchContract();
  }, [rental._id, rental.code]);

  // Fetch feedback related to this rental
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoadingFeedback(true);
        console.log('🔍 Fetching feedbacks for rental:', rental._id, rental.code);
        const response = await feedbackAPI.getFeedbacks();
        console.log('📥 Feedback API response:', response);
        
        let feedbackList: Feedback[] = [];
        if (response && response.success && response.data) {
          feedbackList = response.data.feedbacks || [];
        } else if (Array.isArray(response)) {
          feedbackList = response;
        }
        
        console.log('📋 Total feedbacks found:', feedbackList.length);

        // Find feedback that matches this rental ID
        const matchedFeedback = feedbackList.find((f) => {
          const rid = f.rental_id;
          let ridString = '';
          
          if (typeof rid === 'string') {
            ridString = rid;
          } else if (typeof rid === 'object' && rid !== null) {
            ridString = (rid as any)._id || '';
          }
          
          const isMatch = ridString === rental._id;
          console.log(`  🔸 Feedback ${f._id}: rental_id=${ridString}, match=${isMatch}`);
          
          return isMatch;
        });
        
        console.log('✅ Matched feedback:', matchedFeedback ? `Found (${matchedFeedback._id})` : 'None');
        setFeedback(matchedFeedback || null);
      } catch (error) {
        console.error('❌ Failed to fetch feedback for rental:', error);
        setFeedback(null);
      } finally {
        setLoadingFeedback(false);
      }
    };

    fetchFeedback();
  }, [rental._id, rental.code]);

  const handleDownloadContract = async () => {
    if (!contract) return;
    
    try {
      toast.success('Đang tải...', 'Vui lòng đợi trong giây lát');
      const blob = await contractAPI.downloadContractPDF(contract._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hop-dong-${contract.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Thành công', 'Đã tải hợp đồng về máy');
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      toast.error('Lỗi', 'Không thể tải file hợp đồng');
    }
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

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getContractStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Đã ký';
      case 'pending':
        return 'Chờ ký';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Code and Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white font-mono">{rental.code}</h3>
          </div>
          <Badge className={`${getStatusColor(rental.status)} text-sm px-3 py-1`}>{getStatusText(rental.status)}</Badge>
        </div>
      </div>

      {/* Thông tin chi tiết - Gộp tất cả vào một khung */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-600 rounded">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-semibold text-base text-blue-900 dark:text-blue-100">Thông tin chi tiết</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Thông tin người thuê, xe, trạm - Cột dọc */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-900 space-y-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Người thuê</p>
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{typeof rental.user_id === 'string' ? rental.user_id : rental.user_id?.fullname ?? '-'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{typeof rental.user_id === 'string' ? '' : rental.user_id?.email ?? ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Car className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Xe</p>
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{typeof rental.vehicle_id === 'string' ? rental.vehicle_id : rental.vehicle_id?.name ?? rental.vehicle_id?.license_plate ?? '-'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{typeof rental.vehicle_id === 'string' ? '' : rental.vehicle_id?.model ?? ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Trạm thuê xe</p>
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{typeof rental.station_id === 'string' ? rental.station_id : rental.station_id?.name ?? '-'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{typeof rental.station_id === 'string' ? '' : rental.station_id?.address ?? ''}</p>
              </div>
            </div>
          </div>

          {/* Thời gian thuê và Tổng phí - Gộp chung */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700 space-y-3">
            {/* Thời gian thuê */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                <h5 className="font-semibold text-sm text-green-900 dark:text-green-100">Thời gian thuê</h5>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bắt đầu:</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{formatDate(rental.actual_start_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Kết thúc:</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{formatDate(rental.actual_end_time)}</span>
                </div>
              </div>
            </div>

            {/* Tổng phí */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h5 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Tổng phí</h5>
              </div>
              <p className="font-bold text-2xl text-purple-600 dark:text-purple-400 text-center mb-2">
                {rental.payments && rental.payments.length > 0 
                  ? formatPrice(rental.payments.reduce((sum, p) => sum + (p.amount || 0), 0))
                  : formatPrice(rental.total_fees ?? 0)
                }
              </p>
              {rental.payments && rental.payments.length > 0 && (
                <div className="space-y-1.5">
                  {rental.payments.map((payment, idx) => {
                    const getPaymentMethodLabel = (method: string) => {
                      switch (method.toLowerCase()) {
                        case 'vnpay':
                          return 'VNPay';
                        case 'cash':
                          return 'Tiền mặt';
                        case 'momo':
                          return 'MoMo';
                        case 'bank_transfer':
                          return 'Chuyển khoản';
                        default:
                          return method;
                      }
                    };
                    
                    return (
                      <div key={payment._id || idx} className="flex items-center justify-between text-sm bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1.5 border border-purple-100 dark:border-purple-800">
                        <span className="text-gray-600 dark:text-gray-400">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </span>
                        <span className={`font-medium ${
                          payment.status === 'completed' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {formatPrice(payment.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tình trạng xe */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-orange-600 rounded">
            <Car className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-semibold text-base text-orange-900 dark:text-orange-100">Tình trạng xe</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded p-3 border border-orange-200 dark:border-orange-700">
            <p className="text-sm font-semibold mb-2 text-orange-900 dark:text-orange-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Lúc nhận
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Gauge className="h-4 w-4" />Km:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.mileage ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Battery className="h-4 w-4" />Pin:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.battery_level ?? '-'}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.exterior_condition ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.interior_condition ?? '-'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3 border border-orange-200 dark:border-orange-700">
            <p className="text-sm font-semibold mb-2 text-orange-900 dark:text-orange-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Lúc trả
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Gauge className="h-4 w-4" />Km:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.mileage ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Battery className="h-4 w-4" />Pin:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.battery_level ?? '-'}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.exterior_condition ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.interior_condition ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      {(rental.staff_notes || rental.customer_notes) && (
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-yellow-600 rounded">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-semibold text-base text-yellow-900 dark:text-yellow-100">Ghi chú</h4>
          </div>
          <div className="space-y-2">
            {rental.staff_notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">Nhân viên</p>
                <p className="text-sm text-gray-900 dark:text-white">{rental.staff_notes}</p>
              </div>
            )}
            {rental.customer_notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">Khách hàng</p>
                <p className="text-sm text-gray-900 dark:text-white">{rental.customer_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Section */}
      {!loadingContract && contract && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 overflow-hidden">
          <button
            onClick={() => setShowContractDetail(!showContractDetail)}
            className="w-full p-3 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-600 rounded">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Hợp đồng liên quan</h4>
              <Badge className={getContractStatusColor(contract.status)}>
                {getContractStatusText(contract.status)}
              </Badge>
            </div>
            <div className="text-purple-600 dark:text-purple-400">
              {showContractDetail ? '▲' : '▼'}
            </div>
          </button>
          
          {showContractDetail && (
            <div className="p-3 pt-0">
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-purple-200 dark:border-purple-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Mã hợp đồng:</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white font-mono">{contract.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ngày ký:</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(contract.customer_signed_at)}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewerOpen(true)}
                    className="flex-1 hover:bg-purple-50 dark:hover:bg-purple-950"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Xem
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadContract}
                    className="flex-1 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Tải PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback/Rating Section */}
      {!loadingFeedback && feedback && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
          <button
            onClick={() => setShowFeedbackDetail(!showFeedbackDetail)}
            className="w-full p-3 flex items-center justify-between hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-600 rounded">
                {feedback.type === 'rating' ? (
                  <Star className="h-4 w-4 text-white" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-white" />
                )}
              </div>
              <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                {feedback.type === 'rating' ? 'Đánh giá của bạn' : 'Khiếu nại của bạn'}
              </h4>
              {feedback.type === 'rating' && feedback.overall_rating && (
                <div className="flex items-center gap-1">
                  {renderRatingStars(feedback.overall_rating)}
                </div>
              )}
            </div>
            <div className="text-yellow-600 dark:text-yellow-400">
              {showFeedbackDetail ? '▲' : '▼'}
            </div>
          </button>
          
          {showFeedbackDetail && (
            <div className="p-3 pt-0">
              {feedback.type === 'rating' && (
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700 space-y-2">
                  {feedback.overall_rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Đánh giá tổng thể:</span>
                      {renderRatingStars(feedback.overall_rating)}
                    </div>
                  )}
                  {feedback.staff_service && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Dịch vụ nhân viên:</span>
                      {renderRatingStars(feedback.staff_service)}
                    </div>
                  )}
                  {feedback.vehicle_condition && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Tình trạng xe:</span>
                      {renderRatingStars(feedback.vehicle_condition)}
                    </div>
                  )}
                  {feedback.station_cleanliness && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Vệ sinh trạm:</span>
                      {renderRatingStars(feedback.station_cleanliness)}
                    </div>
                  )}
                  {feedback.checkout_process && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Quy trình nhận xe:</span>
                      {renderRatingStars(feedback.checkout_process)}
                    </div>
                  )}
                  {feedback.comment && (
                    <div className="mt-2 pt-2 border-t border-yellow-100 dark:border-yellow-800">
                      <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Nhận xét:</p>
                      <p className="text-xs text-gray-900 dark:text-white">{feedback.comment}</p>
                    </div>
                  )}
                </div>
              )}

              {feedback.type === 'complaint' && (
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-700 space-y-2">
                  {feedback.title && (
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Tiêu đề:</p>
                      <p className="text-xs text-gray-900 dark:text-white">{feedback.title}</p>
                    </div>
                  )}
                  {feedback.description && (
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Mô tả:</p>
                      <p className="text-xs text-gray-900 dark:text-white">{feedback.description}</p>
                    </div>
                  )}
                  {feedback.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Danh mục:</span>
                      <Badge variant="outline">{feedback.category}</Badge>
                    </div>
                  )}
                  {feedback.status && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-100 dark:border-red-800">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Trạng thái:</span>
                      <Badge className={feedback.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'}>
                        {feedback.status === 'resolved' ? 'Đã giải quyết' : 'Đang xử lý'}
                      </Badge>
                    </div>
                  )}
                  {feedback.response && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Phản hồi:</p>
                      <p className="text-xs text-gray-900 dark:text-white">{feedback.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading indicators */}
      {(loadingContract || loadingFeedback) && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Đang tải thông tin liên quan...</p>
        </div>
      )}

      {/* Footer - Created time */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
        <Clock className="h-3 w-3" />
        <span>Tạo lúc: {formatDate(rental.createdAt)}</span>
      </div>

      {/* Contract Viewer Dialog */}
      {contract && (
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Xem hợp đồng - {contract.code}
              </DialogTitle>
            </DialogHeader>
            <ContractViewer contractId={contract._id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RentalDetail;
