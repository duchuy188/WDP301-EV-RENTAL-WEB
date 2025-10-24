import React, { useEffect, useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { getConversations, getConversationHistory } from '@/api/chatbotAPI';
import { ConversationResponse } from '@/types/chatbot';

type ConversationRaw = ConversationResponse;

const parseList = (res: any): ConversationRaw[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res as ConversationRaw[];
  if (Array.isArray(res.conversations)) return res.conversations as ConversationRaw[];
  if (res.data && Array.isArray(res.data.conversations)) return res.data.conversations as ConversationRaw[];
  if (res.data && Array.isArray(res.data)) return res.data as ConversationRaw[];
  return [];
};

interface ChatHistoryProps {
  onSelect?: (sessionId: string) => void;
  loading?: boolean; // external loading state
  full?: boolean; // whether to render in a large, full panel
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelect, loading: propLoading, full }) => {
  const [list, setList] = useState<ConversationRaw[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const fetchPreviews = async (items: ConversationRaw[]) => {
    if (!items || items.length === 0) return;
    try {
      const promises = items.map(async (c) => {
        try {
          const res = await getConversationHistory(c.session_id);
          const msgs = res?.data?.messages ?? [];
          for (let i = msgs.length - 1; i >= 0; i--) {
            const m = msgs[i];
            if ((m.role || '').toLowerCase() === 'user' && m.message) return { id: c.session_id, text: String(m.message) };
          }
          if (msgs.length) return { id: c.session_id, text: String(msgs[msgs.length - 1].message ?? '') };
        } catch (err) {
          // ignore per-item failure
        }
        return { id: c.session_id, text: '' };
      });

      const results = await Promise.all(promises);
      setPreviews((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r && r.id && r.text) next[r.id] = r.text;
        });
        return next;
      });
    } catch (err) {
      // ignore
    }
  };

  const load = async () => {
    setLocalLoading(true);
    setError(null);
    try {
      const res = await getConversations();
      const parsed = parseList(res);
      // Filter to show only conversations with messages
      const filtered = parsed.filter(c => (c.total_messages ?? 0) > 0);
      setList(filtered);
      // fetch previews for first 20 items
      fetchPreviews(filtered.slice(0, 20));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to fetch');
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`w-full ${full ? 'mt-2' : 'mt-4'}`}>
      {error && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="px-2" style={full ? { maxHeight: 'calc(100vh - 220px)', overflow: 'auto' } : undefined}>
        {list.length === 0 && !localLoading && !propLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Chưa có lịch sử trò chuyện</p>
          </div>
        )}
        <ul className="space-y-2">
          {list.map((c) => {
            const rawPreview = (c.title && String(c.title)) || (c.last_message && String(c.last_message)) || previews[c.session_id] || null;
            const preview = rawPreview ? (rawPreview.length > 120 ? rawPreview.slice(0, 117) + '...' : rawPreview) : null;
            return (
              <li
                key={c.session_id}
                className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => onSelect?.(c.session_id)}
              >
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-500" />
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                          {c.user_role ?? 'Unknown'}
                        </div>
                      </div>
                      {preview && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed ml-10">
                          {preview}
                        </div>
                      )}
                      {!preview && c.last_activity && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500 ml-10">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(c.last_activity).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-700 dark:text-green-400">
                        {c.total_messages ?? 0} tin
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ChatHistory;
