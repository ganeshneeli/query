export type TaskType = "prompt" | "search" | "rag" | "sql";
export type PromptTaskType =
  "General" | "Coding" | "Research" | "Summarization" | "Education" | "Data Analysis" | "Writing";
export type Strategy = "Balanced" | "Quality First" | "Low Cost" | "Low Latency";
export type ExperimentStatus =
  "draft" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type ScoreSource = "llm_judge" | "deterministic" | "human" | "heuristic";

export interface Experiment {
  id: string;
  name: string;
  description: string;
  taskType: TaskType;
  model: string;
  dataset: string;
  strategy: Strategy;
  status: ExperimentStatus;
  progress: number;
  runs: number;
  baselineScore: number | null;
  optimizedScore: number | null;
  latencyMs: number | null;
  baselineLatencyMs: number | null;
  costUsd: number | null;
  tokensSaved: number | null;
  createdAt: string;
  isDemo: boolean;
}

export interface CreateExperimentInput {
  name: string;
  description: string;
  taskType: TaskType;
  model: string;
  dataset: string;
  strategy: Strategy;
}

export interface TimePoint {
  date: string;
  baseline: number;
  optimized: number;
}

export interface DashboardSummary {
  isDemo: boolean;
  totals: {
    experiments: number;
    avgQuality: number;
    tokensSaved: number;
    avgLatencyMs: number;
    estimatedCostUsd: number;
    successRate: number;
  };
  deltas: Record<keyof DashboardSummary["totals"], number>;
  quality: TimePoint[];
  latency: TimePoint[];
  tokens: { date: string; input: number; output: number }[];
  cost: { name: string; cost: number }[];
  distribution: { name: string; value: number }[];
}

export type IssueKind =
  | "ambiguity"
  | "missing_context"
  | "missing_constraints"
  | "unspecified_format"
  | "unnecessary_wording";

export interface DetectedIssue {
  kind: IssueKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export interface QualityIndicators {
  clarity: number;
  specificity: number;
  contextCompleteness: number;
  instructionFollowing: number;
  constraintCoverage: number;
}

export interface AnalyzeRequest {
  prompt: string;
  taskType: PromptTaskType;
  context?: string;
  constraints?: string;
  outputFormat?: string;
}

export interface AnalyzeResponse {
  issues: DetectedIssue[];
  indicators: QualityIndicators;
  estimatedTokens: number;
  source: ScoreSource;
}

export interface OptimizePromptRequest extends AnalyzeRequest {
  model: string;
  strategy: Strategy;
  maxIterations: number;
  outputLength: "short" | "medium" | "long";
  temperature: number;
}

export interface OptimizePromptResponse {
  optimizedPrompt: string;
  explanation: { whatChanged: string[]; why: string[]; benefit: string[]; tradeoffs: string[] };
  original: AnalyzeResponse;
  optimized: AnalyzeResponse;
  iterations: number;
  source: ScoreSource;
}

export interface OptimizeQueryRequest {
  kind: "search" | "rag" | "sql";
  query: string;
  dialect?: string;
  schema?: string;
  collection?: string;
  topK?: number;
  threshold?: number;
  rewrite?: boolean;
}

export interface SearchQueryResult {
  intent: string;
  expansions: string[];
  keywords: string[];
  synonyms: { term: string; alternatives: string[] }[];
  entities: { text: string; type: string }[];
  optimizedQuery: string;
}

export interface RagDocument {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
  updatedAt: string;
}

export interface RagResult {
  rewrittenQuery: string | null;
  documents: RagDocument[];
  metrics: { precisionAtK: number | null; meanScore: number; coverage: number | null };
}

export interface SqlResult {
  valid: boolean;
  messages: string[];
  optimizedSql: string;
  indexRecommendations: string[];
  plan: string | null;
  estimatedRows: number | null;
  estimatedCost: number | null;
  executionMs: { original: number; optimized: number } | null;
  equivalence: "verified" | "not_verified" | "different";
}

export type OptimizeQueryResponse =
  | { kind: "search"; result: SearchQueryResult; source: ScoreSource }
  | { kind: "rag"; result: RagResult; source: ScoreSource }
  | { kind: "sql"; result: SqlResult; source: ScoreSource };

export interface EvaluationMetric {
  key: string;
  label: string;
  baseline: number;
  optimized: number;
  method: ScoreSource;
  explanation: string;
  evidence?: string;
}

export interface EvaluationMetrics {
  experimentId: string;
  isDemo: boolean;
  metrics: EvaluationMetric[];
  performance: {
    baseline: PerfStats;
    optimized: PerfStats;
  };
  responses: {
    originalPrompt: string;
    optimizedPrompt: string;
    baselineResponse: string;
    optimizedResponse: string;
    feedback: string;
  };
}

export interface PerfStats {
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  ttftMs: number | null;
  costUsd: number;
  modelCalls: number;
  iterations: number;
}

export interface FeedbackInput {
  rating: "up" | "down";
  comment?: string;
}

export interface HistoryItem {
  id: string;
  kind: TaskType;
  title: string;
  input: string;
  output: string;
  model: string;
  success: boolean;
  createdAt: string;
  experimentId?: string;
}

export interface HealthStatus {
  ok: boolean;
  version?: string;
  providers?: { name: string; configured: boolean }[];
}

export interface ApiService {
  mode: "demo" | "live";
  health(): Promise<HealthStatus>;
  analyzeInput(req: AnalyzeRequest): Promise<AnalyzeResponse>;
  optimizePrompt(req: OptimizePromptRequest): Promise<OptimizePromptResponse>;
  optimizeQuery(req: OptimizeQueryRequest): Promise<OptimizeQueryResponse>;
  createExperiment(input: CreateExperimentInput): Promise<Experiment>;
  runExperiment(id: string): Promise<Experiment>;
  updateExperimentStatus(id: string, status: ExperimentStatus): Promise<Experiment>;
  deleteExperiment(id: string): Promise<void>;
  duplicateExperiment(id: string): Promise<Experiment>;
  getExperiment(id: string): Promise<Experiment>;
  listExperiments(): Promise<Experiment[]>;
  getEvaluationMetrics(id: string): Promise<EvaluationMetrics>;
  submitFeedback(id: string, feedback: FeedbackInput): Promise<void>;
  getDashboardSummary(): Promise<DashboardSummary>;
  listHistory(): Promise<HistoryItem[]>;
  deleteHistory(id: string): Promise<void>;
  clearHistory(): Promise<void>;
}
