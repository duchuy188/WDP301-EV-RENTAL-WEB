export interface Station {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  available_quantity?: number;
}

export interface AvailableColor {
  sample_vehicle_id: string;
  price_per_day: number;
  deposit_percentage: number;
  color: string;
  available_quantity: number;
}

// Interface for individual vehicle detail
export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  color: string;
  battery_capacity: number;
  max_range: number;
  price_per_day: number;
  deposit_percentage: number;
  images: string[];
  station: Station;
  available_colors: AvailableColor[];
  createdAt: string;
  updatedAt: string;
}

// Interface for vehicles list (FindCar API response)
export interface VehicleListItem {
  brand: string;
  model: string;
  year: number;
  type: string;
  color: string;
  battery_capacity: number;
  max_range: number;
  price_per_day: number;
  deposit_percentage: number;
  available_quantity: number;
  sample_image: string;
  sample_vehicle_id: string;
  all_vehicle_ids: string[];
  stations: Station[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  timestamp: string;
}

export interface VehiclesResponse {
  vehicles: VehicleListItem[];
  pagination: Pagination;
}