import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, Message } from '../types';
import * as api from '../services/api';

const CURRENT_USER_ID = 1;

interface MessagesContextType {
  conversations: Conversation[];
  activeConversation: number | null;
  messages: Record<number, Message[]>;
  totalUnread: number;
  loading: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startConversation: (targetUserId: number) => Promise<void>;
}

export const MessagesContext = createContext<MessagesContextType>(null!);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const activeRef = useRef<number | null>(null);
  activeRef.current = activeConversation;

  const messagesRef = useRef<Record<number, Message[]>>({});
  messagesRef.current = messages;

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.getConversations(CURRENT_USER_ID);
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  const selectConversation = useCallback(async (id: number) => {
    setActiveConversation(id);
    setLoading(true);
    try {
      const msgs = await api.getMessages(id, CURRENT_USER_ID);
      setMessages(prev => ({ ...prev, [id]: msgs }));
      await api.markConversationRead(id, CURRENT_USER_ID);
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c)
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const convId = activeRef.current;
    if (!convId || !content.trim()) return;
    try {
      const msg = await api.sendMessage(convId, CURRENT_USER_ID, content);
      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), msg],
      }));
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, last_message: content, last_message_time: msg.created_at }
            : c
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  const startConversation = useCallback(async (targetUserId: number) => {
    try {
      const { conversationId } = await api.createConversation(CURRENT_USER_ID, targetUserId);
      await fetchConversations();
      await selectConversation(conversationId);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [fetchConversations, selectConversation]);

  // Poll for new messages in active conversation (every 3s)
  useEffect(() => {
    const interval = setInterval(async () => {
      const convId = activeRef.current;
      if (!convId) return;

      const currentMsgs = messagesRef.current[convId];
      if (!currentMsgs || currentMsgs.length === 0) return;

      const lastId = currentMsgs[currentMsgs.length - 1].id;
      try {
        const newMsgs = await api.pollMessages(convId, CURRENT_USER_ID, lastId);
        if (newMsgs.length > 0) {
          setMessages(prev => ({
            ...prev,
            [convId]: [...(prev[convId] || []), ...newMsgs],
          }));
          await api.markConversationRead(convId, CURRENT_USER_ID);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Poll for unread count (every 15s)
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { count } = await api.getUnreadCount(CURRENT_USER_ID);
        setTotalUnread(count);
      } catch {
        // silently ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        totalUnread,
        loading,
        fetchConversations,
        selectConversation,
        sendMessage,
        startConversation,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}
