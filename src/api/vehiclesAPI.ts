

import { VehiclesResponse, Vehicle } from '@/types/vehicles';
import apiClient from './config';


export const vehiclesAPI = {
  getVehicles: async (): Promise<VehiclesResponse> => {
    const response = await apiClient.get('/vehicles');
    return response.data;
  },
  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get(`/vehicles/${id}`);
    return response.data;
  }
};