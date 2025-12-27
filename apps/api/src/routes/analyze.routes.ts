import { Hono } from "hono";
import {
  createAnalysis,
  getAnalysisStatus,
} from "../controllers/analyze.controller";

export const analyzeRoutes = new Hono();

analyzeRoutes.post("/", createAnalysis);
analyzeRoutes.get("/:requestId", getAnalysisStatus);
