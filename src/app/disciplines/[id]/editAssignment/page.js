"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import "../../styles.css";

// Map discipline code to display label (if needed)
function getDisciplineLabel(code) {
  switch (code) {
    case "MN":
      return "ML Numbers";
    case "5N":
      return "5-minute Numbers";
    case "15N":
      return "15-minute Numbers";
    case "30N":
      return "30-minute Numbers";
    case "60N":
      return "Hour Numbers";
    default:
      return code;
  }
}

export default function EditAssignment() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useUser();
  const discipline = params.id;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return null;

  const [journeys, setJourneys] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [
    isShowingNewOptionJourneyDropdown,
    setIsShowingNewOptionJourneyDropdown,
  ] = useState(false);
  const [isShowingChainJourneyDropdown, setIsShowingChainJourneyDropdown] =
    useState(false);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [chainSetIndex, setChainSetIndex] = useState(null);

  // Fetch journeys
  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        const res = await fetch("/api/journeys/names");
        if (!res.ok) throw new Error("Failed to fetch journeys");
        const data = await res.json();
        setJourneys(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching journeys:", err);
        setJourneys([]);
      }
    };
    fetchJourneys();
  }, []);

  useEffect(() => {
    if (!discipline) return;

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/journeyAssignments?discipline=${discipline}`
        );
        if (!res.ok) throw new Error("Failed to fetch assignment");
        const data = await res.json();
        // data.options is an array of journey sets (arrays of {id, name})
        if (data?.options) {
          setAssignment({
            discipline,
            journeySets: data.options.map((opt) => ({
              journeyIDs: opt.map((j) => j.id),
            })),
          });
        } else {
          setAssignment(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [discipline]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const handleAssignNewOption = () => {
    setIsShowingNewOptionJourneyDropdown(true);
  };

  const handleCancelAssignNewOption = () => {
    setIsShowingNewOptionJourneyDropdown(false);
    setSelectedJourney(null);
  };

  const handleChangeSelectedJourney = (id) => {
    setSelectedJourney(id);
  };

  const handleSubmitAssignNewOption = async (e) => {
    // Hide the dropdown after selection
    setIsShowingNewOptionJourneyDropdown(false);
    setLoading(true); // Start loading state

    // Define request method and initialize response variable
    let method;
    let res;

    try {
      // Determine whether assignment exists to decide whether to POST or PUT
      if (
        !assignment ||
        !assignment.journeySets ||
        assignment.journeySets.length === 0
      ) {
        // POST: No existing assignment, create new one
        method = "POST";
        res = await fetch(`/api/journeyAssignments`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discipline,
            options: [[selectedJourney]],
          }),
        });
      } else {
        // POST: Overwrite all options (for simplicity, always use POST)
        method = "POST";
        res = await fetch(`/api/journeyAssignments`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discipline,
            options: [
              ...assignment.journeySets.map((set) => [...set.journeyIDs]),
              [selectedJourney],
            ],
          }),
        });
      }

      // Handle the response from the API
      if (!res.ok) throw new Error("Failed to assign new journey option");

      // Parse the JSON response
      const data = await res.json();

      // Handle success or empty assignment
      if (data?.data) {
        setAssignment(data.data); // Update the assignment state with the new data
        console.log(data); // Log the response for debugging
      } else {
        setAssignment(null); // Set assignment to null if no data found
        console.log("No assignments found");
      }
    } catch (err) {
      // Handle errors during the fetch or JSON parsing
      setError(err.message); // Set the error state to show an error message
      console.error(err); // Log the error for debugging
    } finally {
      // Stop loading state
      setLoading(false);
      setSelectedJourney(null);
    }
  };

  const handleRemoveJourney = async (journeySetIndex, journeyIndex) => {
    const updatedAssignment = { ...assignment };
    updatedAssignment.journeySets[journeySetIndex].journeyIDs.splice(
      journeyIndex,
      1
    );
    if (
      updatedAssignment.journeySets[journeySetIndex].journeyIDs.length === 0
    ) {
      updatedAssignment.journeySets.splice(journeySetIndex, 1);
    }
    setAssignment(updatedAssignment);

    try {
      // POST: Overwrite all options (removal)
      const res = await fetch(`/api/journeyAssignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discipline,
          options: updatedAssignment.journeySets.map((set) => [
            ...set.journeyIDs,
          ]),
        }),
      });

      // Handle the response from the API
      if (!res.ok) throw new Error("Failed to remove journey assignment");

      // Parse the JSON response
      const data = await res.json();

      // Handle success or empty assignment
      if (data?.data) {
        setAssignment(data.data); // Update the assignment state with the new data
        console.log(data); // Log the response for debugging
      } else {
        setAssignment(null); // Set assignment to null if no data found
        console.log("No assignments found");
      }
    } catch (err) {
      // Handle errors during the fetch or JSON parsing
      setError(err.message); // Set the error state to show an error message
      console.error(err); // Log the error for debugging
    } finally {
      // Stop loading state
      setLoading(false);
    }
  };

  const handleChainJourney = async (journeyIndex) => {
    setIsShowingChainJourneyDropdown(true);
    setChainSetIndex(journeyIndex);
  };

  const handleCancelChainJourney = () => {
    setIsShowingChainJourneyDropdown(false);
    setChainSetIndex(null);
  };

  const handleSubmitChainJourney = async (setIndex) => {
    setIsShowingChainJourneyDropdown(false);
    setLoading(true); // Start loading state

    try {
      const updatedJourneySets = [...assignment.journeySets];
      // Only update if the setIndex is valid
      if (
        setIndex >= 0 &&
        setIndex < updatedJourneySets.length &&
        !updatedJourneySets[setIndex].journeyIDs.includes(selectedJourney)
      ) {
        updatedJourneySets[setIndex] = {
          ...updatedJourneySets[setIndex],
          journeyIDs: [
            ...updatedJourneySets[setIndex].journeyIDs,
            selectedJourney,
          ],
        };
      }
      const res = await fetch(`/api/journeyAssignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discipline,
          options: updatedJourneySets.map((set) => [...set.journeyIDs]),
        }),
      });

      // Handle the response from the API
      if (!res.ok) throw new Error("Failed to chain new journey");

      // Parse the JSON response
      const data = await res.json();

      // Handle success or empty assignment
      if (data?.data) {
        setAssignment(data.data); // Update the assignment state with the new data
        console.log(data); // Log the response for debugging
      } else {
        setAssignment(null); // Set assignment to null if no data found
        console.log("No assignments found");
      }
    } catch (err) {
      // Handle errors during the fetch or JSON parsing
      setError(err.message); // Set the error state to show an error message
      console.error(err); // Log the error for debugging
    } finally {
      // Stop loading state
      setLoading(false);
    }

    setChainSetIndex(null);
  };

  const getNameFromJourneyID = (id) => {
    const journey = journeys.find((journey) => journey._id === id);
    return journey ? journey.name : "Unknown";
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">
          Edit journey assignment for {discipline}
        </h1>
        {!loading && !assignment && (
          <p>You have not assigned any journeys to this discipline yet.</p>
        )}

        <Link
          href={{
            pathname: "/journeys",
            query: { startWithJourneyView: "false" },
          }}
        >
          <button className="btn bg-black hover:bg-gray-700 text-white font-bold my-4 py-2 px-6 rounded focus:outline-none focus:shadow-outline">
            Back to Competition assignments
          </button>
        </Link>

        <br />
        {!loading && assignment && (
          <>
            <table className="border-collapse w-full responsive-table-assignments">
              <thead>
                <tr>
                  <th className="w-20">Option</th>
                  <th>Journey(s)</th>
                </tr>
              </thead>
              <tbody>
                {assignment.journeySets.map((journeySet, i) => (
                  <tr key={journeySet._id}>
                    <td className="w-20">{i + 1}</td>
                    <td>
                      {journeySet.journeyIDs.map((journey, index) => (
                        <>
                          <span
                            key={journey}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl text-white font-medium text-lg shadow-sm border border-blue-900 mr-2"
                          >
                            <span>{getNameFromJourneyID(journey)}</span>
                            <button
                              onClick={() => handleRemoveJourney(i, index)}
                              className="text-red-500 hover:text-red-700 focus:outline-none"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </span>
                          {index < journeySet.journeyIDs.length - 1 && (
                            <span className="mr-2 text-2xl font-bold">+</span>
                          )}
                        </>
                      ))}
                      <button
                        onClick={() => handleChainJourney(i)}
                        className={`btn font-bold ml-10 mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline ${
                          isShowingNewOptionJourneyDropdown
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : isShowingChainJourneyDropdown &&
                              chainSetIndex === i
                            ? "hidden"
                            : "bg-black hover:bg-gray-700 text-white"
                        }`}
                      >
                        Chain another
                      </button>
                      {isShowingChainJourneyDropdown && chainSetIndex === i && (
                        <>
                          <select
                            className="btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                            onChange={(e) => {
                              handleChangeSelectedJourney(e.target.value);
                            }}
                          >
                            {journeys
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((journey) => (
                                <option key={journey._id} value={journey._id}>
                                  {journey.name}
                                </option>
                              ))}
                          </select>
                          <button
                            className="bg-black hover:bg-gray-700 text-white btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => handleSubmitChainJourney(i)}
                          >
                            OK
                          </button>
                          <button
                            className="bg-black hover:bg-gray-700 text-white btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={handleCancelChainJourney}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <button
          onClick={handleAssignNewOption}
          disabled={isShowingNewOptionJourneyDropdown}
          className={`btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline ${
            isShowingNewOptionJourneyDropdown
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-black hover:bg-gray-700 text-white"
          }`}
        >
          Assign a journey to this discipline
        </button>
        <br />
        {isShowingNewOptionJourneyDropdown && (
          <>
            <select
              className="btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
              onChange={(e) => {
                handleChangeSelectedJourney(e.target.value);
              }}
            >
              {journeys
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((journey) => (
                  <option key={journey._id} value={journey._id}>
                    {journey.name}
                  </option>
                ))}
            </select>
            <br />
            <button
              className="bg-black hover:bg-gray-700 text-white btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleSubmitAssignNewOption}
            >
              OK
            </button>
            <button
              className="bg-black hover:bg-gray-700 text-white btn font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleCancelAssignNewOption}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}
