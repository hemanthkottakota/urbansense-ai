// UrbanSense AI — simulation engine (demo data only; no real cameras or APIs).
// Fake seeded RNG so every reload shows the same believable city state.
import type { LatLng } from "./city";
import { SEGMENTS, ROUTES, routePolyline } from "./city";

const ROUTES_LIST = ROUTES;

// ---------------------------------------------------------------- seeded rng
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seed = xmur3("urbansense-sih-2026");
const rand = mulberry32(seed());
function rnd() {
  return rand();
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function rint(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function rfloat(min: number, max: number, dp = 1) {
  const f = Math.pow(10, dp);
  return Math.round((rand() * (max - min) + min) * f) / f;
}

// ---------------------------------------------------------------- catalogs
export type DefectType =
  | "pothole"
  | "damaged_road"
  | "waterlogging"
  | "missing_sign"
  | "congestion";

export type IncidentType =
  | "rash_driving"
  | "hit_and_run"
  | "pedestrian_risk"
  | "school_zone_risk"
  | "accident";

export type Severity = "low" | "medium" | "high" | "critical";

export type IssueStatus =
  | "detected"
  | "verified"
  | "prioritized"
  | "assigned"
  | "repairing"
  | "recheck"
  | "closed";

export type IncidentStatus = "open" | "escalated" | "resolved";

export interface Issue {
  id: string;
  type: DefectType;
  title: string;
  segmentId: string;
  roadName: string;
  area: string;
  pos: LatLng;
  severity: Severity;
  confidence: number; // 0-100, corroboration-boosted
  baseConfidence: number;
  status: IssueStatus;
  detections: number; // total raw detection events
  confirmingBuses: string[];
  firstSeen: number; // epoch ms
  lastSeen: number;
  assignedDept: string | null;
  assignedAt: number | null;
  repairDate: number | null; // when repair completed (sim day index)
  recheckVerified: boolean;
  recheckByBus: string | null;
  timeline: { day: number; label: string; note: string }[];
}

export interface Incident {
  id: string;
  type: IncidentType;
  typeName: string;
  ts: number;
  roadName: string;
  area: string;
  pos: LatLng;
  busId: string;
  vehicleReg: string | null;
  vehicleTracked: boolean;
  vehicleMake: string | null;
  confidence: number;
  status: IncidentStatus;
  severity: Severity;
  clipRef: string; // fake edge-AI clip reference
}

export interface Bus {
  id: string;
  reg: string;
  routeId: string;
  routeName: string;
  pos: LatLng;
  heading: number; // deg
  progress: number; // 0..1 along route polyline
  dir: 1 | -1;
  speed: number; // kmph
  status: "sensing" | "offline" | "depot";
  cameraOk: boolean;
  lteOk: boolean;
  detectionsToday: number;
  lastDetection: string;
  detectionsTotal: number;
}

export interface Notification {
  id: string;
  ts: number;
  kind: "defect" | "corroboration" | "traffic" | "safety" | "success";
  text: string;
  detail?: string;
}

export interface TicketRow {
  id: string;
  issueId: string;
  title: string;
  location: string;
  severity: Severity;
  detectedAt: number;
  confirmations: number;
  department: string | null;
  status: IssueStatus;
  ageDays: number;
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  detected: "Detected",
  verified: "Verified",
  prioritized: "Prioritized",
  assigned: "Assigned",
  repairing: "Repairing",
  recheck: "AI Re-check",
  closed: "Closed",
};

export const ISSUE_STATUS_ORDER: IssueStatus[] = [
  "detected",
  "verified",
  "prioritized",
  "assigned",
  "repairing",
  "recheck",
  "closed",
];

export const DEFECT_META: Record<
  DefectType,
  { label: string; color: string; icon: string }
> = {
  pothole: { label: "Pothole", color: "#ea580c", icon: "O" },
  damaged_road: { label: "Damaged Road", color: "#b91c1c", icon: "X" },
  waterlogging: { label: "Waterlogging", color: "#0284c7", icon: "W" },
  missing_sign: { label: "Missing Sign", color: "#b45309", icon: "!" },
  congestion: { label: "Congestion", color: "#7c3aed", icon: "T" },
};

export const INCIDENT_META: Record<
  IncidentType,
  { label: string; color: string }
> = {
  rash_driving: { label: "Rash Driving", color: "#ea580c" },
  hit_and_run: { label: "Hit-and-Run", color: "#dc2626" },
  pedestrian_risk: { label: "Pedestrian Risk", color: "#b45309" },
  school_zone_risk: { label: "School-Zone Risk", color: "#7c3aed" },
  accident: { label: "Accident", color: "#b91c1c" },
};

export const DEPARTMENTS = [
  "Roads & Buildings Dept",
  "Greater City Municipal Corp",
  "Traffic Police",
  "Storm-Water Division",
  "Signals & Signage Cell",
] as const;

export const AREAS = [
  "Kukatpally",
  "Ameerpet",
  "Punjagutta",
  "Banjara Hills",
  "Hitech City",
  "Vidyanagar",
  "Tarnaka",
  "Uppal",
  "Old City",
  "Rethibowli",
] as const;

export const VEHICLE_MAKES = [
  "white sedan",
  "black SUV",
  "blue hatchback",
  "grey temo truck",
  "red motorcycle",
  "silver sedan",
] as const;

export const REG_LETTERS = ["AP", "TS"] as const;
export const REG_DIGITS = [
  "09",
  "07",
  "05",
  "12",
  "13",
  "28",
  "01",
] as const;

export function fakeReg(): string {
  const L = pick(REG_LETTERS);
  const D = pick(REG_DIGITS);
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
  const a = letters[rint(0, letters.length - 1)];
  const b = letters[rint(0, letters.length - 1)];
  const num = rint(1000, 9999);
  return `${L}-${D}-${a}${b}-${num}`;
}

// ---------------------------------------------------------------- world seed
const DEMO_START = Date.now() - 9 * 24 * 3600 * 1000; // "day 1" = 9 days ago

export const BUS_SEED = [
  { id: "LB-101", routeId: "R1", offset: 0.02, dir: 1 },
  { id: "LB-102", routeId: "R2", offset: 0.35, dir: 1 },
  { id: "LB-103", routeId: "R3", offset: 0.55, dir: -1 },
  { id: "LB-104", routeId: "R4", offset: 0.12, dir: 1 },
  { id: "LB-105", routeId: "R5", offset: 0.7, dir: -1 },
  { id: "LB-106", routeId: "R6", offset: 0.2, dir: 1 },
  { id: "LB-107", routeId: "R1", offset: 0.62, dir: -1 },
  { id: "LB-108", routeId: "R2", offset: 0.8, dir: -1 },
  { id: "LB-109", routeId: "R3", offset: 0.05, dir: 1 },
  { id: "LB-110", routeId: "R4", offset: 0.55, dir: -1 },
  { id: "LB-111", routeId: "R5", offset: 0.3, dir: 1 },
  { id: "LB-112", routeId: "R6", offset: 0.68, dir: -1 },
] as const;

const DETECTION_SNIPPETS = [
  "Pothole @ 40 m",
  "Congestion build-up",
  "Lane violation",
  "Waterlogged stretch",
  "Missing signboard",
  "Jaywalking cluster",
  "Sudden braking event",
  "Debris on carriageway",
];

export function seedBuses(): Bus[] {
  return BUS_SEED.map((b) => {
    const route = ROUTES_CACHE[b.routeId];
    return {
      id: b.id,
      reg: `TS09-UB-${rint(1000, 9899)}`,
      routeId: b.routeId,
      routeName: route.name,
      pos: { lat: 0, lng: 0 },
      heading: 0,
      progress: b.offset,
      dir: b.dir as 1 | -1,
      speed: rfloat(18, 42, 0),
      status: rnd() < 0.92 ? "sensing" : rnd() < 0.5 ? "depot" : "offline",
      cameraOk: rnd() < 0.94,
      lteOk: rnd() < 0.96,
      detectionsToday: rint(3, 26),
      lastDetection: pick(DETECTION_SNIPPETS),
      detectionsTotal: rint(120, 900),
    };
  });
}

export function posAlong(
  pts: LatLng[],
  progress: number,
): { pos: LatLng; heading: number } {
  const clamped = Math.min(0.9999, Math.max(0, progress));
  const idxF = clamped * (pts.length - 1);
  const i = Math.floor(idxF);
  const t = idxF - i;
  const a = pts[i];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  const pos = {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
  const heading =
    (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI;
  return { pos, heading };
}

const ROUTES_CACHE = buildRouteCache();

function buildRouteCache(): Record<
  string,
  { name: string; pts: LatLng[]; color: string }
> {
  const cache: Record<
    string,
    { name: string; pts: LatLng[]; color: string }
  > = {};
  for (const r of ROUTES_LIST) {
    cache[r.id] = { name: r.name, pts: routePolyline(r.id), color: r.color };
  }
  return cache;
}

// ---------------------------------------------------------------- issue seeding
function jitter(p: LatLng, meters: number): LatLng {
  const dLat = (rand() - 0.5) * (meters / 111320) * 2;
  const dLng =
    ((rand() - 0.5) * (meters / (111320 * Math.cos((p.lat * Math.PI) / 180)))) *
    2;
  return { lat: p.lat + dLat, lng: p.lng + dLng };
}

function areaForSegment(segmentId: string): string {
  const idx = rint(0, AREAS.length - 1);
  void idx;
  const map: Record<string, string> = {
    r1: "Uppal Ring / ORR stretch",
    r2: "MG Road corridor",
    r3: "Raj Bhavan / Somajiguda",
    r4: "Vidyanagar – Secretariat",
    r5: "Vidyanagar residential",
    r6: "Banjara Hills",
    r7: "Kukatpally",
    r8: "Ameerpet–Punjagutta",
    r9: "Old City",
    r10: "Hitech City",
    r11: "Raidurg",
    r12: "Rethibowli",
    r13: "Tarnaka–Habsiguda",
    r14: "Uppal",
    r15: "Shamshabad approach",
    r16: "Barkas",
  };
  const roadId = segmentId.split("-s")[0];
  return map[roadId] ?? "City zone";
}

function makeTimeline(kind: "open" | "repaired" | "recheck", day0: number) {
  if (kind === "open") {
    return [
      { day: day0, label: "Detected", note: "Edge AI flagged defect on segment" },
      {
        day: day0 + 1,
        label: "Verified",
        note: "Multi-bus corroboration passed threshold",
      },
    ];
  }
  if (kind === "repaired") {
    return [
      { day: day0, label: "Detected", note: "Edge AI flagged defect on segment" },
      {
        day: day0 + 1,
        label: "Verified",
        note: "Multi-bus corroboration passed threshold",
      },
      {
        day: day0 + 3,
        label: "Severity upgraded",
        note: "Re-sampling shows deterioration; prioritized",
      },
      {
        day: day0 + 5,
        label: "Assigned",
        note: "Work order issued to Roads & Buildings Dept",
      },
      {
        day: day0 + 8,
        label: "Repair done",
        note: "Crew completed patch work; re-check scheduled",
      },
    ];
  }
  return [
    { day: day0, label: "Detected", note: "Edge AI flagged defect on segment" },
    {
      day: day0 + 1,
      label: "Verified",
      note: "Multi-bus corroboration passed threshold",
    },
    {
      day: day0 + 3,
      label: "Severity upgraded",
      note: "Re-sampling shows deterioration; prioritized",
    },
    {
      day: day0 + 5,
      label: "Assigned",
      note: "Work order issued to Roads & Buildings Dept",
    },
    {
      day: day0 + 8,
      label: "Repair done",
      note: "Crew completed patch work; re-check scheduled",
    },
    {
      day: day0 + 10,
      label: "Repair verified",
      note: "Subsequent bus re-scan: defect no longer present",
    },
  ];
}

interface SeedIssueSpec {
  type: DefectType;
  roadId: string;
  segIdx: number;
  along: number; // 0..1 within segment
  severity: Severity;
  buses: string[];
  dayDetected: number; // sim day index (0 = 9 days ago)
  status: IssueStatus;
  repaired?: boolean;
  rechecked?: boolean;
}

const ISSUE_SPECS: SeedIssueSpec[] = [
  // hot corridor: Kukatpally Main Rd
  { type: "pothole", roadId: "r7", segIdx: 0, along: 0.4, severity: "high", buses: ["LB-104", "LB-101", "LB-107"], dayDetected: 0, status: "prioritized", repaired: true, rechecked: true },
  { type: "damaged_road", roadId: "r7", segIdx: 1, along: 0.6, severity: "critical", buses: ["LB-104", "LB-110"], dayDetected: 1, status: "assigned" },
  { type: "pothole", roadId: "r7", segIdx: 1, along: 0.25, severity: "medium", buses: ["LB-101"], dayDetected: 2, status: "detected" },
  // MG Road
  { type: "congestion", roadId: "r2", segIdx: 1, along: 0.5, severity: "high", buses: ["LB-102", "LB-108", "LB-104"], dayDetected: 0, status: "verified" },
  { type: "missing_sign", roadId: "r2", segIdx: 0, along: 0.7, severity: "medium", buses: ["LB-102"], dayDetected: 2, status: "verified" },
  { type: "waterlogging", roadId: "r2", segIdx: 2, along: 0.35, severity: "high", buses: ["LB-108", "LB-111"], dayDetected: 3, status: "assigned" },
  // Outer Ring
  { type: "pothole", roadId: "r1", segIdx: 1, along: 0.3, severity: "critical", buses: ["LB-101", "LB-107", "LB-109"], dayDetected: 0, status: "repairing", repaired: true },
  { type: "waterlogging", roadId: "r1", segIdx: 2, along: 0.55, severity: "medium", buses: ["LB-107"], dayDetected: 3, status: "detected" },
  { type: "pothole", roadId: "r1", segIdx: 3, along: 0.6, severity: "low", buses: ["LB-101", "LB-107"], dayDetected: 4, status: "closed", repaired: true, rechecked: true },
  // Hitech City
  { type: "congestion", roadId: "r10", segIdx: 0, along: 0.5, severity: "critical", buses: ["LB-103", "LB-109", "LB-106"], dayDetected: 0, status: "prioritized" },
  { type: "damaged_road", roadId: "r10", segIdx: 1, along: 0.45, severity: "high", buses: ["LB-103"], dayDetected: 2, status: "verified" },
  { type: "missing_sign", roadId: "r10", segIdx: 2, along: 0.3, severity: "low", buses: ["LB-109"], dayDetected: 4, status: "detected" },
  // Sarojini Devi
  { type: "pothole", roadId: "r5", segIdx: 0, along: 0.5, severity: "medium", buses: ["LB-105", "LB-111"], dayDetected: 1, status: "assigned", repaired: true },
  { type: "waterlogging", roadId: "r5", segIdx: 1, along: 0.4, severity: "medium", buses: ["LB-111"], dayDetected: 3, status: "detected" },
  // Banjara Hills
  { type: "missing_sign", roadId: "r6", segIdx: 1, along: 0.55, severity: "medium", buses: ["LB-106", "LB-112"], dayDetected: 1, status: "prioritized" },
  { type: "pothole", roadId: "r6", segIdx: 0, along: 0.3, severity: "high", buses: ["LB-106"], dayDetected: 2, status: "verified" },
  // Charminar approach
  { type: "pothole", roadId: "r9", segIdx: 0, along: 0.45, severity: "high", buses: ["LB-102", "LB-108"], dayDetected: 1, status: "repairing", repaired: true },
  { type: "damaged_road", roadId: "r9", segIdx: 1, along: 0.5, severity: "critical", buses: ["LB-102", "LB-104", "LB-108"], dayDetected: 0, status: "assigned" },
  { type: "waterlogging", roadId: "r9", segIdx: 0, along: 0.7, severity: "low", buses: ["LB-102"], dayDetected: 3, status: "detected" },
  // Airport road
  { type: "pothole", roadId: "r15", segIdx: 0, along: 0.35, severity: "medium", buses: ["LB-103", "LB-112"], dayDetected: 2, status: "verified" },
  { type: "congestion", roadId: "r15", segIdx: 1, along: 0.5, severity: "medium", buses: ["LB-103"], dayDetected: 3, status: "detected" },
  // Ameerpet
  { type: "damaged_road", roadId: "r8", segIdx: 0, along: 0.5, severity: "high", buses: ["LB-104", "LB-110"], dayDetected: 1, status: "prioritized" },
  { type: "missing_sign", roadId: "r8", segIdx: 1, along: 0.6, severity: "low", buses: ["LB-110"], dayDetected: 4, status: "detected" },
  // Tarnaka
  { type: "pothole", roadId: "r13", segIdx: 1, along: 0.5, severity: "high", buses: ["LB-105", "LB-111"], dayDetected: 1, status: "assigned", repaired: true },
  { type: "waterlogging", roadId: "r13", segIdx: 0, along: 0.55, severity: "medium", buses: ["LB-105"], dayDetected: 3, status: "detected" },
  // Uppal ring road
  { type: "pothole", roadId: "r14", segIdx: 0, along: 0.4, severity: "medium", buses: ["LB-105", "LB-111", "LB-110"], dayDetected: 2, status: "closed", repaired: true, rechecked: true },
  { type: "damaged_road", roadId: "r14", segIdx: 1, along: 0.5, severity: "high", buses: ["LB-105"], dayDetected: 3, status: "detected" },
  // Raj Bhavan
  { type: "missing_sign", roadId: "r3", segIdx: 0, along: 0.5, severity: "medium", buses: ["LB-106", "LB-112"], dayDetected: 2, status: "verified" },
  { type: "congestion", roadId: "r3", segIdx: 1, along: 0.5, severity: "high", buses: ["LB-106"], dayDetected: 0, status: "verified" },
  // JN Road
  { type: "pothole", roadId: "r4", segIdx: 2, along: 0.5, severity: "critical", buses: ["LB-104", "LB-110", "LB-105"], dayDetected: 0, status: "repairing", repaired: true },
  { type: "waterlogging", roadId: "r4", segIdx: 1, along: 0.45, severity: "medium", buses: ["LB-110"], dayDetected: 2, status: "verified" },
  // Rethibowli
  { type: "pothole", roadId: "r12", segIdx: 0, along: 0.55, severity: "high", buses: ["LB-106", "LB-112"], dayDetected: 1, status: "prioritized" },
  { type: "missing_sign", roadId: "r12", segIdx: 1, along: 0.4, severity: "low", buses: ["LB-112"], dayDetected: 4, status: "detected" },
  // Raidurg
  { type: "damaged_road", roadId: "r11", segIdx: 0, along: 0.5, severity: "high", buses: ["LB-103", "LB-109"], dayDetected: 2, status: "assigned" },
  { type: "pothole", roadId: "r11", segIdx: 1, along: 0.6, severity: "medium", buses: ["LB-109"], dayDetected: 3, status: "detected" },
  // Barkas
  { type: "waterlogging", roadId: "r16", segIdx: 0, along: 0.5, severity: "medium", buses: ["LB-102"], dayDetected: 3, status: "detected" },
];

const TYPE_BASE_CONF: Record<DefectType, number> = {
  pothole: 84,
  damaged_road: 82,
  waterlogging: 78,
  missing_sign: 74,
  congestion: 80,
};

let issueCounter = 100;

export function seedIssues(): Issue[] {
  const issues: Issue[] = [];
  for (const spec of ISSUE_SPECS) {
    const seg = SEGMENTS.find((s) => s.id === `${spec.roadId}-s${spec.segIdx}`);
    if (!seg) continue;
    const idxF = spec.along * (seg.points.length - 1);
    const i = Math.floor(idxF);
    const t = idxF - i;
    const a = seg.points[i];
    const b = seg.points[Math.min(i + 1, seg.points.length - 1)];
    const base: LatLng = {
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    };
    const pos = jitter(base, 18);
    const baseConf = Math.min(97, TYPE_BASE_CONF[spec.type] + rint(-4, 6));
    const nBuses = spec.buses.length;
    const conf = Math.min(
      99,
      baseConf + (nBuses - 1) * rint(3, 5),
    );
    const detectedAt = DEMO_START + spec.dayDetected * 24 * 3600 * 1000 + rint(0, 20) * 3600 * 1000;
    const title = `${DEFECT_META[spec.type].label} — ${seg.roadName}`;
    let timeline: { day: number; label: string; note: string }[];
    if (spec.rechecked) timeline = makeTimeline("recheck", spec.dayDetected);
    else if (spec.repaired) timeline = makeTimeline("repaired", spec.dayDetected);
    else timeline = makeTimeline("open", spec.dayDetected);
    issues.push({
      id: `ISS-${issueCounter++}`,
      type: spec.type,
      title,
      segmentId: seg.id,
      roadName: seg.roadName,
      area: areaForSegment(seg.id),
      pos,
      severity: spec.severity,
      confidence: conf,
      baseConfidence: baseConf,
      status: spec.status,
      detections: nBuses * rint(2, 6),
      confirmingBuses: [...spec.buses],
      firstSeen: detectedAt,
      lastSeen: DEMO_START + Math.min(9, spec.dayDetected + rint(2, 5)) * 24 * 3600 * 1000,
      assignedDept:
        ISSUE_STATUS_ORDER.indexOf(spec.status) >= 3
          ? deptFor(spec.type)
          : null,
      assignedAt:
        ISSUE_STATUS_ORDER.indexOf(spec.status) >= 3
          ? detectedAt + 2 * 24 * 3600 * 1000
          : null,
      repairDate: spec.repaired ? 8 : null,
      recheckVerified: !!spec.rechecked,
      recheckByBus: spec.rechecked ? pick(BUS_SEED).id : null,
      timeline,
    });
  }
  return issues;
}

function deptFor(type: DefectType): string {
  switch (type) {
    case "pothole":
    case "damaged_road":
      return "Roads & Buildings Dept";
    case "waterlogging":
      return "Storm-Water Division";
    case "missing_sign":
      return "Signals & Signage Cell";
    case "congestion":
      return "Traffic Police";
  }
}

// ---------------------------------------------------------------- incident seeding
interface SeedIncidentSpec {
  type: IncidentType;
  roadId: string;
  segIdx: number;
  along: number;
  busId: string;
  day: number; // 0-9 sim day
  hour: number;
  confidence: number;
  status: IncidentStatus;
  tracked: boolean;
}

const INCIDENT_SPECS: SeedIncidentSpec[] = [
  { type: "hit_and_run", roadId: "r2", segIdx: 0, along: 0.5, busId: "LB-102", day: 8, hour: 21, confidence: 91, status: "escalated", tracked: true },
  { type: "rash_driving", roadId: "r10", segIdx: 0, along: 0.6, busId: "LB-103", day: 8, hour: 18, confidence: 88, status: "open", tracked: true },
  { type: "pedestrian_risk", roadId: "r5", segIdx: 0, along: 0.3, busId: "LB-105", day: 8, hour: 8, confidence: 84, status: "open", tracked: false },
  { type: "school_zone_risk", roadId: "r8", segIdx: 1, along: 0.5, busId: "LB-110", day: 8, hour: 8, confidence: 90, status: "open", tracked: false },
  { type: "accident", roadId: "r1", segIdx: 2, along: 0.4, busId: "LB-101", day: 7, hour: 19, confidence: 95, status: "resolved", tracked: true },
  { type: "rash_driving", roadId: "r7", segIdx: 0, along: 0.7, busId: "LB-104", day: 7, hour: 17, confidence: 82, status: "resolved", tracked: false },
  { type: "hit_and_run", roadId: "r9", segIdx: 0, along: 0.6, busId: "LB-102", day: 6, hour: 20, confidence: 87, status: "resolved", tracked: true },
  { type: "pedestrian_risk", roadId: "r2", segIdx: 1, along: 0.35, busId: "LB-108", day: 6, hour: 9, confidence: 79, status: "resolved", tracked: false },
  { type: "school_zone_risk", roadId: "r6", segIdx: 1, along: 0.4, busId: "LB-106", day: 5, hour: 15, confidence: 86, status: "resolved", tracked: false },
  { type: "accident", roadId: "r13", segIdx: 0, along: 0.5, busId: "LB-105", day: 4, hour: 14, confidence: 93, status: "resolved", tracked: true },
  { type: "rash_driving", roadId: "r15", segIdx: 0, along: 0.5, busId: "LB-112", day: 3, hour: 22, confidence: 81, status: "resolved", tracked: false },
  { type: "pedestrian_risk", roadId: "r9", segIdx: 1, along: 0.3, busId: "LB-104", day: 2, hour: 11, confidence: 77, status: "resolved", tracked: false },
];

let incidentCounter = 500;

export function seedIncidents(): Incident[] {
  const list: Incident[] = INCIDENT_SPECS.map((s) => {
    const seg = SEGMENTS.find((x) => x.id === `${s.roadId}-s${s.segIdx}`);
    if (!seg) return null;
    const idxF = s.along * (seg.points.length - 1);
    const i = Math.floor(idxF);
    const t = idxF - i;
    const a = seg.points[i];
    const b = seg.points[Math.min(i + 1, seg.points.length - 1)];
    const pos = jitter(
      { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t },
      14,
    );
    const ts =
      DEMO_START +
      s.day * 24 * 3600 * 1000 +
      s.hour * 3600 * 1000 +
      rint(0, 59) * 60 * 1000;
    const sev: Severity =
      s.type === "hit_and_run" || s.type === "accident"
        ? "critical"
        : s.type === "rash_driving"
          ? "high"
          : "medium";
    return {
      id: `INC-${incidentCounter++}`,
      type: s.type,
      typeName: INCIDENT_META[s.type].label,
      ts,
      roadName: seg.roadName,
      area: areaForSegment(seg.id),
      pos,
      busId: s.busId,
      vehicleReg: s.tracked ? fakeReg() : null,
      vehicleTracked: s.tracked,
      vehicleMake: s.tracked ? pick(VEHICLE_MAKES) : null,
      confidence: s.confidence,
      status: s.status,
      severity: sev,
      clipRef: `edge://cam-${s.busId.toLowerCase()}/clip_${rint(10000, 99999)}`,
    } as Incident;
  });
  return list.filter((x): x is Incident => x !== null).sort((a, b) => b.ts - a.ts);
}

// ---------------------------------------------------------------- notification templates
export const NOTIF_TEMPLATES = [
  { kind: "defect", text: "New pothole detected", detail: "Edge AI flagged a surface defect; awaiting corroboration" },
  { kind: "corroboration", text: "3 buses confirmed road damage", detail: "Multi-bus corroboration threshold reached" },
  { kind: "traffic", text: "High congestion detected", detail: "Average speed below 12 km/h on corridor" },
  { kind: "safety", text: "Pedestrian risk detected near school zone", detail: "Cluster of jaywalking events during school hours" },
  { kind: "safety", text: "Hit-and-run vehicle identified", detail: "Registration extracted with high confidence" },
  { kind: "success", text: "Road repair successfully verified", detail: "Subsequent bus re-scan found no defect at site" },
  { kind: "defect", text: "New waterlogging detected", detail: "Storm-water accumulation on carriageway" },
  { kind: "corroboration", text: "2 buses confirmed missing signboard", detail: "Verification level raised for signage issue" },
  { kind: "traffic", text: "Signal outage suspected", detail: "Repeated braking events at junction" },
  { kind: "safety", text: "Rash driving event captured", detail: "Overspeed + unsafe lane change sequence" },
] as const;

// ---------------------------------------------------------------- corroboration
export interface CorroborationGroup {
  key: string;
  segmentId: string;
  type: DefectType;
  buses: { busId: string; at: number; conf: number }[];
  combinedConfidence: number;
  verified: boolean;
}

export function corroborate(
  detections: { type: DefectType; segmentId: string; busId: string; at: number; conf: number }[],
  radiusM = 60,
): CorroborationGroup[] {
  void radiusM;
  const groups = new Map<string, CorroborationGroup>();
  for (const d of detections) {
    const key = `${d.segmentId}|${d.type}`;
    const g = groups.get(key) ?? {
      key,
      segmentId: d.segmentId,
      type: d.type,
      buses: [],
      combinedConfidence: 0,
      verified: false,
    };
    if (!g.buses.some((b) => b.busId === d.busId)) g.buses.push({ busId: d.busId, at: d.at, conf: d.conf });
    groups.set(key, g);
  }
  for (const g of groups.values()) {
    const maxBase = Math.max(...g.buses.map((b) => b.conf));
    const boost = (g.buses.length - 1) * 4;
    g.combinedConfidence = Math.min(99, maxBase + boost);
    g.verified = g.buses.length >= 2;
  }
  return [...groups.values()].sort((a, b) => b.buses.length - a.buses.length);
}

// ---------------------------------------------------------------- road health score
export interface RoadHealth {
  segmentId: string;
  roadName: string;
  score: number; // 0-100
  band: "Good" | "Moderate" | "Poor" | "Critical";
  defectCount: number;
  detections: number;
  congestionPct: number; // 0-100
  riskCount: number;
}

export function healthBand(score: number): RoadHealth["band"] {
  if (score >= 90) return "Good";
  if (score >= 70) return "Moderate";
  if (score >= 40) return "Poor";
  return "Critical";
}

export function computeRoadHealth(
  issues: Issue[],
  incidents: Incident[],
  congestionSeed: Map<string, number>,
): RoadHealth[] {
  return SEGMENTS.map((seg) => {
    const segIssues = issues.filter((i) => i.segmentId === seg.id);
    const defectCount = segIssues.length;
    const detections = segIssues.reduce((s, i) => s + i.detections, 0);
    const severityLoad = segIssues.reduce((s, i) => s + SEVERITY_WEIGHT[i.severity], 0);
    const riskCount = incidents.filter(
      (x) => x.status !== "resolved" && Math.abs(x.pos.lat - seg.points[0].lat) < 0.004 && Math.abs(x.pos.lng - seg.points[0].lng) < 0.005,
    ).length;
    const congestionPct = Math.min(100, Math.round(congestionSeed.get(seg.id) ?? rint(15, 70)));
    const raw =
      100 -
      severityLoad * 4.5 -
      Math.min(14, detections * 0.7) -
      congestionPct * 0.22 -
      riskCount * 6;
    const score = Math.max(4, Math.min(99, Math.round(raw)));
    return {
      segmentId: seg.id,
      roadName: seg.roadName,
      score,
      band: healthBand(score),
      defectCount,
      detections,
      congestionPct,
      riskCount,
    };
  });
}

export function bandColor(band: RoadHealth["band"]): string {
  switch (band) {
    case "Good":
      return "var(--brand-green)";
    case "Moderate":
      return "var(--brand-amber)";
    case "Poor":
      return "var(--brand-orange)";
    case "Critical":
      return "var(--brand-red)";
  }
}
