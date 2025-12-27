import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const jsonError = (
  c: Context,
  status: ContentfulStatusCode,
  message: string,
  details?: unknown
) => {
  const payload: Record<string, unknown> = { message };
  if (details !== undefined) {
    payload.details = details;
  }
  return c.json(payload, status);
};

export const parseJsonBody = async (c: Context) => {
  try {
    const data = await c.req.json();
    return { ok: true, data };
  } catch {
    return { ok: false, response: jsonError(c, 400, "Invalid JSON body") };
  }
};
