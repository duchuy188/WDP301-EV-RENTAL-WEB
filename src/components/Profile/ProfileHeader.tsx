import React from 'react';
import { profile } from '@/types/auth';

interface ProfileHeaderProps {
  user: profile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <div className="flex items-center space-x-4">
      {/* Avatar removed as requested */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {user.fullname}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {user.email}
        </p>
        {/* No avatar editing hint anymore */}
      </div>
    </div>
  );
};

export default ProfileHeader;