import axios from 'axios';
import { API_BASE_URL } from './config';
import { ContractsApiResponse, ContractsData } from '@/types/contracts';

const API_URL = `${API_BASE_URL}/contracts`;

// Get contracts with filters
export const getContracts = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  station_id?: string;
  search?: string;
  sort?: string;
  order?: string;
}): Promise<ContractsApiResponse> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get<ContractsApiResponse>(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  
  return response.data;
};

// Get single contract by ID
export const getContractById = async (id: string): Promise<{ success: boolean; message: string; data: { contract: ContractsData } }> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response.data;
};

// Download contract PDF
export const downloadContractPDF = async (id: string): Promise<Blob> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${API_URL}/${id}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });
  
  return response.data;
};

// View contract online (HTML version)
export const getContractViewUrl = (id: string): string => {
  const token = localStorage.getItem('token');
  return `${API_URL}/${id}/view?token=${token}`;
};

// Get PDF URL (for embedding or direct view)
export const getContractPDFUrl = (id: string): string => {
  const token = localStorage.getItem('token');
  return `${API_URL}/${id}/pdf?token=${token}`;
};

// Get contract HTML content (for inline display)
export const getContractHtml = async (id: string): Promise<string> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(`${API_URL}/${id}/view`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'text',
  });
  
  return response.data;
};

export const contractAPI = {
  getContracts,
  getContractById,
  downloadContractPDF,
  getContractViewUrl,
  getContractPDFUrl,
  getContractHtml,
};

