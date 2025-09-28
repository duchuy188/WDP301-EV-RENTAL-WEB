import axiosInstance from './config';

// Interface cho response của API KYC
export interface KYCIdentityResponse {
  message: string;
  identityCard: {
    id: string;
    name: string;
    dob: string;
    address: string;
    frontImage: string;
  };
  kycStatus: string;
  needBackImage: boolean;
}

// Interface cho request upload ảnh CMND/CCCD
export interface UploadIdentityCardRequest {
  image: string; // Base64 string của ảnh
}

// API upload ảnh mặt trước CMND/CCCD
export const uploadIdentityCardFront = async (imageFile: File): Promise<KYCIdentityResponse> => {
  try {
    // Convert file to base64
    const base64Image = await convertFileToBase64(imageFile);
    
    const requestData: UploadIdentityCardRequest = {
      image: base64Image
    };

    const response = await axiosInstance.post<KYCIdentityResponse>(
      '/api/kyc/identity-card/front',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading identity card front:', error);
    throw error;
  }
};

// Utility function để convert file sang base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// API upload ảnh mặt sau CMND/CCCD (nếu cần)
export const uploadIdentityCardBack = async (imageFile: File): Promise<KYCIdentityResponse> => {
  try {
    const base64Image = await convertFileToBase64(imageFile);
    
    const requestData: UploadIdentityCardRequest = {
      image: base64Image
    };

    const response = await axiosInstance.post<KYCIdentityResponse>(
      '/api/kyc/identity-card/back',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading identity card back:', error);
    throw error;
  }
};

// API lấy trạng thái KYC
export const getKYCStatus = async (): Promise<{status: string; progress: number}> => {
  try {
    const response = await axiosInstance.get('/api/kyc/status');
    return response.data;
  } catch (error) {
    console.error('Error getting KYC status:', error);
    throw error;
  }
};