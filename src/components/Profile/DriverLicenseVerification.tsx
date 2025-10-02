import React, { useState } from 'react';
import { Shield, Upload, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadLicenseFront, uploadLicenseBack } from '@/api/kycAPI';
import type { KYCStatusResponse, KYCLicenseFrontResponse, KYCLicenseBackResponse } from '@/types/kyc';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';

interface DriverLicenseVerificationProps {
  kyc: KYCStatusResponse | null;
  onKycUpdate: () => Promise<void>;
  onImagePreview: (imageUrl: string) => void;
  showResponseDetails: (response: any, title: string) => void;
}
// (GPLX) Xác minh Giấy phép lái xe
const DriverLicenseVerification: React.FC<DriverLicenseVerificationProps> = ({
  kyc,
  onKycUpdate,
  onImagePreview,
  showResponseDetails
}) => {
  const [loading, setLoading] = useState(false);
  const [reuploadEnabled, setReuploadEnabled] = useState<Record<string, boolean>>({});
  const [licenseFrontResponse, setLicenseFrontResponse] = useState<KYCLicenseFrontResponse | null>(null);
  const [licenseBackResponse, setLicenseBackResponse] = useState<KYCLicenseBackResponse | null>(null);

  // Auth user (to compare names)
  const { user: authUser } = useAuth();
  const accountName = authUser?.fullname || '';

  // Normalize names: remove diacritics, collapse spaces, lowercase
  const normalizeName = (s?: string) => {
    if (!s) return '';
    // remove combining diacritical marks
    const withoutDiacritics = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return withoutDiacritics.replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const licenseExtractedName = licenseFrontResponse?.license?.name || '';
  const licenseNameMatches = !!licenseExtractedName && normalizeName(licenseExtractedName) === normalizeName(accountName);

  // Hàm upload ảnh GPLX
  const handleDocumentUpload = async (side: 'front' | 'back', file: File) => {
    try {
      setLoading(true);
      let response: any;
      
      if (side === 'front') {
        response = await uploadLicenseFront(file);
        setLicenseFrontResponse(response);
        // lock reupload for this side after success
        setReuploadEnabled(prev => ({ ...prev, ['license-front']: false }));
      } else {
        response = await uploadLicenseBack(file);
        setLicenseBackResponse(response);
        setReuploadEnabled(prev => ({ ...prev, ['license-back']: false }));
      }
      
      // Sau khi upload xong, lấy lại trạng thái KYC mới nhất
      await onKycUpdate();
      
      alert(`Upload GPLX ${side === 'front' ? 'mặt trước' : 'mặt sau'} thành công! Nhấn "Xem chi tiết" để xem thông tin OCR.`);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Tải lên ảnh thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const frontImage = licenseFrontResponse?.license?.image || kyc?.licenseImage;
  const backImage = licenseBackResponse?.license?.backImage || kyc?.licenseBackImage;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Giấy phép lái xe</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">GPLX hạng A1, A2</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mặt trước */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mặt trước</Label>
          <div className="relative">
            {frontImage ? (
              <div className="relative group">
                <img
                  src={frontImage}
                  alt="GPLX mặt trước"
                  className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onImagePreview(frontImage)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {/* show upload control if no OCR response OR user enabled reupload */}
                  {(!licenseFrontResponse || !!reuploadEnabled['license-front']) && (
                    <>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="upload-license-front"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload('front', e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="upload-license-front">
                        <Button size="sm" variant="secondary" asChild>
                          <span><Upload className="h-4 w-4" /></span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleDocumentUpload('front', e.target.files[0]);
                    }
                  }}
                />
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">{loading ? 'Đang tải...' : 'Tải lên ảnh'}</p>
              </label>
            )}
          </div>
          {/* Nút xem chi tiết response mặt trước */}
          {licenseFrontResponse && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => showResponseDetails(licenseFrontResponse, 'Giấy phép lái xe - Mặt trước')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Xem chi tiết OCR
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReuploadEnabled(prev => ({ ...prev, 'license-front': true }))}
              >
                Thay ảnh
              </Button>
            </div>
          )}
        </div>

        {/* Mặt sau */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mặt sau</Label>
          <div className="relative">
            {backImage ? (
              <div className="relative group">
                <img
                  src={backImage}
                  alt="GPLX mặt sau"
                  className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onImagePreview(backImage)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {/* show upload control if no OCR response OR user enabled reupload */}
                  {(!licenseBackResponse || !!reuploadEnabled['license-back']) && (
                    <>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="upload-license-back"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload('back', e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="upload-license-back">
                        <Button size="sm" variant="secondary" asChild>
                          <span><Upload className="h-4 w-4" /></span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleDocumentUpload('back', e.target.files[0]);
                    }
                  }}
                />
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">{loading ? 'Đang tải...' : 'Tải lên ảnh'}</p>
              </label>
            )}
          </div>
          {/* Nút xem chi tiết response mặt sau */}
          {licenseBackResponse && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => showResponseDetails(licenseBackResponse, 'Giấy phép lái xe - Mặt sau')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Xem chi tiết OCR
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReuploadEnabled(prev => ({ ...prev, 'license-back': true }))}
              >
                Thay ảnh
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị thông tin tóm tắt GPLX nếu có */}
      {(licenseFrontResponse || licenseBackResponse) && (
        <div className="mt-4 bg-gray-50 p-2 rounded border text-xs">
          <div><b>Số GPLX:</b> {licenseFrontResponse?.license?.id || kyc?.licenseNumber}</div>
          <div><b>Họ tên:</b> {licenseFrontResponse?.license?.name || kyc?.licenseName}</div>
          <div><b>Hạng:</b> {licenseFrontResponse?.license?.class || kyc?.licenseClass}</div>
          <div><b>Hết hạn:</b> {licenseFrontResponse?.license?.expiryText || kyc?.licenseExpiryText}</div>
          {licenseBackResponse?.license?.classList && (
            <div><b>Các hạng:</b> {licenseBackResponse.license.classList.join(', ')}</div>
          )}
          
          {/* Check allowed classes (A1, A2) - show warning if not allowed */}
          {(() => {
            const allowed = ['A1', 'A2'];
            const frontClass = licenseFrontResponse?.license?.class ? String(licenseFrontResponse.license.class).toUpperCase() : undefined;
            const backClasses: string[] = Array.isArray(licenseBackResponse?.license?.classList)
              ? licenseBackResponse!.license.classList.map((c: any) => String(c).toUpperCase())
              : [];
            const hasAllowed = (frontClass && allowed.includes(frontClass)) || backClasses.some(c => allowed.includes(c));
            if (!hasAllowed) {
              return (
                <div className="mt-2 bg-red-50 border border-red-200 text-red-800 p-2 rounded text-sm">
                  Bạn chỉ có thể thuê xe nếu có GPLX hạng A1 hoặc A2. Vui lòng tải lên GPLX hợp lệ.
                </div>
              );
            }
            return null;
          })()}

          {/* Name match check for license */}
          {licenseFrontResponse && (
            licenseNameMatches ? (
              <div className="mt-2 bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm">
                Tên trên GPLX khớp với tên tài khoản.
              </div>
            ) : (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-800 p-2 rounded text-sm">
                Tên trên GPLX không khớp với tên tài khoản.
                <div className="text-xs mt-1">GPLX: <strong>{licenseExtractedName || '—'}</strong> • Tài khoản: <strong>{accountName || '—'}</strong></div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DriverLicenseVerification;