import React, { useEffect, useState } from 'react';
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
      setList(parsed);
      // fetch previews for first 20 items
      fetchPreviews(parsed.slice(0, 20));
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
      <div className="flex items-center justify-between px-2">
        <div className="text-sm font-medium text-gray-800">Lịch sử chat</div>
        <div>
          <button
            className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200"
            onClick={load}
            disabled={localLoading || propLoading}
          >
            {(localLoading || propLoading) ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-red-500 mt-2 px-2">{error}</div>}

      <div className="mt-2 px-1" style={full ? { maxHeight: 'calc(100vh - 220px)', overflow: 'auto' } : undefined}>
        {list.length === 0 && !localLoading && !propLoading && <div className="text-xs text-gray-500 px-2">Không có lịch sử</div>}
        <ul className="">
          {list.map((c) => {
            const rawPreview = (c.title && String(c.title)) || (c.last_message && String(c.last_message)) || previews[c.session_id] || null;
            const preview = rawPreview ? (rawPreview.length > 120 ? rawPreview.slice(0, 117) + '...' : rawPreview) : null;
            return (
              <li
                key={c.session_id}
                className="py-3 cursor-pointer hover:bg-green-50"
                onClick={() => onSelect?.(c.session_id)}
              >
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.user_role ?? 'Unknown'}</div>
                    {preview && <div className="text-xs text-gray-500 mt-1 truncate">{preview}</div>}
                    {!preview && c.last_activity && (
                      <div className="text-xs text-gray-500 mt-1">{new Date(c.last_activity).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="ml-4 text-xs text-gray-400 text-right">{c.total_messages ?? 0} tin</div>
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
