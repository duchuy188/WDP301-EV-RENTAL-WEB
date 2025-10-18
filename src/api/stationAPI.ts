import apiClient from './config';
import { StationsResponse } from '../types/station';


export const stationAPI = {
  // Lấy thông tin trạm
  // params: optional query parameters (page, limit, city, district, status, search, etc.)
  getStation: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
    district?: string;
    status?: string;
    search?: string;
  }): Promise<StationsResponse> => {
    const response = await apiClient.get('/stations', { params });
    return response.data as StationsResponse;
  },
  getStationById: async (id: string): Promise<StationsResponse> => {
    const response = await apiClient.get(`/stations/${id}`);
    return response.data as StationsResponse;
  }
};