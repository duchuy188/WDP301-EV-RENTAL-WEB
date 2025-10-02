import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getKYCStatus, getIdentityCard, getDriverLicense } from '@/api/kycAPI';
import type { KYCStatusResponse } from '@/types/kyc';
import DocumentDetailsModal, { DocumentResponse } from './DocumentDetailsModal';
import DriverLicenseVerification from './DriverLicenseVerification';
import IdentityCardVerification from './IdentityCardVerification';

interface DocumentVerificationProps {
  onDocumentUpload?: (type: 'license' | 'identity', side: 'front' | 'back') => void;
  onImagePreview?: (imageUrl: string) => void;
}

const DocumentVerification: React.FC<DocumentVerificationProps> = () => {
  const [kyc, setKyc] = useState<KYCStatusResponse | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  // Hàm format ngày tháng năm theo định dạng Việt Nam
  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return '—';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return '—';
    }
  };

  // KYC status label and badge color mapping (Vietnamese)
  const statusKey = (kyc as any)?.status || (kyc as any)?.kycStatus || 'not_submitted';

  const statusLabelMap: Record<string, string> = {
    not_submitted: 'Chưa cập nhật',
    pending: 'Đang chờ',
    approved: 'Đã duyệt',
    rejected: 'Bị từ chối'
  };
  const statusClassMap: Record<string, string> = {
    not_submitted: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  const statusLabel = statusLabelMap[statusKey] || 'Chưa cập nhật';
  const statusBadgeClass = `${statusClassMap[statusKey] || statusClassMap.not_submitted} ml-4`;
  // ...existing code...

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Xác thực giấy tờ</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {statusKey === 'approved'
                ? 'Thông tin giấy tờ đã được xác thực. Bạn có thể xem chi tiết bên dưới.'
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
          {statusKey !== 'approved' && (
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
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                  Vui lòng hoàn tất upload ảnh giấy tờ để có thể thuê xe. Sau khi upload, bạn có thể nhấn "Xem chi tiết OCR" để xem thông tin mà hệ thống đã trích xuất.
                </p>
              </div>
            </>
          )}
          {statusKey === 'approved' && (
            <>
              {/* Nếu backend trả về object dạng { kycStatus, identity, license } */}
              {((kyc as any)?.license || (kyc as any)?.identity) ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-1 text-green-800">Giấy phép lái xe</h3>
                        <p className="text-sm text-gray-700">Số: {(kyc as any)?.license?.id || '—'}</p>
                        
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

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-1 text-blue-800">Căn cước công dân</h3>
                        <p className="text-sm text-gray-700">Số: {(kyc as any)?.identity?.id || '—'}</p>
                       
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

                  <div className="bg-gray-50 border rounded p-3">
                    {/* <p className="text-sm">Rejection reason: {(kyc as any)?.rejectionReason || '—'}</p> */}
                    <p className="text-sm">Cập nhật lần cuối: {formatDateTime((kyc as any)?.lastUpdated || (kyc as any)?.lastUpdatedAt || (kyc as any)?.updatedAt)}</p>
                  </div>
                </>
              ) : (
                // Fallback to legacy/flatter structure
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                    <h3 className="font-semibold mb-2 text-green-800">Giấy phép lái xe</h3>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                      {JSON.stringify({
                        id: (kyc as any)?.licenseNumber,
                        frontImage: (kyc as any)?.licenseImage,
                        backImage: (kyc as any)?.licenseBackImage,
                        expiry: (kyc as any)?.licenseExpiry,
                        expiryText: (kyc as any)?.licenseExpiryText,
                        classList: (kyc as any)?.licenseClassList,
                        frontUploaded: (kyc as any)?.licenseFrontUploaded,
                        backUploaded: (kyc as any)?.licenseBackUploaded,
                        uploaded: (kyc as any)?.licenseUploaded
                      }, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                    <h3 className="font-semibold mb-2 text-blue-800">Căn cước công dân</h3>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                      {JSON.stringify({
                        id: (kyc as any)?.identityCard,
                        frontImage: (kyc as any)?.identityCardFrontImage,
                        backImage: (kyc as any)?.identityCardBackImage,
                        frontUploaded: (kyc as any)?.identityCardFrontUploaded,
                        backUploaded: (kyc as any)?.identityCardBackUploaded
                      }, null, 2)}
                    </pre>
                  </div>
                </>
              )}
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