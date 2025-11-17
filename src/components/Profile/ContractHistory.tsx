import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Calendar,
  MapPin,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ContractDetail from './ContractDetail';
import ContractViewer from './ContractViewer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { contractAPI } from '@/api/constractAPI';
import { Contract } from '@/types/contracts';
import { toast } from '@/utils/toast';

interface ContractHistoryProps {
  className?: string;
}

const ContractHistory: React.FC<ContractHistoryProps> = ({ className }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // web viewer modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContractId, setViewerContractId] = useState<string>('');

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  // Function to fetch data
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add status filter
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add sorting
      const [sortField, sortOrder] = sortBy.split('-');
      params.sort = sortField === 'date' ? 'createdAt' : sortField;
      params.order = sortOrder;

      const response = await contractAPI.getContracts(params);
      
      if (response.success) {
        setContracts(response.data.contracts);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast.error('Lỗi', 'Không thể tải danh sách hợp đồng');
      }
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast.error('Lỗi', error?.response?.data?.message || 'Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, sortBy]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailOpen(true);
  };

  const handleDownloadContract = async (contract: Contract) => {
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

  const handleViewContractOnline = (contract: Contract) => {
    try {
      // Show HTML viewer modal
      setViewerContractId(contract._id);
      setViewerOpen(true);
    } catch (error: any) {
      toast.error('Lỗi', 'Không thể mở hợp đồng. Vui lòng thử lại!');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Đã ký';
      case 'pending':
        return 'Chờ ký';
      case 'expired':
        return 'Hết hạn';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-6 w-6 text-purple-600" />
                Lịch sử hợp đồng
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="signed">Đã ký</SelectItem>
                    <SelectItem value="pending">Chờ ký</SelectItem>
                    <SelectItem value="expired">Hết hạn</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
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
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : contracts.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="font-semibold">Mã hợp đồng</TableHead>
                        <TableHead className="font-semibold">Xe</TableHead>
                        <TableHead className="font-semibold">Trạm</TableHead>
                        <TableHead className="font-semibold">Ngày ký</TableHead>
                        <TableHead className="font-semibold">Trạng thái</TableHead>
                        <TableHead className="font-semibold text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow key={contract._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-gray-400" />
                              <span className="font-mono font-medium">{contract.code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FaMotorcycle className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="font-medium">{contract.vehicle.name}</p>
                                <p className="text-xs text-gray-500">{contract.vehicle.license_plate}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span className="text-sm">{contract.station.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{formatDate(contract.customer_signed_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(contract.status)}>
                              {getStatusText(contract.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(contract)}
                                className="hover:bg-blue-50 dark:hover:bg-blue-950"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Chi tiết
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewContractOnline(contract)}
                                className="hover:bg-purple-50 dark:hover:bg-purple-950"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Xem
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadContract(contract)}
                                className="hover:bg-green-50 dark:hover:bg-green-950"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Tải
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {contracts.map((contract) => (
                    <Card key={contract._id} className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span className="font-mono font-bold">{contract.code}</span>
                          </div>
                          <Badge className={getStatusColor(contract.status)}>
                            {getStatusText(contract.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <FaMotorcycle className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{contract.vehicle.name}</span>
                            <span className="text-gray-500">({contract.vehicle.license_plate})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span className="text-gray-600 dark:text-gray-400">{contract.station.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Ký: {formatDate(contract.customer_signed_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(contract)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem chi tiết
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewContractOnline(contract)}
                              className="flex-1"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Xem online
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadContract(contract)}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Tải PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Trang {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
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
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {statusFilter === 'all' 
                    ? 'Chưa có hợp đồng nào' 
                    : `Không có hợp đồng nào với trạng thái "${getStatusText(statusFilter)}"`
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hợp đồng sẽ được tạo khi bạn hoàn tất các chuyến thuê xe
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Chi tiết hợp đồng
            </DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết về hợp đồng thuê xe.
            </DialogDescription>
          </DialogHeader>
          {selectedContract && <ContractDetail contract={selectedContract} />}
        </DialogContent>
      </Dialog>
      
      {/* Web Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Xem hợp đồng trên web
            </DialogTitle>
            <DialogDescription>
              Xem nội dung hợp đồng trực tuyến.
            </DialogDescription>
          </DialogHeader>
          {viewerContractId && <ContractViewer contractId={viewerContractId} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractHistory;

