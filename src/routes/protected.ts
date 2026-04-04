import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.session!.user,
    session: req.session!.session,
  });
});

export default router;
