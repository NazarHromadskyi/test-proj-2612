import type { Context, Next } from "hono";
import { logger } from "../lib/logger";

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const url = c.req.url;
  
  logger.debug("Incoming request", {
    method,
    path,
    url,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
  });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  
  logger.info("Request completed", {
    method,
    path,
    status,
    duration: `${duration}ms`,
  });
};

