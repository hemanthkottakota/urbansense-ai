// City geometry model — fictional "Lakshminagar Metropolitan Region" (SIH 2026 demo).
// All roads/routes are fictional; coordinates sit in a plausible Indian-city envelope.

export type LatLng = { lat: number; lng: number };

export interface Road {
  id: string;
  name: string;
  lanes: 2 | 4 | 6;
  points: LatLng[]; // centerline polyline
}

export interface BusRoute {
  id: string;
  name: string;
  color: string;
  roadPath: string[]; // ordered road ids
  stops: { name: string; roadId: string; at: number }[];
}

export function distM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pt(lat: number, lng: number): LatLng {
  return { lat, lng };
}

export const CITY_CENTER: LatLng = { lat: 17.4065, lng: 78.4747 };

export const ROADS: Road[] = [
  {
    id: "r1",
    name: "Nehru Outer Ring Rd",
    lanes: 6,
    points: [
      pt(17.5022, 78.3289),
      pt(17.4961, 78.4269),
      pt(17.4836, 78.5241),
      pt(17.4629, 78.6128),
      pt(17.4381, 78.6795),
    ],
  },
  {
    id: "r2",
    name: "MG Road",
    lanes: 6,
    points: [
      pt(17.4215, 78.5029),
      pt(17.4143, 78.5011),
      pt(17.4065, 78.4972),
      pt(17.3982, 78.4931),
      pt(17.3891, 78.4884),
      pt(17.3802, 78.4841),
    ],
  },
  {
    id: "r3",
    name: "Raj Bhavan Rd",
    lanes: 4,
    points: [
      pt(17.4223, 78.4692),
      pt(17.4169, 78.4734),
      pt(17.4102, 78.4781),
      pt(17.4031, 78.4829),
      pt(17.3964, 78.4872),
    ],
  },
  {
    id: "r4",
    name: "JN Road",
    lanes: 4,
    points: [
      pt(17.4366, 78.4662),
      pt(17.4298, 78.4729),
      pt(17.4223, 78.4692),
      pt(17.4143, 78.5011),
      pt(17.4065, 78.4972),
    ],
  },
  {
    id: "r5",
    name: "Sarojini Devi Rd",
    lanes: 2,
    points: [
      pt(17.4143, 78.5011),
      pt(17.4078, 78.5089),
      pt(17.4009, 78.5157),
      pt(17.3934, 78.5226),
      pt(17.3861, 78.5289),
      pt(17.3795, 78.5346),
    ],
  },
  {
    id: "r6",
    name: "Banjara Hills Rd No. 12",
    lanes: 4,
    points: [
      pt(17.4129, 78.4249),
      pt(17.4092, 78.4366),
      pt(17.4049, 78.4478),
      pt(17.4009, 78.4588),
      pt(17.3968, 78.4692),
    ],
  },
  {
    id: "r7",
    name: "Kukatpally Main Rd",
    lanes: 4,
    points: [
      pt(17.4847, 78.4182),
      pt(17.4722, 78.4266),
      pt(17.4592, 78.4348),
      pt(17.4466, 78.4438),
      pt(17.4352, 78.4521),
    ],
  },
  {
    id: "r8",
    name: "Ameerpet–Punjagutta Rd",
    lanes: 4,
    points: [
      pt(17.4466, 78.4438),
      pt(17.4402, 78.4552),
      pt(17.4366, 78.4662),
      pt(17.4298, 78.4729),
      pt(17.4223, 78.4692),
    ],
  },
  {
    id: "r9",
    name: "Charminar Approach Rd",
    lanes: 2,
    points: [
      pt(17.3616, 78.4747),
      pt(17.3672, 78.4821),
      pt(17.3742, 78.4882),
      pt(17.3802, 78.4841),
      pt(17.3891, 78.4884),
    ],
  },
  {
    id: "r10",
    name: "Hitech City Main Rd",
    lanes: 6,
    points: [
      pt(17.4556, 78.3831),
      pt(17.4488, 78.3946),
      pt(17.4423, 78.4047),
      pt(17.4362, 78.4145),
      pt(17.4129, 78.4249),
    ],
  },
  {
    id: "r11",
    name: "Raidurg Metro Pillar Rd",
    lanes: 4,
    points: [pt(17.4556, 78.3831), pt(17.4495, 78.3762), pt(17.4436, 78.3698), pt(17.4362, 78.3638), pt(17.4291, 78.3589)],
  },
  {
    id: "r12",
    name: "Rethibowli–Arvind College Rd",
    lanes: 4,
    points: [pt(17.4129, 78.4249), pt(17.4062, 78.4249), pt(17.3992, 78.4231), pt(17.3922, 78.4215), pt(17.3861, 78.4215)],
  },
  {
    id: "r13",
    name: "Tarnaka–Habsiguda Rd",
    lanes: 4,
    points: [pt(17.4381, 78.5331), pt(17.4289, 78.5409), pt(17.4189, 78.5482), pt(17.4089, 78.5546), pt(17.3992, 78.5596)],
  },
  {
    id: "r14",
    name: "Uppal Ring Rd",
    lanes: 6,
    points: [pt(17.4089, 78.5546), pt(17.4022, 78.5612), pt(17.3942, 78.5681), pt(17.3861, 78.5738), pt(17.3795, 78.5782)],
  },
  {
    id: "r15",
    name: "Shamshabad Airport Rd",
    lanes: 6,
    points: [pt(17.3616, 78.4747), pt(17.3542, 78.4641), pt(17.3472, 78.4532), pt(17.3395, 78.4409), pt(17.3305, 78.4262)],
  },
  {
    id: "r16",
    name: "Barkas Rd",
    lanes: 2,
    points: [pt(17.3616, 78.4747), pt(17.3589, 78.4829), pt(17.3556, 78.4906), pt(17.3512, 78.4986), pt(17.3462, 78.5056)],
  },
];

// Segment spans: how many pieces each road is split into (per node index boundary count)
const SEGMENT_SPANS: Record<string, number> = {
  r1: 4, r2: 3, r3: 2, r4: 3, r5: 2, r6: 2,
  r7: 2, r8: 2, r9: 2, r10: 3, r11: 2, r12: 2,
  r13: 2, r14: 2, r15: 2, r16: 2,
};

export interface Segment {
  id: string;
  roadId: string;
  roadName: string;
  points: LatLng[];
  lengthM: number;
}

function polylineLengthM(pts: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += distM(pts[i], pts[i + 1]);
  return total;
}

export function buildSegments(): Segment[] {
  const segs: Segment[] = [];
  for (const road of ROADS) {
    const nodeCount = road.points.length;
    const spans = SEGMENT_SPANS[road.id] ?? 2;
    // divide the node chain into `spans` contiguous chunks
    const per = Math.max(1, Math.floor((nodeCount - 1) / spans));
    let start = 0;
    for (let s = 0; s < spans; s++) {
      const end = s === spans - 1 ? nodeCount - 1 : start + per;
      const pts = road.points.slice(start, end + 1);
      segs.push({
        id: `${road.id}-s${s}`,
        roadId: road.id,
        roadName: road.name,
        points: pts,
        lengthM: Math.round(polylineLengthM(pts)),
      });
      start = end;
    }
  }
  return segs;
}

export const SEGMENTS: Segment[] = buildSegments();

export function roadOfSegment(segmentId: string): Road | undefined {
  return ROADS.find((r) => segmentId.startsWith(r.id + "-s"));
}

// ---------------------------------------------------------------- routes
export const ROUTES: BusRoute[] = [
  {
    id: "R1",
    name: "Ring Rd Circular",
    color: "#14161a",
    roadPath: ["r1"],
    stops: [
      { name: "KPHB Ring Junction", roadId: "r1", at: 0.08 },
      { name: "Miyapur Ring North", roadId: "r1", at: 0.38 },
      { name: "Gachibowli Ring West", roadId: "r1", at: 0.72 },
      { name: "Uppal Ring East", roadId: "r1", at: 0.95 },
    ],
  },
  {
    id: "R2",
    name: "MG Rd – Charminar",
    color: "#b45309",
    roadPath: ["r2", "r9"],
    stops: [
      { name: "MG Rd North Terminus", roadId: "r2", at: 0.06 },
      { name: "Raj Bhavan Junction", roadId: "r2", at: 0.42 },
      { name: "Madina Circle", roadId: "r9", at: 0.55 },
      { name: "Charminar", roadId: "r9", at: 0.08 },
    ],
  },
  {
    id: "R3",
    name: "Hitech City – Airport Flyer",
    color: "#0284c7",
    roadPath: ["r10", "r1", "r15"],
    stops: [
      { name: "Raidurg Hitech City", roadId: "r10", at: 0.08 },
      { name: "Gachibowli Ring West", roadId: "r1", at: 0.72 },
      { name: "Rethibowli Junction", roadId: "r15", at: 0.4 },
      { name: "Shamshabad Airport", roadId: "r15", at: 0.92 },
    ],
  },
  {
    id: "R4",
    name: "Kukatpally – Old City",
    color: "#15803d",
    roadPath: ["r7", "r8", "r4", "r2", "r9"],
    stops: [
      { name: "KPHB Phase 3", roadId: "r7", at: 0.06 },
      { name: "Ameerpet Metro", roadId: "r8", at: 0.3 },
      { name: "Secretariat Gate", roadId: "r4", at: 0.42 },
      { name: "MG Rd South", roadId: "r2", at: 0.55 },
      { name: "Charminar", roadId: "r9", at: 0.08 },
    ],
  },
  {
    id: "R5",
    name: "Sarojini–Uppal Circular",
    color: "#7c3aed",
    roadPath: ["r5", "r4", "r13", "r14"],
    stops: [
      { name: "Vidyanagar", roadId: "r5", at: 0.18 },
      { name: "JN Road Junction", roadId: "r4", at: 0.45 },
      { name: "Tarnaka Metro", roadId: "r13", at: 0.5 },
      { name: "Uppal Ring", roadId: "r14", at: 0.55 },
    ],
  },
  {
    id: "R6",
    name: "Banjara – Airport Direct",
    color: "#be123c",
    roadPath: ["r6", "r3", "r2", "r12", "r15"],
    stops: [
      { name: "Banjara Hills Rd 12", roadId: "r6", at: 0.06 },
      { name: "Raj Bhavan", roadId: "r3", at: 0.3 },
      { name: "Lakdikapul", roadId: "r2", at: 0.55 },
      { name: "Arvind College", roadId: "r12", at: 0.4 },
      { name: "Shamshabad Airport", roadId: "r15", at: 0.9 },
    ],
  },
];

// Road polyline flattened across a route's road path (for bus motion)
export function routePolyline(routeId: string): LatLng[] {
  const route = ROUTES.find((r) => r.id === routeId);
  if (!route) return [];
  const pts: LatLng[] = [];
  for (const roadId of route.roadPath) {
    const road = ROADS.find((r) => r.id === roadId);
    if (!road) continue;
    for (const p of road.points) {
      const last = pts[pts.length - 1];
      if (!last || Math.abs(last.lat - p.lat) > 1e-9 || Math.abs(last.lng - p.lng) > 1e-9) {
        pts.push(p);
      }
    }
  }
  return pts;
}
