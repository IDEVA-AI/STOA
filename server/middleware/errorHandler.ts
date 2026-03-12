import type { Request, Response, NextFunction } from "express";
import logger from "../lib/logger.js";

export function errorHandler(
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;

  logger.error({
    err,
    method: req.method,
    url: req.originalUrl,
    statusCode,
  });

  const response: { error: string; message: string; statusCode: number } = {
    error: statusCode >= 500 ? "Internal Server Error" : err.message,
    message:
      process.env.NODE_ENV === "production" && statusCode >= 500
        ? "An unexpected error occurred"
        : err.message,
    statusCode,
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const err: Error & { statusCode?: number } = new Error(
    `Not found: ${req.method} ${req.originalUrl}`,
  );
  err.statusCode = 404;
  next(err);
}
