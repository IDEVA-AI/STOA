import { Router } from "express";
import * as messageService from "../services/messageService";

const router = Router();

router.get("/conversations", (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const conversations = messageService.listConversations(userId);
  res.json(conversations);
});

router.post("/conversations", (req, res) => {
  const { userId, targetUserId } = req.body;
  const conversationId = messageService.getOrCreateConversation(userId || 1, targetUserId);
  res.json({ conversationId });
});

router.get("/conversations/:id/messages", (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = Number(req.query.userId) || 1;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  try {
    const messages = messageService.getMessages(conversationId, userId, limit, offset);
    res.json(messages);
  } catch {
    res.status(403).json({ error: "Not a participant" });
  }
});

router.get("/conversations/:id/messages/poll", (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = Number(req.query.userId) || 1;
  const afterId = Number(req.query.after_id) || 0;
  try {
    const messages = messageService.getNewMessages(conversationId, userId, afterId);
    res.json(messages);
  } catch {
    res.status(403).json({ error: "Not a participant" });
  }
});

router.post("/conversations/:id/messages", (req, res) => {
  const conversationId = Number(req.params.id);
  const { senderId, content } = req.body;
  try {
    const message = messageService.sendMessage(conversationId, senderId || 1, content);
    res.json(message);
  } catch {
    res.status(403).json({ error: "Not a participant" });
  }
});

router.post("/conversations/:id/read", (req, res) => {
  const conversationId = Number(req.params.id);
  const { userId } = req.body;
  messageService.markAsRead(conversationId, userId || 1);
  res.json({ success: true });
});

router.get("/unread-count", (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const count = messageService.getTotalUnreadCount(userId);
  res.json({ count });
});

export default router;
