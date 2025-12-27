import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { analyzeRoutes } from "./routes/analyze";
import { webhookRoutes } from "./routes/webhook";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/analyze", analyzeRoutes);
app.route("/webhook", webhookRoutes);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`API running on http://localhost:${port}`);
