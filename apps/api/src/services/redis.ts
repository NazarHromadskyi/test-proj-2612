import { Redis } from "@upstash/redis";
import type { AnalyzeInput, AnalyzeStatus } from "@test-task-261225/shared";

export type AnalysisRecord = {
  requestId: string;
  status: AnalyzeStatus;
  input: AnalyzeInput;
  result?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

const redis = Redis.fromEnv();

const analysisKey = (requestId: string) => `analysis:${requestId}`;

const getTtlSeconds = () => {
  const raw = Number(process.env.ANALYSIS_TTL_SECONDS ?? 3600);
  return Number.isFinite(raw) && raw > 0 ? raw : 3600;
};

export const saveAnalysis = async (record: AnalysisRecord) => {
  const ttlSeconds = getTtlSeconds();
  await redis.set(analysisKey(record.requestId), record, { ex: ttlSeconds });
};

export const getAnalysis = (requestId: string) =>
  redis.get<AnalysisRecord>(analysisKey(requestId));

export const updateAnalysis = async (
  requestId: string,
  updates: Partial<AnalysisRecord>
) => {
  const existing = await getAnalysis(requestId);
  if (!existing) return null;

  const updated: AnalysisRecord = {
    ...existing,
    ...updates,
    requestId,
    updatedAt: new Date().toISOString(),
  };

  await saveAnalysis(updated);
  return updated;
};
