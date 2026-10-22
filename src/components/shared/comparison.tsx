import { useMemo, useState } from "react";
import { Copy, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { diffWords } from "@/lib/diff";
import { copyText, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DiffView({ a, b, className }: { a: string; b: string; className?: string }) {
  const parts = useMemo(() => diffWords(a, b), [a, b]);
  return (
    <pre
      className={cn(
        "whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      {parts.map((p, i) => (
        <span
          key={i}
          className={cn(
            p.type === "added" && "rounded-sm bg-success/15 text-success",
            p.type === "removed" && "rounded-sm bg-destructive/10 text-destructive line-through",
          )}
        >
          {p.text}
        </span>
      ))}
    </pre>
  );
}

export function ComparisonPanel({
  original,
  optimized,
  leftLabel = "Original",
  rightLabel = "Optimized",
}: {
  original: string;
  optimized: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const [view, setView] = useState("side");
  const copy = async (t: string, l: string) => {
    await copyText(t);
    toast.success(`${l} copied`);
  };
  return (
    <div className="space-y-3">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && setView(v)}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="side">Side by side</ToggleGroupItem>
        <ToggleGroupItem value="diff">Highlighted diff</ToggleGroupItem>
      </ToggleGroup>
      {view === "diff" ? (
        <DiffView a={original} b={optimized} className="max-h-96 overflow-auto" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [leftLabel, original],
            [rightLabel, optimized],
          ].map(([l, t]) => (
            <div key={l} className="min-w-0">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                {l}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label={`Copy ${l}`}
                  onClick={() => copy(t ?? "", l ?? "")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                {t || "—"}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QualityScoreCard({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after?: number;
}) {
  const d = after != null ? after - before : null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {before}
          {after != null && (
            <>
              {" "}
              → <span className="font-medium text-foreground">{after}</span>
            </>
          )}
          {d != null && d !== 0 && (
            <span className={cn("ml-1 text-xs", d > 0 ? "text-success" : "text-destructive")}>
              {d > 0 ? "+" : ""}
              {d}
            </span>
          )}
        </span>
      </div>
      <Progress value={after ?? before} className="h-1.5" />
    </div>
  );
}

export function MetricBreakdown({
  items,
}: {
  items: { label: string; before: number; after?: number }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <QualityScoreCard key={i.label} {...i} />
      ))}
    </div>
  );
}

export interface Version {
  id: string;
  label: string;
  text: string;
  createdAt: string;
}
export function VersionHistoryDrawer({
  versions,
  onRestore,
}: {
  versions: Version[];
  onRestore: (v: Version) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-1 h-4 w-4" />
          Versions{" "}
          <Badge variant="secondary" className="ml-1">
            {versions.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Saved versions in this session. Restore one into the editor.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          {versions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No versions saved yet. Use "Save as version" after optimizing.
            </p>
          )}
          {[...versions].reverse().map((v) => (
            <Card key={v.id} className="gap-2 p-3 shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{v.label}</span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(v.createdAt)}</span>
              </div>
              <p className="line-clamp-3 font-mono text-xs text-muted-foreground">{v.text}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onRestore(v);
                  setOpen(false);
                }}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Restore
              </Button>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
