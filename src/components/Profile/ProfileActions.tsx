import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

import ChangePasswordDialog from './ChangePasswordDialog';
import { authAPI } from '@/api/authAPI';

const ProfileActions: React.FC = () => {

  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authAPI.changePassword(data);
      toast.success('Đổi mật khẩu thành công!');
      setOpenChangePassword(false);
    } catch (err: any) {
      toast.error(err?.message || 'Đổi mật khẩu thất bại.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="outline" 
        className="w-full text-sm px-3 py-2 h-9 border hover:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" 
        onClick={() => setOpenChangePassword(true)}
      >
        <Shield className="h-4 w-4 mr-2" />
        Đổi mật khẩu
      </Button>
      <ChangePasswordDialog
        open={openChangePassword}
        onOpenChange={setOpenChangePassword}
        onSubmit={handleChangePassword}
        loading={loading}
      />
    </div>
  );
};

export default ProfileActions;