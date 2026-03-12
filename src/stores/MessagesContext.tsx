import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, Message } from '../types';
import * as api from '../services/api';

interface MessagesContextType {
  conversations: Conversation[];
  activeConversation: number | null;
  messages: Record<number, Message[]>;
  totalUnread: number;
  loading: boolean;
  typingUsers: Record<number, number[]>; // conversationId -> userId[]
  wsConnected: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startConversation: (targetUserId: number) => Promise<void>;
  sendTyping: (conversationId: number) => void;
}

export const MessagesContext = createContext<MessagesContextType>(null!);

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, number[]>>({});
  const [wsConnected, setWsConnected] = useState(false);

  const activeRef = useRef<number | null>(null);
  activeRef.current = activeConversation;

  const messagesRef = useRef<Record<number, Message[]>>({});
  messagesRef.current = messages;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Typing indicator debounce — per conversation
  const lastTypingSentRef = useRef<Record<number, number>>({});

  const getCurrentUserId = useCallback((): number | null => {
    const token = api.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId ?? null;
    } catch {
      return null;
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      const data = await api.getConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [getCurrentUserId]);

  const selectConversation = useCallback(async (id: number) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    setActiveConversation(id);
    setLoading(true);
    try {
      const msgs = await api.getMessages(id, userId);
      setMessages(prev => ({ ...prev, [id]: msgs }));

      // Mark as read via WS if connected, otherwise REST
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'read', conversationId: id }));
      } else {
        await api.markConversationRead(id, userId);
      }

      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c)
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId]);

  const sendMessage = useCallback(async (content: string) => {
    const convId = activeRef.current;
    if (!convId || !content.trim()) return;

    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        conversationId: convId,
        content,
      }));
      return;
    }

    // Fallback to REST
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      const msg = await api.sendMessage(convId, userId, content);
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
  }, [getCurrentUserId]);

  const sendTyping = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    const lastSent = lastTypingSentRef.current[conversationId] || 0;
    if (now - lastSent < 500) return; // debounce 500ms
    lastTypingSentRef.current[conversationId] = now;
    wsRef.current.send(JSON.stringify({ type: 'typing', conversationId }));
  }, []);

  const startConversation = useCallback(async (targetUserId: number) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      const { conversationId } = await api.createConversation(userId, targetUserId);
      await fetchConversations();
      await selectConversation(conversationId);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [getCurrentUserId, fetchConversations, selectConversation]);

  // Handle incoming WS messages
  const handleWsMessage = useCallback((event: MessageEvent) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    switch (data.type) {
      case 'auth_ok':
        setWsConnected(true);
        reconnectAttemptRef.current = 0;
        break;

      case 'new_message': {
        const msg: Message = data.message;
        const convId = msg.conversation_id;

        setMessages(prev => {
          const existing = prev[convId] || [];
          // Avoid duplicates
          if (existing.some(m => m.id === msg.id)) return prev;
          return { ...prev, [convId]: [...existing, msg] };
        });

        // Update conversation list
        setConversations(prev => {
          const userId = getCurrentUserId();
          return prev.map(c => {
            if (c.id !== convId) return c;
            const isActive = activeRef.current === convId;
            return {
              ...c,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: isActive ? c.unread_count : c.unread_count + (msg.sender_id !== userId ? 1 : 0),
            };
          });
        });

        // If this conversation is active and message is from someone else, mark as read
        if (activeRef.current === convId && msg.sender_id !== getCurrentUserId()) {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'read', conversationId: convId }));
          }
        }

        // Clear typing indicator for this user in this conversation
        setTypingUsers(prev => {
          const current = prev[convId] || [];
          const filtered = current.filter(id => id !== msg.sender_id);
          if (filtered.length === 0) {
            const { [convId]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, [convId]: filtered };
        });
        break;
      }

      case 'typing': {
        const { conversationId, userId } = data;
        setTypingUsers(prev => {
          const current = prev[conversationId] || [];
          if (current.includes(userId)) return prev;
          return { ...prev, [conversationId]: [...current, userId] };
        });

        // Clear typing indicator after 3 seconds
        const timerKey = `${conversationId}-${userId}`;
        if (typingTimersRef.current[timerKey]) {
          clearTimeout(typingTimersRef.current[timerKey]);
        }
        typingTimersRef.current[timerKey] = setTimeout(() => {
          setTypingUsers(prev => {
            const current = prev[conversationId] || [];
            const filtered = current.filter(id => id !== userId);
            if (filtered.length === 0) {
              const { [conversationId]: _, ...rest } = prev;
              return rest;
            }
            return { ...prev, [conversationId]: filtered };
          });
          delete typingTimersRef.current[timerKey];
        }, 3000);
        break;
      }

      case 'read': {
        // Another user read messages — could update read receipts UI in the future
        break;
      }

      case 'error': {
        console.error('WebSocket error:', data.error);
        break;
      }
    }
  }, [getCurrentUserId]);

  // Connect/reconnect WebSocket
  const connectWs = useCallback(() => {
    const token = api.getAccessToken();
    if (!token) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = (event) => {
      setWsConnected(false);
      wsRef.current = null;

      // Don't reconnect if closed intentionally (code 4002 = invalid token)
      if (event.code === 4002) return;

      // Exponential backoff reconnect
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      reconnectAttemptRef.current = attempt + 1;

      reconnectTimerRef.current = setTimeout(() => {
        connectWs();
      }, delay);
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }, [handleWsMessage]);

  // Initialize WebSocket connection when token is available
  useEffect(() => {
    const token = api.getAccessToken();
    if (token) {
      connectWs();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Clear all typing timers
      for (const timer of Object.values(typingTimersRef.current)) {
        clearTimeout(timer);
      }
    };
  }, [connectWs]);

  // Fallback polling for unread count (every 30s) — only when WS disconnected
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;

    const fetchUnread = async () => {
      if (wsConnected) return; // skip if WS is connected (we get real-time updates)
      try {
        const { count } = await api.getUnreadCount(userId);
        setTotalUnread(count);
      } catch {
        // silently ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [getCurrentUserId, wsConnected]);

  // Fallback polling for new messages (every 5s) — only when WS disconnected
  useEffect(() => {
    if (wsConnected) return; // no need to poll when WS is active

    const userId = getCurrentUserId();
    if (!userId) return;

    const interval = setInterval(async () => {
      const convId = activeRef.current;
      if (!convId) return;

      const currentMsgs = messagesRef.current[convId];
      if (!currentMsgs || currentMsgs.length === 0) return;

      const lastId = currentMsgs[currentMsgs.length - 1].id;
      try {
        const newMsgs = await api.pollMessages(convId, userId, lastId);
        if (newMsgs.length > 0) {
          setMessages(prev => ({
            ...prev,
            [convId]: [...(prev[convId] || []), ...newMsgs],
          }));
          await api.markConversationRead(convId, userId);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [getCurrentUserId, wsConnected]);

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        totalUnread,
        loading,
        typingUsers,
        wsConnected,
        fetchConversations,
        selectConversation,
        sendMessage,
        startConversation,
        sendTyping,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}
