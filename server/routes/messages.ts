import { Router } from "express";
import * as messageService from "../services/messageService";

const router = Router();

router.get("/conversations", async (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const conversations = await messageService.listConversations(userId);
  res.json(conversations);
});

router.post("/conversations", async (req, res) => {
  const { userId, targetUserId } = req.body;
  const conversationId = await messageService.getOrCreateConversation(userId || 1, targetUserId);
  res.json({ conversationId });
});

router.get("/conversations/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = Number(req.query.userId) || 1;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  try {
    const messages = await messageService.getMessages(conversationId, userId, limit, offset);
    res.json(messages);
  } catch {
    res.status(403).json({ error: "Not a participant" });
  }
});

router.get("/conversations/:id/messages/poll", async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = Number(req.query.userId) || 1;
  const afterId = Number(req.query.after_id) || 0;
  try {
    const messages = await messageService.getNewMessages(conversationId, userId, afterId);
    res.json(messages);
  } catch {
    res.status(403).json({ error: "Not a participant" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  const { senderId, content } = req.body;
  try {
    const message = await messageService.sendMessage(conversationId, senderId || 1, content);
    res.json(message);
  } catch {
    res.status(403).json({ error: "Not a participant" });
  }
});

router.post("/conversations/:id/read", async (req, res) => {
  const conversationId = Number(req.params.id);
  const { userId } = req.body;
  await messageService.markAsRead(conversationId, userId || 1);
  res.json({ success: true });
});

router.get("/unread-count", async (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const count = await messageService.getTotalUnreadCount(userId);
  res.json({ count });
});

export default router;
