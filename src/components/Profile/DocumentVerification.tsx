import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTimeVN } from '@/lib/utils';
import { getKYCStatus, getIdentityCard, getDriverLicense } from '@/api/kycAPI';
import type { KYCStatusResponseUnion } from '@/types/kyc';
import {
  isNewKYCResponse,
  isLegacyKYCResponse,
  isKYCApproved,
  isKYCPending,
  isKYCRejected,
  needsDocumentSubmission,
  getKYCStatusLabel,
  getKYCStatusBadgeClass,
  getLicenseData,
  getIdentityData
} from '@/utils/kycUtils';
import DocumentDetailsModal, { DocumentResponse } from './DocumentDetailsModal';
import DriverLicenseVerification from './DriverLicenseVerification';
import IdentityCardVerification from './IdentityCardVerification';

interface DocumentVerificationProps {
  onDocumentUpload?: (type: 'license' | 'identity', side: 'front' | 'back') => void;
  onImagePreview?: (imageUrl: string) => void;
}

const DocumentVerification: React.FC<DocumentVerificationProps> = () => {
  const [kyc, setKyc] = useState<KYCStatusResponseUnion | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<(DocumentResponse & { title?: string }) | null>(null);

  // Gọi lấy trạng thái KYC khi mount lần đầu
  React.useEffect(() => {
    (async () => {
      const data = await getKYCStatus();
      setKyc(data);
    })();
  }, []);

  // Hàm cập nhật KYC sau khi upload
  const handleKycUpdate = async () => {
    const kycData = await getKYCStatus();
    setKyc(kycData);
  };

  // Hàm hiển thị modal với response data
  const showResponseDetails = (response: DocumentResponse | null, title: string) => {
    setCurrentResponse(response ? ({ ...(response as DocumentResponse), title }) : null);
    setShowResponseModal(true);
  };

  // Hàm preview ảnh
  const handleImagePreview = (_imageUrl: string) => {
    // Image preview functionality can be implemented here if needed
  };

  // Use formatDateTimeVN from utils for consistent date formatting
  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return '—';
    
    try {
      return formatDateTimeVN(dateString);
    } catch (error) {
      return '—';
    }
  };

  // Get status label and badge class using utils
  const statusLabel = getKYCStatusLabel(kyc);
  const statusBadgeClass = `${getKYCStatusBadgeClass(kyc)} ml-4`;
  // ...existing code...

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Xác thực giấy tờ</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isKYCApproved(kyc)
                ? 'Bạn có thể xem chi tiết bên dưới.'
                : 'Vui lòng tải lên ảnh mặt trước và mặt sau của giấy tờ để xác thực'}
            </p>
          </div>
          {/* Status chung */}
          <Badge className={statusBadgeClass}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!isKYCApproved(kyc) && (
            <>
              {/* Giấy phép lái xe */}
              <DriverLicenseVerification
                kyc={kyc}
                onKycUpdate={handleKycUpdate}
                onImagePreview={handleImagePreview}
                showResponseDetails={showResponseDetails}
              />
              
              {/* Căn cước công dân */}
              <IdentityCardVerification
                kyc={kyc}
                onKycUpdate={handleKycUpdate}
                onImagePreview={handleImagePreview}
                showResponseDetails={showResponseDetails}
              />
              
              {/* Information notice based on status */}
              {needsDocumentSubmission(kyc) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                    Vui lòng hoàn tất upload ảnh giấy tờ để có thể thuê xe. Sau khi upload, bạn có thể nhấn "Xem chi tiết OCR" để xem thông tin mà hệ thống đã trích xuất.
                  </p>
                </div>
              )}

              {isKYCPending(kyc) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-400 text-sm">
                    Giấy tờ của bạn đang được xem xét. Vui lòng chờ quá trình duyệt hoàn tất để có thể thuê xe.
                  </p>
                </div>
              )}

              {isKYCRejected(kyc) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-400 text-sm">
                    Giấy tờ của bạn đã bị từ chối. Vui lòng tải lại giấy tờ với chất lượng tốt hơn và thông tin rõ ràng.
                  </p>
                </div>
              )}
            </>
          )}
          {isKYCApproved(kyc) && kyc && (
            <>
              {/* Check if it's new KYC response structure */}
              {isNewKYCResponse(kyc) && (kyc.license || kyc.identity) ? (
                <>
                  {kyc.license && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold mb-1 text-green-800">Giấy phép lái xe</h3>
                          <p className="text-sm text-gray-700">Số: {kyc.license.id || '—'}</p>
                          
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const licenseData = await getDriverLicense();
                                showResponseDetails(licenseData, 'Giấy phép lái xe');
                              } catch (error) {
                                console.error('Error fetching driver license:', error);
                              }
                            }}
                            className="px-3 py-1 text-sm bg-white border rounded shadow-sm hover:bg-gray-50"
                          >
                            Xem chi tiết OCR
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {kyc.identity && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold mb-1 text-blue-800">Căn cước công dân</h3>
                          <p className="text-sm text-gray-700">Số: {kyc.identity.id || '—'}</p>
                         
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const identityData = await getIdentityCard();
                                showResponseDetails(identityData, 'Căn cước công dân');
                              } catch (error) {
                                console.error('Error fetching identity card:', error);
                              }
                            }}
                            className="px-3 py-1 text-sm bg-white border rounded shadow-sm hover:bg-gray-50"
                          >
                            Xem chi tiết OCR
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 border rounded p-3">
                    <p className="text-sm">Cập nhật lần cuối: {formatDateTime(kyc.lastUpdated)}</p>
                  </div>
                </>
              ) : isLegacyKYCResponse(kyc) ? (
                // Fallback to legacy/flatter structure using utils
                <>
                  {(() => {
                    const licenseData = getLicenseData(kyc);
                    const identityData = getIdentityData(kyc);
                    
                    return (
                      <>
                        {licenseData && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                            <h3 className="font-semibold mb-2 text-green-800">Giấy phép lái xe</h3>
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                              {JSON.stringify(licenseData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {identityData && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                            <h3 className="font-semibold mb-2 text-blue-800">Căn cước công dân</h3>
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                              {JSON.stringify(identityData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        <div className="bg-gray-50 border rounded p-3">
                          <p className="text-sm">Cập nhật lần cuối: {formatDateTime(kyc.lastUpdatedAt || kyc.updatedAt)}</p>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : null}
            </>
          )}
        </div>
      </CardContent>
      <DocumentDetailsModal
        open={showResponseModal}
        onOpenChange={setShowResponseModal}
        response={currentResponse}
      />
    </Card>
  );
}

export default DocumentVerification;