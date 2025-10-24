import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  loading?: boolean;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onOpenChange, onSubmit, loading }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{currentPassword?: string; newPassword?: string; confirmPassword?: string}>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    let valid = true;
    const newFieldErrors: typeof fieldErrors = {};
    if (!currentPassword) {
      newFieldErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
      valid = false;
    }
    if (!newPassword) {
      newFieldErrors.newPassword = 'Vui lòng nhập mật khẩu mới.';
      valid = false;
    } else if (newPassword.length < 8) {
      newFieldErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
      valid = false;
    }
    if (!confirmPassword) {
      newFieldErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
      valid = false;
    } else if (newPassword && confirmPassword !== newPassword) {
      newFieldErrors.confirmPassword = 'Mật khẩu mới không khớp.';
      valid = false;
    }
    setFieldErrors(newFieldErrors);
    if (!valid) return;
    try {
      await onSubmit({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.currentPassword && <div className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</div>}
          </div>
          <div>
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.newPassword && <div className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</div>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <div className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</div>}
          </div>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">Lưu thay đổi</Button>
          </DialogFooter>
          
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
