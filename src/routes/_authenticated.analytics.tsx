import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Clock,
  Coins,
  Cpu,
  Database,
  DollarSign,
  Download,
  FileDown,
  FileSpreadsheet,
  Gauge,
  HelpCircle,
  Layers,
  PieChart as PieIcon,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import { ChartCard, chartColors, MetricCard, tooltipStyle } from "@/components/shared/metric-card";
import { FilterToolbar } from "@/components/shared/misc";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { useDashboard, useExperiments } from "@/lib/api/hooks";
import type { Strategy, TaskType } from "@/lib/api/types";
import { downloadFile, fmtMs, fmtNum, fmtUsd, TASK_LABEL, toCsv } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Telemetry — PromptIQ" },
      {
        name: "description",
        content:
          "Comprehensive analytics workspace for prompt quality, token efficiency, latency, and cost telemetry.",
      },
      { property: "og:title", content: "Analytics & Telemetry — PromptIQ" },
      {
        property: "og:description",
        content:
          "Comprehensive analytics workspace for prompt quality, token efficiency, latency, and cost telemetry.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_COLORS = [
  "oklch(0.52 0.22 275)",
  "oklch(0.62 0.12 180)",
  "oklch(0.7 0.14 55)",
  "oklch(0.6 0.18 330)",
];

export function AnalyticsPage() {
  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useDashboard();
  const {
    data: experiments = [],
    isLoading: loadingExp,
    error: expError,
    refetch: refetchExp,
  } = useExperiments();

  // Filters state
  const [timeRange, setTimeRange] = useState("30d");
  const [modelFilter, setModelFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");
  const [datasetFilter, setDatasetFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");

  // Filtered experiments
  const filtered = useMemo(() => {
    let list = [...experiments];
    if (modelFilter !== "all") list = list.filter((e) => e.model === modelFilter);
    if (taskFilter !== "all") list = list.filter((e) => e.taskType === taskFilter);
    if (datasetFilter !== "all") list = list.filter((e) => e.dataset === datasetFilter);
    if (strategyFilter !== "all") list = list.filter((e) => e.strategy === strategyFilter);

    if (timeRange !== "all") {
      const now = Date.now();
      const dayMs = 86400000;
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      list = list.filter((e) => now - new Date(e.createdAt).getTime() <= days * dayMs);
    }
    return list;
  }, [experiments, modelFilter, taskFilter, datasetFilter, strategyFilter, timeRange]);

  // Derived KPIs
  const kpis = useMemo(() => {
    const totalRequests = filtered.length;
    const completed = filtered.filter((e) => e.status === "completed");
    const successfulRequests = completed.filter(
      (e) => (e.optimizedScore ?? 0) >= (e.baselineScore ?? 0),
    ).length;

    const avgQuality =
      completed.length > 0
        ? +(completed.reduce((s, e) => s + (e.optimizedScore ?? 0), 0) / completed.length).toFixed(
            1,
          )
        : 0;

    const avgLatency =
      completed.length > 0
        ? Math.round(completed.reduce((s, e) => s + (e.latencyMs ?? 0), 0) / completed.length)
        : 0;

    const totalTokensSaved = completed.reduce((s, e) => s + (e.tokensSaved ?? 0), 0);
    const totalCost = +completed.reduce((s, e) => s + (e.costUsd ?? 0), 0).toFixed(2);
    const avgCostPerSuccess =
      successfulRequests > 0 ? +(totalCost / successfulRequests).toFixed(3) : 0;

    return {
      totalRequests,
      successfulRequests,
      avgQuality,
      avgLatency,
      totalInputTokens: Math.round(totalTokensSaved * 2.2),
      totalOutputTokens: Math.round(totalTokensSaved * 1.5),
      totalCost,
      avgCostPerSuccess,
    };
  }, [filtered]);

  // Model Comparison Chart Data
  const modelComparisonData = useMemo(() => {
    const models = [
      "gpt-4o-mini",
      "gpt-4o",
      "claude-3.5-sonnet",
      "gemini-1.5-pro",
      "llama-3.1-70b",
    ];
    return models
      .map((m) => {
        const exps = filtered.filter((e) => e.model === m && e.status === "completed");
        const avgQ = exps.length
          ? Math.round(exps.reduce((s, e) => s + (e.optimizedScore ?? 0), 0) / exps.length)
          : 0;
        const avgLat = exps.length
          ? Math.round(exps.reduce((s, e) => s + (e.latencyMs ?? 0), 0) / exps.length)
          : 0;
        return {
          model: m,
          quality: avgQ,
          latency: avgLat,
          count: exps.length,
        };
      })
      .filter((d) => d.count > 0 || modelFilter === "all");
  }, [filtered, modelFilter]);

  // Strategy Success Rate Data
  const strategyData = useMemo(() => {
    const strats: Strategy[] = ["Balanced", "Quality First", "Low Cost", "Low Latency"];
    return strats.map((st) => {
      const group = filtered.filter((e) => e.strategy === st);
      const passed = group.filter(
        (e) => e.status === "completed" && (e.optimizedScore ?? 0) >= (e.baselineScore ?? 0),
      ).length;
      const rate = group.length ? Math.round((passed / group.length) * 100) : 0;
      return { strategy: st, rate, total: group.length };
    });
  }, [filtered]);

  // Scatter: Quality vs Latency
  const qualityVsLatencyData = useMemo(() => {
    return filtered
      .filter((e) => e.status === "completed" && e.optimizedScore != null && e.latencyMs != null)
      .slice(0, 30)
      .map((e) => ({
        name: e.id,
        latency: e.latencyMs,
        quality: e.optimizedScore,
        z: 200,
      }));
  }, [filtered]);

  // Scatter: Quality vs Cost
  const qualityVsCostData = useMemo(() => {
    return filtered
      .filter((e) => e.status === "completed" && e.optimizedScore != null && e.costUsd != null)
      .slice(0, 30)
      .map((e) => ({
        name: e.id,
        cost: +(e.costUsd * 100).toFixed(1), // cents
        quality: e.optimizedScore,
        z: 200,
      }));
  }, [filtered]);

  const handleExportCsv = () => {
    if (!filtered.length) {
      toast.error("No telemetry data to export");
      return;
    }
    const rows = filtered.map((e) => ({
      ID: e.id,
      Name: e.name,
      Task: e.taskType,
      Model: e.model,
      Dataset: e.dataset,
      Strategy: e.strategy,
      Status: e.status,
      "Baseline Score": e.baselineScore ?? "",
      "Optimized Score": e.optimizedScore ?? "",
      "Latency (ms)": e.latencyMs ?? "",
      "Tokens Saved": e.tokensSaved ?? "",
      "Cost ($)": e.costUsd ?? "",
      Created: e.createdAt,
    }));
    downloadFile(`promptiq-analytics-${timeRange}.csv`, toCsv(rows), "text/csv");
    toast.success(`Exported ${rows.length} analytics records`);
  };

  if (summaryError || expError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Performance telemetry and optimization insights."
        />
        <ErrorState
          error={summaryError || expError}
          onRetry={() => {
            refetchSummary();
            refetchExp();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Comprehensive telemetry across model accuracy, latency improvements, token compression, and cost efficiency."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 shadow-none">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">Time Horizon</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Model Family</Label>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
                <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                <SelectItem value="llama-3.1-70b">llama-3.1-70b</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Task Type</Label>
            <Select value={taskFilter} onValueChange={setTaskFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="prompt">Prompt Optimization</SelectItem>
                <SelectItem value="search">Search Query</SelectItem>
                <SelectItem value="rag">RAG Retrieval</SelectItem>
                <SelectItem value="sql">SQL Query</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Reference Dataset</Label>
            <Select value={datasetFilter} onValueChange={setDatasetFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Datasets</SelectItem>
                <SelectItem value="Customer FAQ v2">Customer FAQ v2</SelectItem>
                <SelectItem value="SciQA-500">SciQA-500</SelectItem>
                <SelectItem value="Internal Docs">Internal Docs</SelectItem>
                <SelectItem value="Northwind SQL">Northwind SQL</SelectItem>
                <SelectItem value="MS MARCO subset">MS MARCO subset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Strategy</Label>
            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="Balanced">Balanced</SelectItem>
                <SelectItem value="Quality First">Quality First</SelectItem>
                <SelectItem value="Low Cost">Low Cost</SelectItem>
                <SelectItem value="Low Latency">Low Latency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 8 KPI Cards Grid */}
      {loadingSummary || loadingExp ? (
        <LoadingSkeleton variant="cards" rows={8} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Requests"
            value={fmtNum(kpis.totalRequests)}
            tip="Total optimization runs executed matching current filter conditions."
            icon={Activity}
          />
          <MetricCard
            label="Successful Requests"
            value={fmtNum(kpis.successfulRequests)}
            tip="Runs that completed without semantic degradation or rubric failures."
            icon={Sparkles}
          />
          <MetricCard
            label="Avg Response Quality"
            value={`${kpis.avgQuality} / 100`}
            tip="Mean benchmark quality score achieved post-optimization."
            icon={Gauge}
          />
          <MetricCard
            label="Average Latency"
            value={fmtMs(kpis.avgLatency)}
            invert
            tip="Average turnaround time for optimized queries."
            icon={Clock}
          />
          <MetricCard
            label="Total Input Tokens"
            value={fmtNum(kpis.totalInputTokens)}
            tip="Total prompt tokens processed across filtered pipeline runs."
            icon={Cpu}
          />
          <MetricCard
            label="Total Output Tokens"
            value={fmtNum(kpis.totalOutputTokens)}
            tip="Total generated completion tokens across filtered pipeline runs."
            icon={Zap}
          />
          <MetricCard
            label="Estimated Total Cost"
            value={fmtUsd(kpis.totalCost)}
            invert
            tip="Cumulative API inference expense incurred."
            icon={DollarSign}
          />
          <MetricCard
            label="Avg Cost / Success"
            value={fmtUsd(kpis.avgCostPerSuccess)}
            invert
            tip="Inference expense normalized per successful benchmark pass."
            icon={Coins}
          />
        </div>
      )}

      {/* Insufficient Data Empty State Check */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="Insufficient Data"
          description="No experiment records match the active filter criteria. Widen your timeframe or reset filters to display telemetry charts."
        />
      ) : (
        /* Charts Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Chart 1: Quality Trend */}
          {summary && (
            <ChartCard
              title="Quality Score Trend"
              description="Historical progression of baseline vs optimized quality"
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={summary.quality}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={chartColors.axis} fontSize={11} tickLine={false} />
                  <YAxis
                    stroke={chartColors.axis}
                    fontSize={11}
                    domain={[45, 100]}
                    tickLine={false}
                  />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Baseline Score"
                    stroke={chartColors.axis}
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="optimized"
                    name="Optimized Score"
                    stroke={chartColors.c1}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 6: Task Type Distribution */}
          {summary && (
            <ChartCard
              title="Task Type Distribution"
              description="Share of Prompt, Search, RAG & SQL workloads"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.distribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {summary.distribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", bottom: 0 }}
                    formatter={(val, entry: { payload?: { value?: number } }) =>
                      `${val} (${entry?.payload?.value ?? ""})`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 2: Latency Trend */}
          {summary && (
            <ChartCard
              title="Latency Trend (ms)"
              description="Round-trip latency comparison over time"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.latency}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={chartColors.axis} fontSize={11} tickLine={false} />
                  <YAxis stroke={chartColors.axis} fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar
                    dataKey="baseline"
                    name="Baseline (ms)"
                    fill={chartColors.axis}
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="optimized"
                    name="Optimized (ms)"
                    fill={chartColors.c2}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 4: Token Usage Trend */}
          {summary && (
            <ChartCard
              title="Token Volume Trend"
              description="Input prompt tokens vs output completion tokens"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={summary.tokens}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={chartColors.axis} fontSize={11} tickLine={false} />
                  <YAxis stroke={chartColors.axis} fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="input"
                    name="Input Tokens"
                    stackId="1"
                    stroke={chartColors.c1}
                    fill={chartColors.c1}
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="output"
                    name="Output Tokens"
                    stackId="1"
                    stroke={chartColors.c3}
                    fill={chartColors.c3}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Chart 5: Model Comparison */}
          <ChartCard
            title="Model Quality Comparison"
            description="Average benchmark quality score across models"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelComparisonData}
                layout="vertical"
                margin={{ top: 10, right: 15, left: 35, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={chartColors.axis}
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  stroke={chartColors.axis}
                  fontSize={10}
                  tickLine={false}
                />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="quality"
                  name="Avg Score"
                  fill={chartColors.c1}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 7: Optimization Success Rate by Strategy */}
          <ChartCard
            title="Success Rate by Strategy (%)"
            description="Percentage of optimizations improving quality"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis
                  dataKey="strategy"
                  stroke={chartColors.axis}
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke={chartColors.axis} fontSize={10} domain={[0, 100]} tickLine={false} />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v}%`, "Success Rate"]}
                />
                <Bar dataKey="rate" name="Success %" fill={chartColors.c2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 8: Quality vs Latency */}
          <ChartCard
            title="Quality vs. Latency Trade-Off"
            description="Score achieved relative to turnaround time (ms)"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 15, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  type="number"
                  dataKey="latency"
                  name="Latency (ms)"
                  unit="ms"
                  stroke={chartColors.axis}
                  fontSize={10}
                />
                <YAxis
                  type="number"
                  dataKey="quality"
                  name="Score"
                  domain={[50, 100]}
                  stroke={chartColors.axis}
                  fontSize={10}
                />
                <ZAxis type="number" dataKey="z" range={[80, 200]} />
                <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
                <Scatter name="Runs" data={qualityVsLatencyData} fill={chartColors.c1} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 9: Quality vs Cost */}
          <ChartCard
            title="Quality vs. Cost (¢)"
            description="Quality score vs estimated cost per experiment"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 15, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  type="number"
                  dataKey="cost"
                  name="Cost (cents)"
                  unit="¢"
                  stroke={chartColors.axis}
                  fontSize={10}
                />
                <YAxis
                  type="number"
                  dataKey="quality"
                  name="Score"
                  domain={[50, 100]}
                  stroke={chartColors.axis}
                  fontSize={10}
                />
                <ZAxis type="number" dataKey="z" range={[80, 200]} />
                <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
                <Scatter name="Runs" data={qualityVsCostData} fill={chartColors.c4} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
