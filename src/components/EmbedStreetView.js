import { useState, useEffect } from "react";
import streetViewCache from "@/utilities/streetViewCache";
import { getStreetViewUrl } from "@/utilities/getStreetViewURL";

const EmbedStreetView = ({
  width,
  height,
  location,
  heading = 90,
  pitch = 0,
  fov = 100,
}) => {
  const key = `${location}-${heading}-${pitch}-${fov}`;

  //const embedKey = `${key}-embed`;
  const imageKey = `${key}-image`;

  //const cachedEmbedUrl = streetViewCache[embedKey];
  const cachedImageUrl = streetViewCache[imageKey];

  // const [embedUrl, setEmbedUrl] = useState(cachedEmbedUrl || null);
  const [staticImageUrl, setStaticImageUrl] = useState(cachedImageUrl || null);
  //const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        // if (!cachedEmbedUrl) {
        //   const embed = await getStreetViewUrl(
        //     location,
        //     heading,
        //     pitch,
        //     fov,
        //     "embed"
        //   );
        //   streetViewCache[embedKey] = embed;
        //   setEmbedUrl(embed);
        // }

        if (!cachedImageUrl) {
          const image = await getStreetViewUrl(
            location,
            heading,
            pitch,
            fov,
            "image"
          );
          streetViewCache[imageKey] = image;
          setStaticImageUrl(image);
        }
      } catch (err) {
        console.error("Failed to fetch Street View URLs", err);
      }
    };

    if (location) fetchUrls();
  }, [location, heading, pitch, fov]);

  // const onIframeLoad = () => setIframeLoaded(true);

  if (!staticImageUrl) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* {!iframeLoaded && staticImageUrl ? (
        <img
          src={staticImageUrl}
          alt="Street View (static)"
          className="placeholder-image"
          width={width}
          height={height}
        />
      ) : null}

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
          allow="geolocation; microphone; camera; fullscreen"
        />
      )} */}
      <img
        src={staticImageUrl}
        alt="Street View (static)"
        className="placeholder-image"
        width={width}
        height={height}
      />
    </>
  );
};

export default EmbedStreetView;
