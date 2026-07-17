import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sessionApi, Session, Message, SendMessageData } from '@/lib/api/session';

interface ChatState {
  // Sessions
  sessions: Session[];
  currentSession: Session | null;
  sessionsLoading: boolean;
  sessionsError: string | null;

  // Messages
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;

  // Streaming
  isStreaming: boolean;
  streamingContent: string;
  streamingMessageId: string | null;

  // UI State
  inputValue: string;
  isSending: boolean;
}

interface ChatActions {
  // Session actions
  fetchSessions: () => Promise<void>;
  createSession: (data: { title: string; personaId?: string }) => Promise<Session>;
  updateSession: (id: string, data: { title?: string; personaId?: string }) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
  selectSession: (id: string) => Promise<void>;

  // Message actions
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, data: SendMessageData) => Promise<void>;
  sendStreamingMessage: (sessionId: string, content: string) => Promise<void>;
  clearMessages: () => void;

  // Streaming actions
  startStreaming: (messageId: string) => void;
  appendStreamingContent: (content: string) => void;
  completeStreaming: () => void;
  cancelStreaming: () => void;

  // UI actions
  setInputValue: (value: string) => void;
  clearInput: () => void;
  resetChatState: () => void;
}

const initialState: ChatState = {
  // Sessions
  sessions: [],
  currentSession: null,
  sessionsLoading: false,
  sessionsError: null,

  // Messages
  messages: [],
  messagesLoading: false,
  messagesError: null,

  // Streaming
  isStreaming: false,
  streamingContent: '',
  streamingMessageId: null,

  // UI State
  inputValue: '',
  isSending: false,
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Session actions
      fetchSessions: async () => {
        set({ sessionsLoading: true, sessionsError: null });
        try {
          const response = await sessionApi.getSessions({ status: 'ACTIVE' });
          set({ sessions: response.data, sessionsLoading: false });
        } catch (error: any) {
          set({
            sessionsError: error.response?.data?.error?.message || 'Failed to fetch sessions',
            sessionsLoading: false,
          });
          throw error;
        }
      },

      createSession: async (data) => {
        set({ sessionsLoading: true });
        try {
          const response = await sessionApi.createSession(data);
          const newSession = response.data;
          
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
            sessionsLoading: false,
          }));

          return newSession;
        } catch (error: any) {
          set({ sessionsLoading: false });
          throw error;
        }
      },

      updateSession: async (id, data) => {
        try {
          const response = await sessionApi.updateSession(id, data);
          const updatedSession = response.data;
          
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === id ? updatedSession : session
            ),
            currentSession: state.currentSession?.id === id ? updatedSession : state.currentSession,
          }));

          return updatedSession;
        } catch (error: any) {
          throw error;
        }
      },

      deleteSession: async (id) => {
        try {
          await sessionApi.deleteSession(id);
          
          set((state) => ({
            sessions: state.sessions.filter((session) => session.id !== id),
            currentSession: state.currentSession?.id === id ? null : state.currentSession,
          }));
        } catch (error: any) {
          throw error;
        }
      },

      setCurrentSession: (session) => {
        set({ currentSession: session });
      },

      selectSession: async (id) => {
        try {
          const response = await sessionApi.getSession(id);
          const session = response.data;
          
          set({ currentSession: session });
          await get().fetchMessages(id);
        } catch (error: any) {
          throw error;
        }
      },

      // Message actions
      fetchMessages: async (sessionId) => {
        set({ messagesLoading: true, messagesError: null });
        try {
          const response = await sessionApi.getMessages(sessionId, { limit: 100 });
          set({ messages: response.data, messagesLoading: false });
        } catch (error: any) {
          set({
            messagesError: error.response?.data?.error?.message || 'Failed to fetch messages',
            messagesLoading: false,
          });
          throw error;
        }
      },

      sendMessage: async (sessionId, data) => {
        set({ isSending: true });
        try {
          const response = await sessionApi.sendMessage(sessionId, { ...data, stream: false });
          
          // Add user message to state
          const userMessage: Message = {
            id: `temp-${Date.now()}`,
            sessionId,
            role: 'USER',
            content: data.content,
            contentJson: null,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            modelId: null,
            modelUsed: null,
            latencyMs: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add assistant message to state
          const assistantMessage: Message = {
            id: `temp-assistant-${Date.now()}`,
            sessionId,
            role: 'ASSISTANT',
            content: response.data.data.message.content,
            contentJson: null,
            inputTokens: 0,
            outputTokens: response.data.data.message.outputTokens,
            totalTokens: response.data.data.message.totalTokens,
            modelId: null,
            modelUsed: response.data.data.message.modelUsed,
            latencyMs: response.data.data.message.latencyMs,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            messages: [...state.messages, userMessage, assistantMessage],
            isSending: false,
          }));

          // Refresh messages to get actual IDs
          await get().fetchMessages(sessionId);
        } catch (error: any) {
          set({ isSending: false });
          throw error;
        }
      },

      sendStreamingMessage: async (sessionId, content) => {
        set({ isSending: true });
        
        // Create temporary user message
        const tempUserMessageId = `temp-user-${Date.now()}`;
        const userMessage: Message = {
          id: tempUserMessageId,
          sessionId,
          role: 'USER',
          content,
          contentJson: null,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          modelId: null,
          modelUsed: null,
          latencyMs: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Create temporary assistant message
        const tempAssistantMessageId = `temp-assistant-${Date.now()}`;
        const assistantMessage: Message = {
          id: tempAssistantMessageId,
          sessionId,
          role: 'ASSISTANT',
          content: '',
          contentJson: null,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          modelId: null,
          modelUsed: null,
          latencyMs: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage, assistantMessage],
          isSending: false,
        }));

        // Start streaming
        get().startStreaming(tempAssistantMessageId);
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      // Streaming actions
      startStreaming: (messageId) => {
        set({
          isStreaming: true,
          streamingContent: '',
          streamingMessageId: messageId,
        });
      },

      appendStreamingContent: (content) => {
        set((state) => ({
          streamingContent: state.streamingContent + content,
          messages: state.messages.map((msg) =>
            msg.id === state.streamingMessageId
              ? { ...msg, content: state.streamingContent + content }
              : msg
          ),
        }));
      },

      completeStreaming: () => {
        set({
          isStreaming: false,
          streamingContent: '',
          streamingMessageId: null,
        });
      },

      cancelStreaming: () => {
        set({
          isStreaming: false,
          streamingContent: '',
          streamingMessageId: null,
        });
      },

      // UI actions
      setInputValue: (value) => {
        set({ inputValue: value });
      },

      clearInput: () => {
        set({ inputValue: '' });
      },

      resetChatState: () => {
        set(initialState);
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession,
      }),
    }
  )
);