import apiClient from './config';

export const paymentAPI = {
  // Test endpoint để giả lập thanh toán thành công
  fakeSuccess: async (temp_id: string): Promise<any> => {
    const response = await apiClient.post('/payments/vnpay/fake-success', { temp_id });
    return response.data;
  },
};
