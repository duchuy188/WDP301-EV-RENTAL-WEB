import React, { useState } from 'react';
import { Shield, Upload, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadIdentityCardFront, uploadIdentityCardBack } from '@/api/kycAPI';
import type { KYCStatusResponseUnion, KYCIdentityResponse, KYCIdentityCardResponse } from '@/types/kyc';
import { getIdentityData } from '@/utils/kycUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import { toast } from '@/utils/toast';

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
  
  // Preview states
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

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

  // Hàm xử lý khi chọn file - chỉ hiển thị preview
  const handleFileSelect = (side: 'front' | 'back', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') {
        setFrontPreview(reader.result as string);
        setFrontFile(file);
      } else {
        setBackPreview(reader.result as string);
        setBackFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Hàm upload ảnh CCCD - thực hiện khi bấm nút Upload
  const handleDocumentUpload = async (side: 'front' | 'back') => {
    const file = side === 'front' ? frontFile : backFile;
    if (!file) return;
    try {
      setLoading(true);
      let response: any;
      
      if (side === 'front') {
        response = await uploadIdentityCardFront(file);
        setIdentityFrontResponse(response);
        setReuploadEnabled(prev => ({ ...prev, ['identity-front']: false }));
        // Clear preview after successful upload
        setFrontPreview(null);
        setFrontFile(null);
      } else {
        response = await uploadIdentityCardBack(file);
        setIdentityBackResponse(response);
        setReuploadEnabled(prev => ({ ...prev, ['identity-back']: false }));
        // Clear preview after successful upload
        setBackPreview(null);
        setBackFile(null);
      }
      
      // Sau khi upload xong, lấy lại trạng thái KYC mới nhất
      await onKycUpdate();
      
      toast.success(`Upload CCCD ${side === 'front' ? 'mặt trước' : 'mặt sau'} thành công! Nhấn "Xem chi tiết" để xem thông tin OCR.`);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Tải lên ảnh thất bại!');
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
            {/* Hiển thị ảnh đã upload thành công */}
            {frontImage && !frontPreview ? (
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
                </div>
              </div>
            ) : frontPreview ? (
              /* Hiển thị preview ảnh đã chọn */
              <div className="space-y-2">
                <div className="relative group">
                  <img
                    src={frontPreview}
                    alt="Preview CCCD mặt trước"
                    className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-green-400"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onImagePreview(frontPreview)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleDocumentUpload('front')}
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? 'Đang upload...' : 'Upload ảnh'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFrontPreview(null);
                      setFrontFile(null);
                    }}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              /* Nút chọn file */
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect('front', e.target.files[0]);
                    }
                  }}
                />
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
              </label>
            )}
          </div>
        </div>

        {/* Mặt sau */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mặt sau</Label>
          <div className="relative">
            {/* Hiển thị ảnh đã upload thành công */}
            {backImage && !backPreview ? (
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
                </div>
              </div>
            ) : backPreview ? (
              /* Hiển thị preview ảnh đã chọn */
              <div className="space-y-2">
                <div className="relative group">
                  <img
                    src={backPreview}
                    alt="Preview CCCD mặt sau"
                    className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-green-400"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onImagePreview(backPreview)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleDocumentUpload('back')}
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? 'Đang upload...' : 'Upload ảnh'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBackPreview(null);
                      setBackFile(null);
                    }}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              /* Nút chọn file */
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect('back', e.target.files[0]);
                    }
                  }}
                />
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Hiển thị thông tin tóm tắt CCCD nếu có */}
      {(identityFrontResponse || identityBackResponse) && (
        <div className="mt-4 bg-gray-50 p-2 rounded border text-xs">
          <div><b>Số CCCD:</b> {identityFrontResponse?.identityCard?.id || identityData?.id}</div>
          <div><b>Họ tên:</b> {identityFrontResponse?.identityCard?.name || (identityData as any)?.name}</div>
          <div><b>Ngày sinh:</b> {identityFrontResponse?.identityCard?.dob || (identityData as any)?.dob}</div>
          {identityFrontResponse?.identityCard?.sex && (
            <div><b>Giới tính:</b> {identityFrontResponse.identityCard.sex}</div>
          )}
          {identityFrontResponse?.identityCard?.nationality && (
            <div><b>Quốc tịch:</b> {identityFrontResponse.identityCard.nationality}</div>
          )}
          {identityFrontResponse?.identityCard?.identityHome && (
            <div><b>Quê quán:</b> {identityFrontResponse.identityCard.identityHome}</div>
          )}
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