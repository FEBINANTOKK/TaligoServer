import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createOrganization,
  joinOrganization,
} from "../controllers/organization.controller.js";

const router = Router();

router.post("/api/organization/create", requireAuth, createOrganization);
router.post("/api/organization/join", requireAuth, joinOrganization);

export default router;
