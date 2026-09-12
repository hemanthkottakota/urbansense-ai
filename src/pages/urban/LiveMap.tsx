import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSim } from "@/state/sim-context";
import { CityMap, type MapMode } from "@/components/urban/city-map";
import { SectionTitle, ConfirmBuses, SeverityBadge } from "@/components/urban/shared";
import { DEFECT_META, computeRoadHealth } from "@/lib/sim-engine";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/sim-engine";

const MODES: { id: MapMode; label: string }[] = [
  { id: "issues", label: "Live Detections" },
  { id: "health", label: "Health Score" },
  { id: "congestion", label: "Congestion" },
  { id: "risk", label: "Risk Heat" },
];

export default function LiveMap() {
  const { issues, incidents, buses } = useSim();
  const navigate = useNavigate();
  const [mode, setMode] = useState<MapMode>("issues");
  const [selected, setSelected] = useState<Issue | null>(null);

  const health = useMemo(
    () => computeRoadHealth(issues, incidents, new Map()),
    [issues, incidents],
  );

  const sensing = buses.filter((b) => b.status === "sensing").length;

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Live Map</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Full-city GIS · {sensing} buses streaming · {issues.filter((i) => i.status !== "closed").length}{" "}
            active issues
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors",
                mode === m.id && "bg-foreground text-background",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="h-[calc(100vh-190px)] min-h-[480px]">
            <CityMap
              mode={mode}
              issues={issues}
              incidents={incidents}
              buses={buses}
              health={health}
              onSelectIssue={setSelected}
              onSelectBus={(b) => navigate(`/fleet/${b.id}`)}
            />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-card px-4 py-4">
            <SectionTitle title="Legend" sub="Marker categories on the sensing grid" />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(DEFECT_META).map(([key, m]) => (
                <span key={key} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </span>
              ))}
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.4">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                </svg>
                Safety incident
              </span>
              <span className="flex items-center gap-2">
                <span className="flex size-3.5 items-center justify-center rounded-full bg-foreground" />
                Fleet bus
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full border-2 border-[var(--brand-green)]" />
                Repair verified
              </span>
            </div>
          </section>

          {selected ? (
            <section className="rounded-xl border border-border bg-card px-4 py-4 fade-up">
              <div className="flex items-start justify-between">
                <SectionTitle
                  title={DEFECT_META[selected.type].label}
                  sub={selected.roadName}
                />
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Severity</span>
                  <SeverityBadge severity={selected.severity} />
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">AI Confidence</span>
                  <span className="font-mono-tech font-semibold">{selected.confidence}%</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Verification</span>
                  <ConfirmBuses ids={selected.confirmingBuses} />
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Total detections</span>
                  <span className="font-semibold">{selected.detections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize">{selected.status.replace("_", " ")}</span>
                </div>
              </div>
              {selected.confirmingBuses.length > 0 && (
                <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
                  Detecting buses: {selected.confirmingBuses.join(", ")}
                </p>
              )}
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Select a defect marker on the map to inspect verification details.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
