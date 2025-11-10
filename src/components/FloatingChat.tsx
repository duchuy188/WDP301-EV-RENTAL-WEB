import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2,
  Maximize2,
  Plus,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { sendMessage, getConversationHistory } from '@/api/chatbotAPI';
import { ChatbotAPIResponse } from '@/types/chatbot';
import { ChatbotContext } from '@/pages/ChatbotPage';
import { CHATBOT } from '@/config/chatbot';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  context?: string; // Add context to track conversation flow
  actions?: string[]; // Add actions from API response
  suggestions?: string[]; // Add suggestions for user to click
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

  // Return early if the pathname starts with '/chatbot' (but allow on /chat-history).
  const shouldRender = !location.pathname.startsWith('/chatbot');

  // Hooks are now always called consistently.
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    // Load saved messages from localStorage
    const saved = localStorage.getItem('floating-chat-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>(() => {
    // Load saved context from localStorage
    const saved = localStorage.getItem('floating-chat-context');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          topic: '',
          userIntent: '',
          lastKeywords: [],
          conversationStep: 0,
          sessionId: sessionId,
          conversationId: undefined,
        };
      }
    }
    return {
      topic: '',
      userIntent: '',
      lastKeywords: [],
      conversationStep: 0,
      sessionId: sessionId,
      conversationId: undefined,
    };
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drag and drop functionality
  const [position, setPosition] = useState(() => {
    // Load saved position from localStorage
    const saved = localStorage.getItem('chatbot-position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { bottom: 24, right: 24 };
      }
    }
    return { bottom: 24, right: 24 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const chatButtonRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('floating-chat-messages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Save context to localStorage whenever it changes
  useEffect(() => {
    if (chatContext.sessionId || chatContext.conversationId) {
      localStorage.setItem('floating-chat-context', JSON.stringify(chatContext));
    }
  }, [chatContext]);

  // Auto scroll to bottom when new messages arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Listen for event to open chat with specific session
  useEffect(() => {
    const handleOpenWithSession = async (event: CustomEvent) => {
      const { sessionId: loadSessionId } = event.detail;
      if (!loadSessionId) return;

      // Clear old localStorage data before loading new session
      localStorage.removeItem('floating-chat-messages');
      localStorage.removeItem('floating-chat-context');

      // Open the chat
      setIsOpen(true);
      setIsMinimized(false);
      setIsTyping(true);
      
      try {
        // Load conversation history
        const res = await getConversationHistory(loadSessionId);
        if (res?.success && res?.data?.messages) {
          const loadedMessages: ChatMessage[] = res.data.messages.map((m: any) => {
            const role = (m.role || '').toLowerCase();
            const messageText = m.message || '';
            const urls = extractUrls(messageText);
            
            return {
              id: `loaded-${m.timestamp || Date.now()}`,
              type: role === 'user' ? 'user' : 'bot',
              message: messageText,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              actions: m.metadata?.actions || (urls.length > 0 ? urls : undefined),
              suggestions: m.metadata?.suggestions,
            };
          });
          
          setChatMessages(loadedMessages);
          setChatContext({
            sessionId: loadSessionId,
            conversationId: (res.data as any).conversation_id,
            topic: '',
            userIntent: '',
            lastKeywords: [],
            conversationStep: loadedMessages.length,
          });
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        const msg = extractErrorMessage(err) ?? 'Không thể tải lịch sử chat.';
        setChatMessages([{
          id: Date.now().toString(),
          type: 'bot',
          message: msg,
          timestamp: new Date(),
        }]);
      } finally {
        setIsTyping(false);
      }
    };

    window.addEventListener('openChatWithSession', handleOpenWithSession as unknown as EventListener);
    return () => {
      window.removeEventListener('openChatWithSession', handleOpenWithSession as unknown as EventListener);
    };
  }, []);

  // Listen for payment notification event
  useEffect(() => {
    const handlePaymentNotification = (event: CustomEvent) => {
      const { type, bookingCode, message } = event.detail;
      
      let notificationMessage = '';
      if (type === 'success') {
        notificationMessage = `🎉 Thanh toán thành công! Mã đặt xe: ${bookingCode}. ${message || 'Bạn sẽ nhận được email xác nhận trong vài phút.'}`;
      } else if (type === 'failed') {
        notificationMessage = `❌ Thanh toán thất bại. ${message || 'Vui lòng thử lại.'}`;
      } else if (type === 'cancelled') {
        notificationMessage = `ℹ️ Bạn đã hủy thanh toán. ${message || ''}`;
      } else {
        notificationMessage = message || 'Có thông báo mới về thanh toán.';
      }

      const botMessage: ChatMessage = {
        id: `payment-notif-${Date.now()}`,
        type: 'bot',
        message: notificationMessage,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, botMessage]);
      
      // Auto open chat if it's closed
      if (!isOpen) {
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    window.addEventListener('paymentNotification', handlePaymentNotification as unknown as EventListener);
    return () => {
      window.removeEventListener('paymentNotification', handlePaymentNotification as unknown as EventListener);
    };
  }, [isOpen]);

  // No longer auto-send welcome message - let user choose from suggestions instead

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

  // Extract URLs from text
  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Remove URLs from text to display clean message
  const removeUrls = (text: string): string => {
    return text.replace(/(https?:\/\/[^\s]+)/g, '').trim();
  };

  // Extract payment link from message
  const extractPaymentLink = (text: string): string | null => {
    const paymentRegex = /(https?:\/\/[^\s]*(?:vnpay|payment)[^\s]*)/i;
    const match = text.match(paymentRegex);
    return match ? match[1] : null;
  };

  // Get action type for suggestion
  const getActionForSuggestion = (suggestion: string, actions?: string[]): string | null => {
    if (!actions) return null;
    
    const suggestionLower = suggestion.toLowerCase().trim();
    
    // Map suggestion text to action
    if (suggestionLower.includes('thanh toán') || suggestionLower.includes('thanh toan')) {
      return actions.find(a => a.includes('pay')) || null;
    }
    if (suggestionLower.includes('xem') || suggestionLower.includes('chi tiết') || suggestionLower.includes('chi tiet')) {
      return actions.find(a => a.includes('view') || a.includes('details')) || null;
    }
    if (suggestionLower.includes('hủy') || suggestionLower.includes('huy') || suggestionLower.includes('cancel')) {
      return actions.find(a => a.includes('cancel')) || null;
    }
    if (suggestionLower.includes('xác nhận') || suggestionLower.includes('xac nhan') || suggestionLower.includes('confirm')) {
      return actions.find(a => a.includes('confirm')) || null;
    }
    if (suggestionLower.includes('thay đổi') || suggestionLower.includes('thay doi') || suggestionLower.includes('edit')) {
      return actions.find(a => a.includes('edit')) || null;
    }
    
    return null;
  };

  // All message generation is delegated to the backend API. No local hardcoded replies.

  const handleChatSubmit = async (e?: React.FormEvent, suggestedText?: string) => {
    if (e) e.preventDefault();
    
    const messageText = suggestedText || chatInput.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: messageText,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const payload = {
        message: messageText,
        session_id: chatContext.sessionId,
        conversation_id: chatContext.conversationId
      } as any;

      const res: ChatbotAPIResponse = await sendMessage(payload);

      const botText = res?.message ?? 'Xin lỗi, tôi chưa hiểu. Bạn có thể nói lại?';
      
      // Extract URLs from message or use actions from API
      const urls = extractUrls(botText);
      // Combine action strings and URLs
      const actionStrings = res?.actions || [];
      const messageActions = [...actionStrings, ...urls].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botText,
        timestamp: new Date(),
        context: res?.context,
        actions: messageActions.length > 0 ? messageActions : undefined,
        suggestions: res?.suggestions
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

  const toggleMinimizeChat = () => {
    setIsMinimized(prev => !prev);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const createNewChat = () => {
    // Clear messages and reset context
    setChatMessages([]);
    setChatContext({
      topic: '',
      userIntent: '',
      lastKeywords: [],
      conversationStep: 0,
      sessionId: undefined,
      conversationId: undefined,
    });
    // Clear localStorage
    localStorage.removeItem('floating-chat-messages');
    localStorage.removeItem('floating-chat-context');
  };

  // Handle drag start for chat button
  const handleButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!chatButtonRef.current) return;
    
    setIsDragging(true);
    setHasMoved(false);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    
    const rect = chatButtonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle drag start for chat header
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    // If minimized, clicking on header will expand instead of drag
    if (isMinimized) {
      setIsMinimized(false);
      return;
    }

    e.preventDefault();
    
    if (!e.currentTarget) return;
    
    setIsDragging(true);
    setHasMoved(false);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Check if mouse has moved more than 5px (to distinguish click from drag)
      const deltaX = Math.abs(e.clientX - dragStartPos.x);
      const deltaY = Math.abs(e.clientY - dragStartPos.y);
      
      if (deltaX > 5 || deltaY > 5) {
        setHasMoved(true);
      }

      const width = isOpen ? 400 : 56; // 400 for chat window, 56 for button
      const height = isOpen ? (isMinimized ? 60 : 500) : 56;

      const newRight = window.innerWidth - e.clientX - dragOffset.x - width;
      const newBottom = window.innerHeight - e.clientY - dragOffset.y - height;

      // Keep within bounds
      const boundedRight = Math.max(0, Math.min(newRight, window.innerWidth - width));
      const boundedBottom = Math.max(0, Math.min(newBottom, window.innerHeight - height));

      const newPosition = { right: boundedRight, bottom: boundedBottom };
      setPosition(newPosition);
      
      // Save to localStorage
      localStorage.setItem('chatbot-position', JSON.stringify(newPosition));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // If it was a click (not dragged), open the chat and reset position to right
      if (!hasMoved && !isOpen) {
        setIsOpen(true);
        setIsMinimized(false);
        
        // Reset position to default (right side)
        const defaultPosition = { bottom: 24, right: 24 };
        setPosition(defaultPosition);
        localStorage.setItem('chatbot-position', JSON.stringify(defaultPosition));
      }
      
      setHasMoved(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isOpen, isMinimized, hasMoved, dragStartPos]);

  // Return early if the component should not render.
  if (!shouldRender) return null;

  return (
    <TooltipProvider>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            ref={chatButtonRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed z-50 transition-shadow duration-200"
            style={{ 
              bottom: `${position.bottom}px`, 
              right: `${position.right}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
              opacity: isDragging ? 0.8 : 1,
              userSelect: 'none'
            }}
            onMouseDown={handleButtonMouseDown}
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
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
              height: isMinimized ? 60 : 500 
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed z-50 w-[400px] transition-shadow duration-200"
            style={{ 
              bottom: `${position.bottom}px`, 
              right: `${position.right}px`,
              opacity: isDragging ? 0.8 : 1,
              userSelect: isDragging ? 'none' : 'auto'
            }}
          >
            <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-md">
              {/* Header */}
              <CardHeader 
                className={`bg-gradient-to-r from-green-500 to-green-600 text-white p-4 ${
                  isMinimized ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                }`}
                onMouseDown={handleHeaderMouseDown}
              >
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={createNewChat}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                          disabled={chatMessages.length === 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{chatMessages.length === 0 ? 'Đã ở cuộc trò chuyện mới' : 'Xóa & bắt đầu lại'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMinimizeChat}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                        >
                          {isMinimized ? (
                            <Maximize2 className="h-4 w-4" />
                          ) : (
                            <Minimize2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isMinimized ? 'Phóng to' : 'Thu nhỏ'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={closeChat}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Đóng</p>
                      </TooltipContent>
                    </Tooltip>
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
                      <div className="h-[380px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                        {/* Suggested Questions - Show only when no messages */}
                        {chatMessages.length === 0 && !isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            {/* Welcome message */}
                            <div className="text-center">
                              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                Xin chào! 👋 Tôi có thể giúp gì cho bạn?
                              </p>
                            </div>
                            
                            {/* Suggested questions in grid layout */}
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Gợi ý:
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {CHATBOT.suggestedQuestions.map((question, idx) => (
                                  <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleChatSubmit(undefined, question)}
                                    className="px-3 py-3 text-xs leading-relaxed rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 shadow-sm hover:shadow-md text-left group min-h-[60px] flex items-center"
                                  >
                                    <span className="text-gray-700 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-400">
                                      {question}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                        {chatMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
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
                                <div className="text-[13px] leading-relaxed whitespace-pre-line">
                                  {message.actions && message.actions.length > 0 
                                    ? removeUrls(message.message)
                                    : message.message}
                                </div>
                                
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
                            
                            {/* Render suggestion buttons below the message bubble */}
                            {message.suggestions && message.suggestions.length > 0 && message.type === 'bot' && (
                              <div className="mt-2 ml-9 space-y-1.5 w-[calc(85%-2.25rem)]">
                                {message.suggestions.map((suggestion, idx) => {
                                  const action = getActionForSuggestion(suggestion, message.actions);
                                  const paymentLink = extractPaymentLink(message.message);
                                  
                                  // Special handling for payment action
                                  if (action === 'pay_holding_fee' && paymentLink) {
                                    return (
                                      <Button
                                        key={idx}
                                        onClick={() => window.open(paymentLink, '_blank')}
                                        size="sm"
                                        className="w-full text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                                      >
                                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                        💳 {suggestion}
                                      </Button>
                                    );
                                  }
                                  
                                  // Special handling for cancel action
                                  if (action && action.includes('cancel')) {
                                    return (
                                      <Button
                                        key={idx}
                                        onClick={() => handleChatSubmit(undefined, suggestion)}
                                        size="sm"
                                        className="w-full text-xs bg-white dark:bg-gray-700 border-2 border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 dark:hover:border-red-500 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                                      >
                                        ❌ {suggestion}
                                      </Button>
                                    );
                                  }
                                  
                                  // Special handling for confirm action
                                  if (action && action.includes('confirm')) {
                                    return (
                                      <Button
                                        key={idx}
                                        onClick={() => handleChatSubmit(undefined, suggestion)}
                                        size="sm"
                                        className="w-full text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                                      >
                                        ✅ {suggestion}
                                      </Button>
                                    );
                                  }
                                  
                                  // Default suggestion button
                                  return (
                                    <Button
                                      key={idx}
                                      onClick={() => handleChatSubmit(undefined, suggestion)}
                                      size="sm"
                                      className="w-full text-xs bg-white dark:bg-gray-700 border-2 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 dark:hover:border-green-500 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                                    >
                                      {suggestion}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Render action buttons (URLs) below suggestions - only if no suggestions or no payment in suggestions */}
                            {message.actions && message.actions.length > 0 && message.type === 'bot' && !message.suggestions && (
                              <div className="mt-2 ml-9 space-y-1.5 w-[calc(85%-2.25rem)]">
                                {message.actions.map((action, idx) => {
                                  const isUrl = action.startsWith('http://') || action.startsWith('https://');
                                  if (!isUrl) return null;
                                  
                                  // Kiểm tra xem có phải payment link không
                                  const isPaymentLink = action.includes('payment') || action.includes('vnpay');
                                  
                                  return (
                                    <Button
                                      key={idx}
                                      onClick={() => window.open(action, '_blank')}
                                      size="sm"
                                      className={`w-full text-xs shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                                        isPaymentLink
                                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                      }`}
                                    >
                                      {isPaymentLink ? (
                                        <>
                                          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                          💳 Thanh toán ngay
                                        </>
                                      ) : (
                                        <>
                                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                          Mở liên kết
                                        </>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
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
    </TooltipProvider>
  );
};

export default FloatingChat;
