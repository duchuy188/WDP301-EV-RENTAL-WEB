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
    <div className="space-y-3">
      <Button variant="outline" className="w-full justify-start" onClick={() => setOpenChangePassword(true)}>
        <Shield className="mr-2 h-4 w-4" />
        Đổi mật khẩu
      </Button>
      <ChangePasswordDialog
        open={openChangePassword}
        onOpenChange={setOpenChangePassword}
        onSubmit={handleChangePassword}
        loading={loading}
      />
      {/* <Button variant="outline" className="w-full justify-start">
        <User className="mr-2 h-4 w-4" />
        Cài đặt riêng tư
      </Button>
      <Separator />
      <Button 
        variant="destructive" 
        className="w-full justify-start"
        onClick={handleLogout}
      >
        Đăng xuất
      </Button> */}
    </div>
  );
};

export default ProfileActions;