import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
} from "../controllers/application.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole(["candidate"]), applyToJob);

router.get("/my", requireAuth, requireRole(["candidate"]), getMyApplications);

export default router;
