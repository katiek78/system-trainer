import { useState, useEffect } from "react";
//import streetViewCache from "@/utilities/streetViewCache";
import { getStreetViewUrl } from "@/utilities/getStreetViewURL";

const EmbedStreetViewDynamic = ({
  width,
  height,
  location,
  heading = 90,
  pitch = 0,
  fov = 100,
}) => {
  //const key = `${location}-${heading}-${pitch}-${fov}`;

  //const embedKey = `${key}-embed`;
  //const imageKey = `${key}-image`;

  //const cachedEmbedUrl = streetViewCache[embedKey];
  //const cachedImageUrl = streetViewCache[imageKey];

  //const [embedUrl, setEmbedUrl] = useState(cachedEmbedUrl || null);
  const [embedUrl, setEmbedUrl] = useState(null);
  //const [staticImageUrl, setStaticImageUrl] = useState(cachedImageUrl || null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        // if (!cachedEmbedUrl) {
        const embed = await getStreetViewUrl(
          location,
          heading,
          pitch,
          fov,
          "embed"
        );
        //streetViewCache[embedKey] = embed;
        setEmbedUrl(embed);
      } catch (err) {
        console.error("Failed to fetch Street View URLs", err);
      }
    };

    if (location) fetchUrls();
  }, [location, heading, pitch, fov]);

  const onIframeLoad = () => setIframeLoaded(true);

  if (!embedUrl) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {embedUrl && (
        <iframe
          className="mx-auto"
          width={width}
          height={height}
          style={{ border: 0, padding: "10px" }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={onIframeLoad}
          src={embedUrl}
          allow="accelerometer; gyroscope; geolocation; microphone; camera; fullscreen"
        />
      )}
    </>
  );
};

export default EmbedStreetViewDynamic;
