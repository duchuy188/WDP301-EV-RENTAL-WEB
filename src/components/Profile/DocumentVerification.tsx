import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getKYCStatus } from '@/api/kycAPI';
import type { KYCStatusResponse } from '@/types/kyc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [currentResponse, setCurrentResponse] = useState<any>(null);

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
  const showResponseDetails = (response: any, title: string) => {
    setCurrentResponse({ ...response, title });
    setShowResponseModal(true);
  };

  // Hàm preview ảnh
  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
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
  // alias for easier access inside render
  const resp = currentResponse as any;

  // Helper: lọc các trường OCR có giá trị thực sự
  function filterOcrFields(obj: any) {
    if (!obj || typeof obj !== 'object') return {};
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (typeof v === 'string' && v.trim() && v !== 'N/A') {
        result[k] = v;
      } else if (Array.isArray(v) && v.length > 0 && v.some(x => x && x !== 'N/A')) {
        result[k] = v.filter(x => x && x !== 'N/A');
      } else if (typeof v === 'object' && v !== null) {
        const nested = filterOcrFields(v);
        if (Object.keys(nested).length > 0) result[k] = nested;
      }
    });
    return result;
  }

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
                        <p className="text-sm text-gray-700">Hạng: {((kyc as any)?.license?.classList || []).join(', ') || '—'}</p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => showResponseDetails((kyc as any)?.license || (kyc as any), 'Giấy phép lái xe')}
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
                        <p className="text-sm text-gray-700">Uploaded: {(kyc as any)?.identity?.frontUploaded ? 'Mặt trước' : '—'} / {(kyc as any)?.identity?.backUploaded ? 'Mặt sau' : '—'}</p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => showResponseDetails((kyc as any)?.identity || (kyc as any), 'Căn cước công dân')}
                          className="px-3 py-1 text-sm bg-white border rounded shadow-sm hover:bg-gray-50"
                        >
                          Xem chi tiết OCR
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border rounded p-3">
                    <p className="text-sm">Rejection reason: {(kyc as any)?.rejectionReason || '—'}</p>
                    <p className="text-sm">Last updated: {(kyc as any)?.lastUpdated || (kyc as any)?.lastUpdatedAt || '—'}</p>
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
      {/* Modal hiển thị chi tiết OCR khi nhấn 'Xem chi tiết OCR' */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentResponse?.title || 'Chi tiết OCR'}</DialogTitle>
          </DialogHeader>
          {currentResponse && (
            <div className="space-y-4">

              
              {/* Images (front / back) */}
              {(resp?.frontImage || resp?.backImage || resp?.image || resp?.backImage) && (
                <div className="flex gap-4">
                  {(resp?.frontImage || resp?.image) && (
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Mặt trước</div>
                      <img src={resp?.frontImage || resp?.image} alt="front" className="max-w-full h-auto rounded border" />
                    </div>
                  )}
                  {resp?.backImage && (
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Mặt sau</div>
                      <img src={resp?.backImage} alt="back" className="max-w-full h-auto rounded border" />
                    </div>
                  )}
                </div>
              )}

              {/* Key fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Thông tin chính</h4>
                  <p className="text-sm">ID: {resp?.identityOcr?.front?.id || resp?.id || resp?.identity?.id || resp?.license?.id || resp?.licenseNumber || '—'}</p>
                  <p className="text-sm">Họ tên: {resp?.identityOcr?.front?.name || resp?.licenseOcr?.front?.name || resp?.name || resp?.identity?.name || resp?.license?.name || resp?.licenseName || '—'}</p>
                  <p className="text-sm">Ngày sinh: {resp?.identityOcr?.front?.dob || resp?.licenseOcr?.front?.dob || resp?.dob || resp?.identity?.dob || resp?.license?.dob || resp?.licenseDob || '—'}</p>
                  <p className="text-sm">Hạng / Loại: {((resp?.classList || resp?.license?.classList) || []).join(', ') || resp?.licenseClass || resp?.licenseOcr?.front?.class || '—'}</p>
                  <p className="text-sm">Hạn sử dụng: {resp?.expiryText || resp?.license?.expiryText || resp?.licenseExpiry || resp?.licenseOcr?.front?.doe || '—'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Trạng thái</h4>
                  <p className="text-sm">Front uploaded: {String(resp?.frontUploaded ?? resp?.frontUploaded ?? resp?.license?.frontUploaded ?? resp?.identity?.frontUploaded ?? '—')}</p>
                  <p className="text-sm">Back uploaded: {String(resp?.backUploaded ?? resp?.backUploaded ?? resp?.license?.backUploaded ?? resp?.identity?.backUploaded ?? '—')}</p>
                  <p className="text-sm">Uploaded: {String(resp?.uploaded ?? resp?.license?.uploaded ?? '—')}</p>
                  <p className="text-sm">Rejection reason: {resp?.rejectionReason || '—'}</p>
                </div>
              </div>

              {/* OCR fields (filtered) */}
              {(resp?.frontOcr || resp?.backOcr || resp?.identityOcr || resp?.licenseOcr) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Thông tin OCR</h4>
                  {/* Identity OCR */}
                  {resp?.identityOcr && (
                    <>
                      <div className="font-semibold text-xs mb-1">CCCD/CMND</div>
                      {resp?.identityOcr.front && (
                        <div className="mb-2">
                          <div className="font-medium text-xs">Mặt trước:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(filterOcrFields(resp.identityOcr.front), null, 2)}
                          </pre>
                        </div>
                      )}
                      {resp?.identityOcr.back && (
                        <div>
                          <div className="font-medium text-xs">Mặt sau:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(filterOcrFields(resp.identityOcr.back), null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                  {/* License OCR */}
                  {resp?.licenseOcr && (
                    <>
                      <div className="font-semibold text-xs mb-1 mt-2">Giấy phép lái xe</div>
                      {resp?.licenseOcr.front && (
                        <div className="mb-2">
                          <div className="font-medium text-xs">Mặt trước:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(filterOcrFields(resp.licenseOcr.front), null, 2)}
                          </pre>
                        </div>
                      )}
                      {resp?.licenseOcr.back && (
                        <div>
                          <div className="font-medium text-xs">Mặt sau:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(filterOcrFields(resp.licenseOcr.back), null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default DocumentVerification;