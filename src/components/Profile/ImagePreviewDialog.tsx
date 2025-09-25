import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xem ảnh giấy tờ</DialogTitle>
        </DialogHeader>
        {imageUrl && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;