import { Router } from "express";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "../controllers/candidateProfile.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth, requireRole(["candidate"]));

router.get("/", getProfile);
router.post("/", createProfile);
router.put("/", updateProfile);

export default router;
