import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import {
  ISSUE_STATUS_LABEL,
  SEVERITY_WEIGHT,
  type IssueStatus,
  type Severity,
} from "@/lib/sim-engine";

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
  trend,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "default" | "orange" | "red" | "green" | "blue";
  trend?: number;
  icon?: ReactNode;
}) {
  const toneCls: Record<string, string> = {
    default: "text-foreground",
    orange: "text-[var(--brand-orange)]",
    red: "text-[var(--brand-red)]",
    green: "text-[var(--brand-green)]",
    blue: "text-[var(--brand-blue)]",
  };
  return (
    <div className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-none">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-bold tabular-nums leading-none",
            toneCls[tone],
          )}
        >
          {value}
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
              trend >= 0 ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]",
            )}
          >
            {trend >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    low: "bg-muted text-muted-foreground border-transparent",
    medium: "bg-[var(--brand-amber-soft)] text-[var(--brand-amber)] border-transparent",
    high: "bg-[var(--brand-orange-soft)] text-[var(--brand-orange)] border-transparent",
    critical: "bg-[var(--brand-red-soft)] text-[var(--brand-red)] border-transparent",
  };
  return (
    <Badge className={cn("rounded-md font-semibold uppercase tracking-wide", map[severity])}>
      {severity}
    </Badge>
  );
}

export function StatusChip({ status }: { status: IssueStatus }) {
  const map: Record<IssueStatus, string> = {
    detected: "bg-muted text-muted-foreground",
    verified: "bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]",
    prioritized: "bg-[var(--brand-orange-soft)] text-[var(--brand-orange)]",
    assigned: "bg-[var(--brand-amber-soft)] text-[var(--brand-amber)]",
    repairing: "bg-[var(--brand-orange-soft)] text-[var(--brand-orange)]",
    recheck: "bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]",
    closed: "bg-[var(--brand-green-soft)] text-[var(--brand-green)]",
  };
  return (
    <Badge className={cn("rounded-md font-medium", map[status])}>
      {ISSUE_STATUS_LABEL[status]}
    </Badge>
  );
}

export function HealthBar({ score, band }: { score: number; band: string }) {
  const color =
    band === "Good"
      ? "var(--brand-green)"
      : band === "Moderate"
        ? "var(--brand-amber)"
        : band === "Poor"
          ? "var(--brand-orange)"
          : "var(--brand-red)";
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-full min-w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {score}
      </span>
      <span className="w-16 text-xs text-muted-foreground">{band}</span>
    </div>
  );
}

export function LiveDot({ on = true, label }: { on?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          on ? "live-ping text-[var(--brand-red)]" : "bg-muted-foreground/40",
        )}
      >
        {!on && <span className="sr-only">offline</span>}
      </span>
      {label && (
        <span className="font-mono-tech text-[10px] font-semibold tracking-[0.14em] uppercase">
          {label}
        </span>
      )}
    </span>
  );
}

export function ConfirmBuses({ ids }: { ids: string[] }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-green-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-green)]">
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {ids.length > 1 ? `Verified by ${ids.length} Buses` : "Single-bus detection"}
    </span>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function severityWeight(s: Severity): number {
  return SEVERITY_WEIGHT[s];
}
