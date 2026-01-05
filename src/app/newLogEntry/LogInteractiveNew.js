"use client";

import LogEntryForm from "@/components/LogEntryForm";

export default function LogInteractiveNew({ journeys, publicJourneys, logEntryForm }) {
  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">New training log entry</h1>

        <LogEntryForm
          journeys={journeys}
          publicJourneys={publicJourneys}
          formId="add-log-entry-form"
          logEntryForm={logEntryForm}
        />
      </div>
    </>
  );
}
