import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({ 
  imageUrl, 
  onClose 
}) => {
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Xem ảnh giấy tờ
            </DialogTitle>
            <DialogDescription>
              Xem chi tiết ảnh giấy tờ tùy thân đã tải lên.
            </DialogDescription>
          </DialogHeader>
          
          {imageUrl && (
            <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
              <div className="max-w-full max-h-full bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300 p-4">
                <img
                  src={imageUrl}
                  alt="Ảnh giấy tờ"
                  className="max-w-full h-auto object-contain rounded-lg max-h-[calc(80vh-200px)]"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;