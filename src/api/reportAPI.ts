import { CreateReportRequest, ReportResponse, ReportsListResponse } from '@/types/report';
import apiClient from './config';

export const reportAPI = {
  // Tạo report của rentals
  createReport: async (data: CreateReportRequest): Promise<ReportResponse> => {
    const response = await apiClient.post<ReportResponse>('/reports', data);
    return response.data;
  },
  // Lấy danh sách báo cáo của user
  getMyReports: async (): Promise<ReportsListResponse> => {
    const response = await apiClient.get<ReportsListResponse>('/reports/my-reports');
    return response.data;
  },
};