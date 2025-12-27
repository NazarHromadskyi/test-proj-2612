import type { Context } from "hono";
import { Receiver } from "@upstash/qstash";
import { generateAnalysis } from "../services/openai";
import { getAnalysis, updateAnalysis } from "../services/redis";
import { getErrorMessage, jsonError } from "../lib/http";
import { logger } from "../lib/logger";

const getReceiver = () => {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error("QSTASH signing keys are required");
  }
  return new Receiver({ currentSigningKey, nextSigningKey });
};

export const handleWebhook = async (c: Context) => {
  const signature = c.req.header("Upstash-Signature");
  if (!signature) {
    logger.warn("Webhook request missing signature", { path: c.req.path });
    return jsonError(c, 401, "Missing signature");
  }

  const body = await c.req.text();
  let receiver: Receiver;
  try {
    receiver = getReceiver();
  } catch (error) {
    logger.error("Failed to create QStash receiver", error);
    return jsonError(c, 500, getErrorMessage(error));
  }

  const webhookUrl = process.env.QSTASH_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.error("QSTASH_WEBHOOK_URL is not set");
    return jsonError(c, 500, "Server configuration error");
  }

  logger.debug("Verifying QStash signature", {
    incomingUrl: c.req.url,
    expectedUrl: webhookUrl,
    hasBody: !!body,
  });

  const isValid = await receiver.verify({
    signature,
    body,
    url: webhookUrl,
  });

  if (!isValid) {
    logger.warn("Invalid QStash signature", {
      incomingUrl: c.req.url,
      expectedUrl: webhookUrl,
    });
    return jsonError(c, 401, "Invalid signature");
  }

  logger.debug("QStash signature verified successfully");

  let payload: { requestId?: string };
  try {
    payload = JSON.parse(body) as { requestId?: string };
  } catch (error) {
    logger.warn("Failed to parse webhook body as JSON", { error });
    return jsonError(c, 400, "Invalid JSON body");
  }

  const requestId = payload.requestId;
  if (!requestId) {
    logger.warn("Webhook payload missing requestId", { payload });
    return jsonError(c, 400, "Missing requestId");
  }

  logger.info("Processing webhook", { requestId });

  const record = await getAnalysis(requestId);
  if (!record) {
    logger.warn("Analysis record not found for webhook", { requestId });
    return jsonError(c, 404, "Not found");
  }

  if (record.status === "completed" || record.status === "failed") {
    logger.info("Analysis already processed, skipping", {
      requestId,
      status: record.status,
    });
    return c.json({ ok: true, message: "Already processed" });
  }

  if (record.status !== "pending") {
    logger.warn("Analysis is not in pending status", {
      requestId,
      currentStatus: record.status,
    });
    return c.json({ ok: true, message: "Already processing" });
  }

  await updateAnalysis(requestId, { status: "processing" });
  logger.debug("Analysis status updated to processing", { requestId });

  try {
    logger.debug("Generating analysis with OpenAI", { requestId });
    const result = await generateAnalysis(record.input);

    await updateAnalysis(requestId, {
      status: "completed",
      result,
      error: null,
    });

    logger.info("Analysis completed successfully", { requestId });
    return c.json({ ok: true });
  } catch (error) {
    logger.error("Failed to generate analysis", error, { requestId });
    const message = getErrorMessage(error);
    await updateAnalysis(requestId, {
      status: "failed",
      error: message,
      result: null,
    });
    return jsonError(c, 500, message);
  }
};
