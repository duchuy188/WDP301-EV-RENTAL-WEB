export interface VehicleCondition {
  mileage: number;
  battery_level: number;
  exterior_condition: string;
  interior_condition: string;
  notes: string;
}

export interface RentalInfo {
  vehicle_condition_before: VehicleCondition;
  vehicle_condition_after: VehicleCondition;
  _id: string;
  code: string;
  booking_id: string;
  user_id: string;
  vehicle_id: {
    _id: string;
    name: string;
    brand: string;
    model: string;
  };
  station_id: {
    _id: string;
    name: string;
    address: string;
  };
  actual_start_time: string;
  actual_end_time: string;
  pickup_staff_id: string;
  return_staff_id: string;
  images_before: string[];
  images_after: string[];
  status: string;
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  total_fees: number;
  staff_notes: string;
  customer_notes: string;
  created_by: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface UserInfo {
  _id: string;
  fullname: string;
  email: string;
}

export interface Feedback {
  _id: string;
  rental_id: RentalInfo | string;
  user_id?: UserInfo | string;
  staff_id?: string | null;
  staff_ids?: string[];
  type: string; // e.g., "rating" or "complaint"
  overall_rating?: number;
  staff_service?: number;
  vehicle_condition?: number;
  station_cleanliness?: number;
  checkout_process?: number;
  title?: string;
  description?: string;
  category?: string; // e.g., "vehicle", "other"
  staff_role?: string;
  status?: string; // e.g., "pending", "resolved"
  response?: string;
  resolved_by?: string;
  comment?: string;
  images?: string[];
  is_active?: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  __v?: number;
}

export interface FeedbackResponse {
  success: boolean;
  data: {
    feedbacks: Feedback[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}