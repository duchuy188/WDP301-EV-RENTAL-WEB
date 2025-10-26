// Gửi yêu cầu đặt xe
export interface BookingRequest {
  brand: string;
  model: string;
  vehicle_id?: string; 
  color: string;
  station_id: string;
  start_date: string;      // yyyy-mm-dd
  end_date: string;        // yyyy-mm-dd
  pickup_time: string;     // HH:mm
  return_time: string;     // HH:mm
  special_requests?: string;
  notes?: string;
}

// Vehicle info embedded trong booking
export interface BookingVehicle {
  _id: string;
  license_plate: string;
  name: string;
  brand: string;
  model: string;
  color?: string; // Màu xe
  images?: string[];
}

// Station info embedded trong booking
export interface BookingStation {
  _id: string;
  name: string;
  address: string;
  phone: string;
}

// Thông tin chi tiết booking trả về từ API
export interface Booking {
  _id: string;
  code: string;
  user_id: string;
  vehicle_id: BookingVehicle;
  station_id: BookingStation;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  status: string;
  booking_type: string;
  price_per_day: number;
  total_days: number;
  total_price: number;
  deposit_amount: number;
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  final_amount: number;
  special_requests?: string;
  notes?: string;
  cancellation_reason?: string ;
  cancelled_at?: string ;
  cancelled_by?: string ;
  confirmed_at?: string ;
  confirmed_by?: string ;
  qr_code?: string ;
  qr_expires_at?: string ;
  qr_used_at?: string ;
  created_by?: string ;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Kết quả trả về khi đặt xe thành công
export interface BookingResponse {
  message: string;
  booking: Booking;
  requiresKYC: boolean;
}

export interface BookingPagination {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
}

export interface BookingListResponse {
  message: string;
  bookings: Booking[];
  pagination: BookingPagination;
}