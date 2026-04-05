import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { getJobApplications } from "../controllers/application.controller.js";
import {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  getJobsByOrganization,
  updateJob,
  changeJobStatus,
  deleteJob,
} from "../controllers/job.controller.js";

const router = Router();

/**
 * Public Routes
 */

// Get all available jobs for candidate (excluding already applied jobs)
router.get("/", requireAuth, requireRole(["candidate"]), getJobs);

// Get jobs by organization ID
router.get("/organization/:organizationId", getJobsByOrganization);

// Get jobs created by logged-in recruiter
router.get(
  "/my",
  requireAuth,
  requireRole(["recruiter", "orgadmin"]),
  getMyJobs,
);

// Get applications for a job (recruiter in same organization)
router.get(
  "/:jobId/applications",
  requireAuth,
  requireRole(["recruiter", "orgadmin", "superadmin"]),
  getJobApplications,
);

// Get job by ID
router.get("/:id", getJobById);

/**
 * Protected Routes (Requires Authentication)
 */

// Create new job (only RECRUITER and ORG_ADMIN)
router.post(
  "/",
  requireAuth,
  requireRole(["recruiter", "orgadmin"]),
  createJob,
);

// Update job (only creator or ORG_ADMIN)
router.put(
  "/:id",
  requireAuth,
  requireRole(["recruiter", "orgadmin"]),
  updateJob,
);

// Change job status (only creator or ORG_ADMIN)
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(["recruiter", "orgadmin"]),
  changeJobStatus,
);

// Delete job (only creator or ORG_ADMIN)
router.delete(
  "/:id",
  requireAuth,
  requireRole(["recruiter", "orgadmin"]),
  deleteJob,
);

export default router;
