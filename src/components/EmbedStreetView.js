import { useState, useEffect } from "react";

const EmbedStreetView = ({ width, height, location, heading, pitch, fov }) => {
  const [streetViewUrl, setStreetViewUrl] = useState(null);

  useEffect(() => {
    if (location) {
      // Default values for heading, pitch, and fov
      heading = heading || 90;
      pitch = pitch || 0;
      fov = fov || 100;

      // Call the server-side API route to get the Street View URL
      const fetchStreetViewUrl = async () => {
        try {
          const response = await fetch(
            `/api/streetView?location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}`
          );
          const data = await response.json();
          setStreetViewUrl(data.streetViewUrl);
        } catch (error) {
          console.error("Error fetching Street View URL:", error);
        }
      };

      fetchStreetViewUrl();
    }
  }, [location, heading, pitch, fov]);

  if (!streetViewUrl) {
    return <div>Loading...</div>;
  }

  return (
    <iframe
      className="mx-auto"
      width={width}
      height={height}
      style={{ border: 0, padding: "10px" }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={streetViewUrl}
      // Disable unnecessary permissions like accelerometer
      allow="geolocation; microphone; camera; fullscreen"
    ></iframe>
  );
};

export default EmbedStreetView;
