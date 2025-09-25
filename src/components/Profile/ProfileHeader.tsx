import React from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { profile } from '@/types/auth';

interface ProfileHeaderProps {
  user: profile;
  isEditing: boolean;
  onAvatarUpload?: () => void;
  avatarPreview?: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  isEditing, 
  onAvatarUpload,
  avatarPreview
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage 
            src={avatarPreview || user.avatar} 
            alt={user.fullname} 
          />
          <AvatarFallback className="text-lg">
            {user.fullname.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {isEditing && (
          <button 
            className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-colors"
            title="Thay đổi ảnh đại diện"
            aria-label="Thay đổi ảnh đại diện"
            onClick={onAvatarUpload}
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {user.fullname}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Thành viên từ {formatDate(user.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;