import type { Request, Response } from "express";
import { Organization } from "../models/Organization.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { generateUniqueJoinCode } from "../utils/joinCode.js";

export async function createOrganization(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const user = req.user!;
    console.log(name);
    console.log("Backend");

    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, "Organization name is required, Backend");
    }

    if (user.organizationId) {
      return sendError(res, "You are already part of an organization");
    }

    const joinCode = await generateUniqueJoinCode();

    const org = await Organization.create({
      name: name.trim(),
      joinCode,
    });

    user.role = "orgadmin";
    user.organizationId = org._id;
    user.isOrgAdmin = true;
    await user.save();

    return sendSuccess(
      res,
      "Organization created successfully",
      {
        organization: org,
        user: {
          role: user.role,
          organizationId: user.organizationId,
          isOrgAdmin: user.isOrgAdmin,
        },
      },
      201,
    );
  } catch (err) {
    return sendError(res, "Failed to create organization", 500);
  }
}

export async function joinOrganization(req: Request, res: Response) {
  try {
    const { joinCode } = req.body;
    const user = req.user!;

    if (!joinCode || typeof joinCode !== "string") {
      return sendError(res, "Join code is required");
    }

    if (user.organizationId) {
      return sendError(res, "You are already part of an organization");
    }

    const org = await Organization.findOne({
      joinCode: joinCode.toUpperCase(),
    });
    if (!org) {
      return sendError(res, "Invalid join code", 404);
    }

    user.role = "recruiter";
    user.organizationId = org._id;
    user.isOrgAdmin = false;
    await user.save();

    return sendSuccess(res, "Joined organization successfully", {
      organization: org,
      user: {
        role: user.role,
        organizationId: user.organizationId,
        isOrgAdmin: user.isOrgAdmin,
      },
    });
  } catch (err) {
    return sendError(res, "Failed to join organization", 500);
  }
}
