import mongoose from "mongoose";
import type { Request, Response } from "express";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function applyToJob(req: Request, res: Response) {
  try {
    const user = req.user;
    const { jobId } = req.body as { jobId?: string };

    if (!user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (user.role !== "candidate") {
      return sendError(res, "Only candidates can apply to jobs", 403);
    }

    if (!jobId || typeof jobId !== "string") {
      return sendError(res, "jobId is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return sendError(res, "Invalid job ID format", 400);
    }

    const job = await Job.findOne({
      _id: jobId,
      status: "ACTIVE",
      isActive: true,
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    const existingApplication = await Application.findOne({
      userId: user._id,
      jobId,
    });

    if (existingApplication) {
      return sendError(res, "You have already applied to this job", 400);
    }

    const application = await Application.create({
      userId: user._id,
      jobId,
      resumeId: null,
      matchScore: null,
      status: "applied",
      createdAt: new Date(),
    });

    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicantsCount: 1 },
    });

    return sendSuccess(
      res,
      "Applied successfully",
      { applicationId: application._id },
      201,
    );
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return sendError(res, "You have already applied to this job", 400);
    }

    console.error("Apply to job error:", err);
    return sendError(res, "Failed to apply to job", 500);
  }
}

export async function getMyApplications(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (user.role !== "candidate") {
      return sendError(res, "Only candidates can view their applications", 403);
    }

    const applications = await Application.find({ userId: user._id })
      .populate("jobId", "title description location jobType workMode status")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Applications fetched successfully", applications);
  } catch (err) {
    console.error("Get my applications error:", err);
    return sendError(res, "Failed to fetch applications", 500);
  }
}

// All aplication for particular job for recruiter to view
export async function getJobApplications(req: Request, res: Response) {
  try {
    const user = req.user;
    const rawJobId = req.params.jobId;

    if (!user) {
      return sendError(res, "Unauthorized", 401);
    }

    const role = user.role;
    const isRecruiter = role === "recruiter";
    const isOrgAdmin = role === "orgadmin";
    const isSuperAdmin = role === "superadmin";

    if (!isRecruiter && !isOrgAdmin && !isSuperAdmin) {
      return sendError(
        res,
        "Only recruiters, org admins, or super admins can view job applications",
        403,
      );
    }

    if (!rawJobId || typeof rawJobId !== "string") {
      return sendError(res, "Job ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(rawJobId)) {
      return sendError(res, "Invalid job ID format", 400);
    }

    const jobId = rawJobId;

    const jobQuery = isSuperAdmin
      ? { _id: jobId }
      : { _id: jobId, organizationId: user.organizationId };

    const job = await Job.findOne(jobQuery);

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    const applications = await Application.find({ jobId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return sendSuccess(
      res,
      "Job applications fetched successfully",
      applications,
    );
  } catch (err) {
    console.error("Get job applications error:", err);
    return sendError(res, "Failed to fetch job applications", 500);
  }
}
