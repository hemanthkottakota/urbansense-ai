import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BusFront,
  Camera,
  CheckCircle2,
  Gauge,
  Map,
  RadioTower,
  ShieldAlert,
  Wrench,
} from "lucide-react";

const PIPELINE = [
  "CAPTURE",
  "DETECT",
  "TRANSMIT",
  "VERIFY",
  "VISUALIZE",
  "PRIORITIZE",
  "ACT",
  "RE-CHECK",
];

const FEATURES = [
  {
    icon: BusFront,
    title: "Fleet as Sensors",
    body: "Every public bus streams camera + GPS edge-AI detections along its route — no new roadside hardware.",
  },
  {
    icon: CheckCircle2,
    title: "Multi-Bus Corroboration",
    body: "Independent buses confirming the same defect auto-raise verification level and AI confidence.",
  },
  {
    icon: Map,
    title: "GIS + Heatmaps",
    body: "Live map of potholes, waterlogging, congestion and safety risk, scored per road segment.",
  },
  {
    icon: Wrench,
    title: "Closed-Loop Maintenance",
    body: "Detected → verified → assigned → repaired → AI re-check by the next passing bus.",
  },
  {
    icon: Gauge,
    title: "Traffic Intelligence",
    body: "Vehicle classification, density and corridor congestion observed continuously, not sampled.",
  },
  {
    icon: ShieldAlert,
    title: "Road Safety",
    body: "Rash driving, hit-and-run tracking and school-zone risk alerts routed to Traffic Police.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <BusFront className="size-4.5" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">UrbanSense AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-[13px]">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="text-[13px]">
              <Link to="/dashboard">
                Open Command Center <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-14 text-center">
        <Badge variant="outline" className="mb-6 rounded-full px-3 py-1 font-mono-tech text-[10px] tracking-[0.16em]">
          SMART INDIA HACKATHON 2026 · PROTOTYPE
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl">
          Every bus is a city sensor.
          <span className="block text-[var(--brand-orange)]">Every road, continuously seen.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
          UrbanSense AI turns the public transport fleet into a moving urban
          intelligence platform — detecting road defects, congestion and safety
          incidents with onboard edge AI, then verifying, prioritizing and closing
          the loop with municipal teams.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-lg px-6">
            <Link to="/dashboard">
              Launch Live Demo <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-lg px-6">
            <Link to="/auth">Judge Sign-In</Link>
          </Button>
        </div>

        {/* pipeline strip */}
        <div className="mt-14 rounded-xl border border-border bg-card px-6 py-4">
          <p className="mb-3 font-mono-tech text-[10px] tracking-[0.18em] text-muted-foreground">
            OPERATING PIPELINE
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {PIPELINE.map((step, i) => (
              <span key={step} className="flex items-center gap-1.5">
                <span className="rounded-md bg-muted px-2.5 py-1 font-mono-tech text-[10px] font-bold tracking-[0.12em] text-foreground">
                  {step}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span className="text-muted-foreground/50">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card px-5 py-5 transition-colors hover:border-foreground/25"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-orange-soft)] text-[var(--brand-orange)]">
                <f.icon className="size-4.5" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* proof strip */}
      <section className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
          {[
            ["12", "sensor buses"],
            ["41 km", "corridors covered"],
            ["2.4 s", "detection → platform"],
            ["94%", "multi-bus precision"],
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-extrabold tabular-nums tracking-tight">{v}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-foreground text-background">
          <Camera className="size-5" />
        </span>
        <h2 className="mx-auto mt-5 max-w-xl text-2xl font-bold tracking-tight">
          See the city the way the fleet sees it
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Start the live simulation and watch detections, corroboration and repair
          verification unfold across the road network.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-lg px-6">
            <Link to="/dashboard">
              Start Live Simulation <RadioTower className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-10 text-[11px] text-muted-foreground/70">
          UrbanSense AI — AI-Powered Mobile Urban Intelligence Platform Using Public
          Transport Fleet. Demo prototype with simulated data only.
        </p>
      </section>
    </div>
  );
}
