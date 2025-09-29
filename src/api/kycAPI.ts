import { KYCIdentityResponse, KYCIdentityCardResponse } from '@/types/kyc';
import axiosInstance from './config';
import type { KYCLicenseFrontResponse, KYCLicenseBackResponse, KYCStatusResponse } from '@/types/kyc';

// Generic helper to POST a File as multipart/form-data under key 'image'
const postFile = async <T>(endpoint: string, file: File): Promise<T> => {
  const form = new FormData();
  form.append('image', file, file.name);
  try {
    const resp = await axiosInstance.post<T>(endpoint, form);
    return resp.data;
  } catch (err: any) {
    console.error(`Upload to ${endpoint} failed:`, err?.response?.data || err.message);
    throw err;
  }
};

export const uploadIdentityCardFront = async (imageFile: File): Promise<KYCIdentityResponse> => {
  return postFile<KYCIdentityResponse>('/kyc/identity-card/front', imageFile);
};

export const uploadIdentityCardBack = async (imageFile: File): Promise<KYCIdentityCardResponse> => {
  return postFile<KYCIdentityCardResponse>('/kyc/identity-card/back', imageFile);
};

export const uploadLicenseFront = async (imageFile: File): Promise<KYCLicenseFrontResponse> => {
  return postFile<KYCLicenseFrontResponse>('/kyc/license/front', imageFile);
};

export const uploadLicenseBack = async (imageFile: File): Promise<KYCLicenseBackResponse> => {
  return postFile<KYCLicenseBackResponse>('/kyc/license/back', imageFile);
};

export const getKYCStatus = async () => {
  try {
    const response = await axiosInstance.get('/kyc/status');
    return response.data;
  } catch (error: any) {
    console.error('Error getting KYC status:', error?.response?.data || error.message);
    throw error;
  }
};