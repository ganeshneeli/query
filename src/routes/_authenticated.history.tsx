import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  FileDown,
  History,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
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
import { ComparisonPanel } from "@/components/shared/comparison";
import {
  ConfirmDialog,
  ExportMenu,
  FilterToolbar,
  TablePagination,
} from "@/components/shared/misc";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { useApi } from "@/lib/api";
import { useHistory } from "@/lib/api/hooks";
import type { HistoryItem, TaskType } from "@/lib/api/types";
import { copyText, fmtDate, fmtDateTime, TASK_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Optimization History — PromptIQ" },
      {
        name: "description",
        content: "Audit, search, restore, and compare past prompt and query optimization sessions.",
      },
      { property: "og:title", content: "Optimization History — PromptIQ" },
      {
        property: "og:description",
        content: "Audit, search, restore, and compare past prompt and query optimization sessions.",
      },
    ],
  }),
  component: HistoryPage,
});

export function HistoryPage() {
  const navigate = useNavigate();
  const { api } = useApi();
  const qc = useQueryClient();
  const { data: history = [], isLoading, error, refetch } = useHistory();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Selected item modal for full inspection
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // Delete targets
  const [deleteTarget, setDeleteTarget] = useState<HistoryItem | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const filtered = useMemo(() => {
    let list = [...history];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.input.toLowerCase().includes(q) ||
          h.output.toLowerCase().includes(q) ||
          h.id.toLowerCase().includes(q),
      );
    }
    if (taskFilter !== "all") list = list.filter((h) => h.kind === taskFilter);
    if (modelFilter !== "all") list = list.filter((h) => h.model === modelFilter);
    if (statusFilter !== "all") {
      const isSuccess = statusFilter === "success";
      list = list.filter((h) => h.success === isSuccess);
    }
    if (dateFilter !== "all") {
      const now = Date.now();
      const dayMs = 86400000;
      if (dateFilter === "today") {
        list = list.filter((h) => now - new Date(h.createdAt).getTime() <= dayMs);
      } else if (dateFilter === "7d") {
        list = list.filter((h) => now - new Date(h.createdAt).getTime() <= 7 * dayMs);
      } else if (dateFilter === "30d") {
        list = list.filter((h) => now - new Date(h.createdAt).getTime() <= 30 * dayMs);
      }
    }
    return list;
  }, [history, search, taskFilter, modelFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, page, pageSize]);

  const handleDelete = async (id: string) => {
    await api.deleteHistory(id);
    qc.invalidateQueries({ queryKey: ["history"] });
    toast.success("Deleted history entry");
  };

  const handleClearAll = async () => {
    await api.clearHistory();
    qc.invalidateQueries({ queryKey: ["history"] });
    toast.success("History database cleared");
  };

  const handleRestorePrompt = (item: HistoryItem) => {
    copyText(item.output);
    toast.success(`Copied optimized ${item.kind} to clipboard`);
    if (item.kind === "prompt") {
      navigate({ to: "/prompt-lab" });
    } else {
      navigate({ to: "/query-lab" });
    }
  };

  const exportRows = useMemo(() => {
    return filtered.map((h) => ({
      ID: h.id,
      Task: h.kind,
      Title: h.title,
      Model: h.model,
      Status: h.success ? "Success" : "Failed",
      Input: h.input,
      Output: h.output,
      Date: h.createdAt,
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Optimization History"
        description="Audit, search, restore, and compare past prompt and query optimization sessions."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu rows={exportRows} filename="promptiq-history" label="Export" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearConfirm(true)}
              disabled={history.length === 0}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Clear History
            </Button>
          </div>
        }
      />

      <Card className="p-4 shadow-none sm:p-6 space-y-4">
        {/* Filters Toolbar */}
        <FilterToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search by prompt text, title, or keywords…"
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
            {
              key: "status",
              label: "Outcome",
              value: statusFilter,
              options: [
                { value: "success", label: "Successful" },
                { value: "failure", label: "Failed" },
              ],
              onChange: setStatusFilter,
            },
            {
              key: "date",
              label: "Timeframe",
              value: dateFilter,
              options: [
                { value: "today", label: "Today" },
                { value: "7d", label: "Past 7 days" },
                { value: "30d", label: "Past 30 days" },
              ],
              onChange: setDateFilter,
            },
          ]}
        />

        {/* History List */}
        {isLoading ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No optimization history found"
            description={
              search || taskFilter !== "all" || modelFilter !== "all"
                ? "No previous sessions match your filter criteria."
                : "You haven't run any prompt or query optimizations yet. Run an optimization in Prompt Lab or Query Lab to populate history."
            }
            action={
              <Button size="sm" onClick={() => navigate({ to: "/prompt-lab" })}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Go to Prompt Lab
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {paged.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 hover:border-primary/40 hover:bg-muted/20 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs font-medium">
                      {TASK_LABEL[item.kind]}
                    </Badge>
                    <span className="font-semibold text-sm">{item.title}</span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {item.model}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{fmtDateTime(item.createdAt)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-1">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Complete Result
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRestorePrompt(item)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore into Lab
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            copyText(item.output);
                            toast.success("Output copied to clipboard");
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Output
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Input vs Output Preview Snippets */}
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg border bg-muted/30 p-2.5 font-mono line-clamp-3">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Input Spec:
                    </span>
                    {item.input}
                  </div>
                  <div className="rounded-lg border bg-accent/10 border-primary/20 p-2.5 font-mono line-clamp-3">
                    <span className="text-[10px] uppercase font-bold text-primary block mb-1">
                      Optimized Generation:
                    </span>
                    {item.output}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    {item.success ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Optimization Validated
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Optimization Flawed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={() => setSelectedItem(item)}
                    >
                      Compare Diff <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <TablePagination
              page={page}
              pages={totalPages}
              total={filtered.length}
              onPage={setPage}
            />
          </div>
        )}
      </Card>

      {/* Complete Result Inspection Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">
                  {TASK_LABEL[selectedItem.kind]}
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedItem.model}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {fmtDateTime(selectedItem.createdAt)}
                </span>
              </div>
              <DialogTitle className="mt-1">{selectedItem.title}</DialogTitle>
              <DialogDescription>
                Full original input and optimized output comparison for this optimization run.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <ComparisonPanel
                original={selectedItem.input}
                optimized={selectedItem.output}
                leftLabel="Original Input"
                rightLabel="Optimized Result"
              />
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyText(selectedItem.output);
                  toast.success("Output copied to clipboard");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy Output
              </Button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleRestorePrompt(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Restore into Lab
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete History Record?"
        description="Are you sure you want to delete this optimization log? This action cannot be reversed."
        confirmLabel="Delete Record"
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      {/* Clear All Confirmation */}
      <ConfirmDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title="Clear All History?"
        description="Are you sure you want to permanently clear the entire optimization history database?"
        confirmLabel="Clear Everything"
        onConfirm={() => {
          handleClearAll();
          setClearConfirm(false);
        }}
      />
    </div>
  );
}
