import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import astronautRoutes from "./routes/astronauts";
import telemetryRoutes from "./routes/telemetry";
import alertRoutes from "./routes/alerts";
import missionRoutes from "./routes/mission";
import devRoutes from "./routes/dev";
import { notFound, errorHandler } from "./middleware/errors";

const app = express();
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
  .split(",").map(value => value.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Allow tools such as curl/Postman (no Origin header) and configured local UI origins.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => {
  res.json({ service: "ASTROCARE API", status: "online", timestamp: new Date() });
});
app.use("/api/auth", authRoutes);
app.use("/api/astronauts", astronautRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/mission", missionRoutes);
if (process.env.NODE_ENV !== "production") app.use("/api/dev", devRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;
