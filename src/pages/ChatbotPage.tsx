import React, { createContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { sendMessage, conversations, getConversationHistory } from '@/api/chatbotAPI';
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
      };
      addMessage(assistantMsg);

      if (res.session_id) setSessionId(res.session_id);
      if (res.conversation_id) setConversationId(res.conversation_id);

      if (res.suggestions && res.suggestions.length) {
        const suggText = CHATBOT.suggestionPrefix + res.suggestions.join(' · ');
        addMessage({ id: `s-${Date.now()}`, role: 'system', content: suggText });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(CHATBOT.toastErrorTitle, err?.message ?? CHATBOT.toastErrorMessage);
      addMessage({ id: `a-${Date.now()}`, role: 'assistant', content: CHATBOT.assistantFallback });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatbotContext.Provider value={{ sessionId, conversationId }}>
      <div className="flex flex-row w-full min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        {/* Main scrollable area */}
        <div className="flex flex-row w-full h-screen overflow-y-auto">
          {/* Sidebar */}
          <aside className="w-64 bg-white/90 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-800 shadow flex flex-col items-center py-8 px-4">
            <div className="mb-8 flex flex-col items-center">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-lg mb-2">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">EV Rental</span>
            </div>
            <nav className="flex flex-col gap-4 w-full">
              <button
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-100 text-gray-700 font-medium"
                onClick={createSession}
                disabled={isCreating}
              >
                {isCreating ? 'Đang tạo...' : CHATBOT.aiButtonLabel}
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-100 text-gray-700 font-medium" onClick={() => setShowHistory(s => !s)}>
                {CHATBOT.historyButtonLabel}
              </button>
            </nav>
            <div className="mt-auto w-full px-4">
              <button
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                onClick={() => navigate('/')}
              >
                Quay về
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
                <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto" style={{ minHeight: '1px' }}>
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`relative max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap shadow-sm transition-all
                      ${
                        m.role === 'user'
                          ? 'bg-green-600 text-white rounded-br-lg rounded-tr-2xl rounded-tl-2xl'
                          : m.role === 'assistant'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-lg rounded-tl-2xl rounded-tr-2xl'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl'
                      }`}
                      >
                        {m.role === 'assistant' && (
                          <span className="absolute -top-6 left-0 text-xs text-green-600 font-semibold">
                            {CHATBOT.roleLabels.assistant}
                          </span>
                        )}
                        {m.role === 'user' && (
                          <span className="absolute -top-6 right-0 text-xs text-blue-600 font-semibold">
                            {CHATBOT.roleLabels.user}
                          </span>
                        )}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* ✅ Chat input fixed */}
                <div className="w-full px-0 pb-4 pt-0 flex justify-center items-end" style={{ minHeight: '64px' }}>
                  <form
                    className="flex items-end w-full max-w-3xl bg-white border border-green-300 rounded-2xl p-0 shadow-sm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    autoComplete="off"
                  >
                    {/* ✅ Khung chứa icon riêng biệt, cố định chiều cao */}
                    <div className="flex flex-col justify-end h-full px-3 py-2 border-r border-green-100 bg-green-50/30 rounded-l-2xl">
                      <div className="flex items-center gap-2">
                        <button type="button" tabIndex={-1} className="p-0 rounded-full hover:bg-green-100" title="Đính kèm file"
                          style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" fill="none" stroke="#10A37F" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 7v7a5 5 0 01-10 0V7a3 3 0 016 0v7a1 1 0 01-2 0V7" />
                          </svg>
                        </button>
                        <button type="button" tabIndex={-1} className="p-0 rounded-full hover:bg-green-100" title="Đính kèm ảnh"
                          style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" fill="none" stroke="#10A37F" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5-4 4-2-2-4 4" />
                          </svg>
                        </button>
                        <button type="button" tabIndex={-1} className="p-0 rounded-full hover:bg-green-100" title="Gửi giọng nói"
                          style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" fill="none" stroke="#10A37F" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="9" y="2" width="6" height="12" rx="3" />
                            <path d="M5 10v2a7 7 0 0014 0v-2" />
                            <line x1="12" y1="22" x2="12" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 flex items-end px-3 py-2">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={CHATBOT.inputPlaceholder}
                        className="flex-1 rounded-2xl border-none outline-none px-2 py-2 text-base bg-transparent focus:ring-0 resize-none overflow-y-auto transition-all duration-200 no-scrollbar"
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
                    <div className="flex items-end px-2 py-2">
                      <button
                        type="submit"
                        className="ml-2 mr-4 h-10 w-10 flex items-center justify-center rounded-full bg-green-300 hover:bg-green-400 transition shadow-none"
                        disabled={loading || !input.trim()}
                        title="Gửi"
                      >
                        <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M22 2L11 13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
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
