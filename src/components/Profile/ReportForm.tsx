import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportAPI } from '@/api/reportAPI';
import { toast } from '@/utils/toast';
import { IssueType } from '@/types/report';

interface ReportFormProps {
  rentalId: string;
  onClose: () => void;
  onSuccess: (report: any) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ rentalId, onClose, onSuccess }) => {
  const [issueType, setIssueType] = useState<IssueType>('other');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
        </Button>
      </div>
    </form>
  );
};

export default ReportForm;
