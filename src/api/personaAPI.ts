import { UserStatsResponse } from '@/types/perssonal';

import apiClient from './config';

export const authAPI = {
  //thong ke ca nhan
  getPersonal: async (): Promise<UserStatsResponse> => {
    const response = await apiClient.get('/users/personal-analytics');
    return response.data;
  },
};