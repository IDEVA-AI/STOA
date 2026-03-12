import * as messageRepo from "../repositories/messageRepository";

export function getOrCreateConversation(userId1: number, userId2: number) {
  const existing = messageRepo.findDirectConversation(userId1, userId2);
  if (existing) return existing.id;
  return messageRepo.createConversation([userId1, userId2]);
}

export function listConversations(userId: number) {
  return messageRepo.getConversationsForUser(userId);
}

export function getMessages(conversationId: number, userId: number, limit?: number, offset?: number) {
  if (!messageRepo.isParticipant(conversationId, userId)) {
    throw new Error("Not a participant");
  }
  return messageRepo.getMessages(conversationId, limit, offset);
}

export function getNewMessages(conversationId: number, userId: number, afterId: number) {
  if (!messageRepo.isParticipant(conversationId, userId)) {
    throw new Error("Not a participant");
  }
  return messageRepo.getMessagesSince(conversationId, afterId);
}

export function sendMessage(conversationId: number, senderId: number, content: string) {
  if (!messageRepo.isParticipant(conversationId, senderId)) {
    throw new Error("Not a participant");
  }
  return messageRepo.createMessage(conversationId, senderId, content);
}

export function markAsRead(conversationId: number, userId: number) {
  return messageRepo.markAsRead(conversationId, userId);
}

export function getConversationParticipants(conversationId: number) {
  return messageRepo.getConversationParticipants(conversationId);
}

export function getTotalUnreadCount(userId: number) {
  return messageRepo.getTotalUnreadCount(userId);
}
