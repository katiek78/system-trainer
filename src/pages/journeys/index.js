import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import { useSearchParams } from "next/navigation";
import Journey from "@/models/Journey";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCopy, faEdit } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import { TRADITIONAL_DISCIPLINES, ML_DISCIPLINES } from "@/lib/disciplines";
import JourneyAssignment from "@/models/JourneyAssignment";

const JourneysPage = ({ user, journeys, publicJourneys, assignments }) => {
  //let user = useUser(); //should we be using this instead?
  const searchParams = useSearchParams();
  const startWithJourneyView =
    searchParams.get("startWithJourneyView") === "true";
  const [message, setMessage] = useState("");
  const [isJourneyView, setIsJourneyView] = useState(startWithJourneyView);
  const contentType = "application/json";
  const router = useRouter();

  console.log(assignments);

  const handleJourneyView = () => {
    setIsJourneyView(true);
  };

  const handleAssignmentView = () => {
    setIsJourneyView(false);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this journey?"
    );
    if (confirmed) {
      //remove it from the database
      try {
        await fetch(`/api/journeys/${id}`, {
          method: "Delete",
        });
        refreshData(router);
      } catch (error) {
        setMessage("Failed to delete the journey.");
      }
    }
  };

  const handleCopyPublic = async (id) => {
    try {
      // Fetch the details of the public image set based on the ID
      const publicJourneyResponse = await fetch(`/api/journeys/${id}`, {
        method: "GET",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
      });

      if (!publicJourneyResponse.ok) {
        throw new Error(
          publicJourneyResponse.status + " when fetching journey"
        );
      }

      // Extract the public journey data
      const { data } = await publicJourneyResponse.json();

      // Modify the retrieved data to include the user's ID
      const { _id, ...modifiedJourneyData } = data;
      modifiedJourneyData.userId = user.sub; // Assuming user.sub contains the user's ID

      // POST the modified data to create a copy in the user's private sets
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(modifiedJourneyData),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status + " when copying journey");
      }

      router.push({ pathname: `/journeys` });
    } catch (error) {
      setMessage("Failed to copy journey. " + error);
    }
  };

  const sortedJourneys = journeys.sort((a, b) => a.name.localeCompare(b.name));
  const sortedPublicJourneys = publicJourneys.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const getNameFromJourneyID = (id) => {
    const journey = journeys.find((journey) => journey._id === id);
    return journey ? journey.name : "Unknown";
  };

  const getAssignmentsForDiscipline = (d) => {
    const matchingAssignments = assignments.filter((a) => a.discipline === d);

    if (matchingAssignments.length === 0) {
      return <p></p>;
    }

    return (
      <div>
        {matchingAssignments.map((assignment) => (
          <div key={assignment._id} className="mb-4 p-2">
            {assignment.journeySets.map((set, i) => (
              <div key={i} className="mb-1">
                <strong>Option {i + 1}:</strong>{" "}
                <span className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl text-white font-medium text-lg shadow-sm border border-blue-900 mr-2">
                  {set.journeyIDs
                    .map((id) => getNameFromJourneyID(id))
                    .join(" + ")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">Journeys</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">What is a journey?</h3>
          <p className="font-mono">
            A journey (or memory palace) is a series of locations (or loci) that
            you will use, and maybe re-use, to memorise information. Once you've
            created some journeys, you can click 'Competition assignments' to
            assign your journeys to memory competition disciplines.
          </p>
        </div>
        <br />
        <div className="flex justify-center">
          <p
            onClick={handleJourneyView}
            className={`cursor-pointer mr-3 mb-3 lg:text-3xl sm:text-2xl ${
              isJourneyView ? "active-view" : ""
            }`}
          >
            Journeys
          </p>
          <p className="lg:text-3xl sm:text-2xl mr-3">|</p>
          <p
            onClick={handleAssignmentView}
            className={`cursor-pointer mr-3 mb-3 lg:text-3xl sm:text-2xl ${
              !isJourneyView ? "active-view" : ""
            }`}
          >
            Competition assignments
          </p>
        </div>

        {isJourneyView ? (
          <>
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
              <h2 className="text-2xl font-semibold">My journeys</h2>
              <p className="font-mono">
                You currently have{" "}
                {journeys.length === 0 ? "no " : journeys.length + " "}{" "}
                {journeys.length === 1 ? "journey" : "journeys"}.
              </p>
              <br />
              {journeys.length > 0 &&
                sortedJourneys.map((journey) => (
                  <p className="font-semibold">
                    {" "}
                    <Link
                      href="/journeys/[id]/"
                      as={`/journeys/${journey._id}/`}
                      legacyBehavior
                    >
                      {journey.name}
                    </Link>
                    <FontAwesomeIcon
                      className="ml-5 cursor-pointer"
                      onClick={() => handleDelete(journey._id)}
                      icon={faTrash}
                      size="1x"
                    />
                  </p>
                ))}
              <Link href="/newJourney">
                <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                  Add new journey
                </button>
              </Link>
            </div>

            <br />
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
              <h2 className="text-2xl font-semibold">Public journeys</h2>
              <p className="font-mono">
                There {publicJourneys.length === 1 ? "is" : "are"}{" "}
                {publicJourneys.length} public{" "}
                {publicJourneys.length === 1 ? "journey" : "journeys"}{" "}
                available. Click the <FontAwesomeIcon icon={faCopy} size="1x" />{" "}
                icon next to a journey to make a private copy of that journey,
                which you can then edit.
              </p>
              <br />
              {publicJourneys.length > 0 &&
                sortedPublicJourneys.map((journey) => (
                  <p className="font-semibold">
                    {" "}
                    <Link
                      href="/journeys/[id]/"
                      as={`/journeys/${journey._id}/`}
                      legacyBehavior
                    >
                      {journey.name}
                    </Link>{" "}
                    <FontAwesomeIcon
                      className="ml-5 cursor-pointer"
                      icon={faCopy}
                      size="1x"
                      onClick={() => handleCopyPublic(journey._id)}
                    />
                  </p>
                ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
              <h2 className="text-2xl font-semibold">
                Competition assignments
              </h2>
              <h3 className="font-semibold">
                Assigning journeys to competition disciplines
              </h3>
              <p className="font-mono">
                Here you can assign your journeys to different competition
                disciplines, such as 5-minute Numbers or Speed Cards. You can
                assign as many journeys as you like to each discipline, either
                to be used consecutively (for long disciplines where one journey
                may not be long enough) or as a rotation (for shorter
                disciplines such as Memory League where you wish to have
                multiple options).
              </p>
              <br />
              <p className="font-mono">
                <h3 className="font-semibold">Disciplines</h3>
                <table className="border-collapse border w-full responsive-table-plan">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 px-4 py-2">
                        Discipline
                      </th>
                      <th className="border border-gray-400 px-4 py-2">
                        Journeys (or journey groups)
                      </th>
                      <th className="border lg:border-gray-400 px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ML_DISCIPLINES.map((discipline) => (
                      <tr key={discipline}>
                        <td className="lg:border border-gray-400 px-4 py-2">
                          {discipline}
                        </td>
                        <td className="lg:border border-gray-400 px-4 py-2">
                          {getAssignmentsForDiscipline(discipline)}
                        </td>
                        <td className="lg:border border-gray-400 px-4 py-2">
                          {" "}
                          <Link
                            href="/disciplines/[id]/editAssignment"
                            as={`/disciplines/${discipline}/editAssignment`}
                            legacyBehavior
                          >
                            <FontAwesomeIcon
                              className="cursor-pointer"
                              icon={faEdit}
                              size="1x"
                            />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {TRADITIONAL_DISCIPLINES.map((discipline) => (
                      <tr key={discipline}>
                        <td className="lg:border border-gray-400 px-4 py-2">
                          {discipline}
                        </td>
                        <td className="lg:border border-gray-400 px-4 py-2">
                          {" "}
                          {getAssignmentsForDiscipline(discipline)}
                        </td>
                        <td className="lg:border border-gray-400 px-4 py-2">
                          {" "}
                          <Link
                            href="/disciplines/[id]/editAssignment"
                            as={`/disciplines/${discipline}/editAssignment`}
                            legacyBehavior
                          >
                            <FontAwesomeIcon
                              className="cursor-pointer"
                              icon={faEdit}
                              size="1x"
                            />
                          </Link>
                          {/* </Link> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </p>
            </div>
          </>
        )}
      </div>
      <div>{message}</div>
    </>
  );
};

export default JourneysPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
    const db = await dbConnect();
    const user = auth0User.user;

    //only want to send the name and ID of private journeys
    const result2 = await Journey.find({ userId: user.sub }, { name: 1 });
    const journeys = result2.map((doc) => {
      const journey = JSON.parse(JSON.stringify(doc));
      journey._id = journey._id.toString();
      return journey;
    });

    //only want to send the name and ID of public images sets
    const publicJourneyResult = await Journey.find(
      { $or: [{ userId: null }, { userId: { $exists: false } }] },
      { name: 1 }
    );
    const publicJourneys = publicJourneyResult.map((doc) => {
      const journey = JSON.parse(JSON.stringify(doc));
      journey._id = journey._id.toString();
      return journey;
    });

    const assignmentsResult = await JourneyAssignment.find({
      userId: user.sub,
    });
    const assignments = assignmentsResult.map((doc) => {
      const assignment = JSON.parse(JSON.stringify(doc));
      assignment._id = assignment._id.toString();
      return assignment;
    });

    // let user = await db.user.findUnique({ where: { email: auth0User?.user.email } });
    // if (!user) {
    //    user = db.user.create(auth0User?.user);
    // }
    return {
      props: {
        // dbUser: user,
        user: auth0User.user,
        // user: user,  //EVENTUALLY THIS
        journeys: journeys,
        publicJourneys: publicJourneys,
        assignments,
      },
    };
  },
});
