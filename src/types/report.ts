export type IssueType = 'vehicle_breakdown' | 'battery_issue' | 'accident' | 'other';
export type ReportStatus = 'pending' | 'resolved';

export interface CreateReportRequest {
  rental_id: string;
  issue_type: IssueType;
  description: string;
  images?: string[];
}

export interface Report {
  _id: string;
  code: string;
  rental_id: {
    _id: string;
    code: string;
  };
  booking_id: string;
  user_id: string | {
    _id: string;
    email: string;
    phone: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    name: string;
  };
  station_id: {
    _id: string;
    name: string;
    address?: string;
  };
  issue_type: IssueType;
  description: string;
  images: string[];
  status: ReportStatus;
  resolution_notes: string;
  resolved_at: string | null;
  resolved_by: {
    _id: string;
  } | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  data: Report;
}

export interface ReportsListResponse {
  success: boolean;
  data: Report[];
}
