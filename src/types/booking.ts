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

// Gửi yêu cầu chỉnh sửa booking (edit booking)
export interface BookingUpdateRequest {
  start_date: string;      // yyyy-mm-dd
  end_date: string;        // yyyy-mm-dd
  station_id: string;
  model: string;
  color: string;
  reason: string;          // Lý do chỉnh sửa
}

// Alternative vehicle option khi edit booking fail
export interface AvailableAlternative {
  model: string;
  color: string;
  brand: string;
  available_count: number;
  price_per_day: number;
  estimated_total: number;
}

// Response khi edit booking fail do không còn xe available
export interface BookingUpdateFailedResponse {
  success: false;
  message: string;
  station_name: string;
  dates: string;
  available_alternatives: AvailableAlternative[];
  suggestion: string;
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

// User info embedded trong booking (khi được populate)
export interface BookingUser {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
}

// Thông tin chi tiết booking trả về từ API
export interface Booking {
  _id: string;
  code: string;
  user_id: string | BookingUser; // có thể là string hoặc object khi được populate
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
  edit_count?: number; // Số lần đã chỉnh sửa
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  // Thông tin khách hàng (có thể có hoặc không tùy vào API response)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

// Holding fee info from backend
export interface HoldingFee {
  amount: number;
  status: string;
  payment_url: string;
  expires_at: string;
  expires_in_minutes: number;
}

// Booking details from pending booking response
export interface BookingDetails {
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  total_days: number;
  total_price: number;
  deposit_amount: number;
}

// Vehicle info in pending booking response
export interface PendingVehicle {
  name: string;
  model: string;
  color: string;
  license_plate: string;
  price_per_day: number;
}

// Station info in pending booking response
export interface PendingStation {
  name: string;
  address: string;
}

// Data object trong response của pending booking
export interface PendingBookingData {
  pending_booking_id: string;
  temp_id: string;
  vehicle: PendingVehicle;
  station: PendingStation;
  booking_details: BookingDetails;
  holding_fee: HoldingFee;
  next_steps?: string[];
}

// Kết quả trả về khi đặt xe thành công (với payment URL cho deposit)
export interface BookingResponse {
  success?: boolean;
  message: string;
  booking?: Booking; // Optional vì lúc pending chưa có booking chính thức
  requiresKYC?: boolean;
  requiresPayment?: boolean; // Flag để biết có cần thanh toán hay không
  data?: PendingBookingData; // Data chứa thông tin pending booking và payment URL
}

// Response từ VNPay callback sau khi thanh toán holding fee thành công
export interface PaymentCallbackResponse {
  success: boolean;
  message: string;
  booking?: Booking; // Booking đã được tạo sau khi thanh toán thành công
  data?: {
    booking?: Booking;
    payment?: {
      amount: number;
      status: string;
      transaction_id?: string;
    };
  };
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