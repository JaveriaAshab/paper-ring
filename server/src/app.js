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

// 1. Configure Helmet to allow Google OAuth popups
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

const allowedOrigins = [
  "http://localhost:5173",
  "https://paper-ring-client.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept"
  ],
  credentials: true
};

// 2. Enable CORS middleware
app.use(cors(corsOptions));

// 3. Handle explicit OPTIONS preflight requests globally
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
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
