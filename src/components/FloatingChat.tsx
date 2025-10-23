import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { sendMessage } from '@/api/chatbotAPI';
import { ChatbotAPIResponse } from '@/types/chatbot';
import { ChatbotContext } from '@/pages/ChatbotPage';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  context?: string; // Add context to track conversation flow
}

interface ChatContext {
  topic?: string;
  userIntent?: string;
  lastKeywords?: string[];
  conversationStep?: number;
  // store backend session/conversation ids
  sessionId?: string | undefined;
  conversationId?: string | undefined;
}

const FloatingChat: React.FC = () => {
  const location = useLocation();
  const { sessionId } = useContext(ChatbotContext);

  // Return early if the pathname starts with '/chatbot'.
  const shouldRender = !location.pathname.startsWith('/chatbot');

  // Hooks are now always called consistently.
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>({
    topic: '',
    userIntent: '',
    lastKeywords: [],
    conversationStep: 0,
    sessionId: sessionId, // Use sessionId from ChatbotContext
    conversationId: undefined,
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Request welcome message when chat is opened.
  useEffect(() => {
    if (!isOpen || chatMessages.length > 0) return;

    let mounted = true;

    (async () => {
      try {
        setIsTyping(true);

        // Provide a default welcome message
        const res: ChatbotAPIResponse = await sendMessage({ 
          message: 'Xin chào! Tôi có thể giúp gì cho bạn?', // Default message
          session_id: chatContext.sessionId,
          role: 'user' // Add role to meet API requirements
        });

        if (!mounted) return;

        const botResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'bot',
          message: res?.message ?? 'Xin lỗi, hiện không có phản hồi.',
          timestamp: new Date(),
          context: res?.context,
        };

        setChatMessages((prev) => [...prev, botResponse]);
        setChatContext((prev) => ({
          ...prev,
          sessionId: res?.session_id ?? prev.sessionId,
          conversationId: res?.conversation_id ?? prev.conversationId,
          topic: res?.context ?? prev.topic,
        }));

        // Clear error message after session ID is initialized
        setChatMessages((prev) => prev.filter(msg => msg.message !== 'Session ID is missing. Please refresh the page or try again later.'));
      } catch (err) {
        const msg = extractErrorMessage(err) ?? 'Xin lỗi, không thể kết nối tới chatbot.';
        setChatMessages((prev) => [...prev, {
          id: Date.now().toString(),
          type: 'bot',
          message: msg,
          timestamp: new Date(),
        }]);
      } finally {
        setIsTyping(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // small helper to read axios / fetch error messages
  const extractErrorMessage = (err: any): string | undefined => {
    if (!err) return undefined;
    // axios style
    if (err.response && err.response.data) {
      if (typeof err.response.data === 'string') return err.response.data;
      if (err.response.data.message) return err.response.data.message;
      if (err.response.data.error) return err.response.data.error;
    }
    // fetch or other
    if (err.message) return err.message;
    return undefined;
  };

  // All message generation is delegated to the backend API. No local hardcoded replies.

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const payload = {
        message: chatInput,
        session_id: chatContext.sessionId,
        conversation_id: chatContext.conversationId
      } as any;

      const res: ChatbotAPIResponse = await sendMessage(payload);

      const botText = res?.message ?? 'Xin lỗi, tôi chưa hiểu. Bạn có thể nói lại?';

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botText,
        timestamp: new Date(),
        context: res?.context
      };

      setChatMessages(prev => [...prev, botResponse]);
      setChatContext(prev => ({
        ...prev,
        sessionId: res?.session_id ?? prev.sessionId,
        conversationId: res?.conversation_id ?? prev.conversationId,
        topic: res?.context ?? prev.topic,
        conversationStep: (prev.conversationStep || 0) + 1
      }));
    } catch (err) {
      // fallback: show error message from API or a generic message
      const msg = extractErrorMessage(err) ?? 'Xin lỗi, chatbot hiện không phản hồi. Vui lòng thử lại sau.';
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: msg,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }

    setChatInput('');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Return early if the component should not render.
  if (!shouldRender) return null;

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={toggleChat}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/50 transition-all duration-300"
              size="icon"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            {/* Notification pulse */}
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 60 : 400 
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-80"
          >
            <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-md">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9 border-2 border-white/30">
                      <AvatarFallback className="bg-white text-green-600">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-bold">Trợ lý ảo EV</CardTitle>
                      <div className="flex items-center space-x-1.5">
                        <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse"></div>
                        <span className="text-xs opacity-95 font-medium">Đang online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={minimizeChat}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="p-0">
                      {/* Messages */}
                      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                        {chatMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start space-x-2 max-w-[85%] ${
                              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              {message.type === 'bot' && (
                                <Avatar className="h-7 w-7 mt-1 border-2 border-green-100 dark:border-green-900">
                                  <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-600 dark:text-green-400 text-xs">
                                    <Bot className="h-3.5 w-3.5" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {message.type === 'user' && (
                                <Avatar className="h-7 w-7 mt-1 border-2 border-green-100 dark:border-green-900">
                                  <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 text-xs">
                                    <User className="h-3.5 w-3.5" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                                message.type === 'user' 
                                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-sm' 
                                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                              }`}>
                                <div className="text-[13px] leading-relaxed whitespace-pre-line">{message.message}</div>
                                <p className={`text-[10px] mt-1.5 ${
                                  message.type === 'user' 
                                    ? 'text-green-100' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {message.timestamp.toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-7 w-7 border-2 border-green-100 dark:border-green-900">
                                <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-600 dark:text-green-400">
                                  <Bot className="h-3.5 w-3.5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-xl rounded-bl-sm">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                        <form onSubmit={handleChatSubmit} className="flex space-x-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-600 rounded-lg transition-all duration-300"
                            disabled={isTyping}
                          />
                          <Button 
                            type="submit" 
                            size="sm" 
                            disabled={!chatInput.trim() || isTyping}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 active:scale-95 rounded-lg"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;
