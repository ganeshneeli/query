import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Download,
  FileCheck,
  FileDown,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComparisonPanel, DiffView } from "@/components/shared/comparison";
import { ChartCard, chartColors, tooltipStyle } from "@/components/shared/metric-card";
import { ExportMenu } from "@/components/shared/misc";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { useEvaluation, useExperiments } from "@/lib/api/hooks";
import type { EvaluationMetric, ScoreSource } from "@/lib/api/types";
import { downloadFile, fmtDate, fmtMs, fmtNum, fmtUsd, toCsv } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/evaluation")({
  beforeLoad: () => {
    throw redirect({ to: "/workflow" });
  },
  validateSearch: (search: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Evaluation Studio — PromptIQ" },
      {
        name: "description",
        content: "Measure whether optimization actually improves response quality and performance.",
      },
      { property: "og:title", content: "Evaluation Studio — PromptIQ" },
      {
        property: "og:description",
        content: "Measure whether optimization actually improves response quality and performance.",
      },
    ],
  }),
  component: EvaluationStudioPage,
});

const METHOD_LABELS: Record<
  ScoreSource,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  llm_judge: { label: "LLM Judge (GPT-4o)", variant: "default" },
  deterministic: { label: "Deterministic Check", variant: "secondary" },
  human: { label: "Human Review", variant: "outline" },
  heuristic: { label: "Heuristic Rule", variant: "outline" },
};

function EvaluationStudioPage() {
  const search = Route.useSearch();
  const { data: experiments = [], isLoading: loadingExp } = useExperiments();

  // Selection states
  const [selectedExpId, setSelectedExpId] = useState<string>(
    search.id || experiments[0]?.id || "EXP-1040",
  );
  const [evaluator, setEvaluator] = useState("llm_judge");
  const [dataset, setDataset] = useState("Customer FAQ v2");
  const [minQuality, setMinQuality] = useState(70);
  const [baselineRun, setBaselineRun] = useState("run-1");
  const [optimizedRun, setOptimizedRun] = useState("run-3");
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Fetch evaluation metrics for selected experiment
  const activeId = selectedExpId || experiments[0]?.id;
  const { data: evalData, isLoading: loadingEval, refetch } = useEvaluation(activeId);

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsEvaluating(false);
    toast.success("Benchmark evaluation updated against rubric");
  };

  const handleSaveReport = () => {
    if (!evalData) return;
    const report = {
      experimentId: activeId,
      timestamp: new Date().toISOString(),
      evaluator,
      dataset,
      metrics: evalData.metrics,
      performance: evalData.performance,
    };
    downloadFile(
      `promptiq-eval-${activeId}.json`,
      JSON.stringify(report, null, 2),
      "application/json",
    );
    toast.success("Evaluation report saved and downloaded");
  };

  const handleExportCsv = () => {
    if (!evalData) return;
    const rows = evalData.metrics.map((m) => ({
      Metric: m.label,
      "Baseline Score": m.baseline,
      "Optimized Score": m.optimized,
      Delta: m.optimized - m.baseline,
      Method: m.method,
      Explanation: m.explanation,
      Evidence: m.evidence || "",
    }));
    downloadFile(`promptiq-eval-${activeId}.csv`, toCsv(rows), "text/csv");
    toast.success("Downloaded evaluation CSV");
  };

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!evalData) return [];
    return evalData.metrics.map((m) => ({
      metric: m.label,
      baseline: m.baseline,
      optimized: m.optimized,
      fullMark: 100,
    }));
  }, [evalData]);

  // Scatter plot data: Quality vs Cost
  const scatterData = useMemo(() => {
    if (!evalData) return [];
    return [
      {
        name: "Baseline Run",
        cost: +(evalData.performance.baseline.costUsd * 1000).toFixed(2), // in millidollars
        quality: evalData.metrics.reduce((s, m) => s + m.baseline, 0) / evalData.metrics.length,
        z: 200,
      },
      {
        name: "Optimized Run",
        cost: +(evalData.performance.optimized.costUsd * 1000).toFixed(2),
        quality: evalData.metrics.reduce((s, m) => s + m.optimized, 0) / evalData.metrics.length,
        z: 300,
      },
    ];
  }, [evalData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluation Studio"
        description="Measure whether optimization actually improves response quality and performance."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!evalData}>
              <Download className="mr-1.5 h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveReport} disabled={!evalData}>
              <Save className="mr-1.5 h-4 w-4" />
              Save Report
            </Button>
            <Button size="sm" onClick={handleRunEvaluation} disabled={isEvaluating}>
              {isEvaluating ? (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-4 w-4" />
                  Run Evaluation
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* LLM Judge Ground Truth Disclaimer Banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold">Evaluation Methodology Notice:</span>
          <p className="text-muted-foreground dark:text-blue-300">
            Metrics produced by an LLM judge reflect model estimations and are not verified
            mathematical ground truth. For production validation, cross-reference with deterministic
            format tests and human spot-checks.
          </p>
        </div>
      </div>

      {/* Integrated Framework Banner */}
      <Card className="p-4 shadow-none border-primary/25 bg-gradient-to-r from-primary/5 via-accent/5 to-background glow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold">
                Live Benchmarking
              </Badge>
              <span className="text-xs font-semibold text-foreground">
                Looking for Live Dual LLM Execution & Direct Optimization?
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Run real-time side-by-side inference on Groq LPUs, measure 5-dimensional empirical radar deltas, and refine outputs using feedback steering in the Integrated AI Framework.
            </p>
          </div>
          <Button size="sm" variant="default" className="h-8 text-xs bg-primary text-primary-foreground font-semibold shadow-sm shrink-0" asChild>
            <Link to="/workflow">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 fill-current" />
              Open Integrated Framework →
            </Link>
          </Button>
        </div>
      </Card>

      {/* Configuration Toolbar */}
      <Card className="p-4 shadow-none glow-card">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Experiment</Label>
            <Select value={activeId} onValueChange={setSelectedExpId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select experiment" />
              </SelectTrigger>
              <SelectContent>
                {experiments.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id} className="text-xs font-mono">
                    {exp.id} — {exp.name.slice(0, 24)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Baseline Run</Label>
            <Select value={baselineRun} onValueChange={setBaselineRun}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="run-1">Run #1 (Initial baseline)</SelectItem>
                <SelectItem value="run-2">Run #2 (Pre-optimization)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Optimized Run</Label>
            <Select value={optimizedRun} onValueChange={setOptimizedRun}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="run-3">Run #3 (Optimized v2)</SelectItem>
                <SelectItem value="run-4">Run #4 (Final candidate)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Evaluator</Label>
            <Select value={evaluator} onValueChange={setEvaluator}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llm_judge">LLM-as-a-Judge (GPT-4o)</SelectItem>
                <SelectItem value="deterministic">Deterministic Assertion Suite</SelectItem>
                <SelectItem value="human">Simulated Human Panel</SelectItem>
                <SelectItem value="heuristic">Heuristic Quality Rule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reference Dataset</Label>
            <Select value={dataset} onValueChange={setDataset}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer FAQ v2">Customer FAQ v2</SelectItem>
                <SelectItem value="SciQA-500">SciQA-500</SelectItem>
                <SelectItem value="Internal Docs">Internal Docs</SelectItem>
                <SelectItem value="Northwind SQL">Northwind SQL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <Label className="text-xs">Min Quality Threshold</Label>
              <span className="font-mono text-muted-foreground">{minQuality}%</span>
            </div>
            <Slider
              value={[minQuality]}
              min={50}
              max={95}
              step={5}
              onValueChange={([v]) => v !== undefined && setMinQuality(v)}
              className="pt-2"
            />
          </div>
        </div>
      </Card>

      {/* Loading or Empty State */}
      {loadingEval || !evalData ? (
        <LoadingSkeleton variant="cards" rows={6} />
      ) : (
        <>
          {/* Section 1: Evaluation Metric Cards (7 Metrics) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Evaluation Rubric Breakdown
              </h3>
              <span className="text-xs text-muted-foreground">
                {evalData.metrics.length} dimensions evaluated
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {evalData.metrics.map((metric) => {
                const delta = metric.optimized - metric.baseline;
                const methodInfo = METHOD_LABELS[metric.method] || {
                  label: metric.method,
                  variant: "outline",
                };
                const isPassing = metric.optimized >= minQuality;

                return (
                  <Card key={metric.key} className="p-4 shadow-none space-y-3 glow-card">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-semibold text-sm">{metric.label}</span>
                        <div className="mt-1">
                          <Badge variant={methodInfo.variant} className="text-[10px]">
                            {methodInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold tabular-nums">{metric.optimized}</span>
                        <span className="text-xs text-muted-foreground"> / 100</span>
                        <div
                          className={`flex items-center justify-end text-xs font-medium ${
                            delta > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : delta < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {delta > 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                          ) : delta < 0 ? (
                            <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                          ) : null}
                          {delta > 0 ? `+${delta}` : delta} vs base ({metric.baseline})
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {metric.explanation}
                    </p>

                    {metric.evidence && (
                      <div className="rounded bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground line-clamp-2">
                        Evidence: {metric.evidence}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 2: Performance Telemetry Grid */}
          <Card className="p-4 shadow-none space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Performance & Efficiency Benchmarks
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 text-center text-xs">
              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">Input Tokens</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {evalData.performance.optimized.inputTokens}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  base: {evalData.performance.baseline.inputTokens}
                </span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">Output Tokens</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {evalData.performance.optimized.outputTokens}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {evalData.performance.optimized.outputTokens -
                    evalData.performance.baseline.outputTokens}{" "}
                  saved
                </span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">Total Tokens</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {evalData.performance.optimized.inputTokens +
                    evalData.performance.optimized.outputTokens}
                </p>
                <span className="text-[10px] text-muted-foreground">combined</span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">End-to-End Latency</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {fmtMs(evalData.performance.optimized.latencyMs)}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {fmtMs(
                    evalData.performance.optimized.latencyMs -
                      evalData.performance.baseline.latencyMs,
                  )}
                </span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">TTFT</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {fmtMs(evalData.performance.optimized.ttftMs)}
                </p>
                <span className="text-[10px] text-muted-foreground">time to first tok</span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">Est. Cost / Call</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {fmtUsd(evalData.performance.optimized.costUsd)}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  base: {fmtUsd(evalData.performance.baseline.costUsd)}
                </span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">Model Calls</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {evalData.performance.optimized.modelCalls}
                </p>
                <span className="text-[10px] text-muted-foreground">pipeline steps</span>
              </div>

              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground block text-[11px]">Iterations</span>
                <p className="font-mono font-semibold text-sm mt-1">
                  {evalData.performance.optimized.iterations}
                </p>
                <span className="text-[10px] text-muted-foreground">refinements</span>
              </div>
            </div>
          </Card>

          {/* Section 3: Visual Benchmarks Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Radar: Quality Comparison across all metrics */}
            <ChartCard
              title="Rubric Quality Profile"
              description="Comparing baseline vs. optimized dimensions (0–100)"
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="70%" data={radarData}>
                  <PolarGrid stroke={chartColors.grid} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: chartColors.axis }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke={chartColors.axis}
                    fontSize={10}
                  />
                  <Radar
                    name="Baseline Run"
                    dataKey="baseline"
                    stroke={chartColors.axis}
                    fill={chartColors.axis}
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Optimized Run"
                    dataKey="optimized"
                    stroke={chartColors.c1}
                    fill={chartColors.c1}
                    fillOpacity={0.4}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Scatter: Quality vs Cost */}
            <ChartCard
              title="Quality vs. Cost Trade-Off"
              description="Score improvement against API cost per call"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    type="number"
                    dataKey="cost"
                    name="Cost (m$)"
                    unit=" m$"
                    stroke={chartColors.axis}
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="quality"
                    name="Avg Score"
                    domain={[50, 100]}
                    stroke={chartColors.axis}
                    fontSize={11}
                  />
                  <ZAxis type="number" dataKey="z" range={[100, 300]} />
                  <RechartsTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={tooltipStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Scatter name="Execution Runs" data={scatterData} fill={chartColors.c2}>
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? chartColors.axis : chartColors.c1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Section 4: Response Comparison & Qualitative Differences */}
          <Card className="p-4 shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Response Output Comparison
                </h3>
                <p className="text-xs text-muted-foreground">
                  Inspect the original and optimized LLM generations side-by-side with evaluation
                  judge feedback.
                </p>
              </div>
            </div>

            <Tabs defaultValue="responses" className="space-y-3">
              <TabsList className="grid w-60 grid-cols-2">
                <TabsTrigger value="responses">LLM Responses</TabsTrigger>
                <TabsTrigger value="prompts">Prompts Diff</TabsTrigger>
              </TabsList>

              <TabsContent value="responses" className="space-y-4">
                <ComparisonPanel
                  original={evalData.responses.baselineResponse}
                  optimized={evalData.responses.optimizedResponse}
                  leftLabel="Baseline Generation (Run #1)"
                  rightLabel="Optimized Generation (Run #3)"
                />

                <div className="rounded-lg border bg-accent/10 border-primary/20 p-3 space-y-1 text-xs">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Evaluator Qualitative Synthesis:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {evalData.responses.feedback}
                  </p>
                </div>

                {/* Feedback-Based Refinement Loop */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-primary/5 border-primary/20 p-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      Feedback-Based Refinement Loop:
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Trigger iterative refinement in Prompt Lab using evaluator feedback and rubric score deltas.
                    </p>
                  </div>
                  <Button size="sm" asChild className="h-7 text-xs">
                    <Link to="/prompt-lab">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Refine in Prompt Lab →
                    </Link>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="prompts" className="space-y-3">
                <ComparisonPanel
                  original={evalData.responses.originalPrompt}
                  optimized={evalData.responses.optimizedPrompt}
                  leftLabel="Original Prompt Spec"
                  rightLabel="Optimized Prompt Spec"
                />
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}
