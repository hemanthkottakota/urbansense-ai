import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_CENTER, ROADS, ROUTES, routePolyline } from "@/lib/city";
import {
  DEFECT_META,
  INCIDENT_META,
  bandColor,
  type Bus,
  type Incident,
  type Issue,
} from "@/lib/sim-engine";
import type { RoadHealth } from "@/lib/sim-engine";

export type MapMode = "issues" | "health" | "congestion" | "risk";

function busIcon(bus: Bus): L.DivIcon {
  const on = bus.status === "sensing";
  return L.divIcon({
    className: "us-bus-icon",
    html: `<div style="transform: rotate(${bus.heading}deg); transition: transform .9s linear;">
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="10" fill="${on ? "#14161a" : "#9aa1ac"}" stroke="#fff" stroke-width="2"/>
        <path d="M13 7 L13 19 M13 7 L9.6 11 M13 7 L16.4 11" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitCity() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      L.latLngBounds(ROADS.flatMap((r) => r.points.map((p) => [p.lat, p.lng] as [number, number]))),
      { padding: [24, 24] },
    );
  }, [map]);
  return null;
}

export interface CityMapProps {
  mode?: MapMode;
  issues: Issue[];
  incidents: Incident[];
  buses: Bus[];
  health?: RoadHealth[];
  showRoutes?: boolean;
  showBuses?: boolean;
  onSelectIssue?: (issue: Issue) => void;
  onSelectBus?: (bus: Bus) => void;
  className?: string;
}

export function CityMap({
  mode = "issues",
  issues,
  incidents,
  buses,
  health = [],
  showRoutes = true,
  showBuses = true,
  onSelectIssue,
  onSelectBus,
  className,
}: CityMapProps) {
  const visibleIssues = useMemo(
    () => issues.filter((i) => i.status !== "closed"),
    [issues],
  );

  return (
    <MapContainer
      center={[CITY_CENTER.lat, CITY_CENTER.lng]}
      zoom={12}
      zoomControl={true}
      attributionControl={true}
      className={className}
      style={{ height: "100%", width: "100%" }}
      preferCanvas
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <FitCity />

      {/* road network base */}
      {ROADS.map((road) => (
        <Polyline
          key={road.id}
          positions={road.points.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: "#d6d9dd",
            weight: road.lanes >= 6 ? 6 : road.lanes >= 4 ? 4.5 : 3,
            opacity: 0.9,
            lineCap: "round",
          }}
        />
      ))}

      {/* health / congestion overlay per segment */}
      {(mode === "health" || mode === "congestion") &&
        health.map((h) => {
          const road = ROADS.find((r) => h.segmentId.startsWith(r.id + "-s"));
          const segIdx = Number(h.segmentId.split("-s")[1]);
          if (!road) return null;
          const nodeCount = road.points.length;
          const spans = road.id === "r1" ? 4 : road.id === "r2" || road.id === "r4" || road.id === "r10" ? 3 : 2;
          const per = Math.max(1, Math.floor((nodeCount - 1) / spans));
          const start = segIdx * per;
          const end = segIdx === spans - 1 ? nodeCount - 1 : start + per;
          const pts = road.points.slice(start, end + 1).map((p) => [p.lat, p.lng] as [number, number]);
          if (pts.length < 2) return null;
          const value = mode === "health" ? 100 - h.score : h.congestionPct;
          const color =
            mode === "health"
              ? bandColor(h.band)
              : value >= 75
                ? "#dc2626"
                : value >= 55
                  ? "#ea580c"
                  : value >= 35
                    ? "#b45309"
                    : "#16a34a";
          return (
            <Polyline
              key={`seg-${h.segmentId}`}
              positions={pts}
              pathOptions={{
                color,
                weight: road.lanes >= 6 ? 7 : 5,
                opacity: mode === "congestion" ? 0.85 : 0.9,
                lineCap: "round",
              }}
            >
              <Tooltip sticky>
                <span className="text-[11px] font-medium">{h.roadName}</span>
                <br />
                <span className="text-[11px]">
                  {mode === "health" ? `Health ${h.score}/100 — ${h.band}` : `Congestion ${h.congestionPct}%`}
                </span>
              </Tooltip>
            </Polyline>
          );
        })}

      {/* risk heatmap blobs */}
      {mode === "risk" &&
        issues
          .filter((i) => i.status !== "closed" && (i.severity === "critical" || i.severity === "high"))
          .map((i) => (
            <CircleMarker
              key={`risk-${i.id}`}
              center={[i.pos.lat, i.pos.lng]}
              radius={22 + i.confirmingBuses.length * 5}
              pathOptions={{
                color: "transparent",
                fillColor: i.severity === "critical" ? "#dc2626" : "#ea580c",
                fillOpacity: 0.16,
              }}
            />
          ))}
      {mode === "risk" &&
        incidents
          .filter((i) => i.status !== "resolved")
          .map((i) => (
            <CircleMarker
              key={`risk-inc-${i.id}`}
              center={[i.pos.lat, i.pos.lng]}
              radius={26}
              pathOptions={{ color: "transparent", fillColor: "#dc2626", fillOpacity: 0.18 }}
            />
          ))}

      {/* route overlays */}
      {showRoutes &&
        ROUTES.map((route) => (
          <Polyline
            key={`route-${route.id}`}
            positions={routePolyline(route.id).map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: route.color,
              weight: 1.5,
              opacity: 0.35,
              dashArray: "4 6",
            }}
          />
        ))}

      {/* issue markers */}
      {mode !== "congestion" &&
        visibleIssues.map((issue) => {
          const meta = DEFECT_META[issue.type];
          const verified = issue.confirmingBuses.length >= 2;
          return (
            <CircleMarker
              key={issue.id}
              center={[issue.pos.lat, issue.pos.lng]}
              radius={issue.severity === "critical" ? 8 : issue.severity === "high" ? 7 : 5.5}
              pathOptions={{
                color: "#ffffff",
                weight: verified ? 2.5 : 1.5,
                fillColor: meta.color,
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onSelectIssue?.(issue) }}
            >
              <Popup>
                <div className="min-w-44">
                  <p className="text-xs font-semibold">{meta.label}</p>
                  <p className="text-[11px] text-neutral-600">{issue.roadName}</p>
                  <p className="mt-1 text-[11px]">
                    <b>Severity:</b> {issue.severity}
                  </p>
                  <p className="text-[11px]">
                    <b>AI Confidence:</b> {issue.confidence}%
                  </p>
                  <p className="text-[11px]">
                    <b>Verified by:</b> {issue.confirmingBuses.length}{" "}
                    {issue.confirmingBuses.length === 1 ? "bus" : "buses"}
                  </p>
                  <p className="text-[11px] capitalize">
                    <b>Status:</b> {issue.status.replace("_", " ")}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      {/* closed/repaired re-check markers */}
      {mode === "issues" &&
        issues
          .filter((i) => i.status === "closed")
          .map((issue) => (
            <CircleMarker
              key={`ok-${issue.id}`}
              center={[issue.pos.lat, issue.pos.lng]}
              radius={5}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#16a34a", fillOpacity: 0.9 }}
              eventHandlers={{ click: () => onSelectIssue?.(issue) }}
            >
              <Popup>
                <div>
                  <p className="text-xs font-semibold text-green-700">Repair Verified by Subsequent Bus</p>
                  <p className="text-[11px] text-neutral-600">
                    {issue.roadName} — re-scan clear ({issue.recheckByBus})
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

      {/* incident markers */}
      {mode === "issues" &&
        incidents
          .filter((i) => i.status !== "resolved")
          .map((inc) => {
            const meta = INCIDENT_META[inc.type];
            return (
              <Marker
                key={inc.id}
                position={[inc.pos.lat, inc.pos.lng]}
                icon={L.divIcon({
                  className: "us-incident-icon",
                  html: `<div style="position:relative"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>`,
                  iconSize: [22, 22],
                  iconAnchor: [11, 11],
                })}
              >
                <Popup>
                  <div className="min-w-44">
                    <p className="text-xs font-semibold text-red-700">{meta.label}</p>
                    <p className="text-[11px]">{inc.roadName}</p>
                    <p className="mt-1 text-[11px]">
                      <b>Bus:</b> {inc.busId}
                    </p>
                    <p className="text-[11px]">
                      <b>Confidence:</b> {inc.confidence}%
                    </p>
                    {inc.vehicleTracked && inc.vehicleReg && (
                      <p className="text-[11px]">
                        <b>Vehicle Tracked:</b> {inc.vehicleReg}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

      {/* buses */}
      {showBuses &&
        buses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.pos.lat, bus.pos.lng]}
            icon={busIcon(bus)}
            zIndexOffset={400}
            eventHandlers={{ click: () => onSelectBus?.(bus) }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              <span className="text-[11px] font-semibold">{bus.id}</span>
              <span className="text-[11px]"> · {bus.routeName}</span>
            </Tooltip>
          </Marker>
        ))}
    </MapContainer>
  );
}
