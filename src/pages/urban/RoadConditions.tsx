import { useMemo, useState } from "react";
import { useSim } from "@/state/sim-context";
import { CityMap, type MapMode } from "@/components/urban/city-map";
import {
  SectionTitle,
  SeverityBadge,
  StatusChip,
  ConfirmBuses,
} from "@/components/urban/shared";
import {
  bandColor,
  computeRoadHealth,
  DEFECT_META,
  healthBand,
} from "@/lib/sim-engine";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Issue } from "@/lib/sim-engine";

const MODES: { id: MapMode; label: string }[] = [
  { id: "issues", label: "Defects" },
  { id: "health", label: "Health Score" },
  { id: "congestion", label: "Congestion" },
  { id: "risk", label: "Risk Heat" },
];

export default function RoadConditions() {
  const { issues, incidents, buses } = useSim();
  const [mode, setMode] = useState<MapMode>("health");
  const [selected, setSelected] = useState<Issue | null>(null);

  const health = useMemo(
    () => computeRoadHealth(issues, incidents, new Map()),
    [issues, incidents],
  );

  const byRoad = useMemo(() => {
    const m = new Map<string, { scores: number[]; defects: number }>();
    for (const h of health) {
      const e = m.get(h.roadName) ?? { scores: [], defects: 0 };
      e.scores.push(h.score);
      e.defects += h.defectCount;
      m.set(h.roadName, e);
    }
    return [...m.entries()]
      .map(([road, e]) => ({
        road,
        score: Math.round(e.scores.reduce((s, x) => s + x, 0) / e.scores.length),
        defects: e.defects,
      }))
      .sort((a, b) => a.score - b.score);
  }, [health]);

  const bandCounts = useMemo(() => {
    const counts = { Good: 0, Moderate: 0, Poor: 0, Critical: 0 };
    for (const h of health) counts[h.band]++;
    return counts;
  }, [health]);

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 5 });

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Road Condition Map</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            GIS view of road health, congestion and risk — scored per segment from
            defects, severity, detection frequency, traffic and safety risk
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

      {/* band summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["Good", "90–100"],
            ["Moderate", "70–89"],
            ["Poor", "40–69"],
            ["Critical", "0–39"],
          ] as const
        ).map(([band, range]) => (
          <div key={band} className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: bandColor(band) }} />
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase">{band}</p>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{bandCounts[band]}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">segments · score {range}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="h-[520px]">
            <CityMap
              mode={mode}
              issues={issues}
              incidents={incidents}
              buses={buses}
              health={health}
              showBuses={false}
              showRoutes={mode === "issues"}
              onSelectIssue={setSelected}
            />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {/* road health ranking */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-4 pt-4">
              <SectionTitle title="Road Health Score" sub="Lowest first — maintenance priority" />
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {byRoad.map((r) => {
                    const band = healthBand(r.score);
                    return (
                      <tr key={r.road} className="border-t border-border/60">
                        <td className="px-4 py-2 font-medium">{r.road}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                          {r.defects} defects
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className="font-mono-tech text-xs font-bold tabular-nums"
                              style={{ color: bandColor(band) }}
                            >
                              {r.score}
                            </span>
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${r.score}%`, background: bandColor(band) }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* defect chart */}
          <section className="overflow-hidden rounded-xl border border-border bg-card px-4 py-4">
            <SectionTitle title="Defects by Road" sub="Open issues per corridor" />
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byRoad.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="road"
                    width={130}
                    tick={{ fontSize: 10, fill: "#6d7480" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip
                    wrapperClassName="!rounded-lg border-border text-xs"
                    formatter={(v: number) => [v, "Defects"]}
                  />
                  <Bar dataKey="defects" radius={[0, 4, 4, 0]} barSize={14}>
                    {byRoad.slice(0, 8).map((r) => (
                      <Cell key={r.road} fill={bandColor(healthBand(r.score))} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {/* defect register */}
      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-5 pt-4">
          <SectionTitle title="Defect Register" sub="Continuous re-sampling keeps severity and confidence current" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                <th className="px-5 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Location</th>
                <th className="px-3 py-2 font-semibold">Severity</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Buses</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  onClick={() => setSelected(issue)}
                  className="row-enter cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: DEFECT_META[issue.type].color }}
                      />
                      {DEFECT_META[issue.type].label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {issue.roadName} · {issue.area}
                  </td>
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={issue.severity} />
                  </td>
                  <td className="px-3 py-2.5 font-mono-tech tabular-nums">{issue.confidence}%</td>
                  <td className="px-3 py-2.5">
                    <ConfirmBuses ids={issue.confirmingBuses} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusChip status={issue.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* detail dialog with re-sampling timeline */}
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
                  {DEFECT_META[selected.type].label}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Detail k="Defect type" v={DEFECT_META[selected.type].label} />
                <Detail k="Severity" v={selected.severity} />
                <Detail k="AI Confidence" v={`${selected.confidence}%`} />
                <Detail k="Base confidence" v={`${selected.baseConfidence}%`} />
                <Detail k="GPS" v={`${fmt(selected.pos.lat)}, ${fmt(selected.pos.lng)}`} />
                <Detail k="First seen" v={new Date(selected.firstSeen).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                <Detail k="Detecting bus" v={selected.confirmingBuses[0]} />
                <Detail k="Confirming buses" v={String(selected.confirmingBuses.length)} />
                <Detail k="Status" v={selected.status.replace("_", " ")} />
                <Detail k="Department" v={selected.assignedDept ?? "—"} />
              </div>
              <div className="mt-2 rounded-lg bg-[var(--brand-green-soft)] px-3 py-2">
                <p className="text-xs font-semibold text-[var(--brand-green)]">
                  <ConfirmBuses ids={selected.confirmingBuses} />
                </p>
              </div>
              {selected.timeline.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Continuous re-sampling timeline
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
                  </div>
                </div>
              )}
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
