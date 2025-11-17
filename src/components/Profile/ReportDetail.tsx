import React from 'react';
import { Report } from '@/types/report';
import { Badge } from '@/components/ui/badge';

interface ReportDetailProps {
  report: Report;
}

const ReportDetail: React.FC<ReportDetailProps> = ({ report }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-2 border-yellow-600';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-2 border-green-600';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-2 border-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
      default:
        return status;
    }
  };

  const getIssueTypeText = (type: string) => {
    switch (type) {
      case 'vehicle_breakdown':
        return 'Xe hỏng';
      case 'battery_issue':
        return 'Vấn đề pin';
      case 'accident':
        return 'Tai nạn';
      case 'other':
        return 'Khác';
      default:
        return type;
    }
  };

  const userInfo = typeof report.user_id === 'object' ? report.user_id : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
        <div>
          <p className="text-xs font-medium text-blue-100 dark:text-blue-200 uppercase tracking-wide mb-1">Mã báo cáo</p>
          <h3 className="text-xl font-bold text-white">{report.code}</h3>
          <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">Mã thuê xe: {report.rental_id.code}</p>
        </div>
        <Badge className={`${getStatusColor(report.status)} px-3 py-1 rounded-md text-sm font-semibold`}>
          {getStatusText(report.status)}
        </Badge>
      </div>

      {/* Thông tin chung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loại sự cố</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{getIssueTypeText(report.issue_type)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian báo cáo</p>
            <p className="text-base text-gray-900 dark:text-white">{formatDate(report.createdAt)}</p>
          </div>
          {userInfo && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Người báo cáo</p>
              <p className="text-base text-gray-900 dark:text-white">{userInfo.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{userInfo.phone}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Xe</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{report.vehicle_id.license_plate}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{report.vehicle_id.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trạm</p>
            <p className="text-base text-gray-900 dark:text-white">{report.station_id.name}</p>
            {report.station_id.address && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{report.station_id.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mô tả */}
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Mô tả sự cố</p>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.description}</p>
        </div>
      </div>

      {/* Hình ảnh */}
      {report.images && report.images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Hình ảnh</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {report.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Hình ảnh ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ))}
          </div>
        </div>
      )}

      {/* Giải quyết */}
      {report.status === 'resolved' && (
        <div className="border-t pt-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Thông tin giải quyết</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian giải quyết</p>
              <p className="text-base text-gray-900 dark:text-white">{formatDate(report.resolved_at)}</p>
            </div>
            {report.resolution_notes && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Ghi chú giải quyết</p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.resolution_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;
