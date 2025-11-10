import React, { createContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sparkles, History, ArrowLeft, Paperclip, Image as ImageIcon, Mic, Send, MessageCircle, CreditCard } from 'lucide-react';
import { sendMessage, conversations, getConversationHistory } from '@/api/chatbotAPI';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { ChatMessage } from '@/types/chatbot';
import { CHATBOT } from '@/config/chatbot';
import ChatHistory from '@/components/ChatHistory';

// Create ChatbotContext
export const ChatbotContext = createContext<{
  sessionId: string | undefined;
  conversationId: string | undefined;
}>({
  sessionId: undefined,
  conversationId: undefined,
});

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'system-1',
      role: 'system',
      content: CHATBOT.defaultSystemMessage,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const creatingSessionRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  const createSession = async () => {
    // prevent concurrent calls that would create multiple sessions
    if (creatingSessionRef.current) return;
    creatingSessionRef.current = true;
    setIsCreating(true);
    try {
      const res = await conversations({});
      if (res?.session_id) setSessionId(res.session_id);
      if (res?.conversation_id) setConversationId(res.conversation_id);
      setMessages([
        {
          id: 'system-1',
          role: 'system',
          content: CHATBOT.defaultSystemMessage,
        },
      ]);
    } catch {
      // ignore error
    } finally {
      creatingSessionRef.current = false;
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!sessionId) createSession();
  }, []);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSelectHistory = async (selectedSessionId: string) => {
    setLoadingHistory(true);
    try {
      const res = await getConversationHistory(selectedSessionId);
      if (!res || !res.success || !res.data) throw new Error('No history returned');
      const mapped: ChatMessage[] = [
        {
          id: 'system-1',
          role: 'system',
          content: CHATBOT.defaultSystemMessage,
        },
        ...res.data.messages.map((m) => {
          // normalize role
          const r = (m.role || '').toLowerCase();
          const role: ChatMessage['role'] = r === 'user' ? 'user' : r === 'assistant' ? 'assistant' : 'assistant';
          const ts = m.timestamp ?? String(Date.now());
          return {
            id: `h-${ts}`,
            role,
            content: m.message,
            suggestions: m.metadata?.suggestions,
            actions: m.metadata?.actions,
          };
        }),
      ];

      setMessages(mapped);
      setSessionId(res.data.session_id);
      if ((res.data as any).conversation_id) setConversationId((res.data as any).conversation_id);
      setShowHistory(false);
      setTimeout(() => {
        textareaRef.current?.focus();
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      toast.error('Không thể tải lịch sử hội thoại', err?.message ?? '');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const payload: any = { message: content };
      if (sessionId) payload.session_id = sessionId;
      if (conversationId) payload.conversation_id = conversationId;

      const res = await sendMessage(payload);
      if (!res) throw new Error('No response from server');

      const assistantText = res.message ?? res.context ?? '...';
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        suggestions: res.suggestions,
        actions: res.actions,
      };
      addMessage(assistantMsg);

      if (res.session_id) setSessionId(res.session_id);
      if (res.conversation_id) setConversationId(res.conversation_id);
    } catch (err: any) {
      console.error(err);
      toast.error(CHATBOT.toastErrorTitle, err?.message ?? CHATBOT.toastErrorMessage);
      addMessage({ id: `a-${Date.now()}`, role: 'assistant', content: CHATBOT.assistantFallback });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
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

  return (
    <ChatbotContext.Provider value={{ sessionId, conversationId }}>
      <div className="flex flex-row w-full min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Main scrollable area */}
        <div className="flex flex-row w-full h-screen overflow-y-auto">
          {/* Sidebar */}
          <aside className="w-64 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-800 shadow-lg flex flex-col items-center py-8 px-4">
            <div className="mb-8 flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl mb-3 shadow-lg group-hover:shadow-green-500/50 transition-all duration-300">
                <Zap className="h-6 w-6 text-white animate-pulse" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">EV Rental</span>
            </div>
            <nav className="flex flex-col gap-3 w-full">
              <button
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 flex items-center gap-3 group disabled:opacity-50"
                onClick={createSession}
                disabled={isCreating}
              >
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-500 group-hover:rotate-12 transition-transform" />
                <span>{isCreating ? 'Đang tạo...' : CHATBOT.aiButtonLabel}</span>
              </button>
              <button 
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 flex items-center gap-3 group" 
                onClick={() => setShowHistory(s => !s)}
              >
                <History className="h-5 w-5 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform" />
                <span>{CHATBOT.historyButtonLabel}</span>
              </button>
            </nav>
            <div className="mt-auto w-full px-0">
              <button
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-all duration-300 flex items-center gap-3 group"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:-translate-x-1 transition-transform" />
                <span>Quay về</span>
              </button>
            </div>
          </aside>

          {/* Chat area */}
          <div className="flex-1 flex flex-col items-center justify-end">
            {/* When showing history, render a wider full-width panel so the list is large */}
            {showHistory ? (
              <div className="w-full px-8 py-8 min-h-[60vh] h-[calc(100vh-64px)]">
                <ChatHistory onSelect={handleSelectHistory} loading={loadingHistory} full />
              </div>
            ) : (
              <div className="w-full max-w-4xl flex flex-col justify-end min-h-[60vh] h-[calc(100vh-64px)]">
                {/* Messages */}
                <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto chatbot-scrollbar" style={{ minHeight: '1px' }}>
                  {/* Suggested Questions - Show only when there's only the system message */}
                  {messages.length === 1 && messages[0].role === 'system' && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-2xl mx-auto space-y-4 py-8"
                    >
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl mb-4">
                          <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Bạn cần giúp gì?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Chọn một câu hỏi gợi ý hoặc nhập câu hỏi của bạn bên dưới
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {CHATBOT.suggestedQuestions.map((question, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => handleSuggestedQuestion(question)}
                            className="group text-left p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-600 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 dark:hover:from-green-900/20 dark:hover:to-green-800/10 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 font-medium leading-relaxed">
                                {question}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {messages.map((m, idx) => (
                    <div 
                      key={m.id} 
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} flex-col animate-in fade-in slide-in-from-bottom-4 duration-500`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                        <div
                          className={`relative max-w-[80%] px-5 py-4 rounded-2xl whitespace-pre-wrap shadow-md hover:shadow-lg transition-all duration-300
                        ${
                          m.role === 'user'
                            ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-sm'
                            : m.role === 'assistant'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm backdrop-blur-sm'
                            : 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg'
                        }`}
                        >
                          {m.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                              </div>
                              <span className="text-xs text-green-600 dark:text-green-500 font-semibold">
                                {CHATBOT.roleLabels.assistant}
                              </span>
                            </div>
                          )}
                          {m.role === 'user' && (
                            <span className="absolute -top-6 right-0 text-xs text-green-700 dark:text-green-400 font-semibold">
                              {CHATBOT.roleLabels.user}
                            </span>
                          )}
                          <div className="text-[15px] leading-relaxed">{m.content}</div>
                        </div>
                      </div>

                      {/* Render suggestion buttons below bot message */}
                      {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                        <div className="flex justify-start w-full mt-3">
                          <div className="max-w-[80%] space-y-2">
                            {m.suggestions.map((suggestion, suggIdx) => {
                              const action = getActionForSuggestion(suggestion, m.actions);
                              const paymentLink = extractPaymentLink(m.content);
                              
                              // Special handling for payment action
                              if (action === 'pay_holding_fee' && paymentLink) {
                                return (
                                  <motion.div
                                    key={suggIdx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: suggIdx * 0.1 }}
                                  >
                                    <Button
                                      onClick={() => window.open(paymentLink, '_blank')}
                                      className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
                                    >
                                      <CreditCard className="h-4 w-4 mr-2 inline" />
                                      💳 {suggestion}
                                    </Button>
                                  </motion.div>
                                );
                              }
                              
                              // Special handling for cancel action
                              if (action && action.includes('cancel')) {
                                return (
                                  <motion.button
                                    key={suggIdx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: suggIdx * 0.1 }}
                                    onClick={() => handleSend(suggestion)}
                                    className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
                                  >
                                    ❌ {suggestion}
                                  </motion.button>
                                );
                              }
                              
                              // Special handling for confirm action
                              if (action && action.includes('confirm')) {
                                return (
                                  <motion.button
                                    key={suggIdx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: suggIdx * 0.1 }}
                                    onClick={() => handleSend(suggestion)}
                                    className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
                                  >
                                    ✅ {suggestion}
                                  </motion.button>
                                );
                              }
                              
                              // Default suggestion button
                              return (
                                <motion.button
                                  key={suggIdx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: suggIdx * 0.1 }}
                                  onClick={() => handleSend(suggestion)}
                                  className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 dark:hover:border-green-500 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] text-sm font-medium"
                                >
                                  {suggestion}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white dark:bg-gray-800 px-5 py-4 rounded-2xl rounded-bl-sm shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Đang suy nghĩ...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Chat input */}
                <div className="w-full px-4 pb-6 pt-0 flex justify-center items-end" style={{ minHeight: '64px' }}>
                  <form
                    className="flex items-end w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-2 border-green-200 dark:border-green-800 rounded-2xl p-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-green-300 dark:hover:border-green-700"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    autoComplete="off"
                  >
                    {/* Icon buttons */}
                    <div className="flex flex-col justify-end h-full px-3 py-3 border-r border-green-100 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 rounded-l-2xl">
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          tabIndex={-1} 
                          className="p-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300 hover:scale-110 active:scale-95 group" 
                          title="Đính kèm file"
                        >
                          <Paperclip className="h-5 w-5 text-green-600 dark:text-green-500 group-hover:rotate-12 transition-transform" />
                        </button>
                        <button 
                          type="button" 
                          tabIndex={-1} 
                          className="p-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300 hover:scale-110 active:scale-95 group" 
                          title="Đính kèm ảnh"
                        >
                          <ImageIcon className="h-5 w-5 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          type="button" 
                          tabIndex={-1} 
                          className="p-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300 hover:scale-110 active:scale-95 group" 
                          title="Gửi giọng nói"
                        >
                          <Mic className="h-5 w-5 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 flex items-end px-4 py-3">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={CHATBOT.inputPlaceholder}
                        className="flex-1 rounded-2xl border-none outline-none px-2 py-2 text-[15px] bg-transparent focus:ring-0 resize-none overflow-y-auto transition-all duration-200 no-scrollbar dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        rows={1}
                        style={{ minHeight: '32px', maxHeight: '180px', lineHeight: '1.6' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        disabled={loading}
                      />
                    </div>

                    {/* Send button */}
                    <div className="flex items-end px-3 py-3">
                      <button
                        type="submit"
                        className="h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        disabled={loading || !input.trim()}
                        title="Gửi"
                      >
                        <Send className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChatbotContext.Provider>
  );
};

export default ChatbotPage;
