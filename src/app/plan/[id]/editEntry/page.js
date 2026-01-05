"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PlanEntryForm from "@/components/PlanEntryForm";

export default function EditPlanEntry() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const entryRes = await fetch(`/api/planEntries/${id}`);
        if (!entryRes.ok) throw new Error("Failed to load entry");
        const entryData = await entryRes.json();
        setEntry(entryData.data);
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

  const planEntryForm = {
    discipline: entry.discipline,
    frequency: entry.frequency,
    frequencyType: entry.frequencyType,
    frequencySpecifics: entry.frequencySpecifics,
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">Edit entry</h1>
        <PlanEntryForm
          formId="edit-plan-entry-form"
          forNewEntry={false}
          planEntryForm={planEntryForm}
        />
      </div>
    </>
  );
}
