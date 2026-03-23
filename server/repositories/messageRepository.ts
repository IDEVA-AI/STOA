import db from "../db/connection";

export async function findDirectConversation(userId1: number, userId2: number): Promise<{ id: number } | null> {
  return db.get<{ id: number }>(`
    SELECT cp1.conversation_id as id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = $1 AND cp2.user_id = $2
  `, [userId1, userId2]);
}

export async function createConversation(userIds: number[]): Promise<number> {
  const result = await db.run("INSERT INTO conversations DEFAULT VALUES RETURNING id");
  const conversationId = result.rows[0].id as number;

  for (const userId of userIds) {
    await db.run(
      "INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)",
      [conversationId, userId]
    );
  }

  return conversationId;
}

export async function getConversationsForUser(userId: number) {
  return db.all(`
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
          AND m.sender_id != $1
          AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      ) as unread_count
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != $3
    JOIN users u ON u.id = cp2.user_id
    ORDER BY COALESCE((
        SELECT m.created_at FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.id DESC LIMIT 1
      ), c.created_at) DESC
  `, [userId, userId, userId]);
}

export async function getMessages(conversationId: number, limit: number = 50, offset: number = 0) {
  return db.all(`
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
      u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = $1
    ORDER BY m.id ASC
    LIMIT $2 OFFSET $3
  `, [conversationId, limit, offset]);
}

export async function getMessagesSince(conversationId: number, afterId: number) {
  return db.all(`
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
      u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = $1 AND m.id > $2
    ORDER BY m.id ASC
  `, [conversationId, afterId]);
}

export async function createMessage(conversationId: number, senderId: number, content: string) {
  const result = await db.run(
    "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id",
    [conversationId, senderId, content]
  );

  await db.run(
    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [conversationId]
  );

  return db.get(`
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
      u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = $1
  `, [result.rows[0].id]);
}

export async function isParticipant(conversationId: number, userId: number): Promise<boolean> {
  const row = await db.get(
    "SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
    [conversationId, userId]
  );
  return !!row;
}

export async function markAsRead(conversationId: number, userId: number): Promise<void> {
  await db.run(
    "UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND user_id = $2",
    [conversationId, userId]
  );
}

export async function getConversationParticipants(conversationId: number): Promise<number[]> {
  const rows = await db.all<{ user_id: number }>(
    "SELECT user_id FROM conversation_participants WHERE conversation_id = $1",
    [conversationId]
  );
  return rows.map(r => r.user_id);
}

export async function getTotalUnreadCount(userId: number): Promise<number> {
  const row = await db.get<{ total: number }>(`
    SELECT COALESCE(SUM(unread), 0) as total FROM (
      SELECT COUNT(*) as unread
      FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
      WHERE m.sender_id != $2
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      GROUP BY m.conversation_id
    ) sub
  `, [userId, userId]);
  return row?.total ?? 0;
}
