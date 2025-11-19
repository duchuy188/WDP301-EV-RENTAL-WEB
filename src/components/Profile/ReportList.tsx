import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import ReportDetail from './ReportDetail';
import { reportAPI } from '@/api/reportAPI';
import { Report } from '@/types/report';
import { toast } from '@/utils/toast';

interface ReportListProps {
  className?: string;
}

const ReportList: React.FC<ReportListProps> = ({ className }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const itemsPerPage = 5;

  // View report modal
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await reportAPI.getMyReports();
        
        if (response && response.success && response.data) {
          setReports(response.data);
        } else {
          setReports([]);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Không thể tải danh sách báo cáo');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-2 border-yellow-600 dark:border-yellow-500';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-2 border-green-600 dark:border-green-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-2 border-gray-600 dark:border-gray-500';
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

  // Filter and sort
  const filtered = reports
    .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danh sách báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Danh sách báo cáo</span>
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">--</SelectItem>
                    <SelectItem value="pending">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Mới nhất</SelectItem>
                    <SelectItem value="date-asc">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginated.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="border border-gray-200 rounded-lg">
                    <TableHeader className="bg-gray-100 dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Mã báo cáo</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Loại sự cố</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Biển số xe</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Ngày báo cáo</TableHead>
                        <TableHead className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Trạng thái</TableHead>
                        <TableHead className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((report) => (
                        <TableRow key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <TableCell className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                            {report.code}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {getIssueTypeText(report.issue_type)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {report.vehicle_id.license_plate}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {report.createdAt.split(' ')[0]}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Badge className={`${getStatusColor(report.status)} px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap`}>
                              {getStatusText(report.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setViewReportOpen(true);
                              }}
                              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-xs font-semibold whitespace-nowrap border-2 border-blue-700 dark:border-blue-600"
                              aria-label={`Xem chi tiết ${report.code}`}
                            >
                              Xem chi tiết
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} trong {filtered.length} kết quả
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                      </Button>
                      <span className="text-sm font-medium">
                        Trang {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {reports.length === 0
                    ? 'Bạn chưa có báo cáo nào'
                    : statusFilter === 'all'
                    ? 'Không có kết quả'
                    : `Không có báo cáo với trạng thái "${getStatusText(statusFilter)}"`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Thử thay đổi bộ lọc để xem các báo cáo khác.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Report modal */}
      <Dialog open={viewReportOpen} onOpenChange={setViewReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết về báo cáo sự cố.
            </DialogDescription>
          </DialogHeader>
          {selectedReport ? <ReportDetail report={selectedReport} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportList;
