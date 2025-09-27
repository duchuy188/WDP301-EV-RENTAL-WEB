import React from 'react';
import { Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const ProfileActions: React.FC = () => {
  const handleLogout = () => {
    toast.success('Đã đăng xuất!');
    // Có thể thêm logic logout thực tế ở đây
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Shield className="mr-2 h-4 w-4" />
            Đổi mật khẩu
          </Button>
          <Button variant="outline" className="w-full justify-start">
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
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileActions;