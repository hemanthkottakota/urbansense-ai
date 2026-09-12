import { useMemo, useState } from "react";
import { useSim } from "@/state/sim-context";
import {
  SectionTitle,
  SeverityBadge,
  StatusChip,
  ConfirmBuses,
} from "@/components/urban/shared";
import {
  ISSUE_STATUS_LABEL,
  ISSUE_STATUS_ORDER,
  DEFECT_META,
  type Issue,
} from "@/lib/sim-engine";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock, Wrench } from "lucide-react";

const DEPT_SHORT: Record<string, string> = {
  "Roads & Buildings Dept": "R&B",
  "Greater City Municipal Corp": "GCMC",
  "Traffic Police": "TP",
  "Storm-Water Division": "SWD",
  "Signals & Signage Cell": "SSC",
};

export default function Maintenance() {
  const { issues } = useSim();
  const [selected, setSelected] = useState<Issue | null>(null);

  const tickets = useMemo(
    () => [...issues].sort((a, b) => b.confirmingBuses.length - a.confirmingBuses.length),
    [issues],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of ISSUE_STATUS_ORDER) m.set(s, 0);
    for (const i of issues) m.set(i.status, (m.get(i.status) ?? 0) + 1);
    return m;
  }, [issues]);

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 5 });
  const dayMs = 24 * 3600 * 1000;
  const now = Date.now();

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Maintenance Workflow</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Detected → Verified → Prioritized → Assigned → Repairing → AI Re-check → Closed
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wrench className="size-4" />
          {issues.filter((i) => ["assigned", "repairing"].includes(i.status)).length} active work orders
        </div>
      </div>

      {/* workflow board */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        {ISSUE_STATUS_ORDER.map((status, idx) => {
          const list = issues.filter((i) => i.status === status);
          const isLast = idx === ISSUE_STATUS_ORDER.length - 1;
          return (
            <div
              key={status}
              className={cn(
                "rounded-xl border bg-card px-3.5 py-3",
                isLast
                  ? "border-[var(--brand-green)]/40 bg-[var(--brand-green-soft)]/40"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                  {ISSUE_STATUS_LABEL[status]}
                </p>
                <span
                  className={cn(
                    "font-mono-tech text-sm font-bold tabular-nums",
                    isLast ? "text-[var(--brand-green)]" : "text-foreground",
                  )}
                >
                  {list.length}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {list.slice(0, 3).map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setSelected(i)}
                    className="block w-full truncate rounded-md bg-muted/70 px-2 py-1 text-left text-[10.5px] font-medium hover:bg-muted"
                  >
                    {DEFECT_META[i.type].label} · {i.roadName}
                  </button>
                ))}
                {list.length > 3 && (
                  <p className="px-2 text-[10px] text-muted-foreground">
                    +{list.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* tickets table */}
      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-5 pt-4">
          <SectionTitle
            title="Maintenance Tickets"
            sub="Auto-generated from verified, corroborated detections"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                <th className="px-5 py-2 font-semibold">Ticket</th>
                <th className="px-3 py-2 font-semibold">Issue</th>
                <th className="px-3 py-2 font-semibold">Location</th>
                <th className="px-3 py-2 font-semibold">Severity</th>
                <th className="px-3 py-2 font-semibold">Detected</th>
                <th className="px-3 py-2 font-semibold">Confirmations</th>
                <th className="px-3 py-2 font-semibold">Department</th>
                <th className="px-5 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, idx) => {
                const age = Math.max(0, Math.round((now - t.firstSeen) / dayMs));
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="row-enter cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                    style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
                  >
                    <td className="px-5 py-2.5 font-mono-tech font-semibold">{t.id}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: DEFECT_META[t.type].color }}
                        />
                        {DEFECT_META[t.type].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {t.roadName} · {t.area}
                    </td>
                    <td className="px-3 py-2.5">
                      <SeverityBadge severity={t.severity} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {new Date(t.firstSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      <span className="ml-1 text-[10px]">({age}d ago)</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <ConfirmBuses ids={t.confirmingBuses} />
                    </td>
                    <td className="px-3 py-2.5">
                      {t.assignedDept ? (
                        <span className="flex items-center gap-1.5">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono-tech text-[10px] font-bold">
                            {DEPT_SHORT[t.assignedDept] ?? "DEPT"}
                          </span>
                          <span className="text-muted-foreground">{t.assignedDept}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusChip status={t.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* re-verified repairs spotlight */}
      <section className="mt-4 mb-2 grid grid-cols-1 gap-3 md:grid-cols-3">
        {issues
          .filter((i) => i.recheckVerified)
          .slice(0, 3)
          .map((i) => (
            <button
              key={i.id}
              onClick={() => setSelected(i)}
              className="rounded-xl border border-[var(--brand-green)]/40 bg-[var(--brand-green-soft)]/50 px-4 py-3 text-left transition-colors hover:border-[var(--brand-green)]/70"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--brand-green)]" />
                <p className="text-xs font-bold text-[var(--brand-green)]">
                  Repair Verified by Subsequent Bus
                </p>
              </div>
              <p className="mt-1.5 text-xs font-semibold">{DEFECT_META[i.type].label} · {i.roadName}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Re-scan by {i.recheckByBus} confirmed the defect is cleared — ticket closed
                automatically
              </p>
            </button>
          ))}
      </section>

      {/* detail dialog with workflow timeline */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: DEFECT_META[selected.type].color }}
                  />
                  {selected.id} — {DEFECT_META[selected.type].label}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <Detail k="Location" v={`${selected.roadName} · ${selected.area}`} />
                <Detail k="Severity" v={selected.severity} />
                <Detail k="GPS" v={`${fmt(selected.pos.lat)}, ${fmt(selected.pos.lng)}`} />
                <Detail k="Detection date" v={new Date(selected.firstSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                <Detail k="Confirmations" v={String(selected.confirmingBuses.length)} />
                <Detail k="Department" v={selected.assignedDept ?? "Unassigned"} />
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Workflow progress
                </p>
                <div className="space-y-0">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="relative flex gap-3 pb-3">
                      {i < selected.timeline.length - 1 && (
                        <span className="absolute top-3 left-[5px] h-full w-px bg-border" />
                      )}
                      <span className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-[var(--brand-orange)] bg-background" />
                      <div>
                        <p className="text-xs font-semibold">
                          Day {t.day + 1} · {t.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{t.note}</p>
                      </div>
                    </div>
                  ))}
                  {selected.status === "assigned" && (
                    <div className="relative flex gap-3 pb-1 text-muted-foreground">
                      <span className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/50 bg-background" />
                      <div>
                        <p className="text-xs font-medium">Crew dispatch pending…</p>
                        <p className="flex items-center gap-1 text-[11px]">
                          <Clock className="size-3" /> SLA 72h after assignment
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.08em] text-muted-foreground uppercase">{k}</p>
      <p className="mt-0.5 text-xs font-semibold capitalize">{v}</p>
    </div>
  );
}
