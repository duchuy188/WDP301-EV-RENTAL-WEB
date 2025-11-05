import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  User, 
  MapPin, 
  FileText, 
  Clock, 
  Hash,
  Download,
  CheckCircle2,
  PenTool,
  ExternalLink
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Contract } from '@/types/contracts';
import { toast } from '@/utils/toast';
import { contractAPI } from '@/api/constractAPI';

interface Props {
  contract: Contract;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

const formatDateOnly = (dateString?: string | null) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const getStatusColor = (status: string) => {
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

const getStatusText = (statusText?: string, status?: string) => {
  if (statusText) return statusText;
  
  switch (status) {
    case 'signed':
      return 'Đã ký';
    case 'pending':
      return 'Chờ ký';
    case 'expired':
      return 'Hết hạn';
    default:
      return status || '-';
  }
};

const ContractDetail: React.FC<Props> = ({ contract }) => {
  const handleDownloadContract = async () => {
    try {
      toast.success('Đang tải...', 'Vui lòng đợi trong giây lát');
      
      // Download PDF from API
      const blob = await contractAPI.downloadContractPDF(contract._id);
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `hop-dong-${contract.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Thành công', 'Đã tải hợp đồng về máy');
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      toast.error('Lỗi', error?.response?.data?.message || 'Không thể tải file hợp đồng. Vui lòng thử lại!');
    }
  };

  const handleViewContractOnline = () => {
    try {
      // Get HTML view URL with token
      const viewUrl = contractAPI.getContractViewUrl(contract._id);
      window.open(viewUrl, '_blank');
      toast.success('Đã mở', 'Hợp đồng được mở trong tab mới');
    } catch (error: any) {
      console.error('Error viewing contract:', error);
      toast.error('Lỗi', 'Không thể mở hợp đồng. Vui lòng thử lại!');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Code and Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white font-mono">{contract.code}</h3>
          </div>
          <Badge className={`${getStatusColor(contract.status)} text-xs`}>
            {getStatusText(contract.statusText, contract.status)}
          </Badge>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">{contract.title}</p>
      </div>

      {/* Contract Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleViewContractOnline}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Xem online
        </Button>
        <Button 
          onClick={handleDownloadContract}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Tải PDF
        </Button>
      </div>

      {/* Thời gian hiệu lực */}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-green-600 rounded">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">Thời gian hiệu lực</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded p-2 border border-green-200 dark:border-green-700">
            <span className="text-gray-600 dark:text-gray-400">Từ ngày:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDateOnly(contract.valid_from)}</span>
          </div>
          <div className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded p-2 border border-green-200 dark:border-green-700">
            <span className="text-gray-600 dark:text-gray-400">Đến ngày:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDateOnly(contract.valid_until)}</span>
          </div>
        </div>
      </div>

      {/* Thông tin chuyến thuê */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-purple-600 rounded">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Thông tin chuyến thuê</h4>
        </div>
        <div className="space-y-1 text-xs bg-white dark:bg-gray-800 rounded p-2 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Mã chuyến:</span>
            <span className="font-medium text-gray-900 dark:text-white font-mono">{contract.rental.code}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
            <Badge variant="outline" className="text-xs">
              {contract.rental.status === 'completed' ? 'Hoàn thành' : contract.rental.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-600 rounded">
            <User className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Thông tin chi tiết</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Khách hàng */}
          <div className="bg-white dark:bg-gray-800 rounded p-2 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-1.5">
              <User className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Khách hàng</p>
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{contract.customer.fullname}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contract.customer.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{contract.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Xe */}
          <div className="bg-white dark:bg-gray-800 rounded p-2 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-1.5">
              <FaMotorcycle className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Xe</p>
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{contract.vehicle.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{contract.vehicle.license_plate}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{contract.vehicle.model}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trạm */}
        <div className="mt-3 bg-white dark:bg-gray-800 rounded p-2 border border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Trạm</p>
              <p className="font-medium text-sm text-gray-900 dark:text-white">{contract.station.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{contract.station.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin ký */}
      {(contract.staff_signed_at || contract.customer_signed_at) && (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-600 rounded">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100">Thông tin ký</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contract.staff_signed_at && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-orange-200 dark:border-orange-700">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Nhân viên ký</p>
                <div className="space-y-1">
                  {contract.staff_signed_by && (
                    <>
                      <p className="text-xs text-gray-900 dark:text-white font-medium">{contract.staff_signed_by.fullname}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{contract.staff_signed_by.email}</p>
                    </>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(contract.staff_signed_at)}
                  </div>
                </div>
              </div>
            )}

            {contract.customer_signed_at && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-orange-200 dark:border-orange-700">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Khách hàng ký</p>
                <div className="space-y-1">
                  {contract.customer_signed_by && (
                    <>
                      <p className="text-xs text-gray-900 dark:text-white font-medium">{contract.customer_signed_by.fullname}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{contract.customer_signed_by.email}</p>
                    </>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(contract.customer_signed_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chữ ký */}
      {(contract.staff_signature || contract.customer_signature) && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100/50 dark:from-indigo-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-indigo-600 rounded">
              <PenTool className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">Chữ ký</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contract.staff_signature && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-indigo-200 dark:border-indigo-700">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-1">
                  <PenTool className="h-3 w-3" />
                  Chữ ký nhân viên
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[120px]">
                  <img 
                    src={`data:image/png;base64,${contract.staff_signature}`}
                    alt="Chữ ký nhân viên" 
                    className="max-w-full max-h-[150px] object-contain"
                  />
                </div>
                {contract.staff_signed_by && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {contract.staff_signed_by.fullname}
                  </p>
                )}
              </div>
            )}

            {contract.customer_signature && (
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-indigo-200 dark:border-indigo-700">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-1">
                  <PenTool className="h-3 w-3" />
                  Chữ ký khách hàng
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[120px]">
                  <img 
                    src={`data:image/png;base64,${contract.customer_signature}`}
                    alt="Chữ ký khách hàng" 
                    className="max-w-full max-h-[150px] object-contain"
                  />
                </div>
                {contract.customer_signed_by && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {contract.customer_signed_by.fullname}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ghi chú và điều kiện đặc biệt */}
      {(contract.notes || contract.special_conditions) && (
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-yellow-600 rounded">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">Ghi chú</h4>
          </div>
          <div className="space-y-2">
            {contract.special_conditions && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-yellow-200 dark:border-yellow-700">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Điều kiện đặc biệt</p>
                <p className="text-xs text-gray-900 dark:text-white">{contract.special_conditions}</p>
              </div>
            )}
            {contract.notes && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-yellow-200 dark:border-yellow-700">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Ghi chú</p>
                <p className="text-xs text-gray-900 dark:text-white">{contract.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer - Template & Created time */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          <span>Mẫu: {contract.template.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>Tạo: {formatDateOnly(contract.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;

