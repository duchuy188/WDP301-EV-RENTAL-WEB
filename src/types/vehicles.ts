export interface Station {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  available_quantity?: number;
  latitude?: number;
  longitude?: number;
}

export interface ColorImage {
  color: string;
  images: string[];
  available_quantity: number;
  sample_vehicle_id: string;
}

export interface AvailableColor {
  sample_vehicle_id: string;
  sample_images?: string[];
  images?: string[];
  price_per_day: number;
  deposit_percentage: number;
  color: string;
  available_quantity: number;
  image?: string; // For backward compatibility
  stations?: Station[]; // Stations available for this color
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
  max_speed?: number; // km/h
  power: number; // Watts
  price_per_day: number;
  deposit_percentage: number;
  images: string[];
  station?: Station; // Single station (fallback)
  stations?: Station[]; // Multiple stations (new format)
  available_colors: AvailableColor[];
  color_images?: ColorImage[];
  createdAt: string;
  updatedAt: string;
}

// Interface for vehicles list (FindCar API response)
export interface VehicleListItem {
  // Optional top-level id coming from API (e.g., model name used as id)
  id?: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  color?: string;
  battery_capacity: number;
  max_range: number;
  max_speed?: number; // km/h
  power?: number; // Watts
  price_per_day: number;
  deposit_percentage: number;
  available_quantity?: number;
  total_available_quantity: number;
  sample_image?: string;
  sample_vehicle_id: string;
  all_vehicle_ids: string[];
  stations: Station[];
  color_images: ColorImage[];
  images?: string[]; // Added optional images property
}

// Interface for vehicle filter params
export interface VehicleFilterParams {
  type?: string;
  color?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  station_id?: string;
  page?: number;
  limit?: number;
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