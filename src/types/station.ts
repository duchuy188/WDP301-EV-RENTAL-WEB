export interface Station {
  _id: string;
  code?: string;
  name: string;
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  images?: string[];
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  status?: string;
  max_capacity?: number;
  current_vehicles?: number;
  available_vehicles?: number;
  rented_vehicles?: number;
  maintenance_vehicles?: number;
  reserved_vehicles?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface StationsResponse {
  stations: Station[];
  page?: number;
  limit?: number;
  total?: number;
}
