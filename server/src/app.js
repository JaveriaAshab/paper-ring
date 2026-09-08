import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import ringRoutes from "./routes/ring.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import supportRoutes from "./routes/support.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://paper-ring-client.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like mobile apps/curl) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false); // Fail gracefully instead of throwing an Express error
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 204
};

// 1. MUST BE FIRST: Explicitly handle preflight OPTIONS before Helmet or Rate Limitin
app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));

// 2. Helmet setup configured specifically to allow cross-origin popups/resources
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(express.json({ limit: "1mb" }));

// 3. Rate limiter applied AFTER CORS/OPTIONS check
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

import { connectDB } from "./config/db.js";

// Add this before your routes:
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "Paper Ring API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rings", ringRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, _req, res, _next) => {
  console.error("Paper Ring API error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong."
  });
});

export default app;
