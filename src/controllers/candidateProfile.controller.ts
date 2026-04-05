import type { Request, Response } from "express";
import mongoose from "mongoose";
import { CandidateProfile } from "../models/candidateProfile.model.js";
import { sendError, sendSuccess } from "../utils/response.js";

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeSkills(skills: unknown): string[] | null {
  if (!Array.isArray(skills)) {
    return null;
  }

  const normalizedSkills = skills
    .filter((skill) => typeof skill === "string")
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);

  return normalizedSkills;
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

  if (body.headline !== undefined) {
    if (typeof body.headline !== "string") {
      return null;
    }
    payload.headline = body.headline.trim();
  }

  if (body.summary !== undefined) {
    if (typeof body.summary !== "string") {
      return null;
    }
    payload.summary = body.summary.trim();
  }

  if (body.experienceYears !== undefined) {
    if (
      typeof body.experienceYears !== "number" ||
      Number.isNaN(body.experienceYears) ||
      body.experienceYears < 0
    ) {
      return null;
    }
    payload.experienceYears = body.experienceYears;
  }

  if (body.skills !== undefined) {
    const skills = sanitizeSkills(body.skills);
    if (!skills) {
      return null;
    }
    payload.skills = skills;
  }

  if (body.experience !== undefined) {
    if (!Array.isArray(body.experience)) {
      return null;
    }
    payload.experience = body.experience;
  }

  if (body.education !== undefined) {
    if (!Array.isArray(body.education)) {
      return null;
    }
    payload.education = body.education;
  }

  if (body.resumeUrl !== undefined) {
    if (typeof body.resumeUrl !== "string") {
      return null;
    }
    payload.resumeUrl = body.resumeUrl.trim();
  }

  if (body.resumeText !== undefined) {
    if (typeof body.resumeText !== "string") {
      return null;
    }
    payload.resumeText = body.resumeText.trim();
  }

  if (body.githubUrl !== undefined) {
    if (typeof body.githubUrl !== "string") {
      return null;
    }
    payload.githubUrl = body.githubUrl.trim();
  }

  if (body.linkedinUrl !== undefined) {
    if (typeof body.linkedinUrl !== "string") {
      return null;
    }
    payload.linkedinUrl = body.linkedinUrl.trim();
  }

  if (body.portfolioUrl !== undefined) {
    if (typeof body.portfolioUrl !== "string") {
      return null;
    }
    payload.portfolioUrl = body.portfolioUrl.trim();
  }

  if (body.preferredJobType !== undefined) {
    if (
      typeof body.preferredJobType !== "string" ||
      !JOB_TYPES.includes(body.preferredJobType as (typeof JOB_TYPES)[number])
    ) {
      return null;
    }
    payload.preferredJobType = body.preferredJobType;
  }

  if (body.preferredWorkMode !== undefined) {
    if (
      typeof body.preferredWorkMode !== "string" ||
      !WORK_MODES.includes(
        body.preferredWorkMode as (typeof WORK_MODES)[number],
      )
    ) {
      return null;
    }
    payload.preferredWorkMode = body.preferredWorkMode;
  }

  if (body.isProfileComplete !== undefined) {
    if (typeof body.isProfileComplete !== "boolean") {
      return null;
    }
    payload.isProfileComplete = body.isProfileComplete;
  }

  return payload;
}

export async function createProfile(req: Request, res: Response) {
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

    const existingProfile = await CandidateProfile.findOne({
      userId: req.user._id,
    });

    if (existingProfile) {
      return sendError(res, "Profile already exists", 400);
    }

    const payload = buildProfilePayload(req.body);

    if (!payload) {
      return sendError(
        res,
        "Validation failed. Check input types, skills array, and enum values",
        400,
      );
    }

    const profile = await CandidateProfile.create({
      ...payload,
      userId: req.user._id,
    });

    return sendSuccess(res, "Profile created successfully", profile, 201);
  } catch (err) {
    return sendError(res, getValidationMessage(err), getErrorStatusCode(err));
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }

    const profile = await CandidateProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return sendError(res, "Profile not found", 404);
    }

    return sendSuccess(res, "Profile fetched successfully", profile);
  } catch {
    return sendError(res, "Failed to fetch profile", 500);
  }
}

export async function updateProfile(req: Request, res: Response) {
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

    const existingProfile = await CandidateProfile.findOne({
      userId: req.user._id,
    });

    if (!existingProfile) {
      return sendError(res, "Profile not found", 404);
    }

    const payload = buildProfilePayload(req.body);

    if (!payload) {
      return sendError(
        res,
        "Validation failed. Check input types, skills array, and enum values",
        400,
      );
    }

    if (Object.keys(payload).length === 0) {
      return sendError(res, "No valid fields provided for update", 400);
    }

    const updatedProfile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: payload },
      { new: true, runValidators: true },
    );

    return sendSuccess(res, "Profile updated successfully", updatedProfile);
  } catch (err) {
    return sendError(res, getValidationMessage(err), getErrorStatusCode(err));
  }
}
