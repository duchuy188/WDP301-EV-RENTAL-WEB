import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, XCircle, DollarSign, Trash2, CheckCheck, X } from 'lucide-react';
import { useNotifications, NotificationItem } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification,
    clearAllNotifications 
  } = useNotifications();

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'booking_approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'booking_cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'payment_success':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'booking_approved' || notification.type === 'booking_cancelled') {
      setIsOpen(false);
      navigate('/profile?tab=bookings');
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    clearNotification(notificationId);
    // Giữ dropdown mở sau khi xóa
  };

  const handleClearAll = () => {
    clearAllNotifications();
    // Giữ dropdown mở sau khi xóa tất cả
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    // Giữ dropdown mở sau khi đánh dấu đọc tất cả
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-[10px] text-white font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({unreadCount} chưa đọc)
              </span>
            )}
          </h3>
          
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Đọc tất cả
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Không có thông báo nào
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.bookingCode && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            Mã đặt xe: {notification.bookingCode}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        aria-label="Xóa thông báo"
                      >
                        <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile?tab=bookings');
              }}
            >
              Xem tất cả đặt xe
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;

