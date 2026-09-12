import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { routePolyline } from "@/lib/city";
import {
  advanceBus,
  corroborate,
  seedBuses,
  seedIncidents,
  seedIssues,
  simulateDetections,
  vehicleMix,
  type Bus,
  type DefectType,
  type Incident,
  type Issue,
  type Notification,
  type VehicleMixRow,
} from "@/lib/sim-engine";
import { posAlong, NOTIF_TEMPLATES } from "@/lib/sim-engine";

export interface DetectionEvent {
  id: string;
  type: DefectType;
  segmentId: string;
  roadName: string;
  busId: string;
  at: number;
  conf: number;
}

export interface TrafficNow {
  density: number;
  vehicles: number;
  avgSpeed: number;
  mix: VehicleMixRow[];
}

interface SimContextValue {
  buses: Bus[];
  issues: Issue[];
  incidents: Incident[];
  notifications: Notification[];
  feed: DetectionEvent[];
  running: boolean;
  clockHour: number;
  traffic: TrafficNow;
  unreadCount: number;
  setRunning: (v: boolean) => void;
  markRead: () => void;
  busById: (id: string) => Bus | undefined;
}

const SimContext = createContext<SimContextValue | null>(null);

const initialBuses = seedBuses().map((b) => {
  const pts = routePolyline(b.routeId);
  const { pos, heading } = posAlong(pts, b.progress);
  return { ...b, pos, heading };
});

const initialIssues = seedIssues();
const initialIncidents = seedIncidents();

export function SimProvider({ children }: { children: ReactNode }) {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [notifications, setNotifications] = useState<Notification[]>(
    NOTIF_TEMPLATES.slice(0, 5).map((t, i) => ({
      id: `N-seed-${i}`,
      ts: Date.now() - (i + 1) * 4 * 60 * 1000,
      kind: t.kind,
      text: t.text,
      detail: t.detail,
    })),
  );
  const [feed, setFeed] = useState<DetectionEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [clockHour, setClockHour] = useState(18);
  const [traffic, setTraffic] = useState<TrafficNow>({
    density: 62,
    vehicles: 8420,
    avgSpeed: 27,
    mix: vehicleMix(),
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const runningRef = useRef(running);
  runningRef.current = running;
  const busesRef = useRef(buses);
  busesRef.current = buses;
  const issuesRef = useRef(issues);
  issuesRef.current = issues;

  useEffect(() => {
    const t = setInterval(() => {
      if (!runningRef.current) return;
      const now = Date.now();

      // 1. move buses
      setBuses((prev) =>
        prev.map((b) => {
          const pts = routePolyline(b.routeId);
          return advanceBus(b, 1.5, pts);
        }),
      );

      // 2. new edge detections
      const { detections, notifs } = simulateDetections(busesRef.current, now);
      if (detections.length > 0) {
        setFeed((prev) =>
          [
            ...detections.map((d, i) => ({
              id: `D-${now}-${i}`,
              type: d.type,
              segmentId: d.segmentId,
              roadName: d.segmentId.split("-s")[0],
              busId: d.busId,
              at: d.at,
              conf: d.conf,
            })),
            ...prev,
          ].slice(0, 24),
        );
      }
      if (notifs.length > 0) {
        setNotifications((prev) => [...notifs, ...prev].slice(0, 40));
        setUnreadCount((c) => Math.min(99, c + notifs.length));
      }

      // 3. multi-bus corroboration: fold new detections into known issues
      if (detections.length > 0) {
        const groups = corroborate(
          detections.map((d) => ({
            type: d.type,
            segmentId: d.segmentId,
            busId: d.busId,
            at: d.at,
            conf: d.conf,
          })),
        );
        setIssues((prev) =>
          prev.map((iss) => {
            const g = groups.find(
              (x) => x.segmentId === iss.segmentId && x.type === iss.type,
            );
            if (!g) return iss;
            const newBuses = g.buses
              .map((b) => b.busId)
              .filter((id) => !iss.confirmingBuses.includes(id));
            if (newBuses.length === 0) {
              return {
                ...iss,
                detections: iss.detections + 1,
                lastSeen: now,
              };
            }
            const confirmingBuses = [...iss.confirmingBuses, ...newBuses];
            return {
              ...iss,
              detections: iss.detections + newBuses.length,
              confirmingBuses,
              confidence: Math.min(
                99,
                iss.baseConfidence + (confirmingBuses.length - 1) * 4,
              ),
              lastSeen: now,
              status:
                confirmingBuses.length >= 2 && iss.status === "detected"
                  ? "verified"
                  : iss.status,
              timeline:
                confirmingBuses.length >= 2 && iss.status === "detected"
                  ? [
                      ...iss.timeline,
                      {
                        day: 10,
                        label: "Re-sampled",
                        note: "Additional bus confirmed defect during live patrol",
                      },
                    ]
                  : iss.timeline,
            };
          }),
        );
        setBuses((prev) =>
          prev.map((b) =>
            detections.some((d) => d.busId === b.id)
              ? {
                  ...b,
                  detectionsToday: b.detectionsToday + 1,
                  detectionsTotal: b.detectionsTotal + 1,
                }
              : b,
          ),
        );
      }

      // 4. occasional safety incident
      if (Math.random() < 0.1) {
        const bus =
          busesRef.current.filter((b) => b.status === "sensing")[
            Math.floor(Math.random() * 10)
          ];
        if (bus) {
          const types = [
            "rash_driving",
            "pedestrian_risk",
            "school_zone_risk",
            "accident",
            "hit_and_run",
          ] as const;
          const type = types[Math.floor(Math.random() * types.length)];
          const inc: Incident = {
            id: `INC-${now}`,
            type,
            typeName:
              type === "rash_driving"
                ? "Rash Driving"
                : type === "pedestrian_risk"
                  ? "Pedestrian Risk"
                  : type === "school_zone_risk"
                    ? "School-Zone Risk"
                    : type === "accident"
                      ? "Accident"
                      : "Hit-and-Run",
            ts: now,
            roadName: bus.routeName,
            area: "Live patrol corridor",
            pos: bus.pos,
            busId: bus.id,
            vehicleReg: `TS-09-${Math.floor(1000 + Math.random() * 8999)}`,
            vehicleTracked: Math.random() < 0.6,
            vehicleMake: "grey sedan",
            confidence: 78 + Math.floor(Math.random() * 18),
            status: "open",
            severity: type === "accident" || type === "hit_and_run" ? "critical" : "high",
            clipRef: `edge://cam-${bus.id.toLowerCase()}/clip_${Math.floor(10000 + Math.random() * 89999)}`,
          };
          setIncidents((prev) => [inc, ...prev]);
          setNotifications((prev) =>
            [
              {
                        id: `N-${now}-inc`,
                ts: now,
                kind: "safety" as const,
                text:
                  type === "hit_and_run"
                    ? "Hit-and-run vehicle identified"
                    : `${inc.typeName} incident reported`,
                detail: `${bus.id} on ${bus.routeName} — AI confidence ${inc.confidence}%`,
              },
              ...prev,
            ].slice(0, 40),
          );
          setUnreadCount((c) => Math.min(99, c + 1));
        }
      }

      // 5. traffic drift
      setTraffic((prev) => {
        const density = Math.max(
          22,
          Math.min(96, prev.density + (Math.random() * 10 - 4.5)),
        );
        return {
          density,
          vehicles: Math.round(6200 + density * 46),
          avgSpeed: Math.max(9, Math.round(52 - density * 0.4)),
          mix: Math.random() < 0.15 ? vehicleMix() : prev.mix,
        };
      });

      setClockHour((h) => h); // clockHour drifts on a slower cadence below
    }, 1500);
    return () => clearInterval(t);
  }, []);

  // slow clock drift so "by hour" charts breathe during demo
  useEffect(() => {
    const t = setInterval(() => {
      if (runningRef.current) setClockHour((h) => (h % 24) + 1 === 24 ? 0 : h + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const markRead = useCallback(() => setUnreadCount(0), []);
  const busById = useCallback(
    (id: string) => buses.find((b) => b.id === id),
    [buses],
  );

  const value = useMemo<SimContextValue>(
    () => ({
      buses,
      issues,
      incidents,
      notifications,
      feed,
      running,
      clockHour,
      traffic,
      unreadCount,
      setRunning,
      markRead,
      busById,
    }),
    [
      buses,
      issues,
      incidents,
      notifications,
      feed,
      running,
      clockHour,
      traffic,
      unreadCount,
      markRead,
      busById,
    ],
  );

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSim(): SimContextValue {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used within SimProvider");
  return ctx;
}
