import { useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ExperimentStatus } from "@/lib/api/types";
import { downloadFile, toCsv } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ExportMenu({
  rows,
  filename,
  label = "Export",
}: {
  rows: Record<string, unknown>[];
  filename: string;
  label?: string;
}) {
  const run = (kind: "csv" | "json") => {
    if (!rows.length) {
      toast.error("Nothing to export");
      return;
    }
    if (kind === "csv") downloadFile(`${filename}.csv`, toCsv(rows));
    else downloadFile(`${filename}.json`, JSON.stringify(rows, null, 2), "application/json");
    toast.success(`Exported ${rows.length} rows as ${kind.toUpperCase()}`);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("csv")}>Download CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("json")}>Download JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const STATUS: Record<ExperimentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-secondary text-secondary-foreground",
  running: "bg-accent text-accent-foreground",
  paused: "bg-warning/15 text-warning-foreground dark:text-warning",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};
export function ExperimentStatusBadge({ status }: { status: ExperimentStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent capitalize", STATUS[status])}>
      {status === "running" && (
        <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {status}
    </Badge>
  );
}

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}
export function FilterToolbar({
  search,
  onSearch,
  placeholder = "Search…",
  filters = [],
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {filters.map((f) => (
        <Select key={f.key} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger aria-label={f.label} className="sm:w-40">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {children}
    </div>
  );
}

export function SortButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

export function TablePagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
      <span>
        {total} result{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FeedbackControl({
  onSubmit,
}: {
  onSubmit: (rating: "up" | "down", comment: string) => Promise<void> | void;
}) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Was this result useful?</span>
        <Button
          size="icon"
          variant={rating === "up" ? "default" : "outline"}
          className="h-8 w-8"
          aria-label="Helpful"
          onClick={() => setRating("up")}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={rating === "down" ? "default" : "outline"}
          className="h-8 w-8"
          aria-label="Not helpful"
          onClick={() => setRating("down")}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
      {rating && (
        <div className="flex gap-2">
          <Textarea
            aria-label="Feedback comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className="min-h-9"
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit(rating, comment);
                toast.success("Feedback submitted");
                setRating(null);
                setComment("");
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
