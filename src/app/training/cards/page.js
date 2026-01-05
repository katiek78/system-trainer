"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CardMemorisation from "@/components/CardMemorisation";

export default function CardsMemorisationPage() {
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

      // Fetch image set data
      let imageSets = [];
      if (imageSet && typeof window !== "undefined") {
        const storedImageSets = localStorage.getItem("cardImageSets");
        if (storedImageSets) {
          try {
            imageSets = JSON.parse(storedImageSets);
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
    />
  );
}
