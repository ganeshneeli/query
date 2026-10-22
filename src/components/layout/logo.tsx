import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("h-7 w-7 shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <g className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round">
        <line x1="10" y1="11" x2="16" y2="16" />
        <line x1="22" y1="10" x2="16" y2="16" />
        <line x1="16" y1="16" x2="16" y2="23" />
      </g>
      <circle cx="10" cy="11" r="2.4" className="fill-primary-foreground" />
      <circle cx="22" cy="10" r="2.4" className="fill-primary-foreground" />
      <circle cx="16" cy="23" r="2.4" className="fill-primary-foreground" />
      <circle cx="16" cy="16" r="3" className="fill-success" />
    </svg>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      {!collapsed && (
        <span className="text-base font-semibold tracking-tight">
          Prompt<span className="text-primary">IQ</span>
        </span>
      )}
    </div>
  );
}
