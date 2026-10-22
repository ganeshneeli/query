// Centralized client configuration. Only public, non-secret values belong here.
export const config = {
  apiBaseUrl:
    (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:8000",
  requestTimeoutMs: 20000,
  appName: "PromptIQ",
  tagline: "Better Prompts. Smarter Queries. Measurable Results.",
};

export type DataMode = "demo" | "live";
const MODE_KEY = "promptiq.dataMode";

export function getStoredMode(): DataMode {
  if (typeof window === "undefined") return "demo";
  return window.localStorage.getItem(MODE_KEY) === "live" ? "live" : "demo";
}
export function setStoredMode(mode: DataMode) {
  window.localStorage.setItem(MODE_KEY, mode);
}
