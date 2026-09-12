import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  BusFront,
  RadioTower,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { useSim } from "@/state/sim-context";
import { CityMap } from "@/components/urban/city-map";
import { KpiCard, LiveDot, ConfirmBuses, SectionTitle } from "@/components/urban/shared";
import { DEFECT_META } from "@/lib/sim-engine";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { buses, issues, incidents, running } = useSim();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<(typeof issues)[number] | null>(null);

  const sensing = buses.filter((b) => b.status === "sensing").length;
  const activeIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const pendingMaint = issues.filter((i) =>
    ["prioritized", "assigned", "repairing"].includes(i.status),
  ).length;
  const defects = issues.filter((i) => i.status !== "closed").length;
  const verifiedShare = Math.round(
    (issues.filter((i) => i.confirmingBuses.length >= 2).length /
      Math.max(1, issues.length)) *
      100,
  );

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 5 });

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      {/* header row */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Live Command Center</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Lakshminagar Metropolitan Region · fleet-mounted edge AI sensing the road
            network in real time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              "gap-1.5 rounded-md px-2.5 py-1",
              running
                ? "bg-[var(--brand-red-soft)] text-[var(--brand-red)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            <LiveDot on={running} label={running ? "SIMULATION RUNNING" : "STANDBY"} />
          </Badge>
          <Badge variant="outline" className="rounded-md font-mono-tech text-[11px]">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} IST
          </Badge>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Active Buses"
          value={buses.length}
          sub={`${sensing} currently sensing`}
          icon={<BusFront className="size-4" />}
        />
        <KpiCard
          label="Buses Sensing"
          value={sensing}
          sub="cameras + GPS streaming"
          tone="green"
          icon={<RadioTower className="size-4" />}
        />
        <KpiCard
          label="Road Defects"
          value={defects}
          sub={`${verifiedShare}% multi-bus verified`}
          tone="orange"
          trend={4}
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiCard
          label="Traffic Incidents"
          value={activeIncidents}
          sub="congestion & flow events"
          tone="blue"
          icon={<Wrench className="size-4" />}
        />
        <KpiCard
          label="Safety Alerts"
          value={incidents.filter((i) => i.status !== "resolved").length}
          sub="rash driving, hit-and-run, pedestrian"
          tone="red"
          icon={<ShieldAlert className="size-4" />}
        />
        <KpiCard
          label="Pending Maintenance"
          value={pendingMaint}
          sub="prioritized → repairing"
          icon={<Wrench className="size-4" />}
        />
      </div>

      {/* map + fleet */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <SectionTitle
              title="City Sensing Grid"
              sub="Live detections · fleet positions · corroboration status"
            />
            <div className="flex flex-wrap items-center gap-3 pr-4">
              {Object.values(DEFECT_META).map((m) => (
                <span key={m.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-2 rounded-full bg-[var(--brand-red)]" />
                Safety incident
              </span>
            </div>
          </div>
          <div className="h-[440px]">
            <CityMap
              issues={issues}
              incidents={incidents}
              buses={buses}
              mode="issues"
              onSelectIssue={setSelected}
              onSelectBus={(b) => navigate(`/fleet/${b.id}`)}
            />
          </div>
        </section>

        {/* live fleet panel */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <SectionTitle
              title="Live Bus Fleet"
              sub={`${buses.length} vehicles · ${sensing} streaming edge AI detections`}
            />
          </div>
          <div className="max-h-[470px] flex-1 divide-y divide-border/70 overflow-y-auto">
            {buses.map((bus) => {
              const on = bus.status === "sensing";
              return (
                <button
                  key={bus.id}
                  onClick={() => navigate(`/fleet/${bus.id}`)}
                  className="row-enter flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      on
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <BusFront className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono-tech text-xs font-bold">{bus.id}</span>
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          on ? "bg-[var(--brand-green)]" : "bg-muted-foreground/40",
                        )}
                      />
                      <span className="truncate text-[11px] text-muted-foreground">
                        {bus.routeName}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <MapPin className="size-3" />
                      <span className="font-mono-tech">
                        {bus.pos.lat.toFixed(4)}, {bus.pos.lng.toFixed(4)}
                      </span>
                      <span>· {bus.speed} km/h</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      Last: {bus.lastDetection} · {bus.detectionsToday} detections today
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* corroboration strip */}
      <section className="mt-4 rounded-xl border border-border bg-card px-5 py-4">
        <SectionTitle
          title="Multi-Bus Corroboration"
          sub="Issues confirmed by independent fleet sensors are auto-verified and prioritized"
          right={
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-[var(--brand-green)]" />
              {issues.filter((i) => i.confirmingBuses.length >= 2).length} verified issues
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...issues]
            .sort((a, b) => b.confirmingBuses.length - a.confirmingBuses.length)
            .slice(0, 6)
            .map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelected(issue)}
                className="rounded-lg border border-border/70 p-3 text-left transition-colors hover:border-foreground/25"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{issue.title}</span>
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: DEFECT_META[issue.type].color }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <ConfirmBuses ids={issue.confirmingBuses} />
                  <span className="font-mono-tech text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {issue.confidence}%
                  </span>
                </div>
              </button>
            ))}
        </div>
      </section>

      {/* workflow strip */}
      <section className="mt-4 mb-2 rounded-xl border border-border bg-card px-5 py-4">
        <SectionTitle
          title="Operating Pipeline"
          sub="CAPTURE → DETECT → TRANSMIT → VERIFY → VISUALIZE → PRIORITIZE → ACT → RE-CHECK"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            "CAPTURE",
            "DETECT",
            "TRANSMIT",
            "VERIFY",
            "VISUALIZE",
            "PRIORITIZE",
            "ACT",
            "RE-CHECK",
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono-tech text-[10px] font-bold tracking-[0.12em]",
                  running && i < 5
                    ? "bg-[var(--brand-orange-soft)] text-[var(--brand-orange)]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {step}
              </span>
              {i < arr.length - 1 && (
                <span className="text-muted-foreground/50">→</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* issue detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: DEFECT_META[selected.type].color }}
                  />
                  {DEFECT_META[selected.type].label}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2.5 text-sm">
                <Row k="Road" v={selected.roadName} />
                <Row k="Area" v={selected.area} />
                <Row k="Severity" v={selected.severity} />
                <Row k="AI Confidence" v={`${selected.confidence}%`} />
                <Row k="GPS" v={`${fmt(selected.pos.lat)}, ${fmt(selected.pos.lng)}`} />
                <Row k="Verified by" v={`${selected.confirmingBuses.length} buses`} />
                <Row k="Total detections" v={String(selected.detections)} />
                <Row k="Status" v={selected.status.replace("_", " ")} />
                <Row k="Detecting buses" v={selected.confirmingBuses.join(", ")} />
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
      <span className="text-right text-xs font-semibold capitalize">{v}</span>
    </div>
  );
}
