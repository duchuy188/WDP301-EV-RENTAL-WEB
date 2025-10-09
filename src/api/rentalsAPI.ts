
import { RentalsData, RentalsApiResponse } from '@/types/rentals';
import apiClient from './config';

export const rentalAPI = {
  // Lấy lịch sử thuê xe của user
  getRentals: async (): Promise<RentalsData> => {
    const response = await apiClient.get<RentalsApiResponse>('/rentals/user');
    return response.data.data;
  },
};