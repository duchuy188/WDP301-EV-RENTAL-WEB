import { UserStatsResponse } from '@/types/perssonal';
import apiClient from './config';

export const authAPI = {
  // Thống kê cá nhân
  getPersonal: async (): Promise<UserStatsResponse> => {

      const response = await apiClient.get('/users/personal-analytics');
      return response.data;
  }
};