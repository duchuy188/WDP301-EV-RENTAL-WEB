import React, { useRef } from 'react';
import { Camera, User, Phone, MapPin, Edit, X, Check, Mail } from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { profile } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProfileActions from './ProfileActions';

interface ProfileFormData {
  fullname: string;
  email: string;
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
  showActions?: boolean;
  onEditClick?: () => void;
  onCancelClick?: () => void;
  onSaveClick?: () => void;
  loading?: boolean;
  hasChanges?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  isEditing = false, 
  onAvatarChange,
  avatarLoading = false,
  avatarPreview = null,
  formData,
  onFormDataChange,
  showActions = false,
  onEditClick,
  onCancelClick,
  onSaveClick,
  loading = false,
  hasChanges = false
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
    <div className="space-y-4">
      {/* Avatar bên trái, thông tin bên phải */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cột trái: Avatar và Actions */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-40 w-40 border-4 border-gray-200 dark:border-gray-700 shadow-lg">
              <AvatarImage 
                src={avatarPreview || user.avatar || ''} 
                alt={user.fullname}
                className="object-cover"
              />
              <AvatarFallback className="text-4xl font-semibold bg-gradient-to-br from-green-500 to-blue-500 text-white">
                {getInitials(user.fullname)}
              </AvatarFallback>
            </Avatar>
            
            {/* Loading overlay */}
            {avatarLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <FaMotorcycle className="animate-spin h-6 w-6 text-white" />
              </div>
            )}
            
            {/* Avatar Upload Button */}
            {isEditing && onAvatarChange && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0 shadow-md bg-green-600 hover:bg-green-700 text-white border-2 border-white dark:border-gray-800"
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
          </div>
          
          {/* Nút chỉnh sửa / lưu / hủy */}
          <div className="w-full max-w-[180px] space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center uppercase">
              Hành động
            </h3>
            
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={onEditClick}
                className="w-full text-sm px-3 py-2 h-9 border hover:border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={onCancelClick}
                  className="w-full text-sm px-3 py-2 h-9 border hover:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button
                  onClick={onSaveClick}
                  disabled={loading || !hasChanges}
                  className="w-full text-sm px-3 py-2 h-9 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
              </div>
            )}
            
            {/* Nút đổi mật khẩu - chỉ hiện khi không edit và không phải Google user */}
            {showActions && !isEditing && (
              <ProfileActions />
            )}
          </div>
        </div>
        
        {/* Cột phải: Thông tin chi tiết */}
        <div className="flex-1 space-y-4">
          {/* Form thông tin chi tiết */}
          <div className="space-y-3">
            {/* Họ và tên */}
            <div className="space-y-1.5">
              <Label htmlFor="fullname" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-green-600" />
                <span>Họ và tên</span>
              </Label>
              {isEditing ? (
                <Input
                  id="fullname"
                  value={formData?.fullname || ''}
                  onChange={(e) => handleInputChange('fullname', e.target.value)}
                  className="h-10 text-sm"
                />
              ) : (
                <div className="flex items-center space-x-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{user.fullname}</span>
                </div>
              )}
            </div>

            {/* Email - Read only */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <Mail className="h-3.5 w-3.5 text-orange-600" />
                <span>Email</span>
              </Label>
              <div className="flex items-center space-x-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Mail className="h-4 w-4 text-orange-600" />
                <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{user.email || 'Chưa cập nhật'}</span>
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-600" />
                <span>Số điện thoại</span>
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData?.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="h-10 text-sm"
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <div className="flex items-center space-x-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{user.phone || 'Chưa cập nhật'}</span>
                </div>
              )}
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-purple-600" />
                <span>Địa chỉ</span>
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={formData?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Nhập địa chỉ của bạn"
                  className="h-10 text-sm"
                />
              ) : (
                <div className="flex items-center space-x-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{user.address || 'Chưa cập nhật'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;