import React from 'react';
import { Shield, Upload, Eye, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface DocumentImages {
  license: {
    frontImage: string | null;
    backImage: string | null;
  };
  id: {
    frontImage: string | null;
    backImage: string | null;
  };
}

interface DocumentVerificationProps {
  documentImages: DocumentImages;
  onDocumentUpload: (type: 'license' | 'id', side: 'front' | 'back') => void;
  onImagePreview: (imageUrl: string) => void;
}

const DocumentVerification: React.FC<DocumentVerificationProps> = ({
  documentImages,
  onDocumentUpload,
  onImagePreview
}) => {
  const DocumentSection = ({
    title,
    subtitle,
    type,
    images
  }: {
    title: string;
    subtitle: string;
    type: 'license' | 'id';
    images: { frontImage: string | null; backImage: string | null };
  }) => (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
          </div>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800">
          Chưa xác thực
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mặt trước */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mặt trước</Label>
          <div className="relative">
            {images.frontImage ? (
              <div className="relative group">
                <img
                  src={images.frontImage}
                  alt={`${title} mặt trước`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onImagePreview(images.frontImage!)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDocumentUpload(type, 'front')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                onClick={() => onDocumentUpload(type, 'front')}
              >
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
              </div>
            )}
          </div>
        </div>

        {/* Mặt sau */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mặt sau</Label>
          <div className="relative">
            {images.backImage ? (
              <div className="relative group">
                <img
                  src={images.backImage}
                  alt={`${title} mặt sau`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onImagePreview(images.backImage!)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDocumentUpload(type, 'back')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                onClick={() => onDocumentUpload(type, 'back')}
              >
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Xác thực giấy tờ</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Vui lòng tải lên ảnh mặt trước và mặt sau của giấy tờ để xác thực
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <DocumentSection
            title="Giấy phép lái xe"
            subtitle="GPLX hạng B1"
            type="license"
            images={documentImages.license}
          />
          
          <DocumentSection
            title="Căn cước công dân"
            subtitle="CCCD/CMND"
            type="id"
            images={documentImages.id}
          />

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-400 text-sm">
              Vui lòng hoàn tất upload ảnh giấy tờ để có thể thuê xe
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentVerification;