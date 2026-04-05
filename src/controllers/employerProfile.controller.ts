import type { Request, Response } from "express";
import mongoose from "mongoose";
import {
  EmployerProfile,
  type EmployerRole,
} from "../models/employerProfile.model.js";
import { sendError, sendSuccess } from "../utils/response.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeSkills(skills: unknown): string[] | null {
  if (!Array.isArray(skills)) {
    return null;
  }

  return skills
    .filter((skill) => typeof skill === "string")
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);
}

function resolveEmployerRole(
  userRole: string | null | undefined,
): EmployerRole | null {
  if (!userRole) {
    return null;
  }

  if (userRole === "recruiter") {
    return "RECRUITER";
  }

  if (userRole === "orgadmin") {
    return "ORG_ADMIN";
  }

  return null;
}

function getValidationMessage(err: unknown): string {
  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    return firstError?.message ?? "Validation error";
  }

  if ((err as { code?: number }).code === 11000) {
    return "Profile already exists";
  }

  return "Internal server error";
}

function getErrorStatusCode(err: unknown): number {
  if (err instanceof mongoose.Error.ValidationError) {
    return 400;
  }

  if ((err as { code?: number }).code === 11000) {
    return 400;
  }

  return 500;
}

function buildProfilePayload(
  body: Record<string, unknown>,
): Record<string, unknown> | null {
  const payload: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return null;
    }
    payload.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string") {
      return null;
    }
    payload.phone = body.phone.trim();
  }

  if (body.location !== undefined) {
    if (typeof body.location !== "string") {
      return null;
    }
    payload.location = body.location.trim();
  }

  if (body.jobTitle !== undefined) {
    if (typeof body.jobTitle !== "string") {
      return null;
    }
    payload.jobTitle = body.jobTitle.trim();
  }

  if (body.organizationId !== undefined) {
    if (
      typeof body.organizationId !== "string" ||
      !mongoose.isValidObjectId(body.organizationId)
    ) {
      return null;
    }
    payload.organizationId = body.organizationId;
  }

  if (body.organizationName !== undefined) {
    if (typeof body.organizationName !== "string") {
      return null;
    }
    payload.organizationName = body.organizationName.trim();
  }

  if (body.department !== undefined) {
    if (typeof body.department !== "string") {
      return null;
    }
    payload.department = body.department.trim();
  }

  if (body.linkedinUrl !== undefined) {
    if (typeof body.linkedinUrl !== "string") {
      return null;
    }
    payload.linkedinUrl = body.linkedinUrl.trim();
  }

  if (body.githubUrl !== undefined) {
    if (typeof body.githubUrl !== "string") {
      return null;
    }
    payload.githubUrl = body.githubUrl.trim();
  }

  if (body.websiteUrl !== undefined) {
    if (typeof body.websiteUrl !== "string") {
      return null;
    }
    payload.websiteUrl = body.websiteUrl.trim();
  }

  if (body.skills !== undefined) {
    const skills = sanitizeSkills(body.skills);
    if (!skills) {
      return null;
    }
    payload.skills = skills;
  }

  if (body.isVerified !== undefined) {
    if (typeof body.isVerified !== "boolean") {
      return null;
    }
    payload.isVerified = body.isVerified;
  }

  return payload;
}

export async function createEmployerProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }

    if (!isObject(req.body)) {
      return sendError(res, "Invalid request body", 400);
    }

    if (typeof req.body.name !== "string" || !req.body.name.trim()) {
      return sendError(res, "name is required", 400);
    }

    if (req.body.skills !== undefined && !Array.isArray(req.body.skills)) {
      return sendError(res, "skills must be an array", 400);
    }

    const normalizedRole = resolveEmployerRole(req.user.role);
    if (!normalizedRole) {
      return sendError(res, "Forbidden", 403);
    }

    const existingProfile = await EmployerProfile.findOne({
      userId: req.user._id,
    });
    if (existingProfile) {
      return sendError(res, "Profile already exists", 400);
    }

    const payload = buildProfilePayload(req.body);
    if (!payload) {
      return sendError(res, "Validation failed. Check input field types", 400);
    }

    const profile = await EmployerProfile.create({
      ...payload,
      userId: req.user._id,
      role: normalizedRole,
    });

    return sendSuccess(
      res,
      "Employer profile created successfully",
      profile,
      201,
    );
  } catch (err) {
    return sendError(res, getValidationMessage(err), getErrorStatusCode(err));
  }
}

export async function getEmployerProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }

    const profile = await EmployerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return sendError(res, "Profile not found", 404);
    }

    return sendSuccess(res, "Employer profile fetched successfully", profile);
  } catch {
    return sendError(res, "Failed to fetch employer profile", 500);
  }
}

export async function updateEmployerProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }

    if (!isObject(req.body)) {
      return sendError(res, "Invalid request body", 400);
    }

    if (req.body.skills !== undefined && !Array.isArray(req.body.skills)) {
      return sendError(res, "skills must be an array", 400);
    }

    const normalizedRole = resolveEmployerRole(req.user.role);
    if (!normalizedRole) {
      return sendError(res, "Forbidden", 403);
    }

    const existingProfile = await EmployerProfile.findOne({
      userId: req.user._id,
    });
    if (!existingProfile) {
      return sendError(res, "Profile not found", 404);
    }

    const payload = buildProfilePayload(req.body);
    if (!payload) {
      return sendError(res, "Validation failed. Check input field types", 400);
    }

    if (Object.keys(payload).length === 0) {
      return sendError(res, "No valid fields provided for update", 400);
    }

    const updatedProfile = await EmployerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...payload,
          role: normalizedRole,
        },
      },
      { new: true, runValidators: true },
    );

    return sendSuccess(
      res,
      "Employer profile updated successfully",
      updatedProfile,
    );
  } catch (err) {
    return sendError(res, getValidationMessage(err), getErrorStatusCode(err));
  }
}
