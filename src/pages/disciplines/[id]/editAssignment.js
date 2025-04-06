import { useState, useEffect } from "react";
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router";
import Journey from "@/models/Journey";
import dbConnect from "@/lib/dbConnect";
//import AssignmentForm from "@/components/AssignmentForm";

const EditAssignment = ({ user, journeys }) => {
  const router = useRouter();
  const discipline = router.query.id;

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [
    isShowingNewOptionJourneyDropdown,
    setIsShowingNewOptionJourneyDropdown,
  ] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState(null);

  useEffect(() => {
    if (!discipline || !user) return;

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/disciplines?discipline=${discipline}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch assignment");
        const data = await res.json();
        if (data?.data) {
          setAssignment(data.data);
          console.log(data.data);
        } else {
          setAssignment(null);
          console.log("No assignments found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [discipline, user]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const planEntryForm = {
    // discipline: entry.discipline,
    // frequency: entry.frequency,
    // frequencyType: entry.frequencyType,
    // frequencySpecifics: entry.frequencySpecifics,
  };

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
      if (!assignment) {
        // POST: No existing assignment, create new one
        method = "POST";
        res = await fetch(`/api/disciplines?discipline=${discipline}`, {
          method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            journeyId: selectedJourney, // Create a new assignment with a single journeyID
          }),
        });
      } else {
        // PUT: Existing assignment, add new journeyID to the journeySets array
        method = "PUT";
        res = await fetch(`/api/disciplines?discipline=${discipline}`, {
          method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            journeySets: [
              ...assignment.journeySets,
              { journeyIDs: [selectedJourney] }, // Append a new journey set with the selected journey
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
    }
  };

  const handleRemoveJourney = (journeyId, journeySetIndex, journeyIndex) => {
    const updatedAssignment = { ...assignment };
    updatedAssignment.journeySets[journeySetIndex].journeyIDs.splice(
      journeyIndex,
      1
    );
    setAssignment(updatedAssignment);

    //need to save it too!
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
        {/* <AssignmentForm
          userId={user.sub}
          formId="edit-assignment-form"
          assignmentForm={assignmentForm}
        /> */}

        {!loading && assignment && (
          <>
            {/* <h1>Journeys assigned to {assignment.discipline}</h1> */}
            <table className="border responsive-table">
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Journey(s)</th>
                </tr>
              </thead>
              <tbody>
                {assignment.journeySets.map((journeySet, i) => (
                  <tr key={journeySet._id}>
                    <td>{i + 1}</td>
                    <td>
                      {journeySet.journeyIDs.map((journey, index) => (
                        <span
                          key={journey}
                          className="inline-flex items-center space-x-2 p-1 bg-gray-200 rounded-full text-sm"
                        >
                          <span>{getNameFromJourneyID(journey)}</span>
                          <button
                            onClick={() =>
                              handleRemoveJourney(journey, i, index)
                            }
                            className="text-red-500 hover:text-red-700"
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
                          {index < journeySet.journeyIDs.length - 1 && (
                            <span className="text-xl font-bold">+</span>
                          )}
                        </span>
                      ))}
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
          Assign one of your journeys to this discipline
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
              {journeys.map((journey) => (
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
};

export default EditAssignment;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    const db = await dbConnect();

    const result2 = await Journey.find({ userId: user.sub }, { name: 1 });
    const journeys = result2.map((doc) => {
      const journey = JSON.parse(JSON.stringify(doc));
      journey._id = journey._id.toString();
      return journey;
    });

    return { props: { user, journeys } };
  },
});
