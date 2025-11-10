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
  // return_time được backend tự động tính, không cần gửi
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
  year?: number; // Năm sản xuất
  color?: string; // Màu xe
  price_per_day?: number; // Giá thuê mỗi ngày
  images?: string[];
  type?: string; // Vehicle type
  battery_capacity?: number; // Battery capacity
  max_range?: number; // Maximum range
  max_speed?: number; // Maximum speed
  power?: number; // Power
  deposit_percentage?: number; // Deposit percentage
}

// Station info embedded trong booking
export interface BookingStation {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
}

// User info embedded trong booking (khi được populate)
export interface BookingUser {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
}

// User summary info (for cancelled_by, confirmed_by)
export interface UserSummary {
  _id: string;
  fullname: string;
}

// Thông tin chi tiết booking trả về từ API
export interface Booking {
  holding_fee?: BookingHoldingFee; // Thông tin phí giữ chỗ (sau khi thanh toán)
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
  cancellation_reason?: string;
  cancelled_at?: string | null;
  cancelled_by?: string | UserSummary | null; // có thể là string, object hoặc null
  confirmed_at?: string | null;
  confirmed_by?: string | UserSummary | null; // có thể là string, object hoặc null
  qr_code?: string;
  qr_expires_at?: string;
  qr_used_at?: string | null;
  created_by?: string;
  edit_count?: number; // Số lần đã chỉnh sửa
  edit_reason?: string; // Lý do chỉnh sửa lần cuối
  edit_history?: any[]; // Lịch sử chỉnh sửa
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  // Thông tin khách hàng (có thể có hoặc không tùy vào API response)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

// Payment info embedded trong holding_fee
export interface PaymentInfo {
  _id: string;
  code: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string;
  vnpay_transaction_no?: string;
  vnpay_bank_code?: string;
  createdAt: string;
}

// Holding fee info from backend (for pending booking)
export interface HoldingFee {
  amount: number;
  status: string;
  payment_url: string;
  expires_at: string;
  expires_in_minutes: number;
}

// Holding fee info in booking history (after payment completed)
export interface BookingHoldingFee {
  amount: number;
  status: string;
  payment_method: string;
  paid_at: string;
  payment_id: PaymentInfo;
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

// Data object trong response khi hủy pending booking
export interface CancelPendingBookingData {
  temp_id: string;
  status: string;
  cancelled_at: string;
}

// Response khi hủy pending booking thành công
export interface CancelPendingBookingResponse {
  success: boolean;
  message: string;
  data: CancelPendingBookingData;
}

// Vehicle info in my-pending response
export interface MyPendingVehicle {
  _id: string;
  name: string;
  brand: string;
  model: string;
  color: string;
  license_plate: string;
  price_per_day: number;
  image: string[];
}

// Station info in my-pending response
export interface MyPendingStation {
  _id: string;
  name: string;
  address: string;
  phone: string;
}

// Booking data in my-pending response
export interface MyPendingBookingData {
  vehicle: MyPendingVehicle;
  station: MyPendingStation;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  total_days: number;
  total_price: number;
  price_per_day: number;
}

// Time left info in my-pending response
export interface TimeLeft {
  minutes: number;
  seconds: number;
  formatted: string;
  is_urgent: boolean;
}

// Individual pending booking item
export interface MyPendingBookingItem {
  temp_id: string;
  booking_data: MyPendingBookingData;
  holding_fee_amount: number;
  vnpay_url: string;
  status: string;
  created_at: string;
  expires_at: string;
  time_left: TimeLeft;
}

// Response from GET /api/bookings/my-pending
export interface MyPendingBookingsResponse {
  success: boolean;
  count: number;
  pending_bookings: MyPendingBookingItem[];
  message: string;
}