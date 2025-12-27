import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { logger } from "../lib/logger";
import { jsonError } from "../lib/http";

// Type guard to check if error has status property
type ErrorWithStatus = Error & { status?: number };

const isValidStatusCode = (status: number): status is ContentfulStatusCode => {
  return status >= 100 && status < 600;
};

const getStatusCode = (err: unknown): ContentfulStatusCode => {
  if (err instanceof HTTPException) {
    const status = err.status;
    return isValidStatusCode(status) ? status : 500;
  }

  if (err instanceof Error) {
    const errorWithStatus = err as ErrorWithStatus;
    if (errorWithStatus.status !== undefined) {
      const status = errorWithStatus.status;
      return isValidStatusCode(status) ? status : 500;
    }
  }

  return 500;
};

export const globalErrorHandler: ErrorHandler = (err, c) => {
  logger.error("Unhandled error", err, {
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
  });

  const status = getStatusCode(err);
  const message = err instanceof Error ? err.message : "Internal server error";

  return jsonError(c, status, message);
};
