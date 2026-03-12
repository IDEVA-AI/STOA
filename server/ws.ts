import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import * as messageService from "./services/messageService";

const JWT_SECRET = process.env.JWT_SECRET || "stoa-dev-secret-change-in-production";

interface AuthenticatedSocket {
  ws: WebSocket;
  userId: number;
}

// Map<userId, WebSocket[]> — supports multiple tabs per user
const clients = new Map<number, WebSocket[]>();

interface TokenPayload {
  userId: number;
  role?: string;
  type?: "access" | "refresh";
}

interface WsAuthMessage {
  type: "auth";
  token: string;
}

interface WsSendMessage {
  type: "send_message";
  conversationId: number;
  content: string;
}

interface WsTypingMessage {
  type: "typing";
  conversationId: number;
}

interface WsReadMessage {
  type: "read";
  conversationId: number;
}

type WsIncoming = WsAuthMessage | WsSendMessage | WsTypingMessage | WsReadMessage;

function addClient(userId: number, ws: WebSocket) {
  const existing = clients.get(userId) || [];
  existing.push(ws);
  clients.set(userId, existing);
}

function removeClient(userId: number, ws: WebSocket) {
  const existing = clients.get(userId);
  if (!existing) return;
  const filtered = existing.filter((s) => s !== ws);
  if (filtered.length === 0) {
    clients.delete(userId);
  } else {
    clients.set(userId, filtered);
  }
}

export function broadcastToUser(userId: number, data: unknown) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function broadcastToConversation(
  conversationId: number,
  data: unknown,
  excludeUserId?: number
) {
  const participants = messageService.getConversationParticipants(conversationId);
  for (const userId of participants) {
    if (userId !== excludeUserId) {
      broadcastToUser(userId, data);
    }
  }
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (decoded.type === "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function initWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    let authenticated: AuthenticatedSocket | null = null;

    // Client must authenticate within 5 seconds
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        ws.close(4001, "Authentication timeout");
      }
    }, 5000);

    ws.on("message", (raw: Buffer | string) => {
      let msg: WsIncoming;
      try {
        msg = JSON.parse(typeof raw === "string" ? raw : raw.toString());
      } catch {
        return;
      }

      // Handle auth
      if (msg.type === "auth") {
        const payload = verifyToken((msg as WsAuthMessage).token);
        if (!payload) {
          ws.close(4002, "Invalid token");
          return;
        }
        clearTimeout(authTimeout);
        authenticated = { ws, userId: payload.userId };
        addClient(payload.userId, ws);
        ws.send(JSON.stringify({ type: "auth_ok", userId: payload.userId }));
        return;
      }

      // All other messages require authentication
      if (!authenticated) {
        ws.close(4003, "Not authenticated");
        return;
      }

      const userId = authenticated.userId;

      switch (msg.type) {
        case "send_message": {
          const { conversationId, content } = msg as WsSendMessage;
          if (!content?.trim() || !conversationId) return;
          try {
            const savedMsg = messageService.sendMessage(conversationId, userId, content);
            // Send confirmation to sender (all tabs)
            broadcastToUser(userId, { type: "new_message", message: savedMsg });
            // Send to other participants
            broadcastToConversation(conversationId, { type: "new_message", message: savedMsg }, userId);
          } catch (err) {
            ws.send(JSON.stringify({ type: "error", error: "Failed to send message" }));
          }
          break;
        }

        case "typing": {
          const { conversationId } = msg as WsTypingMessage;
          if (!conversationId) return;
          broadcastToConversation(
            conversationId,
            { type: "typing", conversationId, userId },
            userId
          );
          break;
        }

        case "read": {
          const { conversationId } = msg as WsReadMessage;
          if (!conversationId) return;
          try {
            messageService.markAsRead(conversationId, userId);
            broadcastToConversation(
              conversationId,
              { type: "read", conversationId, userId },
              userId
            );
          } catch {
            // silently ignore
          }
          break;
        }
      }
    });

    ws.on("close", () => {
      clearTimeout(authTimeout);
      if (authenticated) {
        removeClient(authenticated.userId, ws);
      }
    });

    ws.on("error", () => {
      clearTimeout(authTimeout);
      if (authenticated) {
        removeClient(authenticated.userId, ws);
      }
    });
  });

  console.log("WebSocket server initialized");
  return wss;
}
