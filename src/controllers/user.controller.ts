import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function selectRole(req: Request, res: Response) {
  try {
    const { role } = req.body;

    if (role !== "candidate") {
      return sendError(res, "Only 'candidate' role can be selected here");
    }

    const user = req.user!;

    if (user.role) {
      return sendError(res, "Role already assigned");
    }

    user.role = "candidate";
    await user.save();

    return sendSuccess(res, "Role set to candidate", { role: user.role });
  } catch (err) {
    return sendError(res, "Failed to select role", 500);
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const user = req.user!;
    return sendSuccess(res, "User details fetched", {
      role: user.role,
      organizationId: user.organizationId,
      isOrgAdmin: user.isOrgAdmin,
    });
  } catch (err) {
    return sendError(res, "Failed to fetch user details", 500);
  }
}
