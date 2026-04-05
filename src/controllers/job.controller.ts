import type { Request, Response } from "express";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { sendSuccess, sendError } from "../utils/response.js";

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"] as const;
const JOB_STATUS = ["DRAFT", "ACTIVE", "CLOSED"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeSkills(skills: unknown): string[] | null {
  if (!Array.isArray(skills)) {
    return null;
  }

  const normalized = skills
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (normalized.length === 0) {
    return null;
  }

  return normalized;
}

/**
 * Create a new job
 * @route POST /api/jobs
 * @access Private (RECRUITER, ORG_ADMIN)
 */
export async function createJob(req: Request, res: Response) {
  try {
    if (!isObject(req.body)) {
      return sendError(res, "Invalid request body", 400);
    }

    const {
      title,
      description,
      location,
      jobType,
      workMode,
      salaryMin,
      salaryMax,
      currency,
      skills,
      experienceLevel,
      status,
      isActive,
      expiresAt,
    } = req.body;
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

    if (!location || typeof location !== "string" || !location.trim()) {
      return sendError(res, "Job location is required");
    }

    if (
      !jobType ||
      typeof jobType !== "string" ||
      !JOB_TYPES.includes(jobType as (typeof JOB_TYPES)[number])
    ) {
      return sendError(
        res,
        "Invalid jobType. Allowed: FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP",
      );
    }

    if (
      !workMode ||
      typeof workMode !== "string" ||
      !WORK_MODES.includes(workMode as (typeof WORK_MODES)[number])
    ) {
      return sendError(
        res,
        "Invalid workMode. Allowed: REMOTE, HYBRID, ONSITE",
      );
    }

    const normalizedSkills = sanitizeSkills(skills);
    if (!normalizedSkills) {
      return sendError(res, "At least one valid skill is required");
    }

    let parsedSalaryMin: number | undefined;
    let parsedSalaryMax: number | undefined;

    if (salaryMin !== undefined) {
      if (
        typeof salaryMin !== "number" ||
        Number.isNaN(salaryMin) ||
        salaryMin < 0
      ) {
        return sendError(res, "salaryMin must be a non-negative number");
      }
      parsedSalaryMin = salaryMin;
    }

    if (salaryMax !== undefined) {
      if (
        typeof salaryMax !== "number" ||
        Number.isNaN(salaryMax) ||
        salaryMax < 0
      ) {
        return sendError(res, "salaryMax must be a non-negative number");
      }
      parsedSalaryMax = salaryMax;
    }

    if (
      parsedSalaryMin !== undefined &&
      parsedSalaryMax !== undefined &&
      parsedSalaryMin > parsedSalaryMax
    ) {
      return sendError(res, "salaryMin cannot be greater than salaryMax");
    }

    if (
      currency !== undefined &&
      (typeof currency !== "string" || currency.trim().length !== 3)
    ) {
      return sendError(res, "currency must be a 3-letter code");
    }

    if (
      experienceLevel !== undefined &&
      (typeof experienceLevel !== "string" || !experienceLevel.trim())
    ) {
      return sendError(res, "experienceLevel must be a non-empty string");
    }

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        !JOB_STATUS.includes(status as (typeof JOB_STATUS)[number]))
    ) {
      return sendError(res, "Invalid status. Allowed: DRAFT, ACTIVE, CLOSED");
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return sendError(res, "isActive must be a boolean");
    }

    let parsedExpiresAt: Date | undefined;
    if (expiresAt !== undefined) {
      const date = new Date(expiresAt as string);
      if (Number.isNaN(date.getTime())) {
        return sendError(res, "expiresAt must be a valid date");
      }
      parsedExpiresAt = date;
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
      location: location.trim(),
      jobType,
      workMode,
      salaryMin: parsedSalaryMin,
      salaryMax: parsedSalaryMax,
      currency:
        typeof currency === "string"
          ? currency.trim().toUpperCase()
          : undefined,
      skills: normalizedSkills,
      experienceLevel:
        typeof experienceLevel === "string"
          ? experienceLevel.trim()
          : undefined,
      status,
      isActive,
      expiresAt: parsedExpiresAt,
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
 * @access Private (CANDIDATE)
 */
export async function getJobs(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (user.role !== "candidate") {
      return sendError(res, "Only candidates can view available jobs", 403);
    }

    const applications = await Application.find({ userId: user._id }).select(
      "jobId",
    );

    const appliedJobIds = applications.map((application) => application.jobId);

    const jobs = await Job.find({
      _id: { $nin: appliedJobIds },
      status: "ACTIVE",
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("organizationId", "name")
      .populate("createdBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      count: jobs.length,
      data: jobs,
    });
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
 * Get jobs created by logged-in recruiter
 * @route GET /api/jobs/my
 * @access Private (RECRUITER)
 */
export async function getMyJobs(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (user.role !== "recruiter" && user.role !== "orgadmin") {
      return sendError(res, "Only recruiters can view their jobs", 403);
    }

    const jobs = await Job.find({ createdBy: user._id })
      .sort({ createdAt: -1 })
      .populate("organizationId", "name")
      .populate("createdBy", "name email role");

    return sendSuccess(res, "Recruiter jobs fetched successfully", jobs);
  } catch (err) {
    console.error("Get my jobs error:", err);
    return sendError(res, "Failed to fetch recruiter jobs", 500);
  }
}

/**
 * Get jobs by organization
 * @route GET /api/jobs/organization/:organizationId
 * @access Private (ORG_ADMIN)
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
    if (!isObject(req.body)) {
      return sendError(res, "Invalid request body", 400);
    }

    const {
      title,
      description,
      location,
      jobType,
      workMode,
      salaryMin,
      salaryMax,
      currency,
      skills,
      experienceLevel,
      status,
      isActive,
      applicantsCount,
      expiresAt,
    } = req.body;
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

    if (location !== undefined) {
      if (typeof location !== "string" || !location.trim()) {
        return sendError(res, "Job location must be a non-empty string");
      }
      job.location = location.trim();
    }

    if (jobType !== undefined) {
      if (
        typeof jobType !== "string" ||
        !JOB_TYPES.includes(jobType as (typeof JOB_TYPES)[number])
      ) {
        return sendError(
          res,
          "Invalid jobType. Allowed: FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP",
        );
      }
      job.jobType = jobType as
        | "FULL_TIME"
        | "PART_TIME"
        | "CONTRACT"
        | "INTERNSHIP";
    }

    if (workMode !== undefined) {
      if (
        typeof workMode !== "string" ||
        !WORK_MODES.includes(workMode as (typeof WORK_MODES)[number])
      ) {
        return sendError(
          res,
          "Invalid workMode. Allowed: REMOTE, HYBRID, ONSITE",
        );
      }
      job.workMode = workMode as "REMOTE" | "HYBRID" | "ONSITE";
    }

    if (salaryMin !== undefined) {
      if (
        typeof salaryMin !== "number" ||
        Number.isNaN(salaryMin) ||
        salaryMin < 0
      ) {
        return sendError(res, "salaryMin must be a non-negative number");
      }
      job.salaryMin = salaryMin;
    }

    if (salaryMax !== undefined) {
      if (
        typeof salaryMax !== "number" ||
        Number.isNaN(salaryMax) ||
        salaryMax < 0
      ) {
        return sendError(res, "salaryMax must be a non-negative number");
      }
      job.salaryMax = salaryMax;
    }

    if (
      job.salaryMin !== undefined &&
      job.salaryMax !== undefined &&
      job.salaryMin > job.salaryMax
    ) {
      return sendError(res, "salaryMin cannot be greater than salaryMax");
    }

    if (currency !== undefined) {
      if (typeof currency !== "string" || currency.trim().length !== 3) {
        return sendError(res, "currency must be a 3-letter code");
      }
      job.currency = currency.trim().toUpperCase();
    }

    if (skills !== undefined) {
      const normalizedSkills = sanitizeSkills(skills);
      if (!normalizedSkills) {
        return sendError(res, "skills must contain at least one valid skill");
      }
      job.skills = normalizedSkills;
    }

    if (experienceLevel !== undefined) {
      if (typeof experienceLevel !== "string" || !experienceLevel.trim()) {
        return sendError(res, "experienceLevel must be a non-empty string");
      }
      job.experienceLevel = experienceLevel.trim();
    }

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !JOB_STATUS.includes(status as (typeof JOB_STATUS)[number])
      ) {
        return sendError(res, "Invalid status. Allowed: DRAFT, ACTIVE, CLOSED");
      }
      job.status = status as "DRAFT" | "ACTIVE" | "CLOSED";
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return sendError(res, "isActive must be a boolean");
      }
      job.isActive = isActive;
    }

    if (applicantsCount !== undefined) {
      if (
        typeof applicantsCount !== "number" ||
        Number.isNaN(applicantsCount) ||
        applicantsCount < 0
      ) {
        return sendError(res, "applicantsCount must be a non-negative number");
      }
      job.applicantsCount = applicantsCount;
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        job.expiresAt = undefined;
      } else {
        const date = new Date(expiresAt as string);
        if (Number.isNaN(date.getTime())) {
          return sendError(res, "expiresAt must be a valid date");
        }
        job.expiresAt = date;
      }
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
 * Change job status (only by creator or ORG_ADMIN)
 * @route PATCH /api/jobs/:id/status
 * @access Private (Creator or ORG_ADMIN)
 */
export async function changeJobStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!id) {
      return sendError(res, "Job ID is required");
    }

    if (!isObject(req.body)) {
      return sendError(res, "Invalid request body", 400);
    }

    const { status } = req.body;

    if (
      !status ||
      typeof status !== "string" ||
      !JOB_STATUS.includes(status as (typeof JOB_STATUS)[number])
    ) {
      return sendError(res, "Invalid status. Allowed: DRAFT, ACTIVE, CLOSED");
    }

    const job = await Job.findById(id);

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    const isCreator = job.createdBy.toString() === user._id?.toString();
    const isOrgAdmin =
      user.isOrgAdmin &&
      user.organizationId?.toString() === job.organizationId.toString();

    if (!isCreator && !isOrgAdmin) {
      return sendError(
        res,
        "You are not authorized to change this job status",
        403,
      );
    }

    job.status = status as "DRAFT" | "ACTIVE" | "CLOSED";
    job.isActive = status === "ACTIVE";

    await job.save();

    return sendSuccess(res, "Job status updated successfully", job);
  } catch (err) {
    console.error("Change job status error:", err);
    if ((err as any).kind === "ObjectId") {
      return sendError(res, "Invalid job ID format", 400);
    }
    return sendError(res, "Failed to change job status", 500);
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
