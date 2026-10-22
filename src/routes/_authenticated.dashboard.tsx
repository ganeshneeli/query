import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Clock,
  Copy,
  DollarSign,
  Eye,
  FileText,
  FlaskConical,
  Gauge,
  Info,
  Play,
  Plus,
  Sparkles,
  Trash2,
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
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ChartCard, chartColors, MetricCard, tooltipStyle } from "@/components/shared/metric-card";
import {
  ConfirmDialog,
  ExperimentStatusBadge,
  FilterToolbar,
  SortButton,
  TablePagination,
} from "@/components/shared/misc";
import { ModelSelector } from "@/components/shared/model-selector";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { useApi } from "@/lib/api";
import { useDashboard, useExperimentMutations, useExperiments } from "@/lib/api/hooks";
import type { CreateExperimentInput, Experiment, Strategy, TaskType } from "@/lib/api/types";
import { fmtDate, fmtMs, fmtNum, fmtUsd, TASK_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PromptIQ" },
      {
        name: "description",
        content: "Monitor prompt quality, query performance, and optimization outcomes.",
      },
      { property: "og:title", content: "Dashboard — PromptIQ" },
      {
        property: "og:description",
        content: "Monitor prompt quality, query performance, and optimization outcomes.",
      },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "oklch(0.52 0.22 275)", // Prompt (Indigo)
  "oklch(0.62 0.12 180)", // Search (Teal)
  "oklch(0.7 0.14 55)", // RAG (Amber)
  "oklch(0.6 0.18 330)", // SQL (Rose)
];

function DashboardPage() {
  const navigate = useNavigate();
  const { mode } = useApi();
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
  const { create, duplicate, remove, run } = useExperimentMutations();

  // Create Experiment Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [newExp, setNewExp] = useState<CreateExperimentInput>({
    name: "",
    description: "",
    taskType: "prompt",
    model: "gpt-4o-mini",
    dataset: "Customer FAQ v2",
    strategy: "Balanced",
  });

  // Table filters & sorting
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "name" | "baselineScore" | "optimizedScore" | "latencyMs"
  >("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Experiment to delete
  const [deleteTarget, setDeleteTarget] = useState<Experiment | null>(null);

  // Selected experiment details modal
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  const filteredExperiments = useMemo(() => {
    let list = [...experiments];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.model.toLowerCase().includes(q),
      );
    }
    if (taskFilter !== "all") {
      list = list.filter((e) => e.taskType === taskFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }
    list.sort((a, b) => {
      let av = a[sortBy] ?? 0;
      let bv = b[sortBy] ?? 0;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [experiments, search, taskFilter, statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredExperiments.length / pageSize));
  const pageExperiments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExperiments.slice(start, start + pageSize);
  }, [filteredExperiments, page, pageSize]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.name.trim()) return;
    await create.mutateAsync(newExp);
    setCreateOpen(false);
    setNewExp({
      name: "",
      description: "",
      taskType: "prompt",
      model: "gpt-4o-mini",
      dataset: "Customer FAQ v2",
      strategy: "Balanced",
    });
  };

  if (summaryError || expError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Monitor prompt quality, query performance, and optimization outcomes."
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
        title="Dashboard"
        description="Monitor prompt quality, query performance, and optimization outcomes."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/analytics">
                <FileText className="mr-1.5 h-4 w-4" />
                View Reports
              </Link>
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Experiment
            </Button>
          </div>
        }
      />

      {/* Project Mission, Objectives & Innovation Framework */}
      <Card className="p-4 shadow-none border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
              Innovation / Novelty
            </Badge>
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              Integrated AI-Driven Optimization, Evaluation & Refinement Framework
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <Link to="/prompt-lab">
                <Sparkles className="mr-1 h-3 w-3 text-primary" />
                Prompt Lab
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <Link to="/query-lab">
                <Gauge className="mr-1 h-3 w-3 text-teal-600" />
                Query Lab
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <Link to="/evaluation">
                <FileText className="mr-1 h-3 w-3 text-indigo-600" />
                Evaluation Studio
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Core Objectives:
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground text-[11px] leading-relaxed">
              <li>Automatically optimize user prompts and queries.</li>
              <li>Improve LLM response relevance, accuracy, and consistency.</li>
              <li>Reduce unnecessary token usage and response latency.</li>
              <li>Measure improvement using quality and performance metrics.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Expected Outcomes:
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Improved response quality and retrieval relevance, reduced token usage and latency, consistent LLM outputs, and measurable performance improvement over original prompts and queries.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[10px] font-mono">1. Prompt Optimization</Badge>
              <span className="text-muted-foreground text-[10px]">➔</span>
              <Badge variant="secondary" className="text-[10px] font-mono">2. Query Reformulation</Badge>
              <span className="text-muted-foreground text-[10px]">➔</span>
              <Badge variant="secondary" className="text-[10px] font-mono">3. Response Evaluation</Badge>
              <span className="text-muted-foreground text-[10px]">➔</span>
              <Badge variant="secondary" className="text-[10px] font-mono">4. Feedback Refinement</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Demo Notice Banner */}
      {mode === "demo" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Demo Mode Active:</strong> Displaying simulated optimization metrics. Switch
              to Live API in Settings or test with custom inputs.
            </span>
          </div>
          <Link
            to="/settings"
            className="font-semibold underline underline-offset-2 hover:opacity-80"
          >
            Configure backend →
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      {loadingSummary || !summary ? (
        <LoadingSkeleton variant="cards" rows={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Total Experiments"
            value={fmtNum(summary.totals.experiments)}
            delta={summary.deltas.experiments}
            tip="Total number of optimization experiments executed across all models and tasks."
            icon={FlaskConical}
          />
          <MetricCard
            label="Avg Quality Score"
            value={`${summary.totals.avgQuality} / 100`}
            delta={summary.deltas.avgQuality}
            tip="Mean post-optimization response quality score across benchmark suites."
            icon={Gauge}
          />
          <MetricCard
            label="Tokens Saved"
            value={fmtNum(summary.totals.tokensSaved)}
            delta={summary.deltas.tokensSaved}
            tip="Aggregate reduction in prompt and completion tokens achieved via prompt compression."
            icon={Zap}
          />
          <MetricCard
            label="Average Latency"
            value={fmtMs(summary.totals.avgLatencyMs)}
            delta={summary.deltas.avgLatencyMs}
            invert
            tip="Average round-trip execution latency for optimized prompts and queries."
            icon={Clock}
          />
          <MetricCard
            label="Estimated Cost"
            value={fmtUsd(summary.totals.estimatedCostUsd)}
            delta={summary.deltas.estimatedCostUsd}
            invert
            tip="Total estimated API token expenditure across active models."
            icon={DollarSign}
          />
          <MetricCard
            label="Success Rate"
            value={`${summary.totals.successRate}%`}
            delta={summary.deltas.successRate}
            tip="Percentage of optimizations that improved benchmark scores over baseline without semantic regression."
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Dashboard Charts Grid */}
      {loadingSummary || !summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingSkeleton variant="chart" />
          <LoadingSkeleton variant="chart" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Chart 1: Quality Over Time */}
          <ChartCard
            title="Response Quality Over Time"
            description="Comparing baseline vs. optimized quality scores (0–100)"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={summary.quality}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="date" stroke={chartColors.axis} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={chartColors.axis}
                  fontSize={11}
                  domain={[40, 100]}
                  tickLine={false}
                />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="Baseline Score"
                  stroke={chartColors.axis}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="optimized"
                  name="Optimized Score"
                  stroke={chartColors.c1}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 5: Optimization Distribution */}
          <ChartCard
            title="Optimization Distribution"
            description="Task breakdown across Prompt, Search, RAG & SQL"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.distribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
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
                  formatter={(value, entry: { payload?: { value?: number } }) =>
                    `${value}: ${entry?.payload?.value ?? ""}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2: Latency Comparison */}
          <ChartCard
            title="Latency Comparison (ms)"
            description="Baseline vs. optimized execution turnaround"
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
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
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

          {/* Chart 3: Token Usage Over Time */}
          <ChartCard
            title="Token Consumption"
            description="Input and output volume across optimization runs"
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
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                <Area
                  type="monotone"
                  dataKey="input"
                  name="Input Tokens"
                  stackId="1"
                  stroke={chartColors.c1}
                  fill={chartColors.c1}
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="output"
                  name="Output Tokens"
                  stackId="1"
                  stroke={chartColors.c3}
                  fill={chartColors.c3}
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 4: Cost Analysis */}
          <ChartCard
            title="Cost Analysis ($)"
            description="Estimated API expenditure per recent experiment"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.cost} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="name" stroke={chartColors.axis} fontSize={11} tickLine={false} />
                <YAxis stroke={chartColors.axis} fontSize={11} tickLine={false} />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: unknown) => [`$${val}`, "Cost"]}
                />
                <Bar dataKey="cost" name="Cost ($)" fill={chartColors.c4} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Recent Experiments Section */}
      <Card className="p-4 shadow-none sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Recent Experiments</h3>
            <p className="text-xs text-muted-foreground">
              Review and manage benchmarks, rerun optimizations, or inspect evaluation diffs.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/experiments">View All Experiments</Link>
          </Button>
        </div>

        {/* Filter Toolbar */}
        <FilterToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search by name, ID or model…"
          filters={[
            {
              key: "task",
              label: "Task",
              value: taskFilter,
              options: [
                { value: "prompt", label: "Prompt" },
                { value: "search", label: "Search" },
                { value: "rag", label: "RAG" },
                { value: "sql", label: "SQL" },
              ],
              onChange: setTaskFilter,
            },
            {
              key: "status",
              label: "Status",
              value: statusFilter,
              options: [
                { value: "completed", label: "Completed" },
                { value: "running", label: "Running" },
                { value: "queued", label: "Queued" },
                { value: "failed", label: "Failed" },
                { value: "draft", label: "Draft" },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />

        {/* Experiments Table */}
        {loadingExp ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : filteredExperiments.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No experiments found"
            description={
              search || taskFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "Create your first experiment to begin benchmarking prompt improvements."
            }
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Experiment
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>
                    <SortButton
                      label="Experiment"
                      active={sortBy === "name"}
                      onClick={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>
                    <SortButton
                      label="Baseline"
                      active={sortBy === "baselineScore"}
                      onClick={() => toggleSort("baselineScore")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Optimized"
                      active={sortBy === "optimizedScore"}
                      onClick={() => toggleSort("optimizedScore")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Latency"
                      active={sortBy === "latencyMs"}
                      onClick={() => toggleSort("latencyMs")}
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <SortButton
                      label="Date"
                      active={sortBy === "createdAt"}
                      onClick={() => toggleSort("createdAt")}
                    />
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageExperiments.map((exp) => {
                  const scoreDiff =
                    exp.optimizedScore != null && exp.baselineScore != null
                      ? exp.optimizedScore - exp.baselineScore
                      : null;
                  return (
                    <TableRow key={exp.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                        {exp.id}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedExp(exp)}
                          className="text-left font-medium hover:text-primary hover:underline"
                        >
                          {exp.name}
                        </button>
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {exp.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {TASK_LABEL[exp.taskType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{exp.model}</TableCell>
                      <TableCell className="tabular-nums">
                        {exp.baselineScore != null ? `${exp.baselineScore}` : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {exp.optimizedScore != null ? (
                          <span className="font-medium">
                            {exp.optimizedScore}
                            {scoreDiff != null && (
                              <span
                                className={`ml-1 text-xs ${scoreDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                              >
                                ({scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff})
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {fmtMs(exp.latencyMs)}
                      </TableCell>
                      <TableCell>
                        <ExperimentStatusBadge status={exp.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(exp.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setSelectedExp(exp)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({ to: "/evaluation", search: { id: exp.id } })
                              }
                            >
                              <Gauge className="mr-2 h-4 w-4" />
                              Open in Studio
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => run.mutate(exp.id)}
                              disabled={exp.status === "running"}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {exp.status === "running" ? "Running..." : "Run Again"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicate.mutate(exp.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(exp)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pages={totalPages}
              total={filteredExperiments.length}
              onPage={setPage}
            />
          </div>
        )}
      </Card>

      {/* New Experiment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Experiment</DialogTitle>
            <DialogDescription>
              Set up a benchmark experiment to optimize and evaluate prompts or queries against
              reference datasets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="exp-name">Experiment Name *</Label>
              <Input
                id="exp-name"
                value={newExp.name}
                onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
                placeholder="e.g. Customer Support Triage Optimization"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-desc">Description</Label>
              <Textarea
                id="exp-desc"
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                placeholder="Explain the objective and expected quality criteria..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Task Type</Label>
                <Select
                  value={newExp.taskType}
                  onValueChange={(v: TaskType) => setNewExp({ ...newExp, taskType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prompt">Prompt Optimization</SelectItem>
                    <SelectItem value="search">Search Query</SelectItem>
                    <SelectItem value="rag">RAG Retrieval</SelectItem>
                    <SelectItem value="sql">SQL Query</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Model</Label>
                <ModelSelector
                  value={newExp.model}
                  onChange={(v) => setNewExp({ ...newExp, model: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reference Dataset</Label>
                <Select
                  value={newExp.dataset}
                  onValueChange={(v) => setNewExp({ ...newExp, dataset: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer FAQ v2">Customer FAQ v2</SelectItem>
                    <SelectItem value="SciQA-500">SciQA-500</SelectItem>
                    <SelectItem value="Internal Docs">Internal Docs</SelectItem>
                    <SelectItem value="Northwind SQL">Northwind SQL</SelectItem>
                    <SelectItem value="MS MARCO subset">MS MARCO subset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Optimization Strategy</Label>
                <Select
                  value={newExp.strategy}
                  onValueChange={(v: Strategy) => setNewExp({ ...newExp, strategy: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Balanced">Balanced</SelectItem>
                    <SelectItem value="Quality First">Quality First</SelectItem>
                    <SelectItem value="Low Cost">Low Cost</SelectItem>
                    <SelectItem value="Low Latency">Low Latency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newExp.name.trim() || create.isPending}>
                {create.isPending ? "Creating..." : "Create Experiment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Experiment Details Dialog */}
      <Dialog open={!!selectedExp} onOpenChange={(o) => !o && setSelectedExp(null)}>
        {selectedExp && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedExp.id}
                </Badge>
                <ExperimentStatusBadge status={selectedExp.status} />
              </div>
              <DialogTitle className="mt-1">{selectedExp.name}</DialogTitle>
              <DialogDescription>{selectedExp.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/20">
                <div>
                  <span className="text-xs text-muted-foreground">Task Type</span>
                  <p className="font-medium capitalize">{TASK_LABEL[selectedExp.taskType]}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Target Model</span>
                  <p className="font-mono font-medium">{selectedExp.model}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Reference Dataset</span>
                  <p className="font-medium">{selectedExp.dataset}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Optimization Strategy</span>
                  <p className="font-medium">{selectedExp.strategy}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2.5">
                  <span className="text-xs text-muted-foreground">Baseline Score</span>
                  <p className="text-lg font-semibold">{selectedExp.baselineScore ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-2.5 bg-accent/20">
                  <span className="text-xs text-muted-foreground">Optimized Score</span>
                  <p className="text-lg font-semibold text-primary">
                    {selectedExp.optimizedScore ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <span className="text-xs text-muted-foreground">Latency</span>
                  <p className="text-lg font-semibold">{fmtMs(selectedExp.latencyMs)}</p>
                </div>
              </div>

              {selectedExp.status === "running" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Optimization Progress</span>
                    <span>{selectedExp.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${selectedExp.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = selectedExp.id;
                  setSelectedExp(null);
                  navigate({ to: "/evaluation", search: { id } });
                }}
              >
                <Gauge className="mr-1.5 h-4 w-4" />
                Open in Evaluation Studio
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    run.mutate(selectedExp.id);
                    setSelectedExp(null);
                  }}
                  disabled={selectedExp.status === "running"}
                >
                  <Play className="mr-1.5 h-4 w-4" />
                  Rerun
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete Experiment ${deleteTarget?.id}?`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Experiment"
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
