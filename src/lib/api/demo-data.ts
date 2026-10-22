import type { DashboardSummary, Experiment, HistoryItem, Strategy, TaskType } from "./types";

// Seeded pseudo-random generator so demo data is stable across reloads.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const r = rng(42);
const pick = <T>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)] as T;

export const MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "claude-3.5-sonnet",
  "gemini-1.5-pro",
  "llama-3.1-70b",
] as const;
export const DATASETS = [
  "Customer FAQ v2",
  "SciQA-500",
  "Internal Docs",
  "Northwind SQL",
  "MS MARCO subset",
] as const;
const TASKS: TaskType[] = ["prompt", "search", "rag", "sql"];
const STRATS: Strategy[] = ["Balanced", "Quality First", "Low Cost", "Low Latency"];
const NAMES = [
  "Support answer clarity",
  "Code review prompt",
  "Research summary",
  "Product search recall",
  "FAQ retrieval",
  "Revenue report SQL",
  "Onboarding tutor",
  "Contract summarizer",
  "Ticket triage",
  "Log query tuning",
  "Paper Q&A grounding",
  "Orders join rewrite",
];

const day = (offset: number) => new Date(Date.UTC(2026, 9, 20) - offset * 86400000).toISOString();

export function seedExperiments(): Experiment[] {
  return Array.from({ length: 28 }, (_, i) => {
    const taskType = TASKS[i % 4] as TaskType;
    const status =
      i < 2
        ? "running"
        : i === 5
          ? "failed"
          : i === 9
            ? "queued"
            : i === 13
              ? "cancelled"
              : "completed";
    const base = 55 + Math.round(r() * 15);
    const done = status === "completed";
    const bl = 900 + Math.round(r() * 1400);
    return {
      id: `EXP-${String(1040 - i).padStart(4, "0")}`,
      name: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` #${Math.floor(i / NAMES.length) + 1}` : ""}`,
      description: "Demo experiment generated for interface preview.",
      taskType,
      model: pick(MODELS),
      dataset: pick(DATASETS),
      strategy: pick(STRATS),
      status,
      progress: done ? 100 : status === "running" ? 35 + i * 20 : 0,
      runs: done ? 3 + Math.floor(r() * 9) : status === "running" ? 1 : 0,
      baselineScore: done ? base : null,
      optimizedScore: done ? Math.min(98, base + 6 + Math.round(r() * 18)) : null,
      baselineLatencyMs: done ? bl : null,
      latencyMs: done ? Math.round(bl * (0.6 + r() * 0.3)) : null,
      costUsd: done ? +(0.02 + r() * 0.4).toFixed(3) : null,
      tokensSaved: done ? Math.round(200 + r() * 4000) : null,
      createdAt: day(i * 1.3),
      isDemo: true,
    } satisfies Experiment;
  });
}

export function buildSummary(exps: Experiment[]): DashboardSummary {
  const done = exps.filter((e) => e.status === "completed");
  const avg = (f: (e: Experiment) => number) =>
    done.length ? done.reduce((s, e) => s + f(e), 0) / done.length : 0;
  const rr = rng(7);
  const dates = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2026, 7, 1) + i * 5 * 86400000).toISOString().slice(5, 10),
  );
  const counts = TASKS.map((t) => exps.filter((e) => e.taskType === t).length);
  return {
    isDemo: true,
    totals: {
      experiments: exps.length,
      avgQuality: +avg((e) => e.optimizedScore ?? 0).toFixed(1),
      tokensSaved: done.reduce((s, e) => s + (e.tokensSaved ?? 0), 0),
      avgLatencyMs: Math.round(avg((e) => e.latencyMs ?? 0)),
      estimatedCostUsd: +done.reduce((s, e) => s + (e.costUsd ?? 0), 0).toFixed(2),
      successRate: exps.length
        ? +(
            (done.filter((e) => (e.optimizedScore ?? 0) > (e.baselineScore ?? 0)).length /
              exps.length) *
            100
          ).toFixed(1)
        : 0,
    },
    deltas: {
      experiments: 12.5,
      avgQuality: 4.2,
      tokensSaved: 18.1,
      avgLatencyMs: -9.4,
      estimatedCostUsd: -6.3,
      successRate: 3.1,
    },
    quality: dates.map((d, i) => ({
      date: d,
      baseline: Math.round(58 + rr() * 6 + i * 0.3),
      optimized: Math.round(66 + rr() * 6 + i * 1.1),
    })),
    latency: dates.slice(-7).map((d) => {
      const b = 1100 + rr() * 700;
      return { date: d, baseline: Math.round(b), optimized: Math.round(b * (0.62 + rr() * 0.2)) };
    }),
    tokens: dates.map((d) => ({
      date: d,
      input: Math.round(18000 + rr() * 9000),
      output: Math.round(9000 + rr() * 6000),
    })),
    cost: done.slice(0, 8).map((e) => ({ name: e.id.replace("EXP-", "#"), cost: e.costUsd ?? 0 })),
    distribution: [
      { name: "Prompt", value: counts[0] ?? 0 },
      { name: "Search", value: counts[1] ?? 0 },
      { name: "RAG", value: counts[2] ?? 0 },
      { name: "SQL", value: counts[3] ?? 0 },
    ],
  };
}

export function seedHistory(exps: Experiment[]): HistoryItem[] {
  const samples: Record<TaskType, [string, string]> = {
    prompt: [
      "Write something about our product launch",
      "You are a professional writer.\n\nTask: Write a launch announcement for...\n\nConstraints:\n- Under 200 words",
    ],
    search: [
      "cheap laptops good for coding",
      "(budget OR affordable) laptop programming developer -gaming",
    ],
    rag: [
      "What is our refund window for annual plans?",
      "refund policy annual subscription cancellation period",
    ],
    sql: [
      "SELECT * FROM orders WHERE YEAR(created_at) = 2025",
      "SELECT id, total FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'",
    ],
  };
  return exps.slice(0, 18).map((e, i) => ({
    id: `H-${500 + i}`,
    kind: e.taskType,
    title: e.name,
    input: samples[e.taskType][0],
    output: samples[e.taskType][1],
    model: e.model,
    success: e.status !== "failed" && e.status !== "cancelled",
    createdAt: e.createdAt,
    experimentId: e.id,
  }));
}
