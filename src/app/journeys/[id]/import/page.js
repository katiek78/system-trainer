"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";
import ImportLocationsForm from "@/components/ImportLocationsForm";

export default function ImportLocationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, error, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <p>Loading...</p>;

  const journeyId = params.id;

  const importLocationsForm = {
    locationList: "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full">
        <h1 className="py-2 font-mono text-4xl">Import locations</h1>
        <ImportLocationsForm
          formId="import-locations-form"
          importLocationsForm={importLocationsForm}
        />
      </div>
    </>
  );
}
