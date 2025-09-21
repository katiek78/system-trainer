import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PointForm from "@/components/PointForm";

const EditPoint = () => {
  const router = useRouter();
  const { id } = router.query;

  const [error, setError] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [point, setPoint] = useState(null);
  const [journeyId, setJourneyId] = useState(null);
  const [pointIndex, setPointIndex] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`/api/points/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const journey = Array.isArray(data.data) ? data.data[0] : data.data;
        const index = journey.points.findIndex((p) => p._id === id);
        if (index === -1) throw new Error("Point not found");

        setPoint(journey.points[index]);
        setJourneyId(journey._id);
        setPointIndex(index);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load");
        setLoading(false);
      });
  }, [id]);

  if (error) return <p>Failed to load: {error}</p>;
  if (isLoading) return <p>Loading...</p>;
  if (!point) return null; // wait until point is loaded

  const pointForm = {
    name: point.name,
    location: point.location,
    heading: point.heading,
    pitch: point.pitch,
    fov: point.fov,
    memoItem: point.memoItem,
    memoPic: point.memoPic,
  };

  return (
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full">
      <h1 className="py-2 font-mono text-4xl">Edit location</h1>
      <PointForm
        formId="add-point-form"
        pointForm={pointForm}
        forNewPoint={false}
        journeyId={journeyId}
        pointIndex={pointIndex}
      />
    </div>
  );
};

export default EditPoint;
