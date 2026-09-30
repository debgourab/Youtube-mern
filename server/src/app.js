import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import channelRoutes from "./routes/channels.js";
import videoRoutes from "./routes/videos.js";
import commentRoutes from "./routes/comments.js";
import libraryRoutes from "./routes/library.js";

const app = express();

const corsOrigin = (origin, callback) => {
  const allowedOrigins = new Set([
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]);
  const isLocalViteDevServer = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin || "");

  if (!origin || allowedOrigins.has(origin) || isLocalViteDevServer) {
    return callback(null, true);
  }

  return callback(new Error("Not allowed by CORS"));
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "YouTube Clone API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/library", libraryRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((err, _req, res, _next) => {
  if (err.name === "CastError") {
    return res.status(404).json({ message: "Requested resource was not found." });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((item) => item.message).join(" ") });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "value";
    return res.status(409).json({ message: `${field} already exists.` });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  const status = err.status && err.status < 500 ? err.status : 500;
  const message = status === 500 ? "Server error" : err.message;
  res.status(status).json({ message });
});

export default app;
