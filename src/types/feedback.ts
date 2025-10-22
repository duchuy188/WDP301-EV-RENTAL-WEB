export interface Feedback {
  _id: string;
  rental_id: string;
  user_id?: string;
  staff_id?: string;
  staff_ids?: string[];
  type: string; // e.g., "rating" or "complaint"
  overall_rating?: number;
  staff_service?: number;
  vehicle_condition?: number;
  station_cleanliness?: number;
  checkout_process?: number;
  title?: string;
  description?: string;
  category?: string; // e.g., "vehicle"
  staff_role?: string;
  status?: string; // e.g., "pending"
  response?: string;
  resolved_by?: string;
  comment?: string;
  images?: string[];
  is_active?: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}