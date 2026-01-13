"use client";
import JourneyForm from "@/components/JourneyForm";

export default function NewJourneyClient({ userId, journeyForm }) {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Add new journey</h1>
      <JourneyForm userId={userId} formId="newJourneyForm" journeyForm={journeyForm} forNewJourney={true} />
    </div>
  );
}
