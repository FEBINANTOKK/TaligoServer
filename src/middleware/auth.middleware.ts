import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../config/auth.js";
import { User, type IUser } from "../models/User.js";

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
      res
        .status(401)
        .json({ success: false, message: "Unauthorized", data: null });
      return;
    }

    req.session = session;

    // Fetch full user from DB and initialize missing fields
    let user = await User.findById(session.user.id);
    if (user) {
      let needsSave = false;
      if (user.role === undefined || user.role === null) {
        user.role = null;
        needsSave = true;
      }
      if (user.organizationId === undefined) {
        user.organizationId = null;
        needsSave = true;
      }
      if (user.isOrgAdmin === undefined) {
        user.isOrgAdmin = false;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    req.user = user;
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Unauthorized", data: null });
  }
}

declare global {
  namespace Express {
    interface Request {
      session?: {
        session: Record<string, unknown>;
        user: Record<string, unknown>;
      };
      user?: IUser | null;
    }
  }
}
