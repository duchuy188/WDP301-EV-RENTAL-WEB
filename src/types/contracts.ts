// Contract types based on API response

export interface ContractCustomer {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
}

export interface ContractVehicle {
  _id: string;
  name: string;
  license_plate: string;
  model: string;
}

export interface ContractStation {
  _id: string;
  name: string;
  address: string;
}

export interface ContractTemplate {
  _id: string;
  name: string;
  title: string;
}

export interface ContractStaff {
  _id: string;
  fullname: string;
  email: string;
}

export interface ContractRental {
  _id: string;
  code: string;
  status: string;
}

export interface Contract {
  _id: string;
  code: string;
  title: string;
  status: string;
  statusText: string;
  valid_from: string;
  valid_until: string;
  special_conditions?: string;
  notes?: string;
  contract_file_url?: string;
  customer_signed_at?: string;
  staff_signed_at?: string;
  created_at: string;
  updated_at: string;
  rental: ContractRental;
  customer: ContractCustomer;
  vehicle: ContractVehicle;
  station: ContractStation;
  template: ContractTemplate;
  staff_signed_by?: ContractStaff;
  customer_signed_by?: ContractStaff;
  staff_signature?: string;
  customer_signature?: string;
}

export interface ContractPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ContractsData {
  contracts: Contract[];
  pagination: ContractPagination;
}

export interface ContractsApiResponse {
  success: boolean;
  message: string;
  data: ContractsData;
}

