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

export default function JourneyMap({ streetViewPoints }) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Parse streetViewPoints: [{ location, name, memoItem, originalIndex, ... }]
  const points = (streetViewPoints || [])
    .map((p) => {
      if (!p.location) return null;
      const [lat, lng] = p.location.split(",").map(Number);
      if (isNaN(lat) || isNaN(lng)) return null;
      return {
        lat,
        lng,
        name: p.name,
        memoItem: p.memoItem,
        originalIndex: p.originalIndex,
      };
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
        {/* Markers: show original index and name */}
        {points.map((pos, i) => (
          <Marker key={i} position={[pos.lat, pos.lng]}>
            <Popup>
              {`${pos.originalIndex}. ${pos.name || ""}`}
              {pos.memoItem ? (
                <>
                  <br />
                  {pos.memoItem}
                </>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
