import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

// crossOriginResourcePolicy off: attachments are served from MinIO on another port.
app.use(helmet({ crossOriginResourcePolicy: false }));

const corsOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigins.includes("*") ? "*" : corsOrigins }));
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

export default app;
