import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  Activity,
  Bell,
  BusFront,
  CircleDot,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  RadioTower,
  ShieldAlert,
  Wrench,
  X,
  BarChart3,
} from "lucide-react";
import { useSim } from "@/state/sim-context";
import { LiveDot } from "@/components/urban/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live-map", label: "Live Map", icon: Map },
  { to: "/road-conditions", label: "Road Conditions", icon: CircleDot },
  { to: "/traffic", label: "Traffic Intelligence", icon: Gauge },
  { to: "/safety", label: "Safety & Incidents", icon: ShieldAlert },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/fleet", label: "Bus Fleet", icon: BusFront },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const KIND_STYLE: Record<string, string> = {
  defect: "border-l-[var(--brand-orange)]",
  corroboration: "border-l-[var(--brand-green)]",
  traffic: "border-l-[var(--brand-blue)]",
  safety: "border-l-[var(--brand-red)]",
  success: "border-l-[var(--brand-green)]",
};

const KIND_ICON: Record<string, typeof Bell> = {
  defect: Wrench,
  corroboration: RadioTower,
  traffic: Gauge,
  safety: ShieldAlert,
  success: Activity,
};

function useOutsideClose(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    if (ref.current) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [ref, cb]);
}

export function AppShell() {
  const { buses, issues, notifications, running, setRunning, unreadCount, markRead, traffic } = useSim();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  useOutsideClose(notifRef, useCallback(() => setNotifOpen(false), []));
  useOutsideClose(profileRef, useCallback(() => setProfileOpen(false), []));

  const activeBuses = useMemo(
    () => buses.filter((b) => b.status === "sensing").length,
    [buses],
  );
  const pendingMaintenance = useMemo(
    () =>
      issues.filter((i) =>
        ["prioritized", "assigned", "repairing"].includes(i.status),
      ).length,
    [issues],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          {/* logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <BusFront className="size-4.5" strokeWidth={2.2} />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-bold tracking-tight">
                UrbanSense&nbsp;AI
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-muted-foreground sm:block">
                MOBILE URBAN INTELLIGENCE · SIH 2026
              </span>
            </span>
          </NavLink>

          <span className="mx-1 hidden h-6 w-px bg-border md:block" />

          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive &&
                      "bg-foreground text-background hover:bg-foreground hover:text-background",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* mobile nav select */}
          <select
            className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs lg:hidden"
            value=""
            onChange={(e) => navigate(e.target.value)}
          >
            <option value="" disabled>
              Go to…
            </option>
            {NAV.map((item) => (
              <option key={item.to} value={item.to}>
                {item.label}
              </option>
            ))}
          </select>
          {/* live cluster */}
          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] sm:inline-flex",
                running
                  ? "bg-[var(--brand-red-soft)] text-[var(--brand-red)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <LiveDot on={running} label={running ? "LIVE" : "PAUSED"} />
            </span>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground md:flex">
              <BusFront className="size-3.5" />
              <span className="tabular-nums font-semibold text-foreground">{activeBuses}</span>
              buses sensing
            </span>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground xl:flex">
              <Activity className="size-3.5" />
              <span className="tabular-nums font-semibold text-foreground">
                {Math.round(traffic.density)}%
              </span>
              density
            </span>

            <Button
              size="sm"
              onClick={() => setRunning(!running)}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-semibold",
                running &&
                  "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange)]/90",
              )}
            >
              <CircleDot className="size-3.5" />
              {running ? "Stop Simulation" : "Start Live Simulation"}
            </Button>

            {/* notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative flex size-9 items-center justify-center rounded-lg hover:bg-muted"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) markRead();
                }}
                aria-label="Notifications"
              >
                <Bell className="size-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--brand-red)] text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-50 mt-1 w-96 overflow-hidden rounded-xl border border-border bg-popover shadow-lg fade-up">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                    <p className="text-xs font-semibold tracking-wide uppercase">
                      Simulated alert feed
                    </p>
                    <button onClick={() => setNotifOpen(false)} aria-label="Close">
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No alerts yet — start the live simulation.
                      </p>
                    )}
                    {notifications.map((n) => {
                      const Icon = KIND_ICON[n.kind] ?? Bell;
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "row-enter flex gap-3 border-b border-border/60 px-4 py-2.5 last:border-0",
                            KIND_STYLE[n.kind],
                          )}
                          style={{ borderLeftWidth: 3, borderLeftStyle: "solid" }}
                        >
                          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-semibold leading-4">{n.text}</p>
                            {n.detail && (
                              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                                {n.detail}
                              </p>
                            )}
                            <p className="mt-0.5 font-mono-tech text-[10px] text-muted-foreground/70">
                              {new Date(n.ts).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* admin */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 rounded-lg py-1.5 pr-2 pl-1.5 hover:bg-muted"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--brand-orange-soft)] text-[11px] font-bold text-[var(--brand-orange)]">
                  {(user?.name ?? "A").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-xs font-semibold sm:block">
                  {user?.name ?? "Admin"}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lg fade-up">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold">{user?.name ?? "Command Center Admin"}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {user?.email ?? "admin@urbansense.gov.in"}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted"
                      onClick={async () => {
                        await signOut();
                        navigate("/");
                      }}
                    >
                      <LogOut className="size-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
