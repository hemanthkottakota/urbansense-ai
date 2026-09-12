import { useMemo } from "react";
import { useSim } from "@/state/sim-context";
import { KpiCard, SectionTitle } from "@/components/urban/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { congestionByRoad, trafficByHour } from "@/lib/sim-engine";
import { Car, Bike, BusFront, Truck, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

function congestionColor(v: number): string {
  if (v >= 75) return "#dc2626";
  if (v >= 55) return "#ea580c";
  if (v >= 35) return "#b45309";
  return "#16a34a";
}

export default function Traffic() {
  const { traffic, clockHour } = useSim();

  const hourly = useMemo(() => trafficByHour(clockHour), [clockHour]);
  const byRoad = useMemo(() => congestionByRoad(clockHour), [clockHour]);

  const mixIcons: Record<string, typeof Car> = {
    Cars: Car,
    Bikes: Bike,
    Buses: BusFront,
    Trucks: Truck,
    Autos: Car,
  };

  const level =
    traffic.density >= 75
      ? "Severe"
      : traffic.density >= 55
        ? "High"
        : traffic.density >= 35
          ? "Moderate"
          : "Free flow";

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Traffic Intelligence</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Fleet-observed traffic density, vehicle classification and corridor
            congestion — classified by onboard edge AI
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Gauge className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sim clock</span>
          <span className="font-mono-tech text-xs font-bold tabular-nums">
            {String(clockHour).padStart(2, "0")}:00
          </span>
        </div>
      </div>

      {/* live KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Traffic Density"
          value={`${Math.round(traffic.density)}%`}
          sub={level}
          tone={
            traffic.density >= 75
              ? "red"
              : traffic.density >= 55
                ? "orange"
                : "green"
          }
          icon={<Gauge className="size-4" />}
        />
        <KpiCard label="Vehicle Count" value={traffic.vehicles.toLocaleString("en-IN")} sub="observed last window" />
        <KpiCard label="Cars" value={traffic.mix[0].value.toLocaleString("en-IN")} tone="default" icon={<Car className="size-4" />} />
        <KpiCard label="Bikes" value={traffic.mix[1].value.toLocaleString("en-IN")} tone="orange" icon={<Bike className="size-4" />} />
        <KpiCard label="Buses" value={traffic.mix[2].value.toLocaleString("en-IN")} tone="blue" icon={<BusFront className="size-4" />} />
        <KpiCard label="Trucks" value={traffic.mix[3].value.toLocaleString("en-IN")} sub={`Autos: ${traffic.mix[4].value.toLocaleString("en-IN")}`} icon={<Truck className="size-4" />} />
      </div>

      {/* density by hour + avg speed */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Traffic Density by Hour" sub="City-wide index from continuous fleet observations" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#6d7480" }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Bar dataKey="density" radius={[3, 3, 0, 0]}>
                  {hourly.map((h, i) => (
                    <Cell
                      key={i}
                      fill={i === clockHour ? "#ea580c" : "#d8dadd"}
                      stroke={i === clockHour ? "#ea580c" : "none"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Average Speed vs Density" sub="Inverse relationship confirms congestion build-up" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#6d7480" }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10, fill: "#6d7480" }} axisLine={false} tickLine={false} />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="plainline"
                  iconSize={10}
                />
                <Line type="monotone" dataKey="density" name="Density index" stroke="#ea580c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avgSpeed" name="Avg speed (km/h)" stroke="#14161a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* congestion by road + mix */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Congestion by Road" sub="Live corridor congestion index with estimated delay" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRoad} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="road"
                  width={150}
                  tick={{ fontSize: 10.5, fill: "#6d7480" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RTooltip
                  wrapperClassName="!rounded-lg border-border text-xs"
                  formatter={(v: number | string, name: string) =>
                    name === "congestion"
                      ? [`${v}%`, "Congestion"]
                      : [`${v} min`, "Avg delay"]
                  }
                />
                <Bar dataKey="congestion" radius={[0, 4, 4, 0]} barSize={16}>
                  {byRoad.map((r) => (
                    <Cell key={r.road} fill={congestionColor(r.congestion)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <SectionTitle title="Vehicle Classification" sub="Edge AI counts by class across the network" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={traffic.mix} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fontSize: 11, fill: "#6d7480" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RTooltip wrapperClassName="!rounded-lg border-border text-xs" />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                  {traffic.mix.map((m) => (
                    <Cell key={m.name} fill={m.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {byRoad.slice(0, 4).map((r) => (
              <div key={r.road} className="flex items-center justify-between border-t border-border/60 pt-1.5 text-xs">
                <span className="text-muted-foreground">{r.road}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono-tech font-semibold tabular-nums",
                      r.delayMin > 8 ? "text-[var(--brand-red)]" : "text-foreground",
                    )}
                  >
                    +{r.delayMin} min
                  </span>
                  <span className="text-muted-foreground">route delay</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* mix chips */}
      <section className="mt-4 mb-2 flex flex-wrap gap-3 rounded-xl border border-border bg-card px-5 py-4">
        {traffic.mix.map((m) => {
          const Icon = mixIcons[m.name] ?? Car;
          return (
            <span
              key={m.name}
              className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs"
            >
              <Icon className="size-3.5" style={{ color: m.color }} />
              <span className="font-medium">{m.name}</span>
              <span className="font-mono-tech font-semibold tabular-nums">
                {m.value.toLocaleString("en-IN")}
              </span>
            </span>
          );
        })}
      </section>
    </main>
  );
}
