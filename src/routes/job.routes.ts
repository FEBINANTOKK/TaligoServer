import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createJob,
  getJobs,
  getJobById,
  getJobsByOrganization,
  updateJob,
  deleteJob,
} from "../controllers/job.controller.js";

const router = Router();

/**
 * Public Routes
 */

// Get all jobs
router.get("/", getJobs);

// Get job by ID
router.get("/:id", getJobById);

// Get jobs by organization ID
router.get("/organization/:organizationId", getJobsByOrganization);

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

// Delete job (only creator or ORG_ADMIN)
router.delete(
  "/:id",
  requireAuth,
  requireRole(["recruiter", "orgadmin"]),
  deleteJob,
);

export default router;
