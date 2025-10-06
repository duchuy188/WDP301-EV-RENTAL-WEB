export interface UserStatsResponse {
  success: boolean;
  message: string;
  data: UserStatsData;
}

export interface UserStatsData {
  overview: StatsOverview;
  peak_hours: PeakHour[];
  peak_days: PeakDay[];
  vehicle_preferences: VehiclePreference[];
  station_preferences: StationPreference[];
  monthly_stats: MonthlyStats[];
  insights: string[];
  last_updated: string;
}

export interface StatsOverview {
  total_rentals: number;
  total_distance: number;
  total_spent: number;
  total_days: number;
  avg_spent_per_rental: number;
  avg_distance_per_rental: number;
  last_rental_date: string;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface PeakDay {
  day: number;
  dayName: string;
  count: number;
}

export interface VehiclePreference {
  vehicle_type: string;
  count: number;
}

export interface StationPreference {
  station_id: {
    _id: string;
    name: string;
    address: string;
  };
  count: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  rentals: number;
  distance: number;
  spent: number;
}