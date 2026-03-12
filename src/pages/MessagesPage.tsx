import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { Send, Search, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import {
  PageTransition,
  Button,
  Input,
  Avatar,
  Badge,
  Card,
  EmptyState,
} from '../components/ui';
import { Heading, Label } from '../components/ui/Typography';
import { useMessages } from '../hooks/useMessages';

function formatTime(dateStr: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Ontem';
  if (days < 7) {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function MessagesPage() {
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    fetchConversations,
    selectConversation,
    sendMessage,
  } = useMessages();

  const [searchFilter, setSearchFilter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const activeMessages = activeConversation ? messages[activeConversation] || [] : [];
  const activeConv = conversations.find(c => c.id === activeConversation);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const filteredConversations = conversations.filter(c =>
    c.participant.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    const content = inputValue;
    setInputValue('');
    await sendMessage(content);
    inputRef.current?.focus();
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const CURRENT_USER_ID = 1;

  return (
    <PageTransition id="messages" className="h-[calc(100vh-200px)] flex gap-12">
      {/* Conversations List */}
      <div className="w-96 flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <Heading level={1} className="text-5xl">Caixa de Entrada</Heading>
        </div>

        <div className="relative group">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar conversas..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-surface py-4 shadow-sm group-hover:border-warm-gray/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredConversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 opacity-40"
              >
                <MessageSquare size={32} className="mb-4" />
                <p className="font-serif text-lg">Nenhuma conversa</p>
              </motion.div>
            ) : (
              filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "w-full p-6 flex gap-5 text-left transition-all duration-500 border-none group relative overflow-hidden",
                    activeConversation === conv.id
                      ? "bg-surface shadow-xl shadow-black/5"
                      : "hover:bg-surface/50"
                  )}
                >
                  {activeConversation === conv.id && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-0 w-1 h-full bg-gold"
                    />
                  )}
                  <Avatar
                    name={conv.participant.name}
                    src={conv.participant.avatar || undefined}
                    size="xl"
                    interactive
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-black tracking-tight group-hover:text-gold transition-colors">
                        {conv.participant.name}
                      </h4>
                      <Label className="text-[9px] text-warm-gray/60">
                        {formatTime(conv.last_message_time)}
                      </Label>
                    </div>
                    <p className="text-xs text-warm-gray/80 truncate font-light italic leading-relaxed">
                      {conv.last_message || 'Nenhuma mensagem ainda'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && <Badge count={conv.unread_count} />}
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Window */}
      <Card variant="elevated" className="flex-1 flex flex-col overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {!activeConversation ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <EmptyState
                icon={<MessageSquare size={32} />}
                title="Selecione uma conversa"
                description="Escolha uma conversa ao lado para comecar"
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeConversation}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              {activeConv && (
                <div className="p-8 border-b border-line flex justify-between items-center bg-bg/30 backdrop-blur-md">
                  <div className="flex items-center gap-6">
                    <Avatar
                      name={activeConv.participant.name}
                      src={activeConv.participant.avatar || undefined}
                      size="xl"
                    />
                    <div className="space-y-0.5">
                      <Heading level={3}>{activeConv.participant.name}</Heading>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-bg/5">
                {loading ? (
                  <div className="flex items-center justify-center py-20 opacity-40">
                    <p className="font-serif text-lg">Carregando...</p>
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-20 opacity-40">
                    <p className="font-serif text-lg">Envie a primeira mensagem</p>
                  </div>
                ) : (
                  activeMessages.map((msg, i) => {
                    const isOwn = msg.sender_id === CURRENT_USER_ID;
                    const showAvatar =
                      i === 0 || activeMessages[i - 1].sender_id !== msg.sender_id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          "flex gap-4 max-w-[70%]",
                          isOwn ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        {showAvatar ? (
                          <Avatar
                            name={msg.sender_name}
                            src={msg.sender_avatar || undefined}
                            size="md"
                            variant={isOwn ? 'gold' : 'default'}
                          />
                        ) : (
                          <div className="w-10 flex-shrink-0" />
                        )}
                        <div className={cn("space-y-2", isOwn && "text-right")}>
                          <div
                            className={cn(
                              "p-5 text-base leading-relaxed font-light whitespace-pre-wrap",
                              isOwn
                                ? "bg-gold text-paper shadow-xl shadow-gold/10"
                                : "bg-bg border border-line shadow-sm hover:border-gold/30 transition-all"
                            )}
                          >
                            {msg.content}
                          </div>
                          <Label className="text-warm-gray/40 text-[10px]">
                            {formatTime(msg.created_at)}
                          </Label>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-8 border-t border-line bg-bg/30 backdrop-blur-md">
                <div className="flex items-end gap-4 bg-bg border border-line p-3 pl-6 shadow-inner group focus-within:border-gold transition-all">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva sua mensagem..."
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-lg py-3 placeholder:text-warm-gray/20 font-light resize-none"
                  />
                  <Button
                    icon={<Send size={20} />}
                    iconOnly
                    size="md"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </PageTransition>
  );
}
