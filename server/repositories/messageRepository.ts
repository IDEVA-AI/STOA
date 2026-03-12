import db from "../db/connection";

export function findDirectConversation(userId1: number, userId2: number) {
  return db.prepare(`
    SELECT cp1.conversation_id as id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = ? AND cp2.user_id = ?
  `).get(userId1, userId2) as { id: number } | undefined;
}

export function createConversation(userIds: number[]) {
  const result = db.prepare("INSERT INTO conversations DEFAULT VALUES").run();
  const conversationId = result.lastInsertRowid as number;

  const insertParticipant = db.prepare(
    "INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)"
  );
  for (const userId of userIds) {
    insertParticipant.run(conversationId, userId);
  }

  return conversationId;
}

export function getConversationsForUser(userId: number) {
  return db.prepare(`
    SELECT
      c.id,
      u.id as participant_id,
      u.name as participant_name,
      u.avatar as participant_avatar,
      (
        SELECT m.content FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.id DESC LIMIT 1
      ) as last_message,
      (
        SELECT m.created_at FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.id DESC LIMIT 1
      ) as last_message_time,
      (
        SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != ?
          AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      ) as unread_count
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ?
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != ?
    JOIN users u ON u.id = cp2.user_id
    ORDER BY COALESCE(last_message_time, c.created_at) DESC
  `).all(userId, userId, userId);
}

export function getMessages(conversationId: number, limit: number = 50, offset: number = 0) {
  return db.prepare(`
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
      u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ?
    ORDER BY m.id ASC
    LIMIT ? OFFSET ?
  `).all(conversationId, limit, offset);
}

export function getMessagesSince(conversationId: number, afterId: number) {
  return db.prepare(`
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
      u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? AND m.id > ?
    ORDER BY m.id ASC
  `).all(conversationId, afterId);
}

export function createMessage(conversationId: number, senderId: number, content: string) {
  const result = db.prepare(
    "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)"
  ).run(conversationId, senderId, content);

  db.prepare(
    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(conversationId);

  return db.prepare(`
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
      u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);
}

export function isParticipant(conversationId: number, userId: number): boolean {
  const row = db.prepare(
    "SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?"
  ).get(conversationId, userId);
  return !!row;
}

export function markAsRead(conversationId: number, userId: number) {
  db.prepare(
    "UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?"
  ).run(conversationId, userId);
}

export function getTotalUnreadCount(userId: number): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(unread), 0) as total FROM (
      SELECT COUNT(*) as unread
      FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = ?
      WHERE m.sender_id != ?
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      GROUP BY m.conversation_id
    )
  `).get(userId, userId) as { total: number };
  return row.total;
}
