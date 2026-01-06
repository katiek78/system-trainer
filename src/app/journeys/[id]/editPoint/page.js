"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";
import useSWR from "swr";
import PointForm from "@/components/PointForm";

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data);

export default function EditPointPage() {
  const params = useParams();
  const router = useRouter();
  const { user, error: userError, isLoading: userLoading } = useUser();
  const pointId = params.id;

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, userLoading, router]);

  const {
    data: journeys,
    error,
    isLoading,
  } = useSWR(pointId ? `/api/points/${pointId}` : null, fetcher);

  if (userLoading || !user) return <p>Loading...</p>;
  if (error) return <p>Failed to load point data</p>;
  if (isLoading) return <p>Loading...</p>;
  if (!journeys || journeys.length === 0) return <p>Point not found</p>;

  // The API returns an array of journeys, we need the first one
  const journey = journeys[0];
  const point = journey.points.find((p) => p._id === pointId);

  if (!point) return <p>Point not found</p>;

  // Find the index of the point in the journey's points array
  const pointIndex = journey.points.findIndex((p) => p._id === pointId);

  const pointForm = {
    name: point.name || "",
    location: point.location || "",
    heading: point.heading || 90,
    pitch: point.pitch || 0,
    fov: point.fov || 100,
    memoItem: point.memoItem || "",
    memoPic: point.memoPic || "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full">
        <h1 className="py-2 font-mono text-4xl">Edit journey point</h1>
        <PointForm
          formId="edit-point-form"
          pointForm={pointForm}
          forNewPoint={false}
          journeyId={journey._id}
          pointIndex={pointIndex}
        />
      </div>
    </>
  );
}
