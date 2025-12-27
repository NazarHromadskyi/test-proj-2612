import type {
  AnalyzeCreateResponse,
  AnalyzeStatusResponse,
} from "@test-task-261225/shared";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type ApiError = { message?: string };

const hasMessage = (value: unknown): value is { message: string } =>
  typeof (value as { message?: unknown })?.message === "string";

const request = async <T extends Record<string, unknown>>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const payload = (await response.json().catch(() => ({}))) as T | ApiError;

  if (!response.ok) {
    const message = hasMessage(payload)
      ? payload.message
      : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
};

export const getApiBaseUrl = () => apiBaseUrl;

export const createAnalysis = (payload: {
  name: string;
  age: number;
  description: string;
}) =>
  request<AnalyzeCreateResponse>("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const fetchAnalysisStatus = (requestId: string) =>
  request<AnalyzeStatusResponse>(`/analyze/${requestId}`);
