import { Router } from "express";
import {
  createEmployerProfile,
  getEmployerProfile,
  updateEmployerProfile,
} from "../controllers/employerProfile.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth, requireRole(["recruiter", "orgadmin"]));

router.get("/", getEmployerProfile);
router.post("/", createEmployerProfile);
router.put("/", updateEmployerProfile);

export default router;
