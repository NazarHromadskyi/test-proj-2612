import type { z } from "zod";
import {
  analyzeCreateResponseSchema,
  analyzeInputSchema,
  analyzeResultSchema,
  analyzeStatusResponseSchema,
  analyzeStatusSchema,
} from "./schemas";

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;
export type AnalyzeStatus = z.infer<typeof analyzeStatusSchema>;
export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;
export type AnalyzeCreateResponse = z.infer<typeof analyzeCreateResponseSchema>;
export type AnalyzeStatusResponse = z.infer<typeof analyzeStatusResponseSchema>;
