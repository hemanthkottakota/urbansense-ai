import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useSim } from "@/state/sim-context";
import { CityMap } from "@/components/urban/city-map";
import { SectionTitle, LiveDot } from "@/components/urban/shared";
import { DEFECT_META, INCIDENT_META } from "@/lib/sim-engine";
import { ROUTES } from "@/lib/city";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  BusFront,
  Camera,
  Signal,
  Route as RouteIcon,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ------------------------------------------------------------------ fleet list
export function Fleet() {
  const { buses } = useSim();
  const navigate = useNavigate();
  const [routeFilter, setRouteFilter] = useState<string>("all");

  const filtered =
    routeFilter === "all" ? buses : buses.filter((b) => b.routeId === routeFilter);

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bus Fleet</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {buses.length} sensor-equipped buses across {ROUTES.length} routes — every
            vehicle is a moving observation post
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setRouteFilter("all")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium",
              routeFilter === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All routes
          </button>
          {ROUTES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRouteFilter(r.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                routeFilter === r.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-2 rounded-full" style={{ background: r.color }} />
              {r.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((bus) => {
          const on = bus.status === "sensing";
          return (
            <button
              key={bus.id}
              onClick={() => navigate(`/fleet/${bus.id}`)}
              className="rounded-xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-foreground/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      on ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <BusFront className="size-5" />
                  </span>
                  <div>
                    <p className="font-mono-tech text-sm font-bold">{bus.id}</p>
                    <p className="text-[11px] text-muted-foreground">{bus.routeName}</p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "rounded-md border-transparent",
                    on
                      ? "bg-[var(--brand-green-soft)] text-[var(--brand-green)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {bus.status}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                <div>
                  <p className="font-mono-tech text-sm font-bold tabular-nums">{bus.speed}</p>
                  <p className="text-[10px] text-muted-foreground">km/h</p>
                </div>
                <div>
                  <p className="font-mono-tech text-sm font-bold tabular-nums">{bus.detectionsToday}</p>
                  <p className="text-[10px] text-muted-foreground">detections today</p>
                </div>
                <div>
                  <p className="font-mono-tech text-sm font-bold tabular-nums">{bus.detectionsTotal}</p>
                  <p className="text-[10px] text-muted-foreground">lifetime</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="size-3" />
                <span className="font-mono-tech">
                  {bus.pos.lat.toFixed(4)}, {bus.pos.lng.toFixed(4)}
                </span>
              </p>
            </button>
          );
        })}
      </div>
    </main>
  );
}

// ------------------------------------------------------------------ bus detail
export function BusDetail() {
  const { busId } = useParams();
  const { buses, issues, incidents } = useSim();
  const navigate = useNavigate();
  const bus = buses.find((b) => b.id === busId);

  if (!bus) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Bus not found in the live fleet.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/fleet")}>
          <ArrowLeft className="size-4" /> Back to fleet
        </Button>
      </main>
    );
  }

  const routeIssues = issues.filter((i) => i.confirmingBuses.includes(bus.id));
  const busIncidents = incidents.filter((i) => i.busId === bus.id);
  const on = bus.status === "sensing";

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <button
        onClick={() => navigate("/fleet")}
        className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Bus Fleet
      </button>

      {/* header card */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex size-14 items-center justify-center rounded-xl",
                on ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
              )}
            >
              <BusFront className="size-7" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-mono-tech text-xl font-bold">{bus.id}</h1>
                <Badge
                  className={cn(
                    "gap-1.5 rounded-md border-transparent",
                    on
                      ? "bg-[var(--brand-green-soft)] text-[var(--brand-green)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <LiveDot on={on} label={bus.status.toUpperCase()} />
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RouteIcon className="size-3.5" /> {bus.routeName}
                </span>
                <span className="font-mono-tech">Reg: {bus.reg}</span>
                <span>{bus.speed} km/h</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat
              icon={<Camera className="size-4" />}
              label="Camera"
              value={bus.cameraOk ? "Online" : "Fault"}
              ok={bus.cameraOk}
            />
            <MiniStat
              icon={<Signal className="size-4" />}
              label="LTE Connectivity"
              value={bus.lteOk ? "Strong" : "Weak"}
              ok={bus.lteOk}
            />
            <MiniStat
              icon={<BusFront className="size-4" />}
              label="Detections Today"
              value={String(bus.detectionsToday)}
              ok
            />
            <MiniStat
              icon={<MapPin className="size-4" />}
              label="GPS"
              value={`${bus.pos.lat.toFixed(4)}, ${bus.pos.lng.toFixed(4)}`}
              ok
              mono
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px]">
        {/* route map + history */}
        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-4 pt-4">
              <SectionTitle
                title="Live Position on Route"
                sub={`${bus.routeName} · heading ${Math.round(bus.heading)}° · ${on ? "sensing" : "not sensing"}`}
              />
            </div>
            <div className="h-80">
              <CityMap
                issues={issues}
                incidents={incidents}
                buses={[bus]}
                mode="issues"
                onSelectBus={() => {}}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card px-5 py-4">
            <SectionTitle title="Route History" sub="Recent observations along the assigned corridor" />
            <div className="space-y-2.5">
              {[
                `Departed ${ROUTES.find((r) => r.id === bus.routeId)?.stops[0]?.name ?? "terminus"}`,
                ...busIncidents.slice(0, 2).map(
                  (i) => `${INCIDENT_META[i.type].label} observed near ${i.roadName ?? i.area}`,
                ),
                ...routeIssues.slice(0, 3).map(
                  (i) => `${DEFECT_META[i.type].label} re-sampled on ${i.roadName}`,
                ),
                `Approaching ${ROUTES.find((r) => r.id === bus.routeId)?.stops[1]?.name ?? "next stop"}`,
              ].map((line, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-border/50 pb-2 last:border-0">
                  <span className="font-mono-tech text-[10px] text-muted-foreground">
                    {String(18 - i).padStart(2, "0")}:{String((bus.detectionsToday * 7 + i * 13) % 60).padStart(2, "0")}
                  </span>
                  <span className="text-xs">{line}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* detections + incidents */}
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-card px-5 py-4">
            <SectionTitle title="Recent Detections" sub="Road issues confirmed by this bus" />
            {routeIssues.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No corroboration credits yet this shift.
              </p>
            ) : (
              <div className="space-y-2">
                {routeIssues.slice(0, 6).map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-xs font-medium">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: DEFECT_META[i.type].color }}
                      />
                      {DEFECT_META[i.type].label}
                      <span className="text-muted-foreground">· {i.roadName}</span>
                    </span>
                    <span className="font-mono-tech text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {i.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card px-5 py-4">
            <SectionTitle title="Traffic Observations" sub="Latest edge-AI snippets from this vehicle" />
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Last detection</span>
                <span className="font-semibold">{bus.lastDetection}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Avg observed speed</span>
                <span className="font-semibold">{bus.speed} km/h</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Corridor congestion</span>
                <span className="font-semibold">{Math.round(30 + (bus.detectionsToday * 3) % 55)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Incidents reported</span>
                <span className="font-semibold">{busIncidents.length}</span>
              </div>
            </div>
          </section>

          {busIncidents.length > 0 && (
            <section className="rounded-xl border border-border bg-card px-5 py-4">
              <SectionTitle title="Recent Incidents" sub="Safety events captured by this bus" />
              <div className="space-y-2">
                {busIncidents.slice(0, 4).map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                  >
                    <span className="text-xs font-medium">{INCIDENT_META[inc.type].label}</span>
                    <span className="font-mono-tech text-[11px] text-muted-foreground">
                      {new Date(inc.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function MiniStat({
  icon,
  label,
  value,
  ok,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xs font-bold",
          mono && "font-mono-tech",
          ok ? "text-foreground" : "text-[var(--brand-red)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
