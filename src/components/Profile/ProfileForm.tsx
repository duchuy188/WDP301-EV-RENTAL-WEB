import React from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profile } from '@/types/auth';

interface ProfileFormData {
  fullname: string;
  email: string;
  phone: string;
  address: string;
}

interface ProfileFormProps {
  user: profile;
  isEditing: boolean;
  formData: ProfileFormData;
  onFormDataChange: (data: ProfileFormData) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  user, 
  isEditing, 
  formData, 
  onFormDataChange 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullname">Họ và tên</Label>
        {isEditing ? (
          <Input
            id="fullname"
            value={formData.fullname}
            onChange={(e) => handleInputChange('fullname', e.target.value)}
          />
        ) : (
          <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
            <User className="h-4 w-4 text-gray-400" />
            <span>{user.fullname}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        {isEditing ? (
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        ) : (
          <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{user.email}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại</Label>
        {isEditing ? (
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        ) : (
          <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{user.phone || 'Chưa cập nhật'}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Thành viên từ</Label>
        <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDate(user.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;