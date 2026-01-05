"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";
import PointForm from "@/components/PointForm";

export default function NewPointPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, error, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <p>Loading...</p>;

  const journeyId = params.id;
  const insertAt = searchParams.get("insertAt");
  const pointIndex = insertAt ? parseInt(insertAt) : null;

  const pointForm = {
    name: "",
    location: "",
    heading: 90,
    pitch: 0,
    fov: 100,
    memoItem: "",
    memoPic: "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full">
        <h1 className="py-2 font-mono text-4xl">New journey point</h1>
        <PointForm
          formId="add-point-form"
          pointForm={pointForm}
          forNewPoint={true}
          journeyId={journeyId}
          pointIndex={pointIndex}
        />
      </div>
    </>
  );
}
