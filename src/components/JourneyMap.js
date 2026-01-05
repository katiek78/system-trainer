import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
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

function MapContent({ points }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size when map is shown
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.length > 1 && (
        <Polyline positions={points.map((p) => [p.lat, p.lng])} color="blue" />
      )}
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
    </>
  );
}

export default function JourneyMap({
  points: streetViewPoints,
  width,
  height,
}) {
  const containerRef = useRef(null);
  const [mapKey, setMapKey] = useState(Date.now());

  useEffect(() => {
    fixLeafletIcon();

    // Force remount on every render by updating key
    setMapKey(Date.now());

    // Cleanup function to remove any lingering map instances
    return () => {
      if (containerRef.current) {
        const container = containerRef.current;
        // Remove all leaflet-specific data
        if (container._leaflet_id) {
          delete container._leaflet_id;
        }
        // Find and remove any map instances
        const maps = container.querySelectorAll(".leaflet-container");
        maps.forEach((mapEl) => {
          if (mapEl._leaflet_map) {
            mapEl._leaflet_map.remove();
          }
        });
      }
    };
  }, []);

  // Parse streetViewPoints: [{ location, name, memoItem, originalIndex, ... }]
  const points = (streetViewPoints || [])
    .map((p, idx) => {
      if (!p.location) return null;
      const [lat, lng] = p.location.split(",").map(Number);
      if (isNaN(lat) || isNaN(lng)) return null;
      return {
        lat,
        lng,
        name: p.name,
        memoItem: p.memoItem,
        originalIndex: idx + 1,
      };
    })
    .filter(Boolean);

  // Center map on first point or fallback
  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [0, 0];

  return (
    <div
      ref={containerRef}
      style={{ height: height || "400px", width: width || "100%" }}
    >
      <MapContainer
        key={mapKey}
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <MapContent points={points} />
      </MapContainer>
    </div>
  );
}
