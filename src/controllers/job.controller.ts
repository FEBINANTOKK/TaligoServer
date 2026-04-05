import type { Request, Response } from "express";
import { Job } from "../models/Job.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * Create a new job
 * @route POST /api/jobs
 * @access Private (RECRUITER, ORG_ADMIN)
 */
export async function createJob(req: Request, res: Response) {
  try {
    const { title, description } = req.body;
    const user = req.user!;

    // Validate input
    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, "Job title is required");
    }

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return sendError(res, "Job description is required");
    }

    if (title.trim().length < 3) {
      return sendError(res, "Job title must be at least 3 characters");
    }

    if (title.trim().length > 100) {
      return sendError(res, "Job title must not exceed 100 characters");
    }

    if (description.trim().length < 10) {
      return sendError(res, "Job description must be at least 10 characters");
    }

    // Check if user has organization assigned
    if (!user.organizationId) {
      return sendError(
        res,
        "You must be part of an organization to create jobs",
        403,
      );
    }

    // Create job
    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      organizationId: user.organizationId,
      createdBy: user._id,
    });

    return sendSuccess(res, "Job created successfully", job, 201);
  } catch (err) {
    console.error("Create job error:", err);
    return sendError(res, "Failed to create job", 500);
  }
}

/**
 * Get all jobs
 * @route GET /api/jobs
 * @access Public
 */
export async function getJobs(req: Request, res: Response) {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .populate("organizationId", "name")
      .populate("createdBy", "name email role");

    return sendSuccess(res, "Jobs fetched successfully", jobs);
  } catch (err) {
    console.error("Get jobs error:", err);
    return sendError(res, "Failed to fetch jobs", 500);
  }
}

/**
 * Get job by ID
 * @route GET /api/jobs/:id
 * @access Public
 */
export async function getJobById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, "Job ID is required");
    }

    const job = await Job.findById(id)
      .populate("organizationId", "name")
      .populate("createdBy", "name email role");

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    return sendSuccess(res, "Job fetched successfully", job);
  } catch (err) {
    console.error("Get job by ID error:", err);
    if ((err as any).kind === "ObjectId") {
      return sendError(res, "Invalid job ID format", 400);
    }
    return sendError(res, "Failed to fetch job", 500);
  }
}

/**
 * Get jobs by organization
 * @route GET /api/jobs/organization/:organizationId
 * @access Public
 */
export async function getJobsByOrganization(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return sendError(res, "Organization ID is required");
    }

    const jobs = await Job.find({ organizationId })
      .sort({ createdAt: -1 })
      .populate("organizationId", "name")
      .populate("createdBy", "name email role");

    return sendSuccess(res, "Organization jobs fetched successfully", jobs);
  } catch (err) {
    console.error("Get organization jobs error:", err);
    if ((err as any).kind === "ObjectId") {
      return sendError(res, "Invalid organization ID format", 400);
    }
    return sendError(res, "Failed to fetch organization jobs", 500);
  }
}

/**
 * Update job (only by creator or ORG_ADMIN)
 * @route PUT /api/jobs/:id
 * @access Private (Creator or ORG_ADMIN)
 */
export async function updateJob(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const user = req.user!;

    if (!id) {
      return sendError(res, "Job ID is required");
    }

    const job = await Job.findById(id);

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Check authorization: creator or ORG_ADMIN
    const isCreator = job.createdBy.toString() === user._id?.toString();
    const isOrgAdmin =
      user.isOrgAdmin &&
      user.organizationId?.toString() === job.organizationId.toString();

    if (!isCreator && !isOrgAdmin) {
      return sendError(res, "You are not authorized to update this job", 403);
    }

    // Validate input
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return sendError(res, "Job title must be a non-empty string");
      }
      if (title.trim().length < 3) {
        return sendError(res, "Job title must be at least 3 characters");
      }
      if (title.trim().length > 100) {
        return sendError(res, "Job title must not exceed 100 characters");
      }
      job.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return sendError(res, "Job description must be a non-empty string");
      }
      if (description.trim().length < 10) {
        return sendError(res, "Job description must be at least 10 characters");
      }
      job.description = description.trim();
    }

    await job.save();

    return sendSuccess(res, "Job updated successfully", job);
  } catch (err) {
    console.error("Update job error:", err);
    if ((err as any).kind === "ObjectId") {
      return sendError(res, "Invalid job ID format", 400);
    }
    return sendError(res, "Failed to update job", 500);
  }
}

/**
 * Delete job (only by creator or ORG_ADMIN)
 * @route DELETE /api/jobs/:id
 * @access Private (Creator or ORG_ADMIN)
 */
export async function deleteJob(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!id) {
      return sendError(res, "Job ID is required");
    }

    const job = await Job.findById(id);

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Check authorization: creator or ORG_ADMIN
    const isCreator = job.createdBy.toString() === user._id?.toString();
    const isOrgAdmin =
      user.isOrgAdmin &&
      user.organizationId?.toString() === job.organizationId.toString();

    if (!isCreator && !isOrgAdmin) {
      return sendError(res, "You are not authorized to delete this job", 403);
    }

    await Job.findByIdAndDelete(id);

    return sendSuccess(res, "Job deleted successfully");
  } catch (err) {
    console.error("Delete job error:", err);
    if ((err as any).kind === "ObjectId") {
      return sendError(res, "Invalid job ID format", 400);
    }
    return sendError(res, "Failed to delete job", 500);
  }
}
