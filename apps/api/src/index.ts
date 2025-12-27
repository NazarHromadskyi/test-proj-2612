import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { analyzeRoutes } from "./routes/analyze.routes";
import { webhookRoutes } from "./routes/webhook.routes";
import { requestLogger } from "./middleware/logger";
import { globalErrorHandler } from "./middleware/error-handler";
import { logger } from "./lib/logger";

const app = new Hono();

app.onError(globalErrorHandler);

app.use("*", requestLogger);

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Upstash-Signature"],
  })
);

app.get("/health", (c) => c.json({ ok: true }));
app.route("/analyze", analyzeRoutes);
app.route("/webhook", webhookRoutes);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
logger.info(`API server started`, {
  port,
  env: process.env.NODE_ENV ?? "development",
});
