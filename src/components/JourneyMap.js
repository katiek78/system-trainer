import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

function fixLeafletIcon() {
  if (typeof window !== "undefined" && L && L.Icon && L.Icon.Default) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x.src || markerIcon2x,
      iconUrl: markerIcon.src || markerIcon,
      shadowUrl: markerShadow.src || markerShadow,
    });
  }
}

export default function JourneyMap({ locations, names }) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);
  // Parse locations: ["lat,lng", ...] => [{lat, lng}], and names: [name, ...]
  const points = locations
    .map((loc, idx) => {
      if (!loc) return null;
      const [lat, lng] = loc.split(",").map(Number);
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng, name: names ? names[idx] : undefined };
    })
    .filter(Boolean);

  // Center map on first point or fallback
  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [0, 0];

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Draw polyline connecting all points */}
        {points.length > 1 && (
          <Polyline
            positions={points.map((p) => [p.lat, p.lng])}
            color="blue"
          />
        )}
        {/* Markers: first is labeled 'Start', rest are numbered */}
        {points.map((pos, i) => (
          <Marker
            key={i}
            position={[pos.lat, pos.lng]}
          >
            <Popup>{`${i + 1}. ${pos.name || ''}`}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
