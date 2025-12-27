import { z } from "zod";

export const analyzeInputSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.coerce.number().int().min(0).max(120),
  description: z.string().min(1).max(500),
});

export const analyzeStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const analyzeResultSchema = z.object({
  requestId: z.string(),
  status: analyzeStatusSchema,
  result: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});
