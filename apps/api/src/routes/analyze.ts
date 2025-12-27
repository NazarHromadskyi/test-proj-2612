import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { analyzeInputSchema } from "@test-task-261225/shared";
import { enqueueAnalysis } from "../services/qstash";
import { getAnalysis, saveAnalysis, updateAnalysis } from "../services/redis";

export const analyzeRoutes = new Hono();

analyzeRoutes.post("/", async (c) => {
  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ message: "Invalid JSON body" }, 400);
  }

  const parsed = analyzeInputSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json(
      { message: "Invalid input", issues: parsed.error.issues },
      400
    );
  }

  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    await saveAnalysis({
      requestId,
      status: "pending",
      input: parsed.data,
      result: null,
      error: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await enqueueAnalysis(requestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateAnalysis(requestId, {
      status: "failed",
      error: message,
    }).catch(() => null);
    return c.json({ message }, 500);
  }

  return c.json({ requestId });
});

analyzeRoutes.get("/:requestId", async (c) => {
  const { requestId } = c.req.param();
  try {
    const record = await getAnalysis(requestId);
    if (!record) {
      return c.json({ message: "Not found" }, 404);
    }

    return c.json({
      requestId: record.requestId,
      status: record.status,
      result: record.result ?? null,
      error: record.error ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ message }, 500);
  }
});
