import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../config/auth.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.session = session;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

declare global {
  namespace Express {
    interface Request {
      session?: {
        session: Record<string, unknown>;
        user: Record<string, unknown>;
      };
    }
  }
}
