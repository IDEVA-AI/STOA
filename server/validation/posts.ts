import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  userId: z.number().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  userId: z.number().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
