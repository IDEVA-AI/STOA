import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  senderId: z.number().optional(),
});

export const createConversationSchema = z.object({
  participantIds: z.array(z.number()).min(1),
  userId: z.number().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
