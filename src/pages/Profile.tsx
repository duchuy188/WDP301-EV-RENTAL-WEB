import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Check, X, Shield, User, FileCheck, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/utils/toast';
import { authAPI } from '@/api/authAPI';
import { profile, UpdateProfileRequest } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ProfileHeader, 
  DocumentVerification, 
  ProfileStats, 
  ProfileActions, 
  ImagePreviewDialog,
  BookingHistory,
  RentalHistory 
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

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Chống toast success bị lặp lại liên tục
  const lastToastRef = useRef<{ msg: string; time: number } | null>(null);
  const safeToastSuccess = (msg: string) => {
    const now = Date.now();
    if (!lastToastRef.current || lastToastRef.current.msg !== msg || (now - lastToastRef.current.time) > 5000) {
      toast.success(msg);
      lastToastRef.current = { msg, time: now };
    }
  };
  
  // Document upload states
  const [, setDocumentImages] = useState({
    license: {
      frontImage: null as string | null,
      backImage: null as string | null,
    },
    identity: {
      frontImage: null as string | null,
      backImage: null as string | null,
    }
  });
  
  const [showDocumentDialog, setShowDocumentDialog] = useState<{
    type: 'license' | 'identity' | null;
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

  // Check if user is logged in with Google
  const isGoogleUser = () => {
    return user?.provider === 'google' || user?.googleId;
  };

  // Get Google-specific data
  const getGoogleUserInfo = () => {
    if (!isGoogleUser() || !user) return null;
    
    return {
      googleId: user.googleId || '',
      provider: user.provider || 'google',
      avatar: user.avatar || '',
      verifiedEmail: true // Google emails are always verified
    };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // If user is logged in with Google and we don't have backend API, skip API call
      if (isGoogleUser() && authUser) {
        console.log('Google user detected, using local data');
        setUser(authUser);
        setFormData({
          fullname: authUser.fullname || '',
          phone: authUser.phone || '',
          address: authUser.address || '',
        });
        return;
      }
      
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
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // For Google users, don't show error if we have fallback data
      if (isGoogleUser() && authUser) {
        console.log('Using Google user fallback data');
        return;
      }
      
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
        ...(avatarFile && { avatar: avatarFile }), // Only include avatar if file is selected
      };
      
      // For Google users, if backend doesn't exist, save locally
      if (isGoogleUser()) {
        try {
          const response = await authAPI.updateProfile(updateData);
          if (response.success) {
            // Backend update successful
            setUserProfile(response.data);
            setUser(response.data);
            setFormData({
              fullname: response.data.fullname,
              phone: response.data.phone || '',
              address: response.data.address || ''
            });
            // Reset avatar state after successful update
            setAvatarFile(null);
            setAvatarPreview(null);
            localStorage.setItem('user', JSON.stringify(response.data));
            safeToastSuccess('Cập nhật hồ sơ thành công!');
          }
        } catch (apiError: any) {
          console.warn('Backend update failed for Google user, saving locally:', apiError);
          
          // Check if it's a server error (500) or network issue
          const errorStatus = apiError?.response?.status;
          if (errorStatus === 500) {
            toast.error('Lỗi server khi cập nhật avatar. Đang lưu thay đổi cục bộ...');
          } else {
            console.log('API not available, using local storage fallback');
          }
          
          // Fallback: Update local storage for Google users
          if (user) {
            // Handle avatar file conversion to base64 for local storage
            if (avatarFile) {
              // Convert file to base64 for local storage
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64Avatar = e.target?.result as string;
                const updatedUser = {
                  ...user,
                  fullname: updateData.fullname,
                  phone: updateData.phone,
                  address: updateData.address,
                  avatar: base64Avatar,
                  updatedAt: new Date().toISOString()
                };
                
                setUser(updatedUser);
                setUserProfile(updatedUser);
                // Reset avatar state after successful update
                setAvatarFile(null);
                setAvatarPreview(null);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                safeToastSuccess('Cập nhật hồ sơ thành công (lưu cục bộ)!');
              };
              reader.readAsDataURL(avatarFile);
            } else {
              // No avatar change, just update other fields
              const updatedUser = {
                ...user,
                fullname: updateData.fullname,
                phone: updateData.phone,
                address: updateData.address,
                updatedAt: new Date().toISOString()
              };
              
              setUser(updatedUser);
              setUserProfile(updatedUser);
              // Reset avatar state after successful update
              setAvatarFile(null);
              setAvatarPreview(null);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              safeToastSuccess('Cập nhật hồ sơ thành công (lưu cục bộ)!');
            }
          }
        }
      } else {
        // Regular user - use backend API
        const response = await authAPI.updateProfile(updateData);
        if (response.success) {
          setUserProfile(response.data);
          setUser(response.data);
          setFormData({
            fullname: response.data.fullname,
            phone: response.data.phone || '',
            address: response.data.address || ''
          });
          // Reset avatar state after successful update
          setAvatarFile(null);
          setAvatarPreview(null);
          localStorage.setItem('user', JSON.stringify(response.data));
          safeToastSuccess('Cập nhật hồ sơ thành công!');
        }
      }
      
      setIsEditing(false);
      
    } catch (error) {
      const msg = (error as Error)?.message || 'Cập nhật hồ sơ thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!user) return true;
    const basicChanged = user.fullname !== formData.fullname || 
                         (user.phone || '') !== formData.phone || 
                         (user.address || '') !== formData.address;
    const avatarChanged = avatarFile !== null;
    return basicChanged || avatarChanged;
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullname: user.fullname,
        phone: user.phone || '',
        address: user.address || '',
      });
    }
    // Reset avatar changes
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarLoading(false);
    setIsEditing(false);
  };

  const handleFormDataChange = (data: {
    fullname: string;
    phone: string;
    address: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
  };

  const handleDocumentUpload = (type: 'license' | 'identity', side: 'front' | 'back') => {
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

  const handleAvatarChange = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ file ảnh định dạng JPG, PNG, WEBP');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }
    
    setAvatarLoading(true);
    setAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setAvatarPreview(imageUrl);
      setAvatarLoading(false);
    };
    reader.readAsDataURL(file);
    
    toast.success('Đã chọn ảnh đại diện mới!');
  };

  const googleInfo = getGoogleUserInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            {isGoogleUser() && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                Google Account
              </Badge>
            )}
          </div>
          
          {/* Google Account Info */}
          {isGoogleUser() && googleInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                {googleInfo.avatar && (
                  <img
                    src={googleInfo.avatar}
                    alt="Google Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Đăng nhập bằng Google
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {googleInfo.verifiedEmail && "Email đã được xác minh"} • ID: {googleInfo.googleId || 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
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
          <div className="space-y-8">
            <div className="w-full max-w-5xl mx-auto">
              <Tabs defaultValue="profile" className="w-full">
                <div className="flex justify-end mb-4">
                  <TabsList className="inline-flex items-center gap-3 bg-transparent">
                  <TabsTrigger
                    value="profile"
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-transparent bg-white dark:bg-slate-800 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
                  >
                    <User className="h-4 w-4" />
                    Thông tin cá nhân
                  </TabsTrigger>

                  <TabsTrigger
                    value="verification"
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-transparent bg-white dark:bg-slate-800 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
                  >
                    <FileCheck className="h-4 w-4" />
                    Xác thực Kyc
                  </TabsTrigger>

                  <TabsTrigger
                    value="booking-history"
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-transparent bg-white dark:bg-slate-800 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
                  >
                    <Car className="h-4 w-4" />
                    Lịch sử đặt xe
                  </TabsTrigger>

                  <TabsTrigger
                    value="rental-history"
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-transparent bg-white dark:bg-slate-800 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
                  >
                    <Car className="h-4 w-4" />
                    Lịch sử thuê xe
                  </TabsTrigger>
                  
                  
                  
                </TabsList>
              </div>
              
              <TabsContent value="profile" className="mt-0">
                <div className="space-y-6">
                  {/* Main Profile Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                            {isGoogleUser() && (
                              <Badge variant="outline" className="text-xs">
                                Tài khoản Google
                              </Badge>
                            )}
                          </div>
                          {!isEditing ? (
                            <Button
                              variant="outline"
                              onClick={() => setIsEditing(true)}
                              className="h-9"
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
                                className="h-9"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Hủy
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 h-9"
                                disabled={loading || !hasChanges()}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Lưu
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-0">
                        <ProfileHeader 
                          user={user} 
                          isEditing={isEditing}
                          onAvatarChange={handleAvatarChange}
                          avatarLoading={avatarLoading}
                          avatarPreview={avatarPreview}
                          formData={formData}
                          onFormDataChange={handleFormDataChange}
                        />
                        
                        {/* Google-specific information */}
                        {isGoogleUser() && googleInfo && (
                          <>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Thông tin tài khoản Google
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Google ID</span>
                                  <p className="font-mono text-xs p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border">
                                    {googleInfo.googleId || 'N/A'}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nhà cung cấp</span>
                                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium">{googleInfo.provider}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                  💡 <strong>Lưu ý:</strong> Một số thông tin có thể được đồng bộ từ tài khoản Google của bạn. 
                                  Thay đổi sẽ được lưu cục bộ nếu chưa tích hợp với backend.
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Actions and Stats in grid layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Hành động tài khoản</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ProfileActions />
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Profile Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ProfileStats />
                    </motion.div>
                  </div>
                  </div>
              </TabsContent>

              <TabsContent value="verification" className="mt-0">
                {/* Document Verification */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <DocumentVerification
                    onDocumentUpload={handleDocumentUpload}
                    onImagePreview={handleImagePreview}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="booking-history" className="mt-0">
                {/* Booking History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <BookingHistory />
                </motion.div>
              </TabsContent>

              <TabsContent value="rental-history" className="mt-0">
                {/* Rental History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <RentalHistory />
                </motion.div>
              </TabsContent>

            </Tabs>
            </div>
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