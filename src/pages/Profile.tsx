import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { authAPI } from '@/api/authAPI';
import { profile, UpdateProfileRequest } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ProfileHeader, 
  ProfileForm, 
  DocumentVerification, 
  PaymentMethods, 
  ProfileStats, 
  ProfileActions, 
  ImagePreviewDialog 
} from '@/components/Profile';

const Profile: React.FC = () => {
  const { user: authUser, isLoading: authLoading, setUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<profile | null>(null);
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    address: ''
  });

  // Chống toast success bị lặp lại liên tục
  const lastToastRef = useRef<{ msg: string; time: number } | null>(null);
  const safeToastSuccess = (msg: string) => {
    const now = Date.now();
    if (!lastToastRef.current || lastToastRef.current.msg !== msg || (now - lastToastRef.current.time) > 5000) {
      toast.success(msg);
      lastToastRef.current = { msg, time: now };
    }
  };
  
  // Avatar functionality removed per request
  
  // Document upload states
  const [documentImages, setDocumentImages] = useState({
    license: {
      frontImage: null as string | null,
      backImage: null as string | null,
    },
    id: {
      frontImage: null as string | null,
      backImage: null as string | null,
    }
  });
  
  const [showDocumentDialog, setShowDocumentDialog] = useState<{
    type: 'license' | 'id' | null;
    side: 'front' | 'back' | null;
  }>({ type: null, side: null });
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use auth context user data and fetch fresh profile data
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setFormData({
        fullname: authUser.fullname || '',
        phone: authUser.phone || '',
        address: authUser.address || '',
        
      });
    }
    
    // Always try to fetch fresh profile data from server
    fetchProfile();
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const response = await authAPI.getProfile();
      
      if (response && response.data) {
        setUser(response.data);
        setFormData({
          fullname: response.data.fullname || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          
        });
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.data));
  // Không toast ở đây để tránh spam khi load trang
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Only show error toast if we don't have fallback data
      if (!authUser) {
        toast.error('Không thể tải thông tin hồ sơ');
      } else {
        toast.error('Không thể làm mới thông tin hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }
    try {
      setLoading(true);
      
      // Tạo data theo UpdateProfileRequest interface
      const updateData: UpdateProfileRequest = {
        fullname: formData.fullname,
        phone: formData.phone,
        address: formData.address,
      };
      // Avatar fields removed
      
      const response = await authAPI.updateProfile(updateData);
      if (response.success) {
        // Cập nhật user state context & localStorage ngay lập tức
        setUserProfile(response.data);
        setUser(response.data); // local state backup
        setFormData({
          fullname: response.data.fullname,
          phone: response.data.phone || '',
          address: response.data.address || ''
        });
        setIsEditing(false);
        
  // Avatar states removed
        
        // Update localStorage with the new data
        localStorage.setItem('user', JSON.stringify(response.data));
        
  safeToastSuccess('Cập nhật hồ sơ thành công!');
  // Bỏ refreshProfile ngay lập tức vì có thể backend chưa kịp trả về avatar mới (async xử lý) -> dễ bị ghi đè avatar mới bằng dữ liệu cũ
  // Nếu cần đồng bộ sau, có thể thêm nút hoặc setTimeout(() => refreshProfile(), 1500)
      }
    } catch (error) {
      const msg = (error as Error)?.message || 'Cập nhật hồ sơ thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!user) return true;
    const basicChanged = user.fullname !== formData.fullname || (user.phone || '') !== formData.phone || (user.address || '') !== formData.address;
  return basicChanged;
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullname: user.fullname,
        phone: user.phone || '',
        address: user.address || '',
        
      });
    }
    setIsEditing(false);
    
  // Avatar states removed
  };

  // Avatar handlers removed

  const handleFormDataChange = (data: {
    fullname: string;
    phone: string;
    address: string;
    
  }) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      
    }));

    // Cập nhật preview ngay khi người dùng dán URL (nếu chưa chọn file)
    // Avatar preview logic removed
  };

  const handleDocumentUpload = (type: 'license' | 'id', side: 'front' | 'back') => {
    setShowDocumentDialog({ type, side });
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && showDocumentDialog.type && showDocumentDialog.side) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setDocumentImages(prev => ({
          ...prev,
          [showDocumentDialog.type!]: {
            ...prev[showDocumentDialog.type!],
            [showDocumentDialog.side === 'front' ? 'frontImage' : 'backImage']: imageUrl
          }
        }));
        toast.success(`Đã tải lên ảnh ${showDocumentDialog.side === 'front' ? 'mặt trước' : 'mặt sau'} thành công!`);
      };
      reader.readAsDataURL(file);
    }
    setShowDocumentDialog({ type: null, side: null });
    // Reset input value để có thể upload cùng file lại
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tài khoản của tôi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </motion.div>

        {(authLoading || loading) ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Đang tải...
              </p>
            </div>
          </div>
        ) : user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading || !hasChanges()}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Lưu
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProfileHeader user={user} />
                  
                  <Separator />
                  
                  <ProfileForm
                    user={user}
                    isEditing={isEditing}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                  />
                </CardContent>
              </Card>

              <DocumentVerification
                documentImages={documentImages}
                onDocumentUpload={handleDocumentUpload}
                onImagePreview={handleImagePreview}
              />
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <PaymentMethods />
              <ProfileStats />
              <ProfileActions />
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-300">Không thể tải thông tin hồ sơ</p>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload document image"
        />
        
        {/* Image Preview Dialog */}
        <ImagePreviewDialog
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      </div>
    </div>
  );
};

export default Profile;