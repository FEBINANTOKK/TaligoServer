import type { Response } from "express";

export function sendSuccess(
  res: Response,
  message: string,
  data: unknown = null,
  statusCode = 200,
) {
  res.status(statusCode).json({ success: true, message, data });
}

export function sendError(res: Response, message: string, statusCode = 400) {
  res.status(statusCode).json({ success: false, message, data: null });
}
