import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDateVN } from '@/lib/utils';
import { useState } from 'react';
import ImagePreviewDialog from './ImagePreviewDialog';
import type {
  KYCStatusResponse,
  KYCIdentityResponse,
  KYCIdentityCardResponse,
  KYCLicenseFrontResponse,
  KYCLicenseBackResponse
} from '@/types/kyc';

export type DocumentResponse =
  | KYCStatusResponse
  | KYCIdentityResponse
  | KYCIdentityCardResponse
  | KYCLicenseFrontResponse
  | KYCLicenseBackResponse;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: DocumentResponse | null;
}

// Filter OCR fields: keep only meaningful values
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

// Type guards / helpers
function isKYCStatusResponse(obj: any): obj is KYCStatusResponse {
  return obj && typeof obj === 'object' && ('status' in obj || '_id' in obj) && ('licenseOcr' in obj || 'identityOcr' in obj || 'licenseNumber' in obj);
}


// Use formatDateVN from utils for consistent date formatting
function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '—';
  // Handle special cases for non-expiry strings
  const lowerCase = dateString.toLowerCase().trim();
  if (lowerCase.includes('không thời hạn') || 
      lowerCase.includes('vô thời hạn') || 
      lowerCase.includes('permanent') || 
      lowerCase.includes('no expiry') ||
      lowerCase.includes('không hạn') ||
      lowerCase === 'không có' ||
      lowerCase === 'n/a' ||
      lowerCase === '') {
    return 'Không thời hạn';
  }
  
  // If it's clearly not a date format, return as-is
  if (!dateString.match(/\d/) || dateString.length < 6) {
    return dateString;
  }
  
  try {
    const result = formatDateVN(dateString);
    
    // If formatDateVN returns 'Invalid Date', try to return original string if it seems meaningful
    if (result === 'Invalid Date') {
      // If the original string contains meaningful text, return it
      if (dateString.length > 2 && !dateString.match(/^\d+$/)) {
        return dateString;
      }
      return '—';
    }
    return result;
  } catch (error) {
    // Return original string if it might contain meaningful info
    if (dateString.length > 2) {
      return dateString;
    }
    return '—';
  }
}

export default function DocumentDetailsModal({ open, onOpenChange, response }: Props) {
  // State for image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Extract the actual data from the API response structure
  const resp = response as any;
  const actualData = resp?.data || resp; // Handle both nested and direct data structures
  
  // Get title from response or use default
  const title = resp?.title || actualData?.title || 'Chi tiết tài liệu';

  // Get front and back images
  const frontImage = actualData?.identityCard?.frontImage || actualData?.driverLicense?.frontImage || 
                     actualData?.license?.image || actualData?.frontImage || actualData?.image;
  const backImage = actualData?.identityCard?.backImage || actualData?.driverLicense?.backImage || 
                    actualData?.license?.backImage || actualData?.backImage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[70vw] h-[60vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-3 py-2 border-b">
            <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Xem chi tiết thông tin giấy tờ tùy thân đã tải lên.
            </DialogDescription>
          </DialogHeader>

          {actualData && (
            <div className="flex-1 overflow-hidden">
              {/* Main content area with side-by-side layout */}
              <div className="h-full flex">
                {/* Left side - Images */}
                <div className="w-2/5 p-2 bg-gray-50">
                  <div className="h-full flex flex-col gap-1">
                    {frontImage && (
                      <div className="flex-1">
                        <h3 className="text-xs font-medium mb-1 text-gray-800">Mặt trước</h3>
                        <div className="h-full max-h-[calc(25vh-1rem)] bg-white rounded border border-gray-300 p-1 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setPreviewImage(frontImage)}>
                          <img 
                            src={frontImage} 
                            alt="Mặt trước giấy tờ" 
                            className="max-w-full max-h-full object-contain rounded hover:opacity-90 transition-opacity" 
                          />
                        </div>
                      </div>
                    )}
                    {backImage && (
                      <div className="flex-1">
                        <h3 className="text-xs font-medium mb-1 text-gray-800">Mặt sau</h3>
                        <div className="h-full max-h-[calc(25vh-1rem)] bg-white rounded border border-gray-300 p-1 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setPreviewImage(backImage)}>
                          <img 
                            src={backImage} 
                            alt="Mặt sau giấy tờ" 
                            className="max-w-full max-h-full object-contain rounded hover:opacity-90 transition-opacity" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Document information */}
                <div className="flex-1 p-2 overflow-y-auto border-l bg-white">
                  <div className="space-y-1">
                    {/* Check if we have identity card data */}
                    {actualData?.identityCard && (
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <h4 className="text-xs font-semibold mb-1 text-blue-800 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6z" clipRule="evenodd" />
                          </svg>
                          Căn cước công dân
                        </h4>
                        <div className="space-y-0.5">
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Số CCCD:</span>
                            <span className="text-xs text-gray-900 font-mono">{actualData.identityCard.id || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Họ và tên:</span>
                            <span className="text-xs text-gray-900 font-semibold">{actualData.identityCard.name || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Ngày sinh:</span>
                            <span className="text-xs text-gray-900">{formatDate(actualData.identityCard.dob)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Quốc tịch:</span>
                            <span className="text-xs text-gray-900">{actualData.identityCard.nationality || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Giới tính:</span>
                            <span className="text-xs text-gray-900">{actualData.identityCard.sex || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Ngày cấp:</span>
                            <span className="text-xs text-gray-900">{formatDate(actualData.identityCard.issueDate)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Ngày hết hạn:</span>
                            <span className="text-xs text-gray-900">{formatDate(actualData.identityCard.identityDoe)}</span>
                          </div>
                          <div className="flex flex-col py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Nơi cấp:</span>
                            <span className="text-xs text-gray-900">{actualData.identityCard.issueLocation || '—'}</span>
                          </div>
                          <div className="flex flex-col py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Quê quán:</span>
                            <span className="text-xs text-gray-900">{actualData.identityCard.identityHome || '—'}</span>
                          </div>
                          <div className="flex flex-col py-0.5 border-b border-blue-200">
                            <span className="text-xs font-medium text-gray-700">Địa chỉ:</span>
                            <span className="text-xs text-gray-900">{actualData.identityCard.address || '—'}</span>
                          </div>
                          <div className="flex flex-col py-0.5">
                            <span className="text-xs font-medium text-gray-700">Đặc điểm nhận dạng:</span>
                            <span className="text-xs text-gray-900">{actualData.identityCard.features || '—'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Check if we have driver license data - new structure */}
                    {actualData?.driverLicense && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <h4 className="text-xs font-semibold mb-1 text-green-800 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                          </svg>
                          Giấy phép lái xe
                        </h4>
                        <div className="space-y-0.5">
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Số GPLX:</span>
                            <span className="text-xs text-gray-900 font-mono">{actualData.driverLicense.id || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Họ và tên:</span>
                            <span className="text-xs text-gray-900 font-semibold">{actualData.driverLicense.name || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Ngày sinh:</span>
                            <span className="text-xs text-gray-900">{formatDate(actualData.driverLicense.dob)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Quốc tịch:</span>
                            <span className="text-xs text-gray-900">{actualData.driverLicense.nationality || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Hạng GPLX:</span>
                            <span className="text-xs text-gray-900 font-medium">{actualData.driverLicense.class || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Các hạng:</span>
                            <span className="text-xs text-gray-900">{actualData.driverLicense.classList?.join(', ') || '—'}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Ngày cấp:</span>
                            <span className="text-xs text-gray-900">{formatDate(actualData.driverLicense.issueDate)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Hạn sử dụng:</span>
                            <span className="text-xs text-gray-900 font-medium">{formatDate(actualData.driverLicense.expiryText)}</span>
                          </div>
                          <div className="flex flex-col py-0.5 border-b border-green-200">
                            <span className="text-xs font-medium text-gray-700">Nơi cấp:</span>
                            <span className="text-xs text-gray-900">{actualData.driverLicense.placeIssue || '—'}</span>
                          </div>
                          <div className="flex flex-col py-0.5">
                            <span className="text-xs font-medium text-gray-700">Địa chỉ:</span>
                            <span className="text-xs text-gray-900">{actualData.driverLicense.address || '—'}</span>
                          </div>
                          
                        </div>
                      </div>
                    )}

                    {/* Check if we have license data - old structure */}
                    {!actualData?.driverLicense && actualData?.license && (
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h4 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                          </svg>
                          Giấy phép lái xe
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="font-medium text-gray-700">Số GPLX:</span>
                            <span className="text-gray-900 font-mono">{actualData.license.id || '—'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="font-medium text-gray-700">Họ và tên:</span>
                            <span className="text-gray-900 font-semibold">{actualData.license.name || '—'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="font-medium text-gray-700">Hạng GPLX:</span>
                            <span className="text-gray-900 font-medium">{actualData.license.class || '—'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="font-medium text-gray-700">Các hạng:</span>
                            <span className="text-gray-900">{actualData.license.classList?.join(', ') || '—'}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="font-medium text-gray-700">Hạn sử dụng:</span>
                            <span className="text-gray-900 font-medium">{formatDate(actualData.license.expiryText || actualData.license.expiry)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback for KYC status or other response types */}
                    {isKYCStatusResponse(actualData) && (
                      <div className="space-y-4">
                        {/* Driver License from OCR data */}
                        {(actualData as any).licenseOcr && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-semibold mb-3 text-green-800">Giấy phép lái xe</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Số:</span>
                                <span className="text-sm text-gray-900">{(actualData as any).licenseOcr?.front?.id || (actualData as any).licenseOcr?.back?.id || '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Tên:</span>
                                <span className="text-sm text-gray-900">{(actualData as any).licenseOcr?.front?.name || (actualData as any).licenseOcr?.back?.name || '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Hạng:</span>
                                <span className="text-sm text-gray-900">{(actualData as any).licenseOcr?.front?.class || (actualData as any).licenseOcr?.back?.class || '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Hạn sử dụng:</span>
                                <span className="text-sm text-gray-900">{formatDate((actualData as any).licenseOcr?.front?.expiryText || (actualData as any).licenseOcr?.back?.expiryText)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Identity Card from OCR data */}
                        {(actualData as any).identityOcr && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold mb-3 text-blue-800">Căn cước công dân</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Số:</span>
                                <span className="text-sm text-gray-900">{(actualData as any).identityOcr?.front?.id || (actualData as any).identityOcr?.back?.id || '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Họ tên:</span>
                                <span className="text-sm text-gray-900">{(actualData as any).identityOcr?.front?.name || (actualData as any).identityOcr?.back?.name || '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Ngày sinh:</span>
                                <span className="text-sm text-gray-900">{formatDate((actualData as any).identityOcr?.front?.dob || (actualData as any).identityOcr?.back?.dob)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fallback for basic identity data */}
                        {actualData.identity && !(actualData as any).identityOcr && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold mb-3 text-blue-800">Căn cước công dân</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Số:</span>
                                <span className="text-sm text-gray-900">{actualData.identity?.id || '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                                <span className="text-sm text-gray-900">{actualData.identity?.frontUploaded ? 'Đã tải lên' : 'Chưa tải lên'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OCR sections - collapsible for additional data */}
                    {(actualData.identityOcr || actualData.licenseOcr) && (
                      <details className="bg-gray-50 p-3 rounded-lg border">
                        <summary className="text-sm font-medium cursor-pointer text-gray-800 hover:text-gray-600">
                          Thông tin OCR chi tiết (nhấn để xem)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {actualData.identityOcr && (
                            <div>
                              <div className="font-medium text-xs mb-1 text-blue-700">CCCD/CMND OCR</div>
                              {actualData.identityOcr.front && (
                                <div className="mb-1">
                                  <div className="text-xs text-gray-600 mb-1">Mặt trước:</div>
                                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                                    {JSON.stringify(filterOcrFields(actualData.identityOcr.front), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {actualData.identityOcr.back && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Mặt sau:</div>
                                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                                    {JSON.stringify(filterOcrFields(actualData.identityOcr.back), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {actualData.licenseOcr && (
                            <div>
                              <div className="font-semibold text-sm mb-2 text-green-700">Giấy phép lái xe OCR</div>
                              {actualData.licenseOcr.front && (
                                <div className="mb-2">
                                  <div className="font-medium text-xs text-gray-600 mb-1">Mặt trước:</div>
                                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {JSON.stringify(filterOcrFields(actualData.licenseOcr.front), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {actualData.licenseOcr.back && (
                                <div>
                                  <div className="font-medium text-xs text-gray-600 mb-1">Mặt sau:</div>
                                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {JSON.stringify(filterOcrFields(actualData.licenseOcr.back), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Show no data message if none of the above conditions are met */}
                    {!actualData?.identityCard && !actualData?.driverLicense && !actualData?.license && !isKYCStatusResponse(actualData) && 
                     !actualData?.identityOcr && !actualData?.licenseOcr && (
                      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Không có dữ liệu chi tiết phù hợp để hiển thị.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Image Preview Dialog */}
      <ImagePreviewDialog 
        imageUrl={previewImage} 
        onClose={() => setPreviewImage(null)} 
      />
    </Dialog>
  );
}
