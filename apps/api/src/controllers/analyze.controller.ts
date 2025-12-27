import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { analyzeInputSchema } from "@test-task-261225/shared";
import { enqueueAnalysis } from "../services/qstash";
import { getAnalysis, saveAnalysis, updateAnalysis } from "../services/redis";
import { getErrorMessage, jsonError, parseJsonBody } from "../lib/http";
import { logger } from "../lib/logger";

export const createAnalysis = async (c: Context) => {
  const parsedBody = await parseJsonBody(c);
  if (!parsedBody.ok) {
    logger.warn("Failed to parse JSON body", { path: c.req.path });
    return parsedBody.response;
  }

  const parsedInput = analyzeInputSchema.safeParse(parsedBody.data);
  if (!parsedInput.success) {
    logger.warn("Invalid input schema", {
      path: c.req.path,
      errors: parsedInput.error.issues,
    });
    return jsonError(c, 400, "Invalid input", parsedInput.error.issues);
  }

  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  logger.info("Creating analysis request", { requestId });

  try {
    await saveAnalysis({
      requestId,
      status: "pending",
      input: parsedInput.data,
      result: null,
      error: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    logger.debug("Analysis saved to Redis", { requestId });

    await enqueueAnalysis(requestId);

    logger.info("Analysis enqueued to QStash", { requestId });
  } catch (error) {
    logger.error("Failed to create analysis", error, { requestId });
    const message = getErrorMessage(error);
    await updateAnalysis(requestId, {
      status: "failed",
      error: message,
    }).catch(() => null);
    return jsonError(c, 500, message);
  }

  return c.json({ requestId });
};

export const getAnalysisStatus = async (c: Context) => {
  const { requestId } = c.req.param();

  logger.debug("Getting analysis status", { requestId });

  try {
    const record = await getAnalysis(requestId);
    if (!record) {
      logger.warn("Analysis not found", { requestId });
      return jsonError(c, 404, "Not found");
    }

    logger.debug("Analysis status retrieved", {
      requestId,
      status: record.status,
    });

    return c.json({
      requestId: record.requestId,
      status: record.status,
      result: record.result ?? null,
      error: record.error ?? null,
    });
  } catch (error) {
    logger.error("Failed to get analysis status", error, { requestId });
    return jsonError(c, 500, getErrorMessage(error));
  }
};
