import React from 'react';
import type { KYCStatusResponseUnion } from '@/types/kyc';
import {
  isKYCApproved,
  isKYCPending,
  isKYCRejected,
  isKYCNotSubmitted,
  canRentVehicles,
  needsDocumentSubmission,
  hasUploadedDocuments,
  hasAllRequiredDocuments,
  getKYCStatusLabel,
  getKYCStatusBadgeClass
} from '@/utils/kycUtils';

interface KYCStatusCheckerProps {
  kyc: KYCStatusResponseUnion | null;
}

/**
 * Example component showing how to use KYC utility functions
 * for checking KYC verification status throughout the application
 */
const KYCStatusChecker: React.FC<KYCStatusCheckerProps> = ({ kyc }) => {
  // Basic status checks
  const approved = isKYCApproved(kyc);
  const pending = isKYCPending(kyc);
  const rejected = isKYCRejected(kyc);
  const notSubmitted = isKYCNotSubmitted(kyc);

  // Business logic checks
  const userCanRent = canRentVehicles(kyc);
  const needsDocuments = needsDocumentSubmission(kyc);
  const hasDocuments = hasUploadedDocuments(kyc);
  const allDocumentsUploaded = hasAllRequiredDocuments(kyc);

  // UI helpers
  const statusLabel = getKYCStatusLabel(kyc);
  const badgeClass = getKYCStatusBadgeClass(kyc);

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="font-semibold mb-4">KYC Status Checker</h3>
      
      {/* Status Display */}
      <div className="mb-4">
        <span className={`px-2 py-1 rounded text-sm ${badgeClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Status Checks */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h4 className="font-medium">Basic Status Checks:</h4>
          <div className="text-sm space-y-1">
            <div>✅ Approved: {approved ? 'Yes' : 'No'}</div>
            <div>⏳ Pending: {pending ? 'Yes' : 'No'}</div>
            <div>❌ Rejected: {rejected ? 'Yes' : 'No'}</div>
            <div>📝 Not Submitted: {notSubmitted ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Business Logic Checks:</h4>
          <div className="text-sm space-y-1">
            <div>🚗 Can Rent Vehicles: {userCanRent ? 'Yes' : 'No'}</div>
            <div>📄 Needs Documents: {needsDocuments ? 'Yes' : 'No'}</div>
            <div>📤 Has Uploaded Docs: {hasDocuments ? 'Yes' : 'No'}</div>
            <div>✅ All Docs Complete: {allDocumentsUploaded ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Action Messages */}
      <div className="mt-4 p-3 rounded border-l-4">
        {approved && (
          <div className="border-l-green-500 bg-green-50 text-green-800">
            ✅ Xác thực hoàn tất! Bạn có thể thuê xe ngay bây giờ.
          </div>
        )}
        {pending && (
          <div className="border-l-yellow-500 bg-yellow-50 text-yellow-800">
            ⏳ Đang chờ duyệt. Vui lòng chờ quá trình xác thực hoàn tất.
          </div>
        )}
        {rejected && (
          <div className="border-l-red-500 bg-red-50 text-red-800">
            ❌ Giấy tờ bị từ chối. Vui lòng tải lại với chất lượng tốt hơn.
          </div>
        )}
        {notSubmitted && (
          <div className="border-l-gray-500 bg-gray-50 text-gray-800">
            📝 Chưa tải giấy tờ. Vui lòng hoàn tất việc xác thực để thuê xe.
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCStatusChecker;