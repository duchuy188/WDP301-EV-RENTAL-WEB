import type { Feedback } from '@/types/feedback';
import apiClient from './config';

export const feedbackAPI = {
  // Create a new feedback for a rental. Accept either a JSON payload or FormData with files.
  createFeedback: async (payload?: Record<string, any> | FormData): Promise<Feedback> => {
    // If caller passed FormData (files), post it directly and let axios/browser set the Content-Type
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      const response = await apiClient.post<Feedback>('/feedback', payload);
      return response.data;
    }

    // Otherwise send JSON body (payload may be undefined)
    const response = await apiClient.post<Feedback>('/feedback', payload ?? {});
    return response.data;
  },

  // Get feedbacks for current customer
  getFeedbacks: async (): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>('/feedback/customer');
    return response.data;
  }
};
 