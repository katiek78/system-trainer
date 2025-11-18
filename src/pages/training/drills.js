import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const DrillsPage = () => {
  const router = useRouter();
  const { imageSet } = router.query;
  const [imageSetName, setImageSetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (imageSet) {
      setLoading(true);
      setError("");
      fetch(`/api/imageSets/getName?id=${imageSet}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.name) {
            setImageSetName(data.name);
          } else {
            setImageSetName("");
            setError("Image set not found");
          }
        })
        .catch(() => {
          setError("Error fetching image set name");
        })
        .finally(() => setLoading(false));
    }
  }, [imageSet]);

  return (
    <div className="w-full min-h-screen flex justify-center bg-transparent">
      <div className="z-10 font-mono text-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Drills
        </h1>
        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4 text-center">
          {loading ? (
            <p className="font-mono text-lg">Loading...</p>
          ) : error ? (
            <p className="font-mono text-lg text-red-600">{error}</p>
          ) : (
            <h2 className="font-semibold text-xl">{imageSetName}</h2>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillsPage;
