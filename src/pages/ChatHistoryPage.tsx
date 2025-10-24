import React from 'react';
import { MessageSquare } from 'lucide-react';
import ChatHistory from '@/components/ChatHistory';

const ChatHistoryPage: React.FC = () => {
  const handleChatSelect = (sessionId: string) => {
    // Dispatch custom event to open FloatingChat with this session
    window.dispatchEvent(new CustomEvent('openChatWithSession', { 
      detail: { sessionId } 
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Lịch sử trò chuyện
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Xem và tiếp tục các cuộc trò chuyện trước đây với trợ lý AI
              </p>
            </div>
          </div>
        </div>

        {/* Chat History Content */}
        <ChatHistory onSelect={handleChatSelect} full={true} />
      </div>
    </div>
  );
};

export default ChatHistoryPage;

