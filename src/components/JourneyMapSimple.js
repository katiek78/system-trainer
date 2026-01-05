"use client";
import { useEffect, useRef } from "react";

export default function JourneyMapSimple({ points, width, height }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Clean up any existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Import Leaflet dynamically
    import("leaflet").then((L) => {
      // Fix icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Filter to only street view points and parse coordinates
      const validPoints = (points || [])
        .map((p, idx) => {
          if (!p.location) return null;
          const match = p.location.match(/^([-\d.]+),([-\d.]+)/);
          if (!match) return null;
          const [, lat, lng] = match;
          return {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            name: p.name,
            memoItem: p.memoItem,
            index: p.originalIndex || idx + 1,
          };
        })
        .filter((p) => p && !isNaN(p.lat) && !isNaN(p.lng));

      if (validPoints.length === 0) {
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML =
            "<p>No valid locations to display</p>";
        }
        return;
      }

      // Create map
      const map = L.map(mapContainerRef.current).setView(
        [validPoints[0].lat, validPoints[0].lng],
        13
      );

      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add markers
      validPoints.forEach((point) => {
        const marker = L.marker([point.lat, point.lng]).addTo(map);
        const popupContent = `${point.index}. ${point.name || ""}${
          point.memoItem ? `<br/>${point.memoItem}` : ""
        }`;
        marker.bindPopup(popupContent);
      });

      // Add polyline if multiple points
      if (validPoints.length > 1) {
        const polylinePoints = validPoints.map((p) => [p.lat, p.lng]);
        L.polyline(polylinePoints, { color: "blue" }).addTo(map);
      }

      // Fit bounds to show all markers
      const bounds = L.latLngBounds(validPoints.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css"
      />
      <div
        ref={mapContainerRef}
        style={{
          height: height || "400px",
          width: width || "100%",
          position: "relative",
        }}
      />
    </>
  );
}
