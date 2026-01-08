"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";

// Component to render strings with colored suit symbols
function ItemDisplay({ item }) {
  if (!item) return <span>-</span>;
  
  if (typeof item === "string") {
    const parts = [];
    let currentText = "";
    
    for (let i = 0; i < item.length; i++) {
      const char = item[i];
      if (char === "♥" || char === "♦") {
        if (currentText) {
          parts.push(<span key={`text-${i}`}>{currentText}</span>);
          currentText = "";
        }
        parts.push(<span key={`suit-${i}`} style={{ color: "red" }}>{char}</span>);
      } else if (char === "♠" || char === "♣") {
        if (currentText) {
          parts.push(<span key={`text-${i}`}>{currentText}</span>);
          currentText = "";
        }
        parts.push(<span key={`suit-${i}`} style={{ color: "black" }}>{char}</span>);
      } else {
        currentText += char;
      }
    }
    
    if (currentText) {
      parts.push(<span key="text-final">{currentText}</span>);
    }
    
    return parts.length > 0 ? <>{parts}</> : <span>{item}</span>;
  }
  
  return <span>{item}</span>;
}

function DrillHistoryContent() {
  const searchParams = useSearchParams();
  const imageSetParam = searchParams?.get("imageSet") || "";
  const [drillAttempts, setDrillAttempts] = useState([]);
  const [imageSetMap, setImageSetMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drillAttempts");
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          setDrillAttempts(data.data.slice(0, 50));

          // Get unique image set IDs
          const imageSetIds = [...new Set(data.data.map((d) => d.imageSetId))];

          // Fetch image set names
          const setPromises = imageSetIds.map((id) =>
            fetch(`/api/imageSets/getName?id=${id}`).then((r) => r.json())
          );
          const sets = await Promise.all(setPromises);

          const map = {};
          sets.forEach((set, idx) => {
            if (set && set.name) {
              map[imageSetIds[idx]] = set.name;
            }
          });
          setImageSetMap(map);
        }
      }
    } catch (error) {
      console.error("Failed to fetch drill history:", error);
    }
    setLoading(false);
  };

  const deleteAttempt = async (attemptId) => {
    if (!confirm("Delete this drill attempt?")) return;
    try {
      await fetch("/api/drillAttempts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attemptId }),
      });
      fetchData(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete drill attempt:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex justify-center bg-transparent">
      <div className="z-10 font-mono text-lg w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
        <div className="flex justify-between items-center mt-4 mb-2">
          <Link
            href="/training"
            className="text-blue-700 hover:underline font-bold"
          >
            &larr; Back to Training page
          </Link>
          {imageSetParam && (
            <Link
              href={`/training/drills?imageSet=${imageSetParam}`}
              className="text-blue-700 hover:underline font-bold"
            >
              &larr; Back to Drills
            </Link>
          )}
        </div>

        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Drill History
        </h1>

        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
          {drillAttempts.length === 0 ? (
            <p className="text-center text-gray-500">
              No drill attempts recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-400 dark:border-gray-600">
                <thead>
                  <tr>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-left">
                      Date
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-left">
                      Image Set
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-left">
                      Subset
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-center">
                      Items
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-center">
                      Rounds
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-right">
                      Total Time
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-right">
                      Avg/Item
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-right">
                      Target
                    </th>
                    <th className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {drillAttempts.map((attempt) => {
                    const avgTime =
                      attempt.totalTimeSeconds / attempt.itemsAttempted;
                    return (
                      <tr
                        key={attempt._id.toString()}
                        className="hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700">
                          {new Date(attempt.date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700">
                          {imageSetMap[attempt.imageSetId] || "Unknown"}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700">
                          <ItemDisplay item={attempt.subsetDescription || "-"} />
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-center">
                          {attempt.itemsAttempted}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-center">
                          {attempt.roundsCompleted}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-right">
                          {attempt.totalTimeSeconds.toFixed(1)}s
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-right">
                          {avgTime.toFixed(2)}s
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-right">
                          {attempt.targetTimeSeconds
                            ? `${attempt.targetTimeSeconds}s`
                            : "-"}
                        </td>
                        <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-center">
                          <button
                            onClick={() => deleteAttempt(attempt._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold text-xl"
                            title="Delete"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DrillAttemptsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex justify-center items-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <DrillHistoryContent />
    </Suspense>
  );
}
