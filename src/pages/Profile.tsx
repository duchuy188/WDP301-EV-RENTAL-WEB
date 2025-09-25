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
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<profile | null>(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
  });
  
  // Avatar file state
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
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
        email: authUser.email || '',
        phone: authUser.phone || '',
        address: authUser.address || '',
      });
      
      // Try to fetch fresh profile data
      fetchProfile();
    }
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        setFormData({
          fullname: response.data.fullname || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
        });
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show error toast if we already have user data from context
      if (!authUser) {
        toast.error('Không thể tải thông tin hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Tạo data theo UpdateProfileRequest interface
      const updateData: UpdateProfileRequest = {
        fullname: formData.fullname,
        phone: formData.phone,
        address: formData.address,
      };
      
      // Nếu có file avatar được chọn, thêm vào data
      if (selectedAvatarFile) {
        updateData.avatar = selectedAvatarFile;
      }
      
      const response = await authAPI.updateProfile(updateData);
      if (response.success) {
        // Cập nhật user state với data mới từ server
        setUser(response.data);
        setFormData({
          fullname: response.data.fullname,
          email: response.data.email,
          phone: response.data.phone || '',
          address: response.data.address || '',
        });
        setIsEditing(false);
        
        // Reset avatar states
        setSelectedAvatarFile(null);
        setAvatarPreview(null);
        
        // Update localStorage with the new data
        localStorage.setItem('user', JSON.stringify(response.data));
        
        toast.success('Cập nhật hồ sơ thành công!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullname: user.fullname,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
      });
    }
    setIsEditing(false);
    
    // Reset avatar states
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
  };

  // Avatar upload handlers
  const handleAvatarFileSelect = (file: File) => {
    setSelectedAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleAvatarFileSelect(file);
      }
    };
    input.click();
  };

  const handleFormDataChange = (data: {
    fullname: string;
    email: string;
    phone: string;
    address: string;
  }) => {
    setFormData(data);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Lưu
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProfileHeader 
                    user={user} 
                    isEditing={isEditing} 
                    onAvatarUpload={handleAvatarUploadClick}
                    avatarPreview={avatarPreview}
                  />
                  
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