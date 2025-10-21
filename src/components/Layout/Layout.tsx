
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingChat from '@/components/FloatingChat';

const Layout: React.FC = () => {
  const location = useLocation();
  const isChatbotPage = location.pathname === '/chatbot';
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {!isChatbotPage && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isChatbotPage && <Footer />}
      <FloatingChat />
    </div>
  );
};

export default Layout;