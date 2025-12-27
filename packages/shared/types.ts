import type { z } from "zod";
import {
  analyzeInputSchema,
  analyzeResultSchema,
  analyzeStatusSchema,
} from "./schemas";

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;
export type AnalyzeStatus = z.infer<typeof analyzeStatusSchema>;
export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;
