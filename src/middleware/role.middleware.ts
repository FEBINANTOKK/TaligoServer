import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";

/**
 * Middleware to check if user has one of the required roles
 * @param allowedRoles Array of roles that are allowed (e.g., ["recruiter", "orgadmin"])
 * @returns Middleware function
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated (requireAuth middleware should come before this)
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    // Check if user role is in allowed roles
    const userRole = req.user.role?.toLowerCase();

    if (!userRole || !allowedRoles.includes(userRole)) {
      sendError(
        res,
        "Forbidden: You do not have permission to perform this action",
        403,
      );
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user is organization admin
 */
export function requireOrgAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendError(res, "Unauthorized", 401);
    return;
  }

  if (!req.user.isOrgAdmin) {
    sendError(
      res,
      "Forbidden: Only organization admins can perform this action",
      403,
    );
    return;
  }

  next();
}

/**
 * Middleware to check if user is super admin
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendError(res, "Unauthorized", 401);
    return;
  }

  if (req.user.role?.toLowerCase() !== "superadmin") {
    sendError(res, "Forbidden: Only super admins can perform this action", 403);
    return;
  }

  next();
}
