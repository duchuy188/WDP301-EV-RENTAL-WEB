import React, { useRef } from 'react';
import { Camera, User, Phone, MapPin } from 'lucide-react';
import { profile } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormData {
  fullname: string;
  phone: string;
  address: string;
}

interface ProfileHeaderProps {
  user: profile;
  isEditing?: boolean;
  onAvatarChange?: (file: File) => void;
  avatarLoading?: boolean;
  avatarPreview?: string | null;
  formData?: ProfileFormData;
  onFormDataChange?: (data: ProfileFormData) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  isEditing = false, 
  onAvatarChange,
  avatarLoading = false,
  avatarPreview = null,
  formData,
  onFormDataChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    if (isEditing && onAvatarChange) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
    // Reset input value
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    if (formData && onFormDataChange) {
      onFormDataChange({
        ...formData,
        [field]: value
      });
    }
  };

  return (
    <div className="flex items-start md:items-center space-x-6 md:space-x-8">
      {/* Avatar bên trái */}
  <div className="relative flex-shrink-0 w-40 flex flex-col items-center space-y-3">
        <Avatar className="h-24 w-24">
          <AvatarImage 
            src={avatarPreview || user.avatar || ''} 
            alt={user.fullname}
            className="object-cover"
          />
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(user.fullname)}
          </AvatarFallback>
        </Avatar>
        
        {/* Loading overlay */}
        {avatarLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Avatar Upload Button (only show when editing) */}
        {isEditing && onAvatarChange && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full p-0 shadow-lg"
              onClick={handleAvatarClick}
              disabled={avatarLoading}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload avatar"
            />
          </>
        )}
        
        {/* Tên người dùng và email dưới avatar */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.fullname}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {user.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {avatarPreview ? 'Avatar mới đã chọn (chưa lưu)' : 
             (user.avatar ? 'Avatar đã cập nhật' : 'Chưa có avatar')}
            {isEditing && onAvatarChange && ' • Nhấp vào camera để thay đổi'}
          </p>
        </div>
      </div>
      
      {/* Thông tin form bên phải */}
  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-5">
        {/* Họ và tên */}
        <div className="space-y-2">
          <Label htmlFor="fullname" className="text-sm font-medium">Họ và tên</Label>
          {isEditing ? (
            <Input
              id="fullname"
              value={formData?.fullname || ''}
              onChange={(e) => handleInputChange('fullname', e.target.value)}
              className="h-11"
            />
          ) : (
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 min-h-[44px]">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 dark:text-gray-100">{user.fullname}</span>
            </div>
          )}
        </div>

        {/* Số điện thoại */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
          {isEditing ? (
            <Input
              id="phone"
              value={formData?.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="h-11"
              placeholder="Nhập số điện thoại"
            />
          ) : (
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 min-h-[44px]">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 dark:text-gray-100">{user.phone || 'Chưa cập nhật'}</span>
            </div>
          )}
        </div>

        {/* Địa chỉ */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">Địa chỉ</Label>
          {isEditing ? (
            <Input
              id="address"
              value={formData?.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Nhập địa chỉ của bạn"
              className="h-11"
            />
          ) : (
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 min-h-[44px]">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 dark:text-gray-100">{user.address || 'Chưa cập nhật'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;