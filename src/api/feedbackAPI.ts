import type { Feedback, FeedbackResponse } from '@/types/feedback';
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

  // Get feedbacks for current customer with pagination
  getFeedbacks: async (params?: { 
    type?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
  }): Promise<FeedbackResponse> => {
    const response = await apiClient.get<FeedbackResponse>('/feedback/customer', { params });
    return response.data;
  }
};
 