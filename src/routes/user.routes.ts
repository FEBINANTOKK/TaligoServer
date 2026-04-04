import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { selectRole } from "../controllers/user.controller.js";

const router = Router();

router.post("/api/user/select-role", requireAuth, selectRole);

export default router;
