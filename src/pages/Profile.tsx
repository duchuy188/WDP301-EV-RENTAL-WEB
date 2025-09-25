import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CreditCard,
  Edit,
  Check,
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { authAPI } from '@/api/authAPI';
import { profile } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

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
      const response = await authAPI.updateProfile(formData);
      if (response.success) {
        const updatedUser = { ...user, ...formData } as profile;
        setUser(updatedUser);
        setIsEditing(false);
        
        // Update localStorage with the new data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Fetch fresh profile data to ensure we have the latest from server
        await fetchProfile();
        
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar} alt={user.fullname} />
                      <AvatarFallback className="text-lg">
                        {user.fullname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <button 
                        className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-colors"
                        title="Thay đổi ảnh đại diện"
                        aria-label="Thay đổi ảnh đại diện"
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

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Họ và tên</Label>
                    {isEditing ? (
                      <Input
                        id="fullname"
                        value={formData.fullname}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{user.fullname}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phone || 'Chưa cập nhật'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Thành viên từ</Label>
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Verification */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Xác thực giấy tờ</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Vui lòng tải lên ảnh mặt trước và mặt sau của giấy tờ để xác thực
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Giấy phép lái xe */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Giấy phép lái xe</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">GPLX hạng B1</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Chưa xác thực
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mặt trước GPLX */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Mặt trước</Label>
                        <div className="relative">
                          {documentImages.license.frontImage ? (
                            <div className="relative group">
                              <img
                                src={documentImages.license.frontImage}
                                alt="GPLX mặt trước"
                                className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleImagePreview(documentImages.license.frontImage!)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDocumentUpload('license', 'front')}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                              onClick={() => handleDocumentUpload('license', 'front')}
                            >
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                              <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mặt sau GPLX */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Mặt sau</Label>
                        <div className="relative">
                          {documentImages.license.backImage ? (
                            <div className="relative group">
                              <img
                                src={documentImages.license.backImage}
                                alt="GPLX mặt sau"
                                className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleImagePreview(documentImages.license.backImage!)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDocumentUpload('license', 'back')}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                              onClick={() => handleDocumentUpload('license', 'back')}
                            >
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                              <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Căn cước công dân */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Căn cước công dân</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">CCCD/CMND</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Chưa xác thực
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mặt trước CCCD */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Mặt trước</Label>
                        <div className="relative">
                          {documentImages.id.frontImage ? (
                            <div className="relative group">
                              <img
                                src={documentImages.id.frontImage}
                                alt="CCCD mặt trước"
                                className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleImagePreview(documentImages.id.frontImage!)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDocumentUpload('id', 'front')}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                              onClick={() => handleDocumentUpload('id', 'front')}
                            >
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                              <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mặt sau CCCD */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Mặt sau</Label>
                        <div className="relative">
                          {documentImages.id.backImage ? (
                            <div className="relative group">
                              <img
                                src={documentImages.id.backImage}
                                alt="CCCD mặt sau"
                                className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-lg">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleImagePreview(documentImages.id.backImage!)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDocumentUpload('id', 'back')}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                              onClick={() => handleDocumentUpload('id', 'back')}
                            >
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                              <p className="text-sm text-gray-500 mt-1">Tải lên ảnh</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                      Vui lòng hoàn tất upload ảnh giấy tờ để có thể thuê xe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Visa ****1234</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Mặc định</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Chính</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-pink-600" />
                      <div>
                        <p className="font-medium">Ví MoMo</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">090****567</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thêm phương thức
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tổng chuyến đi:</span>
                    <span className="font-semibold">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Điểm đánh giá:</span>
                    <span className="font-semibold text-yellow-600">4.8/5 ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tổng tiết kiệm:</span>
                    <span className="font-semibold text-green-600">2.5kg CO₂</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
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
                    onClick={() => toast.success('Đã đăng xuất!')}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </CardContent>
            </Card>
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
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Xem ảnh giấy tờ</DialogTitle>
            </DialogHeader>
            {previewImage && (
              <div className="flex justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;