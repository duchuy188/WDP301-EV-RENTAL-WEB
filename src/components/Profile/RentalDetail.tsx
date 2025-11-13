import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, CreditCard, FileText, Clock, Gauge, Battery, Sparkles, Hash, Download, Eye, Star, AlertCircle, UserCog, Image as ImageIcon, DollarSign, RefreshCw } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Rental } from '@/types/rentals';
import { Contract } from '@/types/contracts';
import { Feedback } from '@/types/feedback';
import { contractAPI } from '@/api/constractAPI';
import { feedbackAPI } from '@/api/feedbackAPI';
import { Button } from '@/components/ui/button';
import ContractViewer from './ContractViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/utils/toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  rental: Rental;
  onRebook?: () => void;
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

const RentalDetail: React.FC<Props> = ({ rental, onRebook }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  // Modal states for contract and feedback
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  
  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Fetch contract related to this rental
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoadingContract(true);
        // Try to fetch contracts and find the one matching this rental ID
        const response = await contractAPI.getContracts({ limit: 100 });
        
        if (response.success && response.data.contracts) {
          // Find contract that matches this rental ID
          const matchedContract = response.data.contracts.find((c) => {
            const isMatch = c.rental._id === rental._id;
            return isMatch;
          });
          
          setContract(matchedContract || null);
        } else {
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
        const response = await feedbackAPI.getFeedbacks();
        
        let feedbackList: Feedback[] = [];
        if (response && response.success && response.data) {
          feedbackList = response.data.feedbacks || [];
        } else if (Array.isArray(response)) {
          feedbackList = response;
        }

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
          
          return isMatch;
        });
        
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

  const getCategoryText = (category: string) => {
    switch (category.toLowerCase()) {
      case 'staff':
        return 'Nhân viên';
      case 'vehicle':
        return 'Xe';
      case 'payment':
        return 'Thanh toán';
      case 'service':
        return 'Dịch vụ';
      case 'facility':
        return 'Cơ sở vật chất';
      case 'other':
        return 'Khác';
      default:
        return category;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header với mã rental và trạng thái */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-green-100 uppercase tracking-wide font-medium mb-0.5">Mã thuê xe</p>
              <h3 className="font-bold text-xl text-white font-mono">{rental.code}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(rental.status)} text-sm px-3 py-1.5 font-semibold`}>
              {getStatusText(rental.status)}
            </Badge>
            {onRebook && rental.status === 'completed' && (
              <Button
                onClick={onRebook}
                className="bg-white hover:bg-white/90 text-green-600 border-white hover:border-green-100"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Thuê lại
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid layout 3 cột với card hiện đại */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Thông tin xe */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
          {/* Người thuê section - Hidden
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Người thuê</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Họ và tên</p>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {typeof rental.user_id === 'string' ? rental.user_id : rental.user_id?.fullname ?? '-'}
                </p>
              </div>
              {typeof rental.user_id !== 'string' && rental.user_id?.email && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rental.user_id.email}</p>
                </div>
              )}
              {typeof rental.user_id !== 'string' && rental.user_id?.phone && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Số điện thoại</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{rental.user_id.phone}</p>
                </div>
              )}
            </div>
          </div>
          */}
          
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FaMotorcycle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Xe</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Biển số xe</p>
                <p className="font-bold text-base text-gray-900 dark:text-white font-mono">
                  {typeof rental.vehicle_id === 'string' ? rental.vehicle_id : rental.vehicle_id?.license_plate ?? '-'}
                </p>
              </div>
              {typeof rental.vehicle_id !== 'string' && (rental.vehicle_id?.name || rental.vehicle_id?.model) && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Model</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {rental.vehicle_id?.name ?? ''} {rental.vehicle_id?.model ?? ''}
                  </p>
                </div>
              )}
            </div>
            
            <Separator className="my-3" />
            
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Trạm</h5>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                {typeof rental.station_id === 'string' ? rental.station_id : rental.station_id?.name ?? '-'}
              </p>
              {typeof rental.station_id !== 'string' && rental.station_id?.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{rental.station_id.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Thời gian & Nhân viên */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Thời gian thuê</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Bắt đầu</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatDate(rental.actual_start_time)}</p>
                </div>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Kết thúc</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatDate(rental.actual_end_time)}</p>
                </div>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <UserCog className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Nhân viên</h4>
            </div>
            
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Giao xe</p>
                <p className="font-semibold text-sm text-blue-700 dark:text-blue-300">
                  {typeof rental.pickup_staff_id === 'string' 
                    ? rental.pickup_staff_id 
                    : rental.pickup_staff_id?.fullname ?? '-'}
                </p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Nhận xe</p>
                <p className="font-semibold text-sm text-green-700 dark:text-green-300">
                  {typeof rental.return_staff_id === 'string' 
                    ? rental.return_staff_id 
                    : rental.return_staff_id?.fullname ?? '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Chi phí & Thanh toán */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
          {/* Chỉ hiển thị chi phí phát sinh nếu có phát sinh */}
          {((rental.late_fee ?? 0) > 0 || (rental.damage_fee ?? 0) > 0 || (rental.other_fees ?? 0) > 0 || (rental.total_fees ?? 0) > 0) && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Chi phí phát sinh</h4>
              </div>
              
              <div className="space-y-2">
                {(rental.late_fee ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Phí trễ hạn:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(rental.late_fee ?? 0)}</span>
                  </div>
                )}
                {(rental.damage_fee ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Phí hư hỏng:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(rental.damage_fee ?? 0)}</span>
                  </div>
                )}
                {(rental.other_fees ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Phí khác:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(rental.other_fees ?? 0)}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Tổng phí phát sinh:</span>
                    <span className="font-bold text-base text-red-600 dark:text-red-400">{formatPrice(rental.total_fees ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Thanh toán</h4>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 mb-3">
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-1 text-center">Tổng thanh toán</p>
              <p className="font-bold text-2xl text-purple-600 dark:text-purple-400 text-center">
                {rental.payments && rental.payments.length > 0 
                  ? formatPrice(rental.payments.reduce((sum, p) => sum + (p.amount || 0), 0))
                  : formatPrice(rental.total_fees ?? 0)}
              </p>
            </div>
            
            {rental.payments && rental.payments.length > 0 && (
              <div className="space-y-2">
                {rental.payments.map((payment, idx) => {
                  const getPaymentMethodLabel = (method: string) => {
                    switch (method.toLowerCase()) {
                      case 'vnpay': return 'VNPay';
                      case 'cash': return 'Tiền mặt';
                      case 'momo': return 'MoMo';
                      case 'bank_transfer': return 'Chuyển khoản';
                      default: return method;
                    }
                  };
                  
                  const getPaymentTypeLabel = (type: string) => {
                    switch (type) {
                      case 'rental_fee': return 'Tiền thuê';
                      case 'additional_fee': return 'Phí phát sinh';
                      case 'deposit': return 'Đặt cọc';
                      default: return type;
                    }
                  };
                  
                  return (
                    <div key={payment._id || idx} className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getPaymentTypeLabel(payment.payment_type)}
                        </span>
                        <span className={`font-bold text-sm ${
                          payment.status === 'completed' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {formatPrice(payment.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{getPaymentMethodLabel(payment.payment_method)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tình trạng xe & Hình ảnh - Gộp chung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tình trạng xe */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-orange-600 rounded">
              <FaMotorcycle className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-semibold text-base text-orange-900 dark:text-orange-100">Tình trạng xe</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-orange-200 dark:border-orange-700">
              <p className="text-xs font-semibold mb-2 text-orange-900 dark:text-orange-100 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Lúc nhận
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Gauge className="h-3 w-3" />Km:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.mileage ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Battery className="h-3 w-3" />Pin:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_before?.battery_level ?? '-'}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ngoại hình:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{rental.vehicle_condition_before?.exterior_condition ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kỹ Thuật:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{rental.vehicle_condition_before?.interior_condition ?? '-'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 border border-orange-200 dark:border-orange-700">
              <p className="text-xs font-semibold mb-2 text-orange-900 dark:text-orange-100 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Lúc trả
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Gauge className="h-3 w-3" />Km:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.mileage ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Battery className="h-3 w-3" />Pin:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{rental.vehicle_condition_after?.battery_level ?? '-'}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{rental.vehicle_condition_after?.exterior_condition ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{rental.vehicle_condition_after?.interior_condition ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hình ảnh xe */}
        {((rental.images_before && rental.images_before.length > 0) || (rental.images_after && rental.images_after.length > 0)) && (
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-cyan-600 rounded">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-semibold text-base text-cyan-900 dark:text-cyan-100">Hình ảnh xe</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rental.images_before && rental.images_before.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-cyan-200 dark:border-cyan-700">
                  <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400 mb-2">Lúc nhận ({rental.images_before.length} ảnh)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {rental.images_before.slice(0, 10).map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => { setSelectedImage(img); setImageViewerOpen(true); }}
                        className="relative group overflow-hidden rounded border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all"
                      >
                        <img 
                          src={img} 
                          alt={`Before ${idx + 1}`} 
                          className="w-full h-16 object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                    {rental.images_before.length > 10 && (
                      <div className="flex items-center justify-center h-16 bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">+{rental.images_before.length - 10}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {rental.images_after && rental.images_after.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-cyan-200 dark:border-cyan-700">
                  <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400 mb-2">Lúc trả ({rental.images_after.length} ảnh)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {rental.images_after.slice(0, 10).map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => { setSelectedImage(img); setImageViewerOpen(true); }}
                        className="relative group overflow-hidden rounded border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all"
                      >
                        <img 
                          src={img} 
                          alt={`After ${idx + 1}`} 
                          className="w-full h-16 object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                    {rental.images_after.length > 10 && (
                      <div className="flex items-center justify-center h-16 bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">+{rental.images_after.length - 10}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ghi chú */}
      {(rental.staff_notes || rental.customer_notes || rental.vehicle_condition_before?.notes || rental.vehicle_condition_after?.notes) && (
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-yellow-600 rounded">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-semibold text-base text-yellow-900 dark:text-yellow-100">Ghi chú</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {rental.vehicle_condition_before?.notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700 min-w-0">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Ghi chú lúc nhận</p>
                <p className="text-xs text-gray-900 dark:text-white break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden">{rental.vehicle_condition_before.notes}</p>
              </div>
            )}
            {rental.vehicle_condition_after?.notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700 min-w-0">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Ghi chú lúc trả</p>
                <p className="text-xs text-gray-900 dark:text-white break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden">{rental.vehicle_condition_after.notes}</p>
              </div>
            )}
            {rental.staff_notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700 min-w-0">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Ghi chú nhân viên</p>
                <p className="text-xs text-gray-900 dark:text-white break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden">{rental.staff_notes}</p>
              </div>
            )}
            {rental.customer_notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700 min-w-0">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Ghi chú khách hàng</p>
                <p className="text-xs text-gray-900 dark:text-white break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden">{rental.customer_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract & Feedback Buttons - Side by side */}
      <div className="flex flex-wrap gap-3">
        {/* Contract Section - Button to open modal */}
        {!loadingContract && contract && (
          <button
            onClick={() => setContractModalOpen(true)}
            className="flex-1 min-w-[280px] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200 p-3 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-900/30"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-600 rounded-lg shadow-md">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Hợp đồng liên quan</h4>
                <Badge className={`${getContractStatusColor(contract.status)} text-xs px-2 py-0.5`}>
                  {getContractStatusText(contract.status)}
                </Badge>
              </div>
            </div>
            <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          </button>
        )}

        {/* Feedback/Rating Section - Button to open modal */}
        {!loadingFeedback && feedback && (
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="flex-1 min-w-[280px] bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700 shadow-sm hover:shadow-md transition-all duration-200 p-3 flex items-center justify-between hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-600 rounded-lg shadow-md">
                {feedback.type === 'rating' ? (
                  <Star className="h-4 w-4 text-white" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-white" />
                )}
              </div>
              <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                {feedback.type === 'rating' ? 'Đánh giá của bạn' : 'Khiếu nại của bạn'}
              </h4>
            </div>
            <Eye className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Loading indicators */}
      {(loadingContract || loadingFeedback) && (
        <div className="text-center py-4">
          <LoadingSpinner size="sm" text="Đang tải thông tin liên quan..." />
        </div>
      )}

      {/* Footer - Created time */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
        <Clock className="h-3 w-3" />
        <span>Tạo lúc: {formatDate(rental.createdAt)}</span>
      </div>

      {/* Contract Detail Modal */}
      {contract && (
        <Dialog open={contractModalOpen} onOpenChange={setContractModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Thông tin hợp đồng
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mã hợp đồng</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{contract.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trạng thái</p>
                    <Badge className={getContractStatusColor(contract.status)}>
                      {getContractStatusText(contract.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ngày ký</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(contract.customer_signed_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ngày tạo</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(contract.created_at)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => { setContractModalOpen(false); setViewerOpen(true); }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem hợp đồng đầy đủ
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadContract}
                  className="flex-1 hover:bg-green-50 dark:hover:bg-green-950"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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

      {/* Image Viewer Modal */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-cyan-600" />
              Xem ảnh
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
            <img 
              src={selectedImage} 
              alt="Full size" 
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(selectedImage, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Tải ảnh
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Detail Modal */}
      {feedback && (
        <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {feedback.type === 'rating' ? (
                  <Star className="h-5 w-5 text-yellow-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {feedback.type === 'rating' ? 'Đánh giá của bạn' : 'Khiếu nại của bạn'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {feedback.type === 'rating' && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800 space-y-3">
                  {feedback.overall_rating && (
                    <div className="flex items-center justify-between py-2 border-b border-yellow-200 dark:border-yellow-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đánh giá tổng thể</span>
                      {renderRatingStars(feedback.overall_rating)}
                    </div>
                  )}
                  {feedback.staff_service && (
                    <div className="flex items-center justify-between py-2 border-b border-yellow-200 dark:border-yellow-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dịch vụ nhân viên</span>
                      {renderRatingStars(feedback.staff_service)}
                    </div>
                  )}
                  {feedback.vehicle_condition && (
                    <div className="flex items-center justify-between py-2 border-b border-yellow-200 dark:border-yellow-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tình trạng xe</span>
                      {renderRatingStars(feedback.vehicle_condition)}
                    </div>
                  )}
                  {feedback.station_cleanliness && (
                    <div className="flex items-center justify-between py-2 border-b border-yellow-200 dark:border-yellow-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vệ sinh trạm</span>
                      {renderRatingStars(feedback.station_cleanliness)}
                    </div>
                  )}
                  {feedback.checkout_process && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quy trình nhận xe</span>
                      {renderRatingStars(feedback.checkout_process)}
                    </div>
                  )}
                  {feedback.comment && (
                    <div className="mt-4 pt-4 border-t-2 border-yellow-300 dark:border-yellow-700">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Nhận xét của bạn:</p>
                      <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-700 break-all overflow-wrap-anywhere whitespace-normal">{feedback.comment}</p>
                    </div>
                  )}
                  
                  {/* Images - Hình ảnh đánh giá */}
                  {feedback.images && feedback.images.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                        Hình ảnh đánh giá ({feedback.images.length} ảnh)
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {feedback.images.map((img, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => { setSelectedImage(img); setImageViewerOpen(true); }}
                            className="relative group overflow-hidden rounded border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                          >
                            <img 
                              src={img} 
                              alt={`Rating ${idx + 1}`} 
                              className="w-full h-20 object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {feedback.type === 'complaint' && (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-800 space-y-3">
                  {feedback.title && (
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Tiêu đề</p>
                      <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-700">{feedback.title}</p>
                    </div>
                  )}
                  {feedback.description && (
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Mô tả chi tiết</p>
                      <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-700 break-words whitespace-pre-wrap">{feedback.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {feedback.category && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Danh mục</span>
                        <Badge variant="outline" className="text-sm w-fit">{getCategoryText(feedback.category)}</Badge>
                      </div>
                    )}
                    {feedback.status && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Trạng thái</span>
                        <Badge className={`w-fit ${feedback.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                          {feedback.status === 'resolved' ? 'Đã giải quyết' : 'Đang xử lý'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Staff Info - Nhân viên bị khiếu nại */}
                  {feedback.staff_id && typeof feedback.staff_id === 'object' && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-700">
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-2">Nhân viên liên quan</p>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(feedback.staff_id as any).fullname || '-'}
                        </p>
                        {(feedback.staff_id as any).email && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{(feedback.staff_id as any).email}</p>
                        )}
                        {feedback.staff_role && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {feedback.staff_role === 'pickup' ? 'Nhân viên giao xe' : feedback.staff_role === 'return' ? 'Nhân viên nhận xe' : feedback.staff_role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Images - Hình ảnh khiếu nại */}
                  {feedback.images && feedback.images.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                        Hình ảnh khiếu nại ({feedback.images.length} ảnh)
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {feedback.images.map((img, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => { setSelectedImage(img); setImageViewerOpen(true); }}
                            className="relative group overflow-hidden rounded border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                          >
                            <img 
                              src={img} 
                              alt={`Complaint ${idx + 1}`} 
                              className="w-full h-20 object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {feedback.comment && (
                    <div className="mt-4 pt-4 border-t-2 border-red-300 dark:border-red-700">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">Bình luận:</p>
                      <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-700 break-words whitespace-pre-wrap">{feedback.comment}</p>
                    </div>
                  )}
                  {feedback.response && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border-2 border-green-300 dark:border-green-700">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2">Phản hồi từ hệ thống:</p>
                      <p className="text-sm text-gray-900 dark:text-white break-words whitespace-pre-wrap">{feedback.response}</p>
                    </div>
                  )}

                  {/* Created Date */}
                  {feedback.createdAt && (
                    <div className="pt-3 border-t border-red-200 dark:border-red-700 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Ngày tạo khiếu nại:</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(feedback.createdAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RentalDetail;

