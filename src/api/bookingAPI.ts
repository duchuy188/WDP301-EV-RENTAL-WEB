
import apiClient from './config';
import { BookingListResponse, BookingRequest, BookingResponse } from '@/types/booking';


export const bookingAPI = {
  postBooking: async (data: BookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },
  // Lấy danh sách booking của user (có phân trang)
  getBookings: async (params?: { page?: number; limit?: number }): Promise<BookingListResponse> => {
    const response = await apiClient.get('/bookings/user', { params });
    return response.data;
  },

};