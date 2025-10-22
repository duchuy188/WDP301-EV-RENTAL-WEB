import React, { useState, useRef, useEffect } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { feedbackAPI } from '@/api/feedbackAPI';
import type { Feedback } from '@/types/feedback';
import { toast } from '@/utils/toast';

interface FeedbackFormProps {
  rentalId: string;
  onClose?: () => void;
  onSuccess?: (created: Feedback) => void;
  // optional staff ids related to this rental (pickup and/or return staff)
  staffIds?: string[];
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ rentalId, onClose, onSuccess, staffIds }) => {
  const [type, setType] = useState<'rating' | 'complaint'>('rating');
  const [ratings, setRatings] = useState({
    overall: 5,
    staff: 5,
    vehicle: 5,
    station: 5,
    checkout: 5,
  });

  const [complaint, setComplaint] = useState({
    title: '',
    description: '',
    category: '',
    staffRole: '',
  });

  const [comment, setComment] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState<'rating' | 'complaint' | null>(null);

  const createdPreviewsRef = useRef<string[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  /** ========== CHẶN ĐỔI LOẠI PHẢN HỒI ========== */
  const handleTypeChange = (newType: 'rating' | 'complaint') => {
    if (submittedType && submittedType !== newType) {
      toast.error(`Bạn đã gửi ${submittedType === 'rating' ? 'đánh giá' : 'khiếu nại'} rồi, không thể gửi loại khác.`);
      return;
    }
    setType(newType);
    setComment('');
    if (fileRef.current) fileRef.current.value = '';
    previews.forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    setImageFiles([]);
    setPreviews([]);
    createdPreviewsRef.current = [];
  };

  /** ========== XỬ LÝ FILE ẢNH ========== */
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const max = 5;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    const incoming = Array.from(files).filter(f => {
      if (!validTypes.includes(f.type)) {
        toast.error(`Bỏ qua ${f.name} — không phải định dạng ảnh hợp lệ`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`Bỏ qua ${f.name} — vượt quá 5MB`);
        return false;
      }
      return true;
    });

    if (incoming.length === 0) return;

    const available = max - imageFiles.length;
    if (available <= 0) {
      toast.error('Bạn chỉ được tải tối đa 5 ảnh');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const toAdd = incoming.slice(0, available);
    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...toAdd].slice(0, max));
    setPreviews(prev => {
      const next = [...prev, ...newPreviews].slice(0, max);
      createdPreviewsRef.current = [...createdPreviewsRef.current, ...newPreviews].slice(0, max);
      return next;
    });

    if (fileRef.current) fileRef.current.value = '';
    toast.success(`Đã thêm ${toAdd.length} ảnh`);
  };

  const removeImage = (idx: number) => {
    setImageFiles(s => s.filter((_, i) => i !== idx));
    setPreviews(s => {
      const url = s[idx];
      if (url) URL.revokeObjectURL(url);
      createdPreviewsRef.current = createdPreviewsRef.current.filter(u => u !== url);
      return s.filter((_, i) => i !== idx);
    });
  };

  useEffect(() => {
    return () => {
      createdPreviewsRef.current.forEach(p => {
        try { URL.revokeObjectURL(p); } catch {}
      });
    };
  }, []);

  // Reset form state when rentalId changes (avoid keeping submittedType or files across different rentals
  // or when the dialog is reopened without remounting the component)
  useEffect(() => {
    // revoke any existing previews
    createdPreviewsRef.current.forEach(p => {
      try { URL.revokeObjectURL(p); } catch {}
    });
    createdPreviewsRef.current = [];
    setPreviews([]);
    setImageFiles([]);

    // reset fields
    setType('rating');
    setRatings({ overall: 5, staff: 5, vehicle: 5, station: 5, checkout: 5 });
    setComplaint({ title: '', description: '', category: '', staffRole: '' });
    setComment('');
    setSubmitting(false);
    setSubmittedType(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [rentalId]);

  /** ========== VALIDATION ========== */
  const validate = () => {
    if (!rentalId) return 'Thiếu mã đơn thuê.';
    if (!type) return 'Thiếu loại phản hồi.';

    if (type === 'rating' && ratings.overall === null) return 'Vui lòng đánh giá tổng thể.';

    if (type === 'complaint') {
      if (!complaint.title.trim()) return 'Vui lòng nhập tiêu đề.';
      if (!complaint.description.trim()) return 'Vui lòng nhập mô tả.';
      if (!complaint.category) return 'Vui lòng chọn danh mục.';
      if (complaint.category === 'staff' && !complaint.staffRole)
        return 'Vui lòng chọn vai trò nhân viên.';
    }
    return null;
  };

  /** ========== GỬI FORM ========== */
  const submit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('rental_id', rentalId);
      form.append('type', type);

      if (type === 'rating') {
        form.append('overall_rating', String(ratings.overall));
        form.append('staff_service', String(ratings.staff));
        form.append('vehicle_condition', String(ratings.vehicle));
        form.append('station_cleanliness', String(ratings.station));
        form.append('checkout_process', String(ratings.checkout));
      }

      if (type === 'complaint') {
        form.append('title', complaint.title);
        form.append('description', complaint.description);
        form.append('category', complaint.category);
        if (complaint.category === 'staff') {
          form.append('staff_role', complaint.staffRole);
          // include staff ids if provided by parent
          if (Array.isArray(staffIds) && staffIds.length > 0) {
            // prefer sending staff_id if single, otherwise staff_ids
            if (staffIds.length === 1) {
              form.append('staff_id', String(staffIds[0]));
            } else {
              staffIds.forEach(sid => form.append('staff_ids', String(sid)));
            }
          }
        }
      }

      if (comment) form.append('comment', comment);
      imageFiles.forEach(f => form.append('images', f));

      const created = await feedbackAPI.createFeedback(form);
      toast.success(type === 'rating' ? 'Gửi đánh giá thành công' : 'Gửi khiếu nại thành công');

      setSubmittedType(type); // Ghi lại loại đã gửi
      onSuccess?.(created);
      onClose?.();
    } catch (e) {
      toast.error(type === 'rating' ? 'Gửi đánh giá thất bại' : 'Gửi khiếu nại thất bại');
      console.error('Feedback submission error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  /** ========== COMPONENT PHỤ ========== */
  const RatingStars = ({ value, onChange, size = 'default' }: { value: number; onChange: (v: number) => void; size?: 'default' | 'small' }) => {
    const isSmall = size === 'small';
    return (
      <div className={`flex items-center ${isSmall ? 'space-x-1' : 'space-x-2'}`}>
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            className={`rounded transition-colors ${
              s <= value
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isSmall ? 'px-2 py-1 text-sm' : 'px-3 py-2'}`}
            onClick={() => onChange(s)}
            disabled={submitting || !!submittedType}
          >
            {isSmall ? s : `${s}★`}
          </button>
        ))}
      </div>
    );
  };

  /** ========== UI ========== */
  return (
    <div className="space-y-4">
      {/* Chọn loại phản hồi */}
      <div>
        <label className="block text-sm font-medium mb-2">Loại phản hồi</label>
        <div className="flex items-center space-x-2">
          {!submittedType ? (
            (['rating', 'complaint'] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`px-4 py-2 rounded transition-colors ${
                  type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleTypeChange(t)}
                disabled={submitting}
              >
                {t === 'rating' ? 'Đánh giá' : 'Khiếu nại'}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 rounded bg-amber-600 text-white text-sm">
              Đã gửi {submittedType === 'rating' ? 'đánh giá' : 'khiếu nại'}
            </div>
          )}
        </div>
      </div>

      {/* Form đánh giá */}
      {type === 'rating' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Đánh giá tổng thể <span className="text-red-500">*</span>
            </label>
            <RatingStars value={ratings.overall} onChange={v => setRatings(p => ({ ...p, overall: v }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'staff', label: 'Dịch vụ nhân viên' },
              { key: 'vehicle', label: 'Tình trạng xe' },
              { key: 'station', label: 'Vệ sinh trạm' },
              { key: 'checkout', label: 'Quy trình trả xe' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <RatingStars
                  value={ratings[key as keyof typeof ratings]}
                  onChange={v => setRatings(p => ({ ...p, [key]: v }))}
                  size="small"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form khiếu nại */}
      {type === 'complaint' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              value={complaint.title}
              onChange={e => setComplaint(p => ({ ...p, title: e.target.value }))}
              placeholder="Nhập tiêu đề khiếu nại"
              disabled={submitting || !!submittedType}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mô tả <span className="text-red-500">*</span></label>
            <Textarea
              rows={4}
              value={complaint.description}
              onChange={e => setComplaint(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả chi tiết vấn đề"
              disabled={submitting || !!submittedType}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Danh mục <span className="text-red-500">*</span></label>
            <Select
              value={complaint.category}
              onValueChange={v => setComplaint(p => ({ ...p, category: v, staffRole: '' }))}
              disabled={submitting || !!submittedType}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vehicle">Xe</SelectItem>
                <SelectItem value="staff">Nhân viên</SelectItem>
                <SelectItem value="payment">Thanh toán</SelectItem>
                <SelectItem value="service">Dịch vụ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {complaint.category === 'staff' && (
            <div>
              <label className="block text-sm font-medium mb-2">Vai trò nhân viên</label>
              <Select
                value={complaint.staffRole}
                onValueChange={v => setComplaint(p => ({ ...p, staffRole: v }))}
                disabled={submitting || !!submittedType}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Chọn vai trò nhân viên" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Nhận xe</SelectItem>
                  <SelectItem value="return">Trả xe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Bình luận chung */}
      <div>
        <label className="block text-sm font-medium mb-2">Bình luận</label>
        <Textarea
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Nhập bình luận (tuỳ chọn)"
          disabled={submitting || !!submittedType}
        />
      </div>

      {/* Upload ảnh */}
      <div>
        <label className="block text-sm font-medium mb-2">Hình ảnh (tối đa 5)</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={e => handleFiles(e.target.files)}
          disabled={previews.length >= 5 || submitting || !!submittedType}
          className="block w-full text-sm text-gray-500 cursor-pointer file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt={`Ảnh ${i + 1}`} className="h-20 w-20 object-cover rounded border" />
                {!submittedType && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Hủy</Button>
        <Button type="button" onClick={submit} disabled={submitting || !!submittedType}>
          {submitting
            ? 'Đang gửi...'
            : submittedType
            ? 'Đã gửi phản hồi'
            : type === 'rating'
            ? 'Gửi đánh giá'
            : 'Gửi khiếu nại'}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default FeedbackForm;
