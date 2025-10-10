import React, { useState } from 'react';
import { Shield, Upload, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadIdentityCardFront, uploadIdentityCardBack } from '@/api/kycAPI';
import type { KYCStatusResponseUnion, KYCIdentityResponse, KYCIdentityCardResponse } from '@/types/kyc';
import { getIdentityData } from '@/utils/kycUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';

interface IdentityCardVerificationProps {
  kyc: KYCStatusResponseUnion | null;
  onKycUpdate: () => Promise<void>;
  onImagePreview: (imageUrl: string) => void;
  showResponseDetails: (response: any, title: string) => void;
}
// (CCCD) Xác minh Căn cước công dân
const IdentityCardVerification: React.FC<IdentityCardVerificationProps> = ({
  kyc,
  onKycUpdate,
  onImagePreview,
  showResponseDetails
}) => {
  const [loading, setLoading] = useState(false);
  const [reuploadEnabled, setReuploadEnabled] = useState<Record<string, boolean>>({});
  const [identityFrontResponse, setIdentityFrontResponse] = useState<KYCIdentityResponse | null>(null);
  const [identityBackResponse, setIdentityBackResponse] = useState<KYCIdentityCardResponse | null>(null);

  // Auth user (to compare names)
  const { user: authUser } = useAuth();
  const accountName = authUser?.fullname || '';

  // Get identity data using utils
  const identityData = getIdentityData(kyc);

  // Normalize names: remove diacritics, collapse spaces, lowercase
  const normalizeName = (s?: string) => {
    if (!s) return '';
    // remove combining diacritical marks
    const withoutDiacritics = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return withoutDiacritics.replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const identityExtractedName = identityFrontResponse?.identityCard?.name || '';
  const identityNameMatches = !!identityExtractedName && normalizeName(identityExtractedName) === normalizeName(accountName);

  // Hàm upload ảnh CCCD
  const handleDocumentUpload = async (side: 'front' | 'back', file: File) => {
    try {
      setLoading(true);
      let response: any;
      
      if (side === 'front') {
        response = await uploadIdentityCardFront(file);
        setIdentityFrontResponse(response);
        setReuploadEnabled(prev => ({ ...prev, ['identity-front']: false }));
      } else {
        response = await uploadIdentityCardBack(file);
        setIdentityBackResponse(response);
        setReuploadEnabled(prev => ({ ...prev, ['identity-back']: false }));
      }
      
      // Sau khi upload xong, lấy lại trạng thái KYC mới nhất
      await onKycUpdate();
      
      alert(`Upload CCCD ${side === 'front' ? 'mặt trước' : 'mặt sau'} thành công! Nhấn "Xem chi tiết" để xem thông tin OCR.`);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Tải lên ảnh thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const frontImage = identityFrontResponse?.identityCard?.frontImage || identityData?.frontImage;
  const backImage = identityBackResponse?.identityCard?.backImage || identityData?.backImage;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Căn cước công dân</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">CCCD/CMND</p>
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
                  alt="CCCD mặt trước"
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
                  {(!identityFrontResponse || !!reuploadEnabled['identity-front']) && (
                    <>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="upload-identity-front"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload('front', e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="upload-identity-front">
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
          {identityFrontResponse && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => showResponseDetails(identityFrontResponse, 'Căn cước công dân - Mặt trước')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Xem chi tiết OCR
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReuploadEnabled(prev => ({ ...prev, 'identity-front': true }))}
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
                  alt="CCCD mặt sau"
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
                  {(!identityBackResponse || !!reuploadEnabled['identity-back']) && (
                    <>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="upload-identity-back"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload('back', e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="upload-identity-back">
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
          {identityBackResponse && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => showResponseDetails(identityBackResponse, 'Căn cước công dân - Mặt sau')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Xem chi tiết OCR
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReuploadEnabled(prev => ({ ...prev, 'identity-back': true }))}
              >
                Thay ảnh
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị thông tin tóm tắt CCCD nếu có */}
      {(identityFrontResponse || identityBackResponse) && (
        <div className="mt-4 bg-gray-50 p-2 rounded border text-xs">
          <div><b>Số CCCD:</b> {identityFrontResponse?.identityCard?.id || identityData?.id}</div>
          <div><b>Họ tên:</b> {identityFrontResponse?.identityCard?.name || (identityData as any)?.name}</div>
          <div><b>Ngày sinh:</b> {identityFrontResponse?.identityCard?.dob || (identityData as any)?.dob}</div>
          <div><b>Địa chỉ:</b> {identityFrontResponse?.identityCard?.address || (identityData as any)?.address}</div>
          {identityBackResponse?.identityCard?.issueDate && (
            <div><b>Ngày cấp:</b> {identityBackResponse.identityCard.issueDate}</div>
          )}
          {identityBackResponse?.identityCard?.issueLocation && (
            <div><b>Nơi cấp:</b> {identityBackResponse.identityCard.issueLocation}</div>
          )}
          
          {/* Name match check for identity */}
          {identityFrontResponse && (
            identityNameMatches ? (
              <div className="mt-2 bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm">
                Tên trên CCCD khớp với tên tài khoản.
              </div>
            ) : (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-800 p-2 rounded text-sm">
                Tên trên CCCD không khớp với tên tài khoản.
                <div className="text-xs mt-1">CCCD: <strong>{identityExtractedName || '—'}</strong> • Tài khoản: <strong>{accountName || '—'}</strong></div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityCardVerification;