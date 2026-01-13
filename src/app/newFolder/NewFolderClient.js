"use client";
import JourneyFolderForm from "@/components/JourneyFolderForm";

export default function NewFolderClient({ userId, journeyFolderForm }) {
  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Add new folder</h1>
      <JourneyFolderForm userId={userId} formId="newFolderForm" journeyFolderForm={journeyFolderForm} forNewJourneyFolder={true} />
    </div>
  );
}
