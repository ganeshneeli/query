import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-accent p-3 text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { mode, setMode } = useApi();
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="mb-2 h-6 w-6 text-destructive" />
      <h3 className="font-medium">Couldn't load this data</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{msg}</p>
      <div className="mt-4 flex gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Retry
          </Button>
        )}
        {mode === "live" && (
          <Button size="sm" variant="secondary" onClick={() => setMode("demo")}>
            Switch to demo mode
          </Button>
        )}
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  variant = "cards",
  rows = 5,
}: {
  variant?: "cards" | "table" | "chart" | "panel";
  rows?: number;
}) {
  if (variant === "cards")
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  if (variant === "chart") return <Skeleton className="h-64 w-full rounded-xl" />;
  if (variant === "panel")
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    );
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
