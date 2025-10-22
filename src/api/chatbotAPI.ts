
import { MessagePayload, ChatbotAPIResponse, ChatHistoryResponse } from '../types/chatbot';
import apiClient from './config';

export async function sendMessage(payload: MessagePayload): Promise<ChatbotAPIResponse> {

    const res = await apiClient.post<ChatbotAPIResponse>('/chatbot/message', payload);
    return res.data;
}

export async function conversations(payload: MessagePayload): Promise<ChatbotAPIResponse> {

    const res = await apiClient.post<ChatbotAPIResponse>('/chatbot/conversations', payload);
    return res.data;
}

export async function getConversationHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const res = await apiClient.get<ChatHistoryResponse>(`/chatbot/history`, { params: { session_id: sessionId } });
    return res.data;
}

export async function getConversations(limit?: number): Promise<ChatbotAPIResponse> {
    // Calls GET /chatbot/conversations and optionally includes the `limit` query param.
    const params = limit !== undefined ? { limit } : {};
    const res = await apiClient.get<ChatbotAPIResponse>('/chatbot/conversations', { params });
    return res.data;
}