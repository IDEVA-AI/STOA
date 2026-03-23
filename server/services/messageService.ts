import * as messageRepo from "../repositories/messageRepository";

export async function getOrCreateConversation(userId1: number, userId2: number) {
  const existing = await messageRepo.findDirectConversation(userId1, userId2);
  if (existing) return existing.id;
  return await messageRepo.createConversation([userId1, userId2]);
}

export async function listConversations(userId: number) {
  return await messageRepo.getConversationsForUser(userId);
}

export async function getMessages(conversationId: number, userId: number, limit?: number, offset?: number) {
  if (!await messageRepo.isParticipant(conversationId, userId)) {
    throw new Error("Not a participant");
  }
  return await messageRepo.getMessages(conversationId, limit, offset);
}

export async function getNewMessages(conversationId: number, userId: number, afterId: number) {
  if (!await messageRepo.isParticipant(conversationId, userId)) {
    throw new Error("Not a participant");
  }
  return await messageRepo.getMessagesSince(conversationId, afterId);
}

export async function sendMessage(conversationId: number, senderId: number, content: string) {
  if (!await messageRepo.isParticipant(conversationId, senderId)) {
    throw new Error("Not a participant");
  }
  return await messageRepo.createMessage(conversationId, senderId, content);
}

export async function markAsRead(conversationId: number, userId: number) {
  return await messageRepo.markAsRead(conversationId, userId);
}

export async function getConversationParticipants(conversationId: number) {
  return await messageRepo.getConversationParticipants(conversationId);
}

export async function getTotalUnreadCount(userId: number) {
  return await messageRepo.getTotalUnreadCount(userId);
}
