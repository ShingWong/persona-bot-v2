import { apiClient } from './client';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  tokensUsed?: number;
  modelUsed?: string;
}

export interface SendMessageRequest {
  content: string;
  stream?: boolean;
}

export interface SendMessageResponse {
  message: Message;
  sessionTokens: number;
}

export const messageApi = {
  async getMessages(sessionId: string): Promise<Message[]> {
    const response = await apiClient.get(`/sessions/${sessionId}/messages`);
    return response.data;
  },

  async sendMessage(sessionId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await apiClient.post(`/sessions/${sessionId}/messages`, data);
    return response.data;
  },

  async sendMessageToLLM(sessionId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await apiClient.post(`/sessions/${sessionId}/messages/llm`, data);
    return response.data;
  },

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    await apiClient.delete(`/sessions/${sessionId}/messages/${messageId}`);
  }
};