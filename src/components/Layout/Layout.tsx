
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingChat from '@/components/FloatingChat';
import PendingPaymentBanner from '@/components/PendingPaymentBanner';

const Layout: React.FC = () => {
  const location = useLocation();
  const isChatbotPage = location.pathname === '/chatbot';
  const isPaymentPage = location.pathname === '/payment';
  
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {!isChatbotPage && <Header />}
      
      {/* Banner hiển thị đặt xe chưa thanh toán - Ẩn khi đang ở trang payment */}
      {!isChatbotPage && !isPaymentPage && (
        <div className="container mx-auto px-4 pt-4">
          <PendingPaymentBanner />
        </div>
      )}
      
      <main className="flex-1">
        <Outlet />
      </main>
      {!isChatbotPage && <Footer />}
      <FloatingChat />
    </div>
  );
};

export default Layout;