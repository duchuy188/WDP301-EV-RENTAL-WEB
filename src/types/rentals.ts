// Types for rentals API
export interface RentalsApiResponse {
  success: boolean;
  message?: string;
  data: RentalsData;
}

export interface RentalsData {
  rentals: Rental[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Rental {
  _id: string;
  code: string;
  booking_id: string;
  user_id: UserSummary | string;
  vehicle_id: VehicleSummary | string;
  station_id: StationSummary | string;
  actual_start_time: string; // ISO date string
  actual_end_time: string;   // ISO date string
  pickup_staff_id?: StaffSummary | string | null;
  return_staff_id?: StaffSummary | string | null;
  vehicle_condition_before: VehicleCondition;
  vehicle_condition_after: VehicleCondition;
  images_before: string[];
  images_after: string[];
  status: RentalStatus;
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  total_fees: number;
  staff_notes?: string | null;
  customer_notes?: string | null;
  created_by: string;
  is_active: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface VehicleCondition {
  mileage: number;
  battery_level: number;
  exterior_condition: string;
  interior_condition: string;
  notes?: string | null;
}

export interface UserSummary {
  _id: string;
  fullname?: string;
  email?: string;
  phone?: string;
}

export interface VehicleSummary {
  _id: string;
  license_plate?: string;
  name?: string;
  model?: string;
}

export interface StationSummary {
  _id: string;
  name?: string;
  address?: string;
}

export interface StaffSummary {
  _id: string;
  fullname?: string;
}

export type RentalStatus = 'active' | 'completed' | 'cancelled' | string;
