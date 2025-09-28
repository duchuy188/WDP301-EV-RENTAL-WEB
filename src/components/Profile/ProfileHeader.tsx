import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { profile } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  user: profile;
  isEditing?: boolean;
  onAvatarChange?: (file: File) => void;
  avatarLoading?: boolean;
  avatarPreview?: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  isEditing = false, 
  onAvatarChange,
  avatarLoading = false,
  avatarPreview = null
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

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="h-16 w-16">
          <AvatarImage 
            src={avatarPreview || user.avatar || ''} 
            alt={user.fullname}
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-semibold">
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
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
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
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {user.fullname}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {user.email}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {avatarPreview ? 'Avatar mới đã chọn (chưa lưu)' : 
           (user.avatar ? 'Avatar đã cập nhật' : 'Chưa có avatar')}
          {isEditing && onAvatarChange && ' • Nhấp vào camera để thay đổi'}
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;