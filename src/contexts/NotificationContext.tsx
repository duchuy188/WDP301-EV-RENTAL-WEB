import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { bookingAPI } from '@/api/bookingAPI';
import { Booking } from '@/types/booking';

export interface NotificationItem {
  id: string;
  type: 'booking_approved' | 'booking_cancelled' | 'payment_success';
  title: string;
  message: string;
  bookingCode?: string;
  timestamp: string;
  isRead: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifiedBookings, setNotifiedBookings] = useState<Set<string>>(new Set());

  // Load danh sách booking đã thông báo từ localStorage (chỉ để tránh duplicate)
  useEffect(() => {
    if (isAuthenticated) {
      const storedNotified = localStorage.getItem('notified_bookings');
      if (storedNotified) {
        try {
          setNotifiedBookings(new Set(JSON.parse(storedNotified)));
        } catch (e) {
          console.error('Failed to parse notified bookings from localStorage', e);
        }
      }
    } else {
      // Clear khi logout
      setNotifications([]);
      setNotifiedBookings(new Set());
    }
  }, [isAuthenticated]);

  // Lưu danh sách booking đã thông báo vào localStorage (chỉ để tránh duplicate)
  useEffect(() => {
    if (isAuthenticated && notifiedBookings.size > 0) {
      localStorage.setItem('notified_bookings', JSON.stringify(Array.from(notifiedBookings)));
    }
  }, [notifiedBookings, isAuthenticated]);

  // Kiểm tra booking mới được duyệt
  const checkForNewApprovals = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await bookingAPI.getBookings({ page: 1, limit: 20 });
      const bookings = response.bookings || [];

      const newNotifications: NotificationItem[] = [];

      bookings.forEach((booking: Booking) => {
        // Kiểm tra nếu booking đã được confirm và CHƯA ĐƯỢC THÔNG BÁO
        if (
          booking.confirmed_at && 
          booking.status === 'confirmed' &&
          !notifiedBookings.has(booking._id)
        ) {
          const confirmedBy = typeof booking.confirmed_by === 'object' && booking.confirmed_by
            ? booking.confirmed_by.fullname
            : 'Nhân viên';

          newNotifications.push({
            id: `booking_approved_${booking._id}_${Date.now()}`,
            type: 'booking_approved',
            title: 'Đặt xe đã được duyệt',
            message: `Đặt xe ${booking.code} đã được ${confirmedBy} duyệt. Vui lòng đến trạm đúng giờ để nhận xe.`,
            bookingCode: booking.code,
            timestamp: booking.confirmed_at,
            isRead: false,
            data: {
              bookingId: booking._id,
              vehicleName: booking.vehicle_id?.name,
              startDate: booking.start_date,
              pickupTime: booking.pickup_time,
            },
          });
        }

        // Kiểm tra nếu booking bị hủy và CHƯA ĐƯỢC THÔNG BÁO
        if (
          booking.cancelled_at &&
          booking.status === 'cancelled' &&
          !notifiedBookings.has(booking._id)
        ) {
          const cancelledBy = typeof booking.cancelled_by === 'object' && booking.cancelled_by
            ? booking.cancelled_by.fullname
            : 'Hệ thống';

          newNotifications.push({
            id: `booking_cancelled_${booking._id}_${Date.now()}`,
            type: 'booking_cancelled',
            title: 'Đặt xe đã bị hủy',
            message: `Đặt xe ${booking.code} đã bị hủy bởi ${cancelledBy}. ${booking.cancellation_reason ? 'Lý do: ' + booking.cancellation_reason : ''}`,
            bookingCode: booking.code,
            timestamp: booking.cancelled_at,
            isRead: false,
            data: {
              bookingId: booking._id,
              reason: booking.cancellation_reason,
            },
          });
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        
        // Cập nhật danh sách booking đã được thông báo (để tránh thông báo lại)
        const updatedNotified = new Set(notifiedBookings);
        bookings.forEach((b: Booking) => {
          if ((b.confirmed_at && b.status === 'confirmed') || (b.cancelled_at && b.status === 'cancelled')) {
            updatedNotified.add(b._id);
          }
        });
        setNotifiedBookings(updatedNotified);
      }
    } catch (error) {
      console.error('Error checking for new approvals:', error);
    }
  };

  // Polling để kiểm tra thông báo mới mỗi 30 giây
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check ngay khi mount
    checkForNewApprovals();

    // Sau đó check định kỳ mỗi 30 giây
    const interval = setInterval(checkForNewApprovals, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, notifiedBookings]);

  // Lắng nghe sự kiện thanh toán thành công
  useEffect(() => {
    const handlePaymentNotification = (event: CustomEvent) => {
      const { type, bookingCode, message, amount } = event.detail;

      if (type === 'success') {
        const newNotification: NotificationItem = {
          id: `payment_success_${bookingCode}_${Date.now()}`,
          type: 'payment_success',
          title: 'Thanh toán thành công',
          message: message || `Thanh toán cho đặt xe ${bookingCode} đã thành công. Số tiền: ${amount} đ`,
          bookingCode,
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        setNotifications(prev => [newNotification, ...prev]);
      }
    };

    window.addEventListener('paymentNotification', handlePaymentNotification as EventListener);

    return () => {
      window.removeEventListener('paymentNotification', handlePaymentNotification as EventListener);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    // Không xóa notified_bookings để tránh thông báo lại những booking cũ
  };

  const refreshNotifications = () => {
    checkForNewApprovals();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

