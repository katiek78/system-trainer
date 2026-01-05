"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LogEntryForm from "@/components/LogEntryForm";

export default function EditEntry() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [entry, setEntry] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [publicJourneys, setPublicJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Fetch the log entry
        const entryRes = await fetch(`/api/logEntries/${id}`);
        if (!entryRes.ok) throw new Error("Failed to load entry");
        const entryData = await entryRes.json();
        setEntry(entryData.data);

        // Fetch journeys
        const journeysRes = await fetch("/api/journeys/names");
        if (journeysRes.ok) {
          const journeysData = await journeysRes.json();
          // Filter private and public journeys
          const privateJourneys = journeysData.filter((j) => j.userId);
          const publicJourneysData = journeysData.filter((j) => !j.userId);
          setJourneys(privateJourneys);
          setPublicJourneys(publicJourneysData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error}</p>;
  if (!entry) return null;

  const logEntryForm = {
    entryDate: entry.entryDate,
    discipline: entry.discipline,
    score: entry.score,
    correct: entry.correct,
    time: entry.time || "",
    journey: entry.journey,
    notes: entry.notes,
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">Edit log entry</h1>
        <LogEntryForm
          journeys={journeys}
          publicJourneys={publicJourneys}
          formId="edit-log-entry-form"
          forNewEntry={false}
          logEntryForm={logEntryForm}
        />
      </div>
    </>
  );
}
