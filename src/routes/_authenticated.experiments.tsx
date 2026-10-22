import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Copy,
  Eye,
  FileDown,
  FlaskConical,
  Gauge,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  StopCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
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
import {
  ConfirmDialog,
  ExperimentStatusBadge,
  ExportMenu,
  FilterToolbar,
  SortButton,
  TablePagination,
} from "@/components/shared/misc";
import { ModelSelector } from "@/components/shared/model-selector";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { useApi } from "@/lib/api";
import { useExperimentMutations, useExperiments } from "@/lib/api/hooks";
import type { CreateExperimentInput, Experiment, Strategy, TaskType } from "@/lib/api/types";
import { fmtDate, fmtMs, fmtNum, fmtUsd, TASK_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/experiments")({
  validateSearch: (search: Record<string, unknown>): {
    new?: boolean | undefined;
    id?: string | undefined;
  } => ({
    new: search["new"] === true || search["new"] === "true" ? true : undefined,
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Experiments — PromptIQ" },
      {
        name: "description",
        content: "Manage, benchmark, and evaluate prompt and query optimization experiments.",
      },
      { property: "og:title", content: "Experiments — PromptIQ" },
      {
        property: "og:description",
        content: "Manage, benchmark, and evaluate prompt and query optimization experiments.",
      },
    ],
  }),
  component: ExperimentsPage,
});

export function ExperimentsPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { mode } = useApi();
  const { data: experiments = [], isLoading, error, refetch } = useExperiments();
  const { create, duplicate, remove, run, status: updateStatus } = useExperimentMutations();

  // Dialog & Details state
  const [createOpen, setCreateOpen] = useState(searchParams.new || false);
  const [detailsTarget, setDetailsTarget] = useState<Experiment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Experiment | null>(null);

  // New Experiment Form
  const [form, setForm] = useState<CreateExperimentInput>({
    name: "",
    description: "",
    taskType: "prompt",
    model: "gpt-4o-mini",
    dataset: "Customer FAQ v2",
    strategy: "Balanced",
  });

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "name" | "baselineScore" | "optimizedScore" | "latencyMs" | "runs"
  >("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Active running experiments count
  const runningCount = experiments.filter((e) => e.status === "running").length;

  // Auto-select experiment if ID passed in query
  useMemo(() => {
    if (searchParams.id && experiments.length) {
      const match = experiments.find((e) => e.id === searchParams.id);
      if (match) setDetailsTarget(match);
    }
  }, [searchParams.id, experiments]);

  const filtered = useMemo(() => {
    let list = [...experiments];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      );
    }
    if (taskFilter !== "all") list = list.filter((e) => e.taskType === taskFilter);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (modelFilter !== "all") list = list.filter((e) => e.model === modelFilter);

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
  }, [experiments, search, taskFilter, statusFilter, modelFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, page, pageSize]);

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
    if (!form.name.trim()) return;
    await create.mutateAsync(form);
    setCreateOpen(false);
    setForm({
      name: "",
      description: "",
      taskType: "prompt",
      model: "gpt-4o-mini",
      dataset: "Customer FAQ v2",
      strategy: "Balanced",
    });
  };

  const exportRows = useMemo(() => {
    return filtered.map((e) => ({
      ID: e.id,
      Name: e.name,
      Task: e.taskType,
      Model: e.model,
      Dataset: e.dataset,
      Strategy: e.strategy,
      Status: e.status,
      Runs: e.runs,
      "Baseline Score": e.baselineScore ?? "",
      "Optimized Score": e.optimizedScore ?? "",
      "Latency (ms)": e.latencyMs ?? "",
      "Tokens Saved": e.tokensSaved ?? "",
      Created: e.createdAt,
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        description="Configure, execute, benchmark, and monitor prompt and query optimization pipelines."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu rows={exportRows} filename="promptiq-experiments" label="Export" />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Experiment
            </Button>
          </div>
        }
      />

      {/* Running Experiment Real-Time Banner */}
      {runningCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-semibold text-primary">
              {runningCount} experiment{runningCount > 1 ? "s" : ""} actively optimizing.
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              Progress updates automatically every 3 seconds. Status will reflect completion once
              the run finishes.
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="p-4 shadow-none sm:p-6 space-y-4">
        {/* Filters */}
        <FilterToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search experiments by name, ID, or description…"
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
                { value: "paused", label: "Paused" },
                { value: "failed", label: "Failed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "draft", label: "Draft" },
              ],
              onChange: setStatusFilter,
            },
            {
              key: "model",
              label: "Model",
              value: modelFilter,
              options: [
                { value: "gpt-4o-mini", label: "gpt-4o-mini" },
                { value: "gpt-4o", label: "gpt-4o" },
                { value: "claude-3.5-sonnet", label: "claude-3.5-sonnet" },
                { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
                { value: "llama-3.1-70b", label: "llama-3.1-70b" },
              ],
              onChange: setModelFilter,
            },
          ]}
        />

        {/* Experiments Table */}
        {isLoading ? (
          <LoadingSkeleton variant="table" rows={8} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No experiments found"
            description="Adjust your search filters or start a new optimization experiment."
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
                  <TableHead className="w-[110px]">Experiment ID</TableHead>
                  <TableHead>
                    <SortButton
                      label="Name & Details"
                      active={sortBy === "name"}
                      onClick={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Target Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <SortButton
                      label="Runs"
                      active={sortBy === "runs"}
                      onClick={() => toggleSort("runs")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Avg Quality"
                      active={sortBy === "optimizedScore"}
                      onClick={() => toggleSort("optimizedScore")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Created"
                      active={sortBy === "createdAt"}
                      onClick={() => toggleSort("createdAt")}
                    />
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((exp) => {
                  const scoreDiff =
                    exp.optimizedScore != null && exp.baselineScore != null
                      ? exp.optimizedScore - exp.baselineScore
                      : null;

                  return (
                    <TableRow key={exp.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {exp.id}
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setDetailsTarget(exp)}
                          className="text-left font-medium hover:text-primary hover:underline block truncate max-w-xs"
                        >
                          {exp.name}
                        </button>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {exp.description}
                        </span>
                        {exp.status === "running" && (
                          <div className="mt-1.5 flex items-center gap-2 max-w-[180px]">
                            <Progress value={exp.progress} className="h-1.5" />
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {exp.progress}%
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {TASK_LABEL[exp.taskType]}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {exp.dataset}
                      </TableCell>

                      <TableCell className="font-mono text-xs">{exp.model}</TableCell>

                      <TableCell>
                        <ExperimentStatusBadge status={exp.status} />
                      </TableCell>

                      <TableCell className="font-mono text-xs tabular-nums">{exp.runs}</TableCell>

                      <TableCell className="tabular-nums">
                        {exp.optimizedScore != null ? (
                          <div className="text-xs font-medium">
                            <span>{exp.optimizedScore}</span>
                            <span className="text-muted-foreground"> / 100</span>
                            {scoreDiff != null && (
                              <span
                                className={`ml-1 text-[11px] ${
                                  scoreDiff > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : scoreDiff < 0
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                }`}
                              >
                                ({scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(exp.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setDetailsTarget(exp)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Inspect Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                navigate({ to: "/evaluation", search: { id: exp.id } })
                              }
                            >
                              <Gauge className="mr-2 h-4 w-4" />
                              Evaluation Studio
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {exp.status === "running" ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: exp.id, status: "paused" })
                                  }
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause Execution
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ id: exp.id, status: "cancelled" })
                                  }
                                >
                                  <StopCircle className="mr-2 h-4 w-4" />
                                  Cancel Experiment
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => run.mutate(exp.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                {exp.status === "paused"
                                  ? "Resume"
                                  : exp.status === "failed"
                                    ? "Retry"
                                    : "Run Optimization"}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={() => duplicate.mutate(exp.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Config
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
              total={filtered.length}
              onPage={setPage}
            />
          </div>
        )}
      </Card>

      {/* Create Experiment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure New Experiment</DialogTitle>
            <DialogDescription>
              Launch an iterative benchmark to test prompt or query modifications against a
              reference evaluation rubric.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-exp-name">Experiment Name *</Label>
              <Input
                id="create-exp-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. LLM Groundedness Benchmark"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-exp-desc">Description</Label>
              <Textarea
                id="create-exp-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Objective, hypothesis, and evaluation constraints..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Task Type</Label>
                <Select
                  value={form.taskType}
                  onValueChange={(v: TaskType) => setForm({ ...form, taskType: v })}
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
                <Label>Target Model</Label>
                <ModelSelector
                  value={form.model}
                  onChange={(v) => setForm({ ...form, model: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Evaluation Dataset</Label>
                <Select
                  value={form.dataset}
                  onValueChange={(v) => setForm({ ...form, dataset: v })}
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
                  value={form.strategy}
                  onValueChange={(v: Strategy) => setForm({ ...form, strategy: v })}
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
              <Button type="submit" disabled={!form.name.trim() || create.isPending}>
                {create.isPending ? "Creating..." : "Save & Launch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Experiment Details Dialog */}
      <Dialog open={!!detailsTarget} onOpenChange={(o) => !o && setDetailsTarget(null)}>
        {detailsTarget && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {detailsTarget.id}
                </Badge>
                <ExperimentStatusBadge status={detailsTarget.status} />
              </div>
              <DialogTitle className="mt-1">{detailsTarget.name}</DialogTitle>
              <DialogDescription>{detailsTarget.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/20">
                <div>
                  <span className="text-xs text-muted-foreground">Task Type</span>
                  <p className="font-medium capitalize">{TASK_LABEL[detailsTarget.taskType]}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Target Model</span>
                  <p className="font-mono font-medium">{detailsTarget.model}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Dataset</span>
                  <p className="font-medium">{detailsTarget.dataset}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Strategy</span>
                  <p className="font-medium">{detailsTarget.strategy}</p>
                </div>
              </div>

              {/* Baseline vs Optimized Score Comparison */}
              <div className="rounded-lg border p-3 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Baseline vs. Optimized Outcomes
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-muted/40 p-2">
                    <span className="text-[11px] text-muted-foreground">Baseline Quality</span>
                    <p className="text-base font-semibold">{detailsTarget.baselineScore ?? "—"}</p>
                  </div>
                  <div className="rounded bg-accent/20 p-2 border border-primary/20">
                    <span className="text-[11px] text-primary">Optimized Quality</span>
                    <p className="text-base font-semibold text-primary">
                      {detailsTarget.optimizedScore ?? "—"}
                    </p>
                  </div>
                  <div className="rounded bg-muted/40 p-2">
                    <span className="text-[11px] text-muted-foreground">Tokens Saved</span>
                    <p className="text-base font-semibold">
                      {fmtNum(detailsTarget.tokensSaved ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {detailsTarget.status === "running" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Active Benchmark Progress</span>
                    <span>{detailsTarget.progress}%</span>
                  </div>
                  <Progress value={detailsTarget.progress} className="h-2" />
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = detailsTarget.id;
                  setDetailsTarget(null);
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
                    run.mutate(detailsTarget.id);
                    setDetailsTarget(null);
                  }}
                  disabled={detailsTarget.status === "running"}
                >
                  <Play className="mr-1.5 h-4 w-4" />
                  Rerun Experiment
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
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All associated run metrics will be permanently cleared.`}
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
