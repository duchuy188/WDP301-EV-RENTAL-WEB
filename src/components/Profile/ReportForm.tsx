import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportAPI } from '@/api/reportAPI';
import { toast } from '@/utils/toast';
import { IssueType } from '@/types/report';
import { Upload, X, Eye, Download } from 'lucide-react';

interface ReportFormProps {
  rentalId: string;
  onClose: () => void;
  onSuccess: (report: any) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ rentalId, onClose, onSuccess }) => {
  const [issueType, setIssueType] = useState<IssueType>('other');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize to max 1200px width/height
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Giới hạn tối đa 5 ảnh
    if (images.length + fileArray.length > 5) {
      toast.error('Chỉ được tải lên tối đa 5 ảnh');
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB mỗi ảnh)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = fileArray.filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
      toast.error('Mỗi ảnh không được vượt quá 5MB');
      return;
    }

    // Thêm ảnh mới
    setImages(prev => [...prev, ...fileArray]);

    // Compress và tạo preview
    for (const file of fileArray) {
      try {
        const compressed = await compressImage(file);
        setImagePreviews(prev => [...prev, compressed]);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error('Không thể xử lý ảnh');
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả sự cố');
      return;
    }

    try {
      setSubmitting(true);

      const response = await reportAPI.createReport({
        rental_id: rentalId,
        issue_type: issueType,
        description: description.trim(),
        images: images,
      });

      toast.success('Tạo báo cáo sự cố thành công');
      onSuccess(response.data);
    } catch (error: any) {
      console.error('Error creating report:', error);
      toast.error(error?.response?.data?.message || 'Không thể tạo báo cáo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Fullscreen Image Viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Fullscreen preview"
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <a
            href={selectedImage}
            download="image.jpg"
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
            Tải ảnh
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="issue_type">Loại sự cố</Label>
        <Select value={issueType} onValueChange={(value) => setIssueType(value as IssueType)}>
          <SelectTrigger id="issue_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vehicle_breakdown">Xe hỏng</SelectItem>
            <SelectItem value="battery_issue">Vấn đề pin</SelectItem>
            <SelectItem value="accident">Tai nạn</SelectItem>
            <SelectItem value="other">Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Mô tả sự cố</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết sự cố..."
          rows={5}
          className="resize-none"
        />
      </div>

      <div>
        <Label htmlFor="images">Hình ảnh (Tùy chọn)</Label>
        <div className="mt-2">
          <label
            htmlFor="images"
            className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
          >
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">
                Nhấn để tải ảnh lên (Tối đa 5 ảnh, mỗi ảnh &lt; 5MB)
              </span>
            </div>
            <input
              id="images"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={submitting || images.length >= 5}
            />
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {imagePreviews.map((preview, index) => (
              <div 
                key={index} 
                className="relative group cursor-pointer"
                onClick={() => setSelectedImage(preview)}
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                />
                {/* Overlay tối khi hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                {/* Nút xóa */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  disabled={submitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Đã chọn {images.length}/5 ảnh
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
        </Button>
      </div>
      </form>
    </>
  );
};

export default ReportForm;
