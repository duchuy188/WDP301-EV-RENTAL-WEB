import { ReportResponse, ReportsListResponse } from '@/types/report';
import apiClient from './config';

interface CreateReportData {
  rental_id: string;
  issue_type: string;
  description: string;
  images?: File[];
}

export const reportAPI = {
  // Tạo report của rentals
  createReport: async (data: CreateReportData): Promise<ReportResponse> => {
    const formData = new FormData();
    formData.append('rental_id', data.rental_id);
    formData.append('issue_type', data.issue_type);
    formData.append('description', data.description);
    
    // Thêm các file ảnh vào FormData
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await apiClient.post<ReportResponse>('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  // Lấy danh sách báo cáo của user
  getMyReports: async (): Promise<ReportsListResponse> => {
    const response = await apiClient.get<ReportsListResponse>('/reports/my-reports');
    return response.data;
  },
};