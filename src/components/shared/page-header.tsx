import type { ReactNode } from "react";
import { FlaskConical, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScoreSource } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-warning/50 bg-warning/10 text-warning-foreground dark:text-warning",
            className,
          )}
        >
          <FlaskConical className="h-3 w-3" /> Demo data
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Simulated values for interface preview. These are not measured results.
      </TooltipContent>
    </Tooltip>
  );
}

const SOURCE: Record<ScoreSource, { label: string; tip: string; cls: string }> = {
  llm_judge: {
    label: "LLM judge",
    tip: "Scored by a language model. Useful signal, not verified ground truth.",
    cls: "border-primary/40 text-primary",
  },
  deterministic: {
    label: "Deterministic",
    tip: "Computed by a reproducible test or metric.",
    cls: "border-success/50 text-success",
  },
  human: {
    label: "Human rating",
    tip: "Provided by human reviewers.",
    cls: "border-chart-4/50 text-chart-4",
  },
  heuristic: {
    label: "Heuristic",
    tip: "Rule-based estimate computed in the browser. Not an LLM measurement.",
    cls: "border-muted-foreground/40 text-muted-foreground",
  },
};

export function SourceBadge({ source }: { source: ScoreSource }) {
  const s = SOURCE[source];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn("gap-1 font-normal", s.cls)}>
          <Info className="h-3 w-3" /> {s.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{s.tip}</TooltipContent>
    </Tooltip>
  );
}
