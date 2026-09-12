import { useMemo } from "react";
import { useSim } from "@/state/sim-context";
import { SectionTitle } from "@/components/urban/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DEFECT_META,
  INCIDENT_META,
  computeRoadHealth,
  bandColor,
  trafficByHour,
} from "@/lib/sim-engine";
import { AREAS } from "@/lib/sim-engine";

export default function Analytics() {
  const { issues, incidents, clockHour } = useSim();

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of issues) m.set(i.type, (m.get(i.type) ?? 0) + 1);
    return [...m.entries()].map(([type, count]) => ({
      name: DEFECT_META[type as keyof typeof DEFECT_META].label,
      value: count,
      color: DEFECT_META[type as keyof typeof DEFECT_META].color,
    }));
  }, [issues]);

  const byArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of issues) m.set(i.area, (m.get(i.area) ?? 0) + 1);
    return AREAS.map((a) => ({ area: a as string, defects: m.get(a as string) ?? 0 }))
      .filter((r) => r.defects > 0)
      .sort((a, b) => b.defects - a.defects);
  }, [issues]);

  const incidentsByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of incidents) m.set(i.type, (m.get(i.type) ?? 0) + 1);
    return [...m.entries()].map(([type, count]) => ({
      name: INCIDENT_META[type as keyof typeof INCIDENT_META].label,
      value: count,
      color: INCIDENT_META[type as keyof typeof INCIDENT_META].color,
    }));
  }, [incidents]);

  const health = useMemo(
    () => computeRoadHealth(issues, incidents, new Map()),
    [issues, incidents],
  );

  const congestionTrend = useMemo(
    () =>
      trafficByHour(clockHour).map((t) => ({
        hour: t.hour,
        congestion: t.density,
        incidents: Math.max(0, Math.round(t.density / 18 + (Number(t.hour.slice(0, 2)) % 4 === 0 ? 2 : 0))),
      })),
    [clockHour],
  );

  // response time proxy: days between firstSeen and assignment
  const responseByRoad = useMemo(() => {
    const m = new Map<string, { total: number; n: number }>();
    for (const i of issues) {
      if (!i.assignedAt) continue;
      const days = (i.assignedAt - i.firstSeen) / (24 * 3600 * 1000);
      const e = m.get(i.roadName) ?? { total: 0, n: 0 };
      e.total += days;
      e.n += 1;
      m.set(i.roadName, e);
    }
    return [...m.entries()]
      .map(([road, e]) => ({
        road,
        days: Math.max(0.5, Math.round((e.total / e.n) * 10) / 10),
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 8);
  }, [issues]);

  const verifiedPie = useMemo(() => {
    const verified = issues.filter((i) => i.confirmingBuses.length >= 2).length;
    const single = issues.length - verified;
    return [
      { name: "Multi-bus verified", value: verified, color: "#16a34a" },
      { name: "Single detection", value: single, color: "#d8dadd" },
    ];
  }, [issues]);

  const maintenanceFunnel = useMemo(() => {
    const order = ["verified", "prioritized", "assigned", "repairing", "recheck", "closed"];
    return order.map((s, idx) => ({
      stage: ["Verified", "Prioritized", "Assigned", "Repairing", "Re-check", "Closed"][idx],
      count: issues.filter((i) => order.indexOf(i.status) >= idx && i.status !== "detected").length,
    }));
  }, [issues]);

  const maintenanceCompletion = useMemo(() => {
    const closed = issues.filter((i) => i.status === "closed").length;
    const recheck = issues.filter((i) => i.recheckVerified).length;
    const repaired = issues.filter((i) => i.repairDate !== null).length;
    return [
      { name: "Repaired", value: repaired, color: "#0284c7" },
      { name: "Re-verified", value: recheck, color: "#16a34a" },
      { name: "Closed", value: closed, color: "#14161a" },
    ];
  }, [issues]);

  const totalKm = useMemo(
    () => health.reduce((s, h) => s + h.score, 0) / Math.max(1, health.length),
    [health],
  );

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Cross-corridor performance from simulated 9-day operations window ·
          avg road health {Math.round(totalKm)}/100
        </p>
      </div>

      {/* row 1 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Road Defects by Category" sub="All open + closed detections" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: "#6d7480" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={26}>
                  {byCategory.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Defects by Area" sub="Zone-level hotspots" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byArea} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 6 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="area" width={92} tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Bar dataKey="defects" radius={[0, 4, 4, 0]} barSize={13}>
                  {byArea.map((r) => (
                    <Cell key={r.area} fill="#ea580c" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Verified vs Unverified" sub="Corroboration-driven verification split" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verifiedPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {verifiedPie.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* row 2 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Traffic Congestion Trend" sub="Hourly congestion index with incident overlay" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={congestionTrend} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" iconSize={10} />
                <Line type="monotone" dataKey="congestion" name="Congestion index" stroke="#ea580c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="incidents" name="Incident load" stroke="#14161a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Safety Incidents by Type" sub="Full simulation window" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsByType} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6d7480" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={30}>
                  {incidentsByType.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* row 3 */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Average Response Time" sub="Days from detection to department assignment" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseByRoad} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 6 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="road" width={110} tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" formatter={(v: number) => [`${v} d`, "Avg response"]} />
                <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={13}>
                  {responseByRoad.map((r) => (
                    <Cell key={r.road} fill={r.days > 2.5 ? "#dc2626" : r.days > 1.5 ? "#ea580c" : "#16a34a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Maintenance Funnel" sub="Verified issues progressing through workflow" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceFunnel} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 8.5, fill: "#6d7480" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={26} fill="#14161a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Maintenance Completion" sub="Repairs, AI re-verifications and closures" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maintenanceCompletion}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {maintenanceCompletion.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* health distribution strip */}
      <section className="mt-4 mb-2 rounded-xl border border-border bg-card px-5 py-4">
        <SectionTitle title="Segment Health Distribution" sub="Every scored road segment by band" />
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {(["Good", "Moderate", "Poor", "Critical"] as const).map((band) => {
            const n = health.filter((h) => h.band === band).length;
            const pct = (n / Math.max(1, health.length)) * 100;
            if (n === 0) return null;
            return (
              <div
                key={band}
                className="flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${pct}%`, background: bandColor(band) }}
                title={`${band}: ${n} segments`}
              >
                {n}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          {([
            ["Good", "90–100"],
            ["Moderate", "70–89"],
            ["Poor", "40–69"],
            ["Critical", "0–39"],
          ] as const).map(([band, range]) => (
            <span key={band} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: bandColor(band) }} />
              {band} ({range})
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
