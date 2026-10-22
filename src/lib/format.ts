import type { TaskType } from "@/lib/api/types";

export const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
export const fmtMs = (n: number | null) =>
  n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${n} ms`;
export const fmtUsd = (n: number | null) =>
  n == null ? "—" : `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`;
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export const TASK_LABEL: Record<TaskType, string> = {
  prompt: "Prompt",
  search: "Search",
  rag: "RAG",
  sql: "SQL",
};

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] as object);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n",
  );
}

export function downloadFile(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
