import { Hono } from "hono";
import { Receiver } from "@upstash/qstash";
import { generateAnalysis } from "../services/openai";
import { getAnalysis, updateAnalysis } from "../services/redis";

export const webhookRoutes = new Hono();

const getReceiver = () => {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error("QSTASH signing keys are required");
  }
  return new Receiver({ currentSigningKey, nextSigningKey });
};

webhookRoutes.post("/", async (c) => {
  const signature = c.req.header("Upstash-Signature");
  if (!signature) {
    return c.json({ message: "Missing signature" }, 401);
  }

  const body = await c.req.text();
  let receiver: Receiver;
  try {
    receiver = getReceiver();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ message }, 500);
  }

  const isValid = await receiver.verify({
    signature,
    body,
    url: c.req.url,
  });
  if (!isValid) {
    return c.json({ message: "Invalid signature" }, 401);
  }

  let payload: { requestId?: string };
  try {
    payload = JSON.parse(body) as { requestId?: string };
  } catch {
    return c.json({ message: "Invalid JSON body" }, 400);
  }

  const requestId = payload.requestId;
  if (!requestId) {
    return c.json({ message: "Missing requestId" }, 400);
  }

  const record = await getAnalysis(requestId);
  if (!record) {
    return c.json({ message: "Not found" }, 404);
  }

  await updateAnalysis(requestId, { status: "processing" });

  try {
    const result = await generateAnalysis(record.input);
    await updateAnalysis(requestId, {
      status: "completed",
      result,
      error: null,
    });
    return c.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateAnalysis(requestId, {
      status: "failed",
      error: message,
      result: null,
    });
    return c.json({ message }, 500);
  }
});
