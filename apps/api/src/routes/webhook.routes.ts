import { Hono } from "hono";
import { handleWebhook } from "../controllers/webhook.controller";

export const webhookRoutes = new Hono();

webhookRoutes.post("/", handleWebhook);
