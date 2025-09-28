import React from 'react';
import { User, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profile } from '@/types/auth';

interface ProfileFormData {
  fullname: string;
  phone: string;
  address: string;
  avatar?: string; // URL của avatar, nếu có
}

interface ProfileFormProps {
  user: profile;
  isEditing: string | boolean;
  formData: ProfileFormData;
  onFormDataChange: (data: ProfileFormData) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  user, 
  isEditing, 
  formData, 
  onFormDataChange 
}) => {
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

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">Địa chỉ</Label>
        {isEditing ? (
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Nhập địa chỉ của bạn"
          />
        ) : (
          <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{user.address || 'Chưa cập nhật'}</span>
          </div>
        )}
      </div>

      {/* Avatar URL input removed */}
    </div>
  );
};

export default ProfileForm;