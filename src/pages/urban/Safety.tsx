import { useMemo, useState } from "react";
import { useSim } from "@/state/sim-context";
import { CityMap } from "@/components/urban/city-map";
import { KpiCard, SectionTitle, SeverityBadge } from "@/components/urban/shared";
import { INCIDENT_META, type Incident } from "@/lib/sim-engine";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CarFront,
  ScanLine,
  ShieldAlert,
  Siren,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${Math.max(1, s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[var(--brand-red-soft)] text-[var(--brand-red)]",
  escalated: "bg-[var(--brand-orange-soft)] text-[var(--brand-orange)]",
  resolved: "bg-[var(--brand-green-soft)] text-[var(--brand-green)]",
};

export default function Safety() {
  const { incidents, issues, buses } = useSim();
  const [selected, setSelected] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (filter === "all" ? incidents : incidents.filter((i) => i.type === filter)),
    [incidents, filter],
  );

  const openCount = incidents.filter((i) => i.status === "open").length;
  const escalated = incidents.filter((i) => i.status === "escalated").length;
  const tracked = incidents.filter((i) => i.vehicleTracked).length;
  const hitAndRun = incidents.filter((i) => i.type === "hit_and_run").length;

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Safety &amp; Incidents</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Real-time incident detection from fleet cameras — rash driving, hit-and-run,
          pedestrian and school-zone risk
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Open Incidents" value={openCount} tone="red" icon={<Siren className="size-4" />} />
        <KpiCard label="Escalated" value={escalated} tone="orange" icon={<AlertTriangle className="size-4" />} />
        <KpiCard label="Vehicles Tracked" value={tracked} tone="blue" icon={<ScanLine className="size-4" />} />
        <KpiCard label="Hit-and-Run Cases" value={hitAndRun} tone="red" icon={<CarFront className="size-4" />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_440px]">
        {/* incident feed */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <SectionTitle title="Incident Feed" sub="Newest first · AI-extracted metadata" />
            <div className="flex flex-wrap items-center gap-1 pb-4">
              {["all", ...Object.keys(INCIDENT_META)].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    filter === t
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "all" ? "All" : INCIDENT_META[t as keyof typeof INCIDENT_META].label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[560px] divide-y divide-border/60 overflow-y-auto">
            {filtered.map((inc) => {
              const meta = INCIDENT_META[inc.type];
              return (
                <button
                  key={inc.id}
                  onClick={() => setSelected(inc)}
                  className="row-enter flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span
                    className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${meta.color}14`, color: meta.color }}
                  >
                    <ShieldAlert className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold">{inc.typeName}</span>
                      <SeverityBadge severity={inc.severity} />
                      <Badge className={cn("rounded-md border-transparent font-medium", STATUS_STYLE[inc.status])}>
                        {inc.status}
                      </Badge>
                      {inc.vehicleTracked && (
                        <Badge className="rounded-md border-transparent bg-[var(--brand-blue-soft)] font-medium text-[var(--brand-blue)]">
                          Vehicle Tracked
                        </Badge>
                      )}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {inc.roadName} · {inc.area} · bus {inc.busId} · AI confidence {inc.confidence}%
                    </span>
                    <span className="mt-0.5 block font-mono-tech text-[10px] text-muted-foreground/70">
                      {timeAgo(inc.ts)} · {inc.clipRef}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* map + hit-and-run spotlight */}
        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-4 pt-4">
              <SectionTitle title="Incident Map" sub="Unresolved incidents across the network" />
            </div>
            <div className="h-64">
              <CityMap
                issues={issues}
                incidents={incidents}
                buses={buses}
                mode="risk"
                showBuses={false}
                showRoutes={false}
              />
            </div>
          </section>

          {/* hit-and-run spotlight */}
          {(() => {
            const hnr = incidents.find((i) => i.type === "hit_and_run" && i.status !== "resolved");
            if (!hnr) return null;
            return (
              <section className="rounded-xl border border-[var(--brand-red)]/30 bg-[var(--brand-red-soft)]/60 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Siren className="size-4 text-[var(--brand-red)]" />
                  <p className="text-xs font-bold tracking-[0.08em] text-[var(--brand-red)] uppercase">
                    Hit-and-Run — Active Tracking
                  </p>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--brand-red)]/15 pb-1.5">
                    <span className="text-muted-foreground">Vehicle Tracked</span>
                    <span className="font-semibold">{hnr.vehicleTracked ? "Yes" : "Searching"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--brand-red)]/15 pb-1.5">
                    <span className="text-muted-foreground">Registration Extracted</span>
                    <span className="font-mono-tech font-semibold">{hnr.vehicleReg ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--brand-red)]/15 pb-1.5">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-mono-tech font-semibold">{hnr.confidence}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-semibold">{hnr.roadName}</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
                  ANPR frames from multiple fleet buses matched a partial plate; registration
                  extracted and shared with Traffic Police control room.
                </p>
              </section>
            );
          })()}
        </div>
      </div>

      {/* detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: INCIDENT_META[selected.type].color }}
                  />
                  {selected.typeName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2.5 text-sm">
                <Row k="Time" v={new Date(selected.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
                <Row k="Location" v={`${selected.roadName} · ${selected.area}`} />
                <Row k="Bus ID" v={selected.busId} />
                <Row k="Vehicle Reg" v={selected.vehicleReg ?? "Not captured"} />
                <Row k="Vehicle Tracked" v={selected.vehicleTracked ? "Yes" : "No"} />
                <Row k="AI Confidence" v={`${selected.confidence}%`} />
                <Row k="Status" v={selected.status} />
                <Row k="Evidence clip" v={selected.clipRef} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-1.5">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-right text-xs font-semibold">{v}</span>
    </div>
  );
}
