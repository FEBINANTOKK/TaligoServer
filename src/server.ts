import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db";
import { initAuth, getAuth } from "./config/auth";
import protectedRoutes from "./routes/protected";
import userRoutes from "./routes/user.routes";
import organizationRoutes from "./routes/organization.routes";
import { errorHandler } from "./middleware/error.middleware";
import { requireAuth } from "./middleware/auth.middleware";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Better Auth handler — must be before express.json()
app.all("/api/auth/*", (req, res) => {
  // console.log("Auth request:", req.method, req.url);
  toNodeHandler(getAuth())(req, res);
});

// Parse JSON for all other routes
app.use(express.json());

// Routes
app.use(protectedRoutes);
app.use(userRoutes);
app.use(organizationRoutes);

// Health check
app.get("/api/health", requireAuth, (_req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use(errorHandler);

async function start() {
  await connectDB();
  initAuth();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
