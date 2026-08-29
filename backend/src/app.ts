import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { checkDbConnection } from "./lib/db";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import articleRoutes from "./routes/admin/articles";
import mediaRoutes from "./routes/admin/media";
import breakingRoutes from "./routes/admin/breaking";
import adsRoutes from "./routes/admin/ads";
import adminMiscRoutes from "./routes/admin/misc";
import cronRoutes from "./routes/cron";

function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? "http://localhost:3000";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: (origin, callback) => {
        const allowed = getCorsOrigins();
        if (!origin || allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: ${origin}`));
        }
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    const db = await checkDbConnection();
    res.status(db ? 200 : 503).json({
      status: db ? "ok" : "degraded",
      service: "rajniti-api",
      database: db ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/admin/articles", articleRoutes);
  app.use("/api/admin/media", mediaRoutes);
  app.use("/api/admin/breaking", breakingRoutes);
  app.use("/api/admin/ads", adsRoutes);
  app.use("/api/admin", adminMiscRoutes);
  app.use("/api/cron", cronRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
