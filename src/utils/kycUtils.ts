import type { KYCStatusResponseUnion, KYCStatusResponse, KYCStatusResponseLegacy } from '@/types/kyc';

/**
 * Utility functions for KYC status checking
 */

// Type guard functions
export const isNewKYCResponse = (kyc: KYCStatusResponseUnion): kyc is KYCStatusResponse => {
  return 'kycStatus' in kyc;
};

export const isLegacyKYCResponse = (kyc: KYCStatusResponseUnion): kyc is KYCStatusResponseLegacy => {
  return 'status' in kyc && '_id' in kyc;
};

// Extract KYC status from different response structures
export const extractKYCStatus = (kyc: KYCStatusResponseUnion | null): string => {
  if (!kyc) return 'not_submitted';
  if (isNewKYCResponse(kyc)) return kyc.kycStatus;
  if (isLegacyKYCResponse(kyc)) return kyc.status;
  return 'not_submitted';
};

// KYC status checking functions
export const isKYCApproved = (kyc: KYCStatusResponseUnion | null): boolean => {
  return extractKYCStatus(kyc) === 'approved';
};

export const isKYCPending = (kyc: KYCStatusResponseUnion | null): boolean => {
  return extractKYCStatus(kyc) === 'pending';
};

export const isKYCRejected = (kyc: KYCStatusResponseUnion | null): boolean => {
  return extractKYCStatus(kyc) === 'rejected';
};

export const isKYCNotSubmitted = (kyc: KYCStatusResponseUnion | null): boolean => {
  return extractKYCStatus(kyc) === 'not_submitted';
};

// Business logic functions
export const canRentVehicles = (kyc: KYCStatusResponseUnion | null): boolean => {
  return isKYCApproved(kyc);
};

export const needsDocumentSubmission = (kyc: KYCStatusResponseUnion | null): boolean => {
  return isKYCNotSubmitted(kyc) || isKYCRejected(kyc);
};

export const isKYCInProgress = (kyc: KYCStatusResponseUnion | null): boolean => {
  return isKYCPending(kyc);
};

// Get human-readable status
export const getKYCStatusLabel = (kyc: KYCStatusResponseUnion | null, language: 'vi' | 'en' = 'vi'): string => {
  const status = extractKYCStatus(kyc);
  
  const labels = {
    vi: {
      not_submitted: 'Chưa cập nhật',
      pending: 'Đang chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối'
    },
    en: {
      not_submitted: 'Not Submitted',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    }
  } as const;

  const languageLabels = labels[language];
  return (languageLabels as any)[status] || languageLabels.not_submitted;
};

// Get CSS class for status badge
export const getKYCStatusBadgeClass = (kyc: KYCStatusResponseUnion | null): string => {
  const status = extractKYCStatus(kyc);
  
  const statusClassMap: Record<string, string> = {
    not_submitted: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return statusClassMap[status] || statusClassMap.not_submitted;
};

// Helper functions to extract specific data from KYC response
export const getLicenseData = (kyc: KYCStatusResponseUnion | null) => {
  if (!kyc) return null;
  
  if (isNewKYCResponse(kyc)) {
    return kyc.license || null;
  }
  
  if (isLegacyKYCResponse(kyc)) {
    return {
      id: kyc.licenseNumber,
      frontImage: kyc.licenseImage,
      backImage: kyc.licenseBackImage,
      expiry: kyc.licenseExpiry,
      expiryText: kyc.licenseExpiryText,
      classList: kyc.licenseClassList,
      frontUploaded: kyc.licenseFrontUploaded,
      backUploaded: kyc.licenseBackUploaded,
      uploaded: kyc.licenseUploaded
    };
  }
  
  return null;
};

export const getIdentityData = (kyc: KYCStatusResponseUnion | null) => {
  if (!kyc) return null;
  
  if (isNewKYCResponse(kyc)) {
    return kyc.identity || null;
  }
  
  if (isLegacyKYCResponse(kyc)) {
    return {
      id: kyc.identityCard,
      frontImage: kyc.identityCardFrontImage,
      backImage: kyc.identityCardBackImage,
      frontUploaded: kyc.identityCardFrontUploaded,
      backUploaded: kyc.identityCardBackUploaded,
      name: kyc.identityName,
      dob: kyc.identityDob,
      address: kyc.identityAddress
    };
  }
  
  return null;
};

// Check if user has uploaded documents
export const hasUploadedDocuments = (kyc: KYCStatusResponseUnion | null): boolean => {
  const license = getLicenseData(kyc);
  const identity = getIdentityData(kyc);
  
  const hasLicense = license && (license.frontUploaded || license.backUploaded);
  const hasIdentity = identity && (identity.frontUploaded || identity.backUploaded);
  
  return !!(hasLicense || hasIdentity);
};

// Check if all required documents are uploaded
export const hasAllRequiredDocuments = (kyc: KYCStatusResponseUnion | null): boolean => {
  const license = getLicenseData(kyc);
  const identity = getIdentityData(kyc);
  
  const licenseComplete = license && license.frontUploaded && license.backUploaded;
  const identityComplete = identity && identity.frontUploaded && identity.backUploaded;
  
  return !!(licenseComplete && identityComplete);
};