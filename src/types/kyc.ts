export interface KYCIdentityResponse {
  message: string; //mặt trước cccd
  identityCard: {
    id: string;
    name: string;
    dob: string;
    identityHome?: string;
    address: string;
    sex?: string;
    nationality?: string;
    identityDoe?: string; // date of expiry - ngày hết hạn
    frontImage: string;
  };
  kycStatus: string;
  needBackImage: boolean;
}

// Interface cho request upload ảnh CMND/CCCD
export interface UploadRequest {
  image: string; // Base64 string của ảnh
}


// New KYC Identity Card Response interface
export interface KYCIdentityCardResponse {
  message: string; //mặt sau cccd
  identityCard: {
    issueDate: string;
    issueLocation: string;
    features: string;
    backImage: string;
  };
  kycStatus: string;
  needsFrontImage: boolean;
}


// Mặt trước GPLX
export interface KYCLicenseFrontResponse {
  message: string;
  license: {
    id: string;
    name: string;
    class: string;
    expiry: string;
    expiryText: string;
    image: string;
  };
  kycStatus: string;
  needsBackImage: boolean;
}

// Mặt sau GPLX
export interface KYCLicenseBackResponse {
  message: string;
  license: {
    classList: string[];
    backImage: string;
  };
  kycStatus: string;
  needsFrontImage: boolean;
}










// Địa chỉ chi tiết
export interface IdentityAddressEntities {
  province: string;
  district: string;
  ward: string;
  street: string;
}

// Legacy KYC Status API response type (for backward compatibility)
export interface KYCStatusResponseLegacy {
  _id: string;
  userId: string;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejectionReason: string;
  verificationMethod: 'auto' | 'manual' | '';
  autoApproved: boolean;
  identityCard: string;
  identityCardType: string;
  identityCardTypeNew: string;
  identityCardFrontImage: string;
  identityCardFrontImagePublicId: string;
  identityCardBackImage: string;
  identityCardBackImagePublicId: string;
  identityCardFrontUploaded: boolean;
  identityCardBackUploaded: boolean;
  identityName: string;
  identityDob: string;
  identityHome: string;
  identityAddress: string;
  identityAddressEntities: IdentityAddressEntities;
  identitySex: string;
  identityNationality: string;
  identityDoe: string;
  identityIssueDate: string;
  identityIssueLoc: string;
  identityFeatures: string;
  identityReligion: string;
  identityEthnicity: string;
  identityOcr: {
    front: IdentityOcrFront;
    back: IdentityOcrBack;
  };
  licenseNumber: string;
  licenseImage: string;
  licenseImagePublicId: string;
  licenseBackImage: string;
  licenseBackImagePublicId: string;
  licenseExpiry: string | null;
  licenseExpiryText: string;
  licenseFrontUploaded: boolean;
  licenseBackUploaded: boolean;
  licenseUploaded: boolean;
  licenseTypeOcr: string;
  licenseName: string;
  licenseDob: string;
  licenseNation: string;
  licenseAddress: string;
  licensePlaceIssue: string;
  licenseIssueDate: string;
  licenseClass: string;
  licenseClassList: string[];
  licenseOcr: {
    front: LicenseOcrFront;
    back: LicenseOcrBack;
  };
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
  approvedAt: string;
  approvedBy: string;
}

// New KYC Status API response type (updated structure)
export interface KYCStatusResponse {
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  identity?: {
    id: string;
    frontImage: string;
    backImage: string;
    frontUploaded: boolean;
    backUploaded: boolean;
  };
  license?: {
    id: string;
    frontImage: string;
    backImage: string;
    expiry: string;
    expiryText: string;
    classList: string[];
    frontUploaded: boolean;
    backUploaded: boolean;
    uploaded: boolean;
  };
  lastUpdated?: string;
}

// Union type to support both new and legacy KYC response structures
export type KYCStatusResponseUnion = KYCStatusResponse | KYCStatusResponseLegacy;



export interface LicenseOcrFront {
  id: string;
  id_prob: string;
  name: string;
  name_prob: string;
  dob: string;
  dob_prob: string;
  nation: string;
  nation_prob: string;
  address: string;
  address_prob: string;
  address_raw: string;
  address_raw_prob: string;
  place_issue: string;
  place_issue_prob: string;
  date: string;
  date_prob: string;
  class: string;
  class_prob: string;
  doe: string;
  doe_prob: string;
  overall_score: string;
  type: string;
}

export interface LicenseOcrBack {
  class: string[];
  class_prob: string[];
  date: string[];
  date_prob: string[];
  overall_score: string;
  type: string;
}

export interface IdentityOcrFront {
  id: string;
  id_prob: string;
  name: string;
  name_prob: string;
  number_of_name_lines: string;
  dob: string;
  dob_prob: string;
  sex: string;
  sex_prob: string;
  nationality: string;
  nationality_prob: string;
  home: string;
  home_prob: string;
  address: string;
  address_prob: string;
  type_new: string;
  address_entities: {
    province: string;
    district: string;
    ward: string;
    street: string;
  };
  doe: string;
  doe_prob: string;
  overall_score: string;
  type: string;
}

export interface IdentityOcrBack {
  features: string;
  features_prob: string;
  issue_date: string;
  issue_date_prob: string;
  mrz: string[];
  mrz_prob: string;
  overall_score: string;
  issue_loc: string;
  issue_loc_prob: string;
  type_new: string;
  type: string;
  mrz_details: {
    id: string;
    name: string;
    doe: string;
    dob: string;
    nationality: string;
    sex: string;
  };
  pob: string;
  pob_prob: string;
  address: string;
  address_prob: string;
  doe: string;
  doe_prob: string;
}

