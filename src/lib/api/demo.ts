import { analyzePrompt, optimizePromptHeuristic } from "@/lib/prompt-heuristics";
import { buildSummary, seedExperiments, seedHistory } from "./demo-data";
import type {
  ApiService,
  EvaluationMetrics,
  Experiment,
  HistoryItem,
  OptimizeQueryResponse,
  SqlResult,
} from "./types";

// Development-only demo adapter. Implements the same ApiService interface as the
// live HTTP client. Every value it returns is simulated and flagged isDemo/heuristic.

const KEY = "promptiq.demo.v1";
interface Store {
  experiments: Experiment[];
  history: HistoryItem[];
  startedAt: Record<string, number>;
}

let store: Store | null = null;
function db(): Store {
  if (store) return store;
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
  if (raw) {
    try {
      store = JSON.parse(raw) as Store;
      return store;
    } catch {
      /* reseed */
    }
  }
  const experiments = seedExperiments();
  store = { experiments, history: seedHistory(experiments), startedAt: {} };
  return store;
}
const save = () => {
  if (typeof window !== "undefined" && store)
    window.localStorage.setItem(KEY, JSON.stringify(store));
};
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms + Math.random() * 250));
const RUN_MS = 25000;

function tick(e: Experiment): Experiment {
  const s = db();
  if (e.status !== "running") return e;
  const started = s.startedAt[e.id];
  if (!started) return e;
  const progress = Math.min(100, Math.round(((Date.now() - started) / RUN_MS) * 100));
  if (progress < 100) return { ...e, progress };
  const base = 55 + Math.round(Math.random() * 15);
  const bl = 900 + Math.round(Math.random() * 1200);
  delete s.startedAt[e.id];
  return {
    ...e,
    status: "completed",
    progress: 100,
    runs: e.runs + 1,
    baselineScore: base,
    optimizedScore: base + 8,
    baselineLatencyMs: bl,
    latencyMs: Math.round(bl * 0.75),
    costUsd: 0.12,
    tokensSaved: 900,
  };
}
function refreshAll() {
  const s = db();
  s.experiments = s.experiments.map(tick);
  save();
  return s.experiments;
}
function find(id: string) {
  const e = refreshAll().find((x) => x.id === id);
  if (!e) throw new Error(`Experiment ${id} not found`);
  return e;
}
function update(id: string, patch: Partial<Experiment>) {
  const s = db();
  s.experiments = s.experiments.map((e) => (e.id === id ? { ...e, ...patch } : e));
  save();
  return find(id);
}
const nextId = () =>
  `EXP-${String(Math.max(...db().experiments.map((e) => +e.id.slice(4)), 1000) + 1).padStart(4, "0")}`;

function sqlDemo(sql: string): SqlResult {
  const s = sql.trim();
  const valid =
    /^\s*(select|with)\b/i.test(s) &&
    (s.match(/\(/g)?.length ?? 0) === (s.match(/\)/g)?.length ?? 0);
  const messages: string[] = [];
  if (!valid)
    messages.push("Only SELECT / WITH statements are accepted, and parentheses must be balanced.");
  if (/select\s+\*/i.test(s))
    messages.push("SELECT * reads every column; list only required columns.");
  if (/\b(year|lower|upper|date)\s*\(/i.test(s))
    messages.push("A function on a filtered column prevents index use.");
  if (/\blike\s+'%/i.test(s)) messages.push("Leading wildcard LIKE cannot use a B-tree index.");
  let optimized = s.replace(/select\s+\*/i, "SELECT id, /* list required columns */ created_at");
  optimized = optimized.replace(
    /year\((\w+)\)\s*=\s*(\d{4})/i,
    (_m, c: string, y: string) => `${c} >= '${y}-01-01' AND ${c} < '${+y + 1}-01-01'`,
  );
  const where = s.match(/where\s+(?:year\()?(\w+)/i)?.[1];
  const table = s.match(/from\s+(\w+)/i)?.[1];
  return {
    valid,
    messages,
    optimizedSql: optimized,
    indexRecommendations:
      where && table ? [`CREATE INDEX idx_${table}_${where} ON ${table} (${where});`] : [],
    plan: null,
    estimatedRows: null,
    estimatedCost: null,
    executionMs: null,
    equivalence: "not_verified",
  };
}

export const demoApi: ApiService = {
  mode: "demo",
  async health() {
    await wait(300);
    return { ok: false, providers: [] };
  },
  async analyzeInput(req) {
    await wait();
    return analyzePrompt(req);
  },
  async optimizePrompt(req) {
    await wait(900);
    return optimizePromptHeuristic(req);
  },
  async optimizeQuery(req): Promise<OptimizeQueryResponse> {
    await wait(700);
    if (req.kind === "sql") return { kind: "sql", source: "heuristic", result: sqlDemo(req.query) };
    const words = req.query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    const stop = new Set([
      "the",
      "a",
      "an",
      "for",
      "of",
      "to",
      "in",
      "is",
      "what",
      "how",
      "our",
      "and",
      "on",
      "with",
      "are",
      "do",
      "i",
      "my",
    ]);
    const keywords = [...new Set(words.filter((w) => !stop.has(w) && w.length > 2))];
    if (req.kind === "search") {
      const SYN: Record<string, string[]> = {
        cheap: ["budget", "affordable"],
        good: ["recommended", "top-rated"],
        fast: ["quick", "high-performance"],
        laptop: ["notebook"],
        buy: ["purchase"],
        fix: ["resolve", "troubleshoot"],
        error: ["exception", "failure"],
      };
      const synonyms = keywords
        .filter((k) => SYN[k])
        .map((k) => ({ term: k, alternatives: SYN[k] ?? [] }));
      const intent = /\b(buy|price|cheap|best)\b/i.test(req.query)
        ? "Transactional"
        : /\b(how|why|what|fix)\b/i.test(req.query)
          ? "Informational"
          : "Navigational";
      const entities = (req.query.match(/\b[A-Z][a-zA-Z0-9]+\b/g) ?? []).map((t) => ({
        text: t,
        type: "Proper noun",
      }));
      return {
        kind: "search",
        source: "heuristic",
        result: {
          intent,
          keywords,
          synonyms,
          entities,
          expansions: synonyms
            .flatMap((s) =>
              s.alternatives.map((a) => req.query.replace(new RegExp(s.term, "i"), a)),
            )
            .slice(0, 4),
          optimizedQuery: keywords
            .map((k) => (SYN[k] ? `(${[k, ...(SYN[k] ?? [])].join(" OR ")})` : k))
            .join(" "),
        },
      };
    }
    const docs = [
      "Refund policy",
      "Billing FAQ",
      "Subscription terms",
      "Account cancellation",
      "Pricing overview",
      "Enterprise agreement",
      "Support SLA",
      "Data retention",
    ]
      .map((t, i) => ({
        id: `doc-${i + 1}`,
        title: t,
        score: +(0.92 - i * 0.07 - Math.random() * 0.03).toFixed(3),
        snippet: `Demo snippet from "${t}" mentioning ${keywords.slice(0, 3).join(", ") || "the query"}. This text is simulated.`,
        source: `${req.collection ?? "collection"}/${t.toLowerCase().replace(/\s/g, "-")}.md`,
        updatedAt: "2026-09-12",
      }))
      .filter((d) => d.score >= (req.threshold ?? 0))
      .slice(0, req.topK ?? 5);
    return {
      kind: "rag",
      source: "heuristic",
      result: {
        rewrittenQuery: req.rewrite ? keywords.join(" ") : null,
        documents: docs,
        metrics: {
          precisionAtK: null,
          coverage: null,
          meanScore: docs.length
            ? +(docs.reduce((s, d) => s + d.score, 0) / docs.length).toFixed(3)
            : 0,
        },
      },
    };
  },
  async createExperiment(input) {
    await wait();
    const e: Experiment = {
      ...input,
      id: nextId(),
      status: "draft",
      progress: 0,
      runs: 0,
      baselineScore: null,
      optimizedScore: null,
      latencyMs: null,
      baselineLatencyMs: null,
      costUsd: null,
      tokensSaved: null,
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    db().experiments.unshift(e);
    save();
    return e;
  },
  async runExperiment(id) {
    await wait();
    db().startedAt[id] = Date.now();
    return update(id, { status: "running", progress: 0 });
  },
  async updateExperimentStatus(id, status) {
    await wait();
    if (status !== "running") delete db().startedAt[id];
    return update(id, { status });
  },
  async deleteExperiment(id) {
    await wait(300);
    const s = db();
    s.experiments = s.experiments.filter((e) => e.id !== id);
    save();
  },
  async duplicateExperiment(id) {
    const src = find(id);
    return demoApi.createExperiment({
      name: `${src.name} (copy)`,
      description: src.description,
      taskType: src.taskType,
      model: src.model,
      dataset: src.dataset,
      strategy: src.strategy,
    });
  },
  async getExperiment(id) {
    await wait(250);
    return find(id);
  },
  async listExperiments() {
    await wait(350);
    return [...refreshAll()];
  },
  async getEvaluationMetrics(id): Promise<EvaluationMetrics> {
    await wait();
    const e = find(id);
    const b = e.baselineScore ?? 60,
      o = e.optimizedScore ?? 70;
    const m = (
      key: string,
      label: string,
      db_: number,
      do_: number,
      method: EvaluationMetrics["metrics"][number]["method"],
      explanation: string,
      evidence?: string,
    ) => ({
      key,
      label,
      baseline: Math.min(100, b + db_),
      optimized: Math.min(100, o + do_),
      method,
      explanation,
      ...(evidence ? { evidence } : {}),
    });
    return {
      experimentId: id,
      isDemo: true,
      metrics: [
        m(
          "relevance",
          "Relevance",
          4,
          5,
          "llm_judge",
          "Judge rated how directly the response addresses the question.",
        ),
        m(
          "correctness",
          "Correctness",
          -2,
          1,
          "deterministic",
          "Exact-match against reference answers in the dataset.",
          "Matched 41 / 50 reference answers (simulated).",
        ),
        m(
          "completeness",
          "Completeness",
          -5,
          3,
          "llm_judge",
          "Coverage of the required sub-points listed in the rubric.",
        ),
        m(
          "clarity",
          "Clarity",
          6,
          8,
          "human",
          "Average of 3 simulated human ratings on a 1–5 scale, rescaled.",
        ),
        m(
          "instruction",
          "Instruction Following",
          -4,
          6,
          "deterministic",
          "Format and length checks passed / total checks.",
          "Passed 18 / 20 format checks (simulated).",
        ),
        m(
          "groundedness",
          "Groundedness",
          0,
          2,
          "llm_judge",
          "Share of claims supported by retrieved context.",
        ),
        m(
          "semantic",
          "Semantic Preservation",
          30,
          25,
          "deterministic",
          "Embedding cosine similarity between original and optimized intent.",
        ),
      ],
      performance: {
        baseline: {
          inputTokens: 412,
          outputTokens: 690,
          latencyMs: e.baselineLatencyMs ?? 1600,
          ttftMs: 420,
          costUsd: 0.0061,
          modelCalls: 1,
          iterations: 0,
        },
        optimized: {
          inputTokens: 538,
          outputTokens: 455,
          latencyMs: e.latencyMs ?? 1200,
          ttftMs: 390,
          costUsd: 0.0052,
          modelCalls: 3,
          iterations: 2,
        },
      },
      responses: {
        originalPrompt: "Summarize this support ticket and tell me what to do.",
        optimizedPrompt:
          "You are a support lead.\n\nTask: Summarize the ticket below in 3 bullet points, then recommend one next action.\n\nConstraints:\n- Under 120 words\n- Flag missing information explicitly\n\nOutput format: Summary bullets, then 'Next action:' line.",
        baselineResponse:
          "The customer is unhappy about billing. They were charged twice and want help. You should look into it and maybe refund them, and also check whether the system has a bug that caused this to happen to others too.",
        optimizedResponse:
          "- Customer was charged twice for the October invoice.\n- They request a refund for the duplicate charge.\n- Order ID is missing from the ticket.\n\nNext action: Ask for the order ID, then issue a refund for the duplicate charge.",
        feedback:
          "Optimized response follows the requested format and flags missing data. Simulated evaluation — not a real measurement.",
      },
    };
  },
  async submitFeedback() {
    await wait(300);
  },
  async getDashboardSummary() {
    await wait(500);
    return buildSummary(refreshAll());
  },
  async listHistory() {
    await wait(350);
    return [...db().history];
  },
  async deleteHistory(id) {
    await wait(200);
    const s = db();
    s.history = s.history.filter((h) => h.id !== id);
    save();
  },
  async clearHistory() {
    await wait(200);
    db().history = [];
    save();
  },
};

export function addDemoHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
  const s = db();
  s.history.unshift({ ...item, id: `H-${Date.now()}`, createdAt: new Date().toISOString() });
  save();
}
export function resetDemoData() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  store = null;
}
