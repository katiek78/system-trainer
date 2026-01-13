"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import CardMemorisation from "@/components/CardMemorisation";

export const dynamic = "force-dynamic";

function CardsContent() {
  const searchParams = useSearchParams();

  // Extract params from searchParams
  const mode = searchParams.get("mode") || "SC";
  const decks = searchParams.get("decks") || 1;
  const memorisationTime = searchParams.get("memorisationTime") || 60;
  const recallTime = searchParams.get("recallTime") || 240;
  const journeyOption = searchParams.get("journeyOption") || 0;
  const cardGrouping = searchParams.get("cardGrouping") || 1;
  const imageSet = searchParams.get("imageSet") || "";
  const cardGroupsPerLocation = searchParams.get("cardGroupsPerLocation") || 1;
  const timedMode = searchParams.get("timedMode") || "0";
  const memoCountdown = searchParams.get("memoCountdown") || "20";
  const recallCountdownMode = searchParams.get("recallCountdownMode") || "0";
  const recallCountdown = searchParams.get("recallCountdown") || "20";

  const [journeyData, setJourneyData] = useState([]);
  const [imageSetData, setImageSetData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch journey and image set data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch journey options from localStorage (saved by settings page)
      let journeys = [];
      if (typeof window !== "undefined") {
        const storedOptions = localStorage.getItem("cardJourneyOptions");
        if (storedOptions) {
          try {
            const options = JSON.parse(storedOptions);
            const selectedIdx = Number(journeyOption);
            if (options[selectedIdx]) {
              // Fetch full journey data for each journey ID in the selected option
              const journeyIds = options[selectedIdx].map((j) => j.id);
              const results = await Promise.all(
                journeyIds.map(async (id) => {
                  const res = await fetch(`/api/journeys/${id}`);
                  if (res.ok) {
                    const data = await res.json();
                    return data.data || null;
                  }
                  return null;
                })
              );
              journeys = results.filter(Boolean);
            }
          } catch (e) {
            console.error("Error loading journey options:", e);
          }
        }
      }

      // Fetch image set data (always fetch full objects if only IDs are present)
      let imageSets = [];
      if (imageSet && typeof window !== "undefined") {
        const storedImageSets = localStorage.getItem("cardImageSets");
        if (storedImageSets) {
          try {
            const parsed = JSON.parse(storedImageSets);
            // If parsed is an array of strings (IDs), fetch each full object
            if (
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              typeof parsed[0] === "string"
            ) {
              imageSets = await Promise.all(
                parsed.map(async (id) => {
                  try {
                    const res = await fetch(`/api/imageSets/${id}`);
                    if (res.ok) {
                      const data = await res.json();
                      if (data && data.data) {
                        return {
                          id: data.data._id,
                          name: data.data.name,
                          count: data.data.images.length,
                          images: data.data.images,
                        };
                      }
                    }
                  } catch (err) {
                    console.error("Error fetching image set:", err);
                  }
                  return null;
                })
              );
              imageSets = imageSets.filter(Boolean);
            } else if (
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              typeof parsed[0] === "object" &&
              parsed[0].images
            ) {
              // Already full objects
              imageSets = parsed;
            } else {
              // Fallback: fetch single imageSet by ID
              const res = await fetch(`/api/imageSets/${imageSet}`);
              if (res.ok) {
                const data = await res.json();
                if (data && data.data) {
                  imageSets = [
                    {
                      id: data.data._id,
                      name: data.data.name,
                      count: data.data.images.length,
                      images: data.data.images,
                    },
                  ];
                }
              }
            }
          } catch (e) {
            // Fallback: fetch from API
            try {
              const res = await fetch(`/api/imageSets/${imageSet}`);
              if (res.ok) {
                const data = await res.json();
                if (data && data.data) {
                  imageSets = [
                    {
                      id: data.data._id,
                      name: data.data.name,
                      count: data.data.images.length,
                      images: data.data.images,
                    },
                  ];
                }
              }
            } catch (err) {
              console.error("Error fetching image set:", err);
            }
          }
        } else {
          // No localStorage: fetch single imageSet by ID
          try {
            const res = await fetch(`/api/imageSets/${imageSet}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.data) {
                imageSets = [
                  {
                    id: data.data._id,
                    name: data.data.name,
                    count: data.data.images.length,
                    images: data.data.images,
                  },
                ];
              }
            }
          } catch (err) {
            console.error("Error fetching image set:", err);
          }
        }
      }

      setJourneyData(journeys);
      setImageSetData(imageSets);

      setLoading(false);
    }

    fetchData();
  }, [journeyOption, imageSet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <CardMemorisation
      decks={Number(decks)}
      grouping={cardGrouping}
      cardGroupsPerLocation={cardGroupsPerLocation}
      journey={journeyData}
      imageSet={imageSetData}
      onFinish={() => {}}
      mode={mode}
      timedMode={timedMode}
      memorisationTime={Number(memorisationTime)}
      recallTime={Number(recallTime)}
      memoCountdown={Number(memoCountdown)}
      recallCountdownMode={recallCountdownMode}
      recallCountdown={Number(recallCountdown)}
    />
  );
}

export default function CardsMemorisationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      }
    >
      <CardsContent />
    </Suspense>
  );
}
