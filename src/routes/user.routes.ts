import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { selectRole, getMe } from "../controllers/user.controller.js";

const router = Router();

router.get("/api/user/me", requireAuth, getMe);
router.post("/api/user/select-role", requireAuth, selectRole);

export default router;
