import { config } from "@/lib/config";
import type { ApiService } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null,
    public kind: "network" | "timeout" | "http" | "invalid" | "unsupported",
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.requestTimeoutMs);
  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : null,
      signal: ctrl.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError")
      throw new ApiError("The request timed out.", null, "timeout");
    throw new ApiError(`Could not reach the backend at ${config.apiBaseUrl}.`, null, "network");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = (await res.json()) as { detail?: string };
      if (j.detail) detail = j.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(`Backend returned ${res.status}: ${detail}`, res.status, "http");
  }
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError("The backend returned an invalid response.", res.status, "invalid");
  }
}

const unsupported = (what: string) => () =>
  Promise.reject(
    new ApiError(`${what} is not available in the planned backend API yet.`, null, "unsupported"),
  );

export const httpApi: ApiService = {
  mode: "live",
  health: () => request("GET", "/api/v1/health"),
  analyzeInput: (r) => request("POST", "/api/v1/analyze", r),
  optimizePrompt: (r) => request("POST", "/api/v1/optimize/prompt", r),
  optimizeQuery: (r) => request("POST", "/api/v1/optimize/query", r),
  createExperiment: (i) => request("POST", "/api/v1/experiments", i),
  runExperiment: (id) => request("POST", `/api/v1/experiments/${encodeURIComponent(id)}/run`),
  updateExperimentStatus: unsupported("Pausing or cancelling experiments"),
  deleteExperiment: unsupported("Deleting experiments"),
  duplicateExperiment: unsupported("Duplicating experiments"),
  getExperiment: (id) => request("GET", `/api/v1/experiments/${encodeURIComponent(id)}`),
  listExperiments: () => request("GET", "/api/v1/experiments"),
  getEvaluationMetrics: (id) =>
    request("GET", `/api/v1/experiments/${encodeURIComponent(id)}/metrics`),
  submitFeedback: (id, f) =>
    request("POST", `/api/v1/experiments/${encodeURIComponent(id)}/feedback`, f),
  getDashboardSummary: () => request("GET", "/api/v1/dashboard/summary"),
  listHistory: unsupported("History"),
  deleteHistory: unsupported("Deleting history"),
  clearHistory: unsupported("Clearing history"),
};
