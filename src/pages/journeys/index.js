import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import { useSearchParams } from "next/navigation";
import Journey from "@/models/Journey";
import JourneyFolder from "@/models/JourneyFolder";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faCopy,
  faEdit,
  faFolder,
  faFolderOpen,
  faFolderPlus,
  faArrowAltCircleRight,
} from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import { TRADITIONAL_DISCIPLINES, ML_DISCIPLINES } from "@/lib/disciplines";
import JourneyAssignment from "@/models/JourneyAssignment";

const JourneysPage = ({
  user,
  journeys,
  publicJourneys,
  assignments,
  folders,
}) => {
  //let user = useUser(); //should we be using this instead?
  const searchParams = useSearchParams();
  const startWithJourneyView =
    searchParams.get("startWithJourneyView") === "true" ||
    searchParams.get("startWithJourneyView") === "";
  const [message, setMessage] = useState("");
  const [isJourneyView, setIsJourneyView] = useState(
    startWithJourneyView || true
  );
  const [openFolders, setOpenFolders] = useState({});
  const [selectedJourneyId, setSelectedJourneyId] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const contentType = "application/json";
  const router = useRouter();

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateNewFolder = () => {
    //TODO
  };

  const handleClickJourney = (journeyId) => {
    router.push(`/journeys/${journeyId}`);
  };

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

  const handleMoveToFolder = async (journeyId, folderId) => {
    try {
      await fetch(`/api/journeys/${journeyId}/editFolder`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({
          folderId,
        }),
      });
      refreshData(router);
    } catch (error) {
      setMessage("Failed to move the journey to the folder.");
    }
    setShowFolderModal(false);
  };

  const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));

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
          <div key={assignment._id} className="mb-4 sm:p-2">
            {assignment.journeySets.map((set, i) => (
              <div key={i} className="mb-1">
                <strong>Option {i + 1}:</strong>{" "}
                <span className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl text-white font-medium text-lg shadow-sm border border-blue-900 mr-2">
                  {set.journeyIDs.map((id, j) => {
                    //const journeyName = getNameFromJourneyID(id);
                    return (
                      <>
                        <span key={id} onClick={() => handleClickJourney(id)}>
                          {getNameFromJourneyID(id)}
                        </span>
                        {j < set.journeyIDs.length - 1 && (
                          <span className="mx-1"> + </span>
                        )}
                      </>
                    );
                  })}
                </span>
                <span className="ml-5 text-xs">
                  (points:{" "}
                  {set.journeyIDs.reduce((acc, id) => {
                    const journey = journeys.find(
                      (journey) => journey._id === id
                    );
                    return acc + (journey?.pointsCount || 0);
                  }, 0)}
                  )
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
        <div className="bg-white dark:bg-slate-800 text-sm sm:text-lg py-5 px-5 rounded">
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
            className={`cursor-pointer mr-3 mb-3 text-sm sm:text-lg md:text-3xl ${
              isJourneyView ? "active-view" : ""
            }`}
          >
            Journeys
          </p>
          <p className="text-sm sm:text-lg md:text-3xl mr-3">|</p>
          <p
            onClick={handleAssignmentView}
            className={`cursor-pointer mr-3 mb-3 text-sm sm:text-lg md:text-3xl ${
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

              <Link href="/newJourney">
                <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                  Add new journey
                </button>
              </Link>
              <Link href="/newFolder">
                <button className="btn bg-black hover:bg-gray-700 ml-3 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                  Add new folder
                </button>
              </Link>
              <br />
              <br />
              {folders.length > 0 &&
                sortedFolders.map((folder) => {
                  const journeysInFolder = journeys.filter(
                    (j) => j.folderId === folder._id
                  );
                  return (
                    <div
                      key={folder._id}
                      onClick={() => toggleFolder(folder._id)}
                      className="font-semibold text-xl mb-2"
                    >
                      <FontAwesomeIcon
                        icon={openFolders[folder._id] ? faFolderOpen : faFolder}
                        className="text-yellow-500 w-5 h-5 mr-2"
                      />{" "}
                      {folder.name}
                      {openFolders[folder._id] && (
                        <ul className="ml-6 mt-2 space-y-1">
                          {journeysInFolder.length === 0 && (
                            <li className="text-sm flex items-center">
                              No journeys in this folder
                            </li>
                          )}
                          {journeysInFolder.length > 0 &&
                            journeysInFolder.map((journey) => (
                              <li
                                key={journey._id}
                                className="flex items-center"
                              >
                                <Link
                                  href="/journeys/[id]/"
                                  as={`/journeys/${journey._id}/`}
                                  legacyBehavior
                                >
                                  {journey.name}
                                </Link>
                                <span className="font-light">
                                  {" "}
                                  ({journey.pointsCount} points)
                                </span>
                                <FontAwesomeIcon
                                  className="ml-5 mr-5 cursor-pointer"
                                  onClick={() => handleDelete(journey._id)}
                                  icon={faTrash}
                                  size="1x"
                                />
                                <FontAwesomeIcon
                                  icon={faArrowAltCircleRight}
                                  className="cursor-pointer text-gray-600 hover:text-blue-500"
                                  onClick={() => {
                                    setSelectedJourneyId(journey._id);
                                    setShowFolderModal(true);
                                  }}
                                />
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  );
                })}

              {/* Journeys with no folder */}
              {journeys.length > 0 &&
                sortedJourneys
                  .filter((j) => !j.folderId)
                  .map((journey) => (
                    <p className="font-semibold text-xl">
                      {" "}
                      <Link
                        href="/journeys/[id]/"
                        as={`/journeys/${journey._id}/`}
                        legacyBehavior
                      >
                        {journey.name}
                      </Link>
                      <span className="font-light">
                        {" "}
                        ({journey.pointsCount} points)
                      </span>
                      <FontAwesomeIcon
                        className="ml-5 mr-5 cursor-pointer"
                        onClick={() => handleDelete(journey._id)}
                        icon={faTrash}
                        size="1x"
                      />
                      <FontAwesomeIcon
                        icon={faArrowAltCircleRight}
                        className="cursor-pointer text-gray-600 hover:text-blue-500"
                        onClick={() => {
                          setSelectedJourneyId(journey._id);
                          setShowFolderModal(true);
                        }}
                      />
                    </p>
                  ))}
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
            <div className="bg-white dark:bg-slate-800 py-5 px-2 sm:px-5 rounded">
              <details>
                <summary>
                  <span className="text-sm sm:text-lg md:text-2xl font-semibold">
                    Competition assignments
                  </span>
                </summary>
                <h3 className="font-semibold text-sm sm:text-lg">
                  Assigning journeys to competition disciplines
                </h3>
                <p className="font-mono text-sm sm:text-lg">
                  Here you can assign your journeys to different competition
                  disciplines, such as 5-minute Numbers or Speed Cards. You can
                  assign as many journeys as you like to each discipline, either
                  to be used consecutively (for long disciplines where one
                  journey may not be long enough) or as a rotation (for shorter
                  disciplines such as Memory League where you wish to have
                  multiple options).
                </p>
              </details>
              <br />

              <h3 className="font-semibold">Disciplines</h3>
              <div className="overflow-x-auto max-w-full">
                <div className="grid gap-4 sm:table overflow-x-hidden max-w-full">
                  <div className="hidden sm:table-header-group">
                    <div className="table-row bg-gray-200 max-w-full">
                      <div className="table-cell border border-gray-400 px-0 sm:px-4 py-2 font-semibold">
                        Discipline
                      </div>
                      <div className="table-cell border border-gray-400 px-0 sm:px-4 py-2 font-semibold">
                        Journeys (or journey groups)
                      </div>
                      <div className="table-cell border border-gray-400 px-0 sm:px-4 py-2"></div>
                    </div>
                  </div>

                  {[...ML_DISCIPLINES, ...TRADITIONAL_DISCIPLINES].map(
                    (discipline) => (
                      <div
                        key={discipline}
                        className="max-w-full sm:table-row border sm:border-none rounded sm:rounded-none shadow sm:shadow-none p-1 sm:p-4 bg-white"
                      >
                        <div className="sm:table-cell border sm:border border-gray-400 px-1 sm:px-4 py-2">
                          <div className="sm:hidden text-xs font-semibold text-gray-500 mb-1">
                            Discipline
                          </div>
                          {discipline}
                        </div>
                        <div className="sm:table-cell border sm:border border-gray-400 px-1 sm:px-4 py-2">
                          <div className="sm:hidden text-xs font-semibold text-gray-500 mb-1">
                            Journeys
                          </div>
                          {getAssignmentsForDiscipline(discipline)}
                        </div>
                        <div className="sm:table-cell border sm:border border-gray-400 px-1 sm:px-4 py-2">
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
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div>{message}</div>
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Move to Folder
            </h2>

            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {sortedFolders.map((folder) => (
                <li
                  key={folder._id}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-800 dark:text-gray-100"
                  onClick={() =>
                    handleMoveToFolder(selectedJourneyId, folder._id)
                  }
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="mr-2 text-yellow-500"
                  />
                  {folder.name}
                </li>
              ))}
            </ul>

            <div className="flex justify-end mt-4">
              <button
                className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white mr-2"
                onClick={() => setShowFolderModal(false)}
              >
                Cancel
              </button>

              <button
                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                onClick={() => handleCreateNewFolder()}
              >
                <FontAwesomeIcon icon={faFolderPlus} className="mr-2" />
                Create New Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JourneysPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
    const db = await dbConnect();
    const user = auth0User.user;

    //get name, length, folderID and ID of private journeys
    const journeys = await Journey.aggregate([
      { $match: { userId: user.sub } },
      {
        $project: {
          name: 1,
          folderId: 1,
          pointsCount: { $size: { $ifNull: ["$points", []] } },
        },
      },
    ]);
    journeys.forEach((j) => (j._id = j._id.toString()));

    //get journey folders for this user
    const foldersResult = await JourneyFolder.find({ userId: user.sub });
    const folders = foldersResult.map((doc) => {
      const folder = JSON.parse(JSON.stringify(doc));
      folder._id = folder._id.toString();
      return folder;
    });

    //get name and ID of public images sets
    const publicJourneyResult = await Journey.find(
      { $or: [{ userId: null }, { userId: { $exists: false } }] },
      { name: 1 }
    );
    const publicJourneys = publicJourneyResult.map((doc) => {
      const journey = JSON.parse(JSON.stringify(doc));
      journey._id = journey._id.toString();
      return journey;
    });

    //get assignments
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
        folders,
      },
    };
  },
});
