import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        details: result.error.issues,
      });
    }
    req.body = result.data;
    next();
  };
}

export { registerSchema, loginSchema, refreshSchema } from "./auth";
export type { RegisterInput, LoginInput, RefreshInput } from "./auth";

export { createPostSchema, createCommentSchema } from "./posts";
export type { CreatePostInput, CreateCommentInput } from "./posts";

export { sendMessageSchema, createConversationSchema } from "./messages";
export type { SendMessageInput, CreateConversationInput } from "./messages";
