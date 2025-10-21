// Message format in chat history
export interface ChatHistoryMessage {
  role: string;
  message: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    actions?: string[];
    context?: string;
  };
}

// Data object in chat history response
export interface ChatHistoryData {
  session_id: string;
  user_role: string;
  total_messages: number;
  last_activity: string;
  messages: ChatHistoryMessage[];
}

// Full API response for chat history
export interface ChatHistoryResponse {
  success: boolean;
  data: ChatHistoryData;
}
export interface MessagePayload {
    // frontend-friendly fields
    conversationId?: string;
    content?: string;
    // raw message text (backend expects `message`)
    message?: string;
    // backend session / conversation keys (snake_case to match API)
    session_id?: string;
    conversation_id?: string;
    role?: 'user' | 'assistant' | 'system';
}

export interface MessageResponse {
    id: string;
    content: string;
    role: string;
    createdAt: string;
}

export interface Conversation {
    id: string;
    title?: string;
    lastMessage?: string;
    updatedAt?: string;
}

export interface Suggestion {
    id: string;
    text: string;
}

// Response shape returned by the chatbot backend (example from swagger)
export interface ChatbotAPIResponse {
    success: boolean;
    message: string;
    suggestions?: string[];
    actions?: string[];
    context?: string;
    session_id?: string;
    conversation_id?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}



export interface ConversationResponse {
  session_id: string;
  user_role?: string;
  status?: string;
  total_messages?: number;
  last_activity?: string;
  created_at?: string;
  title?: string;
  [key: string]: any;
}

// Optional frontend model (camelCase) if needed later
export interface ConversationItem {
  sessionId: string;
  userRole?: string;
  status?: string;
  totalMessages?: number;
  lastActivity?: Date | null;
  createdAt?: Date | null;
  title?: string;
}

export function mapConversation(resp: ConversationResponse): ConversationItem {
  return {
    sessionId: resp.session_id,
    userRole: resp.user_role,
    status: resp.status,
    totalMessages: resp.total_messages,
    lastActivity: resp.last_activity ? new Date(resp.last_activity) : null,
    createdAt: resp.created_at ? new Date(resp.created_at) : null,
    title: resp.title,
  };
}
