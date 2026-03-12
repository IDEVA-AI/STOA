import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] Error ${statusCode}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

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
