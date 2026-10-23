import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, HelpCircle, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  delta,
  tip,
  icon: Icon,
  invert = false,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  tip: string;
  icon?: LucideIcon;
  invert?: boolean;
}) {
  const good = delta == null ? null : invert ? delta < 0 : delta > 0;
  return (
    <Card className="gap-0 rounded-xl p-4 shadow-none glow-card transition-all hover:shadow-sm">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          {Icon && <Icon className="h-4 w-4 text-primary" />} {label}
        </span>
        <Tooltip>
          <TooltipTrigger aria-label={`About ${label}`}>
            <HelpCircle className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{tip}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</div>
      {delta != null && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            good ? "text-success" : "text-destructive",
          )}
        >
          {delta >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {Math.abs(delta).toFixed(1)}%{" "}
          <span className="text-muted-foreground font-normal">vs previous period</span>
        </div>
      )}
    </Card>
  );
}

export function ChartCard({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 rounded-xl p-4 shadow-none glow-card transition-all", className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="h-60 w-full">{children}</div>
    </Card>
  );
}

export const chartColors = {
  c1: "var(--color-chart-1)",
  c2: "var(--color-chart-2)",
  c3: "var(--color-chart-3)",
  c4: "var(--color-chart-4)",
  c5: "var(--color-chart-5)",
  grid: "var(--color-border)",
  axis: "var(--color-muted-foreground)",
};
export const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};
