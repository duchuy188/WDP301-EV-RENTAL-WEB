
import apiClient from './config';
import { BookingListResponse, BookingRequest, BookingResponse } from '@/types/booking';


export const bookingAPI = {
  postBooking: async (data: BookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },
  // Lấy danh sách booking của user (có phân trang)
  getBookings: async (params?: { page?: number; limit?: number }): Promise<BookingListResponse> => {
    const response = await apiClient.get('/bookings/user', { 
      params: {
        ...params,
        populate: 'user_id' // Yêu cầu backend populate thông tin user
      }
    });
    return response.data;
  },

  // Cancel (delete) a booking by id. Accept an optional payload (e.g. { reason })
  // Note: axios.delete only accepts a request body when passed as `data` in the config.
  cancelBooking: async (id: string, payload?: { reason?: string }) => {
    const response = await apiClient.delete(`/bookings/${id}`, { data: payload ?? {} });
    return response.data;
  },

  // Get detailed booking by id
  getBooking: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/bookings/${id}`, {
      params: {
        populate: 'user_id' // Yêu cầu backend populate thông tin user
      }
    });
    return response.data;
  },


};