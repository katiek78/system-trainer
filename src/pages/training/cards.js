import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CardMemorisation from "@/components/CardMemorisation";

export default function CardsMemorisationPage() {
  const router = useRouter();
  const {
    mode = "SC",
    decks = 1,
    memorisationTime = 60,
    recallTime = 240,
    journeyOption = 0,
    cardGrouping = 1,
    imageSet = "",
  } = router.query;

  // Get journey and image set info from localStorage (as in cardsSettings.js)
  const [journey, setJourney] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Get journey options from localStorage
    const options = JSON.parse(
      localStorage.getItem("cardJourneyOptions") || "[]"
    );
    const selectedOption = Number(journeyOption) || 0;
    const journeyIds = (options[selectedOption] || []).map((j) => j.id);
    // Fetch full journey objects for these IDs
    async function fetchJourneys() {
      if (!journeyIds.length) {
        setJourney([]);
        return;
      }
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
      setJourney(results.filter(Boolean));
    }
    fetchJourneys();
    // Get image set info (for hint bar)
    let imageSets = JSON.parse(localStorage.getItem("cardImageSets") || "[]");
    // Filter image sets to match grouping
    let filtered = imageSets;
    if (cardGrouping === "1") {
      filtered = imageSets.filter((set) => set.count === 52);
    } else if (cardGrouping === "2") {
      filtered = imageSets.filter(
        (set) => set.count === 1352 || set.count === 2704
      );
    } else if (cardGrouping === "3") {
      filtered = imageSets.filter(
        (set) => set.count === 64 || set.count === 2197
      );
    }
    setImages(filtered);
  }, [journeyOption, cardGrouping]);

  // Handler for finishing memorisation
  function handleFinish() {
    // TODO: Route to recall phase or summary
    alert("Memorisation finished!");
  }

  return (
    <CardMemorisation
      decks={Number(decks)}
      grouping={cardGrouping}
      journey={journey}
      imageSet={images}
      onFinish={handleFinish}
    />
  );
}
