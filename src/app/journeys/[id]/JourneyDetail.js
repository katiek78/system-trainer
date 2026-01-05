"use client";
import "./styles.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEdit,
  faMap,
  faPlus,
  faTrash,
  faPlay,
  faArrowLeftLong,
  faArrowRightLong,
  faBackward,
  faForward,
  faPlusCircle,
  faRocket,
  faLink,
  faUnlink,
} from "@fortawesome/free-solid-svg-icons";
import dynamic from "next/dynamic";
import EmbedStreetView from "@/components/EmbedStreetView";
import EmbedStreetViewDynamic from "@/components/EmbedStreetViewDynamic";
import EmbedImage from "@/components/EmbedImage";

const JourneyMapSimple = dynamic(
  () => import("@/components/JourneyMapSimple"),
  {
    ssr: false,
    loading: () => <p>Loading map...</p>,
  }
);

export default function JourneyDetail({
  journey,
  journeys,
  linkedFromJourneys,
}) {
  const searchParams = useSearchParams();
  const pageFromUrl = searchParams.get("page");

  // --- STATE ---
  // --- STATE ---
  const [mounted, setMounted] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [journeyForm, setJourneyForm] = useState({ name: journey.name });
  const [isListView, setIsListView] = useState(true);
  const [currentPage, setCurrentPage] = useState(
    pageFromUrl ? parseInt(pageFromUrl) : 1
  );
  const [currentSlideshowPoint, setCurrentSlideshowPoint] = useState(0);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showMap2, setShowMap2] = useState(false);
  const [selectedPointIndexForLinking, setSelectedPointIndexForLinking] =
    useState(null);
  const [newJourneyName, setNewJourneyName] = useState("");
  const [allPoints, setAllPoints] = useState(null);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(400);
  // Simulate admin/public logic for demo (replace with real logic as needed)
  const isAdmin = true;
  const isPublicJourney = false;
  const PAGE_LIMIT = 20;

  // Sync currentPage with URL parameter
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [searchParams]);

  // --- HELPERS ---
  const isLocationStreetView = (location) => /^[-\d]/.test(location);
  const points = journey.points || [];
  const totalPages = Math.ceil(points.length / PAGE_LIMIT) || 1;
  const pagedPoints = points.slice(
    (currentPage - 1) * PAGE_LIMIT,
    currentPage * PAGE_LIMIT
  );

  // --- HANDLERS ---
  const handleChangeTitle = (e) =>
    setJourneyForm({ ...journeyForm, name: e.target.value });
  const handleToggleEditable = () => setIsEditable(!isEditable);

  const handleSubmitJourneyForm = async () => {
    try {
      const res = await fetch(`/api/journeys/${journey._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: journeyForm.name, points: [] }),
      });
      if (res.ok) {
        setIsEditable(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update journey", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this journey?")) return;
    try {
      await fetch(`/api/journeys/${journey._id}`, {
        method: "DELETE",
      });
      window.location.href = "/journeys";
    } catch (error) {
      console.error("Failed to delete journey", error);
    }
  };

  const handleDeletePoint = async (pointID) => {
    if (!confirm("Are you sure you want to delete this point?")) return;
    try {
      await fetch(`/api/points/${pointID}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete point", error);
    }
  };

  const handleInsertPointAt = (insertAt) => {
    window.location.href = `/journeys/${journey._id}/new?insertAt=${insertAt}`;
  };

  const movePointBackwards = async (pointIndex) => {
    try {
      await fetch(`/api/journeys/${journey._id}/reorderPoint`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointIndex,
          direction: "b",
        }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to move point", error);
    }
  };

  const movePointForwards = async (pointIndex) => {
    try {
      await fetch(`/api/journeys/${journey._id}/reorderPoint`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointIndex,
          direction: "f",
        }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to move point", error);
    }
  };

  const handleSlideshow = () => {
    setIsListView(false);
    setAllPoints(points);
    setCurrentSlideshowPoint(0);
  };
  const handleGallery = () => {
    setIsListView(true);
    setCurrentPage(1);
  };
  const handlePrevious = () =>
    setCurrentSlideshowPoint((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setCurrentSlideshowPoint((prev) =>
      Math.min(prev + 1, (allPoints || points).length - 1)
    );
  const handleGoToStart = () => setCurrentSlideshowPoint(0);
  const handleGoToEnd = () =>
    setCurrentSlideshowPoint((allPoints || points).length - 1);

  const handleLinkJourney = (pointIndex) => {
    setSelectedPointIndexForLinking(pointIndex);
    setShowJourneyModal(true);
  };

  const linkJourney = async (pointIndex, linkedJourneyID) => {
    try {
      await fetch(`/api/journeys/${journey._id}/linkJourney`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointIndex,
          linkedJourneyID,
        }),
      });
      setShowJourneyModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to link journey", error);
    }
  };

  const handleUnlinkJourney = async (pointIndex) => {
    try {
      await fetch(`/api/journeys/${journey._id}/linkJourney`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointIndex,
        }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to unlink journey", error);
    }
  };

  const handleCreateNewJourney = async () => {
    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newJourneyName }),
      });
      if (!res.ok) throw new Error(res.status);
      const { data } = await res.json();
      const newlyCreatedJourneyID = data._id;
      await linkJourney(selectedPointIndexForLinking, newlyCreatedJourneyID);
    } catch (error) {
      console.error("Failed to create journey", error);
    }
  };

  const handleCreateNewJourneyClick = () => {
    if (newJourneyName.trim()) {
      handleCreateNewJourney();
    }
    setShowJourneyModal(false);
  };
  const handleNameChange = (e) => setNewJourneyName(e.target.value);

  const handleToggleMap2 = async () => {
    if (!showMap2) {
      // Fetch all points if not already loaded
      if (!allPoints) {
        try {
          const res = await fetch(`/api/journeys/${journey._id}`);
          const data = await res.json();
          if (data.success && data.data.points) {
            setAllPoints(data.data.points);
          }
        } catch (error) {
          console.error("Failed to fetch all points", error);
        }
      }
    }
    setShowMap2(!showMap2);
  };

  // --- EFFECTS ---
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (window.innerWidth < 600) {
        setWidth(300);
        setHeight(200);
      } else if (window.innerWidth > 1350) {
        setWidth(1200);
        setHeight(700);
      } else {
        setWidth(500);
        setHeight(400);
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // --- RENDER ---
  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="z-10 justify-between font-mono pl-2 md:pl-2 lg:pl-0">
      <h3 className="underline py-0 font-mono text-sm md:text-md lg:text-lg">
        <Link href="/journeys">Back to Journeys</Link>
      </h3>
      <h2 className="py-2 font-mono text-2xl md:text-3xl lg:text-5xl ">
        <FontAwesomeIcon icon={faMap} color="palegoldenrod" className="mr-5" />
        {isEditable ? (
          <input
            onChange={handleChangeTitle}
            className="text-2xl md:text-3xl lg:text-5xl "
            style={{ width: "90%" }}
            value={journeyForm.name}
          />
        ) : (
          journeyForm.name
        )}
        {isEditable ? (
          <FontAwesomeIcon
            className="hover:text-gray-700 hover:cursor-pointer ml-5"
            icon={faCheck}
            size="1x"
            onClick={handleSubmitJourneyForm}
          />
        ) : (
          <FontAwesomeIcon
            className="hover:text-gray-700 hover:cursor-pointer ml-5"
            onClick={handleToggleEditable}
            icon={faEdit}
            size="1x"
          />
        )}
        <FontAwesomeIcon
          className="hover:text-gray-700 hover:cursor-pointer ml-5"
          icon={faTrash}
          size="1x"
          onClick={handleDelete}
        />
      </h2>
      {linkedFromJourneys && linkedFromJourneys.length > 0 && (
        <div className="mb-2 text-md md:text-lg lg:text-xl font-mono">
          <span className="font-semibold">Linked from:</span>
          {linkedFromJourneys.map((j) => (
            <span key={j._id} className="ml-2">
              <Link
                href={`/journeys/${j._id}`}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {j.name}
              </Link>
            </span>
          ))}
        </div>
      )}
      <div className="journey-btn-container">
        <div className="journey-btn-container flex flex-wrap gap-2 items-center mt-3">
          {points.length > 0 && (
            <button
              onClick={handleToggleMap2}
              className="btn bg-blue-600 hover:bg-blue-800 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {showMap2 ? "Hide journey map" : "Create journey map"}
            </button>
          )}
          {(!isPublicJourney || isAdmin) && journey && journey._id && (
            <>
              <Link
                href={`/journeys/${journey._id}/new?insertAt=${
                  (currentPage - 1) * PAGE_LIMIT + points.length
                }`}
              >
                <button className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                  Add a location
                </button>
              </Link>
              <Link href={`/journeys/${journey._id}/import`}>
                <button className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2">
                  Import locations
                </button>
              </Link>
            </>
          )}
          {points.length > 0 &&
            (isListView ? (
              <button
                onClick={handleSlideshow}
                className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Slideshow
              </button>
            ) : (
              <button
                onClick={handleGallery}
                className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Gallery
              </button>
            ))}
        </div>
      </div>
      <div
        className="relative w-full overflow-hidden py-2 md:py-0 lg:py-0 px-2 lg:px-5 rounded bg-white dark:bg-slate-800"
        style={{ minHeight: "400px" }}
      >
        {showMap2 && allPoints && (
          <div className="mb-5">
            <JourneyMapSimple
              key={`map2-${journey._id}-${allPoints.length}`}
              points={allPoints
                .map((p, idx) => ({
                  ...p,
                  originalIndex: idx + 1,
                }))
                .filter((p) => p.location && isLocationStreetView(p.location))}
              width={width}
              height={height}
            />
          </div>
        )}
        {isListView ? (
          <>
            <h2 className="mb-5 text-lg md:text-2xl lg:text-2xl font-semibold">
              Locations:
            </h2>
            <div className="mb-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Link
                    href={`/journeys/${journey._id}?page=${page}`}
                    key={page}
                  >
                    <button
                      className={`btn mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline ${
                        currentPage === page
                          ? "bg-green-500 text-black font-bold"
                          : "bg-black hover:bg-gray-700 text-white font-bold"
                      }`}
                    >
                      {page}
                    </button>
                  </Link>
                )
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {pagedPoints.map((point, i) => (
                <div
                  className="point-card flex flex-col justify-between items-center relative mb-4 p-3 border border-gray-300 rounded-lg shadow-md hover:shadow-xl transition duration-300"
                  key={point._id || i}
                >
                  <div className="card-content w-full px-0 md:px-1 lg:px-2 flex flex-col justify-center items-center h-full overflow-hidden">
                    <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                      {(currentPage - 1) * PAGE_LIMIT + i + 1}. {point.name}
                    </p>
                    <div
                      className="street-view-container relative"
                      style={{ minHeight: "150px" }}
                    >
                      {point.location &&
                      isLocationStreetView(point.location) ? (
                        <EmbedStreetView
                          width={300}
                          height={150}
                          location={point.location}
                          heading={point.heading || 90}
                          pitch={point.pitch || 0}
                          fov={point.fov || 100}
                        />
                      ) : point.location ? (
                        <EmbedImage
                          width={300}
                          height={200}
                          location={point.location}
                        />
                      ) : null}
                      {point.memoPic && (
                        <img
                          src={point.memoPic}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 md:h-20 w-auto object-contain z-20"
                          alt="Memo"
                        />
                      )}
                    </div>
                    <div className="w-full flex flex-col justify-center items-center">
                      <p className="text-2xl point-name max-w-full text-center whitespace-normal break-words">
                        {point.memoItem}
                      </p>
                      {point.linkedJourneyID && (
                        <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                          <Link
                            href={`/journeys/${point.linkedJourneyID}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <>
                              <FontAwesomeIcon
                                icon={faRocket}
                                color="red"
                                size="1x"
                                title="Teleport to linked journey"
                              />{" "}
                              {journeys.find(
                                (j) => j._id === point.linkedJourneyID
                              )?.name || "Unnamed Journey"}
                            </>
                          </Link>
                        </p>
                      )}
                    </div>
                    {(!isPublicJourney || isAdmin) && (
                      <>
                        <div className="icon-container flex flex-row space-x-3 mt-2 px-3 pb-5 justify-evenly">
                          <FontAwesomeIcon
                            onClick={() => {
                              handleInsertPointAt(
                                (currentPage - 1) * PAGE_LIMIT + i
                              );
                            }}
                            icon={faPlusCircle}
                            size="2x"
                            title="Insert point before"
                            className="cursor-pointer hover:text-blue-500"
                          />

                          {!(i === 0 && currentPage === 1) && (
                            <FontAwesomeIcon
                              onClick={() =>
                                movePointBackwards(
                                  (currentPage - 1) * PAGE_LIMIT + i
                                )
                              }
                              icon={faArrowLeftLong}
                              size="2x"
                              title="Move point backwards"
                              className="cursor-pointer hover:text-blue-500"
                            />
                          )}

                          {!point.linkedJourneyID && (
                            <FontAwesomeIcon
                              onClick={() =>
                                handleLinkJourney(
                                  (currentPage - 1) * PAGE_LIMIT + i
                                )
                              }
                              icon={faLink}
                              size="2x"
                              title="Link a journey"
                              className="cursor-pointer hover:text-blue-500"
                            />
                          )}

                          {point.linkedJourneyID && (
                            <FontAwesomeIcon
                              onClick={() =>
                                handleUnlinkJourney(
                                  (currentPage - 1) * PAGE_LIMIT + i
                                )
                              }
                              icon={faUnlink}
                              size="2x"
                              title="Unlink journey"
                              className="cursor-pointer hover:text-blue-500"
                            />
                          )}

                          {!(
                            i === points.length - 1 &&
                            currentPage === totalPages
                          ) && (
                            <FontAwesomeIcon
                              onClick={() =>
                                movePointForwards(
                                  (currentPage - 1) * PAGE_LIMIT + i
                                )
                              }
                              className="cursor-pointer hover:text-blue-500"
                              icon={faArrowRightLong}
                              size="2x"
                              title="Move point forwards"
                            />
                          )}

                          <FontAwesomeIcon
                            onClick={() => {
                              handleInsertPointAt(
                                (currentPage - 1) * PAGE_LIMIT + i + 1
                              );
                            }}
                            icon={faPlusCircle}
                            size="2x"
                            title="Insert point after"
                            className="cursor-pointer hover:text-blue-500"
                          />
                        </div>
                        <div className="icon-container flex flex-row space-x-3 px-3 pb-5 justify-end items-end">
                          <Link href={`/journeys/${point._id}/editPoint`}>
                            <FontAwesomeIcon
                              title="Edit this point"
                              icon={faEdit}
                              size="2x"
                              className="cursor-pointer hover:text-blue-500"
                            />
                          </Link>
                          <FontAwesomeIcon
                            title="Delete this point"
                            className="ml-5 cursor-pointer hover:text-red-500"
                            icon={faTrash}
                            size="2x"
                            onClick={() => handleDeletePoint(point._id)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {journey && journey._id && (!isPublicJourney || isAdmin) && (
                <div className="plusIcon flex items-center justify-center mb-16">
                  <Link
                    href={`/journeys/${journey._id}/new?insertAt=${
                      (currentPage - 1) * PAGE_LIMIT + pagedPoints.length
                    }`}
                  >
                    <FontAwesomeIcon
                      className="cursor-pointer bg-gray-200 rounded p-10 dark:bg-black"
                      icon={faPlus}
                      size="5x"
                    />
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          allPoints &&
          allPoints[currentSlideshowPoint] && (
            <div className="p-2 lg:p-5 flex flex-wrap justify-center">
              <div className="point-card-container flex justify-center">
                <div className="point-card-big flex justify-center relative mb-4 border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition duration-300">
                  <div className="card-content w-full px-0 md:px-1 lg:px-2 h-full flex flex-col justify-center">
                    <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                      {currentSlideshowPoint + 1}.{" "}
                      {allPoints[currentSlideshowPoint].name}
                    </p>
                    <div
                      className="street-view-container relative"
                      style={{ minHeight: `${height}px` }}
                    >
                      {allPoints[currentSlideshowPoint].location &&
                      isLocationStreetView(
                        allPoints[currentSlideshowPoint].location
                      ) ? (
                        <EmbedStreetViewDynamic
                          width={width}
                          height={height}
                          location={allPoints[currentSlideshowPoint].location}
                          heading={
                            allPoints[currentSlideshowPoint].heading || 90
                          }
                          pitch={allPoints[currentSlideshowPoint].pitch || 0}
                          fov={allPoints[currentSlideshowPoint].fov || 100}
                        />
                      ) : allPoints[currentSlideshowPoint].location ? (
                        <EmbedImage
                          width={width}
                          height={height}
                          location={allPoints[currentSlideshowPoint].location}
                        />
                      ) : null}
                      {allPoints[currentSlideshowPoint]?.memoPic && (
                        <img
                          src={allPoints[currentSlideshowPoint].memoPic}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 md:h-64 object-contain z-20"
                          alt="Memo"
                        />
                      )}
                      <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                        {allPoints[currentSlideshowPoint].memoItem}
                      </p>
                      <div className="icon-container flex flex-row justify-center items-center">
                        {currentSlideshowPoint > 0 && (
                          <FontAwesomeIcon
                            className="ml-5"
                            icon={faBackward}
                            size="2x"
                            onClick={handleGoToStart}
                          />
                        )}
                        <div className="w-10"></div>
                        {currentSlideshowPoint > 0 && (
                          <FontAwesomeIcon
                            className="ml-5"
                            icon={faPlay}
                            style={{ transform: "rotate(180deg)" }}
                            size="2x"
                            onClick={handlePrevious}
                          />
                        )}
                        <div className="w-10"></div>
                        {currentSlideshowPoint < allPoints.length - 1 && (
                          <FontAwesomeIcon
                            className="ml-5"
                            icon={faPlay}
                            size="2x"
                            onClick={handleNext}
                          />
                        )}
                        <div className="w-10"></div>
                        {currentSlideshowPoint < allPoints.length - 1 && (
                          <FontAwesomeIcon
                            className="ml-5"
                            icon={faForward}
                            size="2x"
                            onClick={handleGoToEnd}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
      {showJourneyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Link to journey
            </h2>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {journeys &&
                journeys.map((j) => (
                  <li
                    key={j._id}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-800 dark:text-gray-100"
                    onClick={() =>
                      linkJourney(selectedPointIndexForLinking, j._id)
                    }
                  >
                    <FontAwesomeIcon
                      icon={faMap}
                      className="mr-2 text-yellow-500"
                    />
                    {j.name}
                  </li>
                ))}
            </ul>
            <div className="mt-4">
              <label
                htmlFor="new-journey-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Journey Name
              </label>
              <input
                id="new-journey-name"
                type="text"
                value={newJourneyName}
                onChange={handleNameChange}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter journey name"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white mr-2"
                onClick={() => setShowJourneyModal(false)}
              >
                Cancel
              </button>
              <button
                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                onClick={handleCreateNewJourneyClick}
                disabled={!newJourneyName.trim()}
              >
                <FontAwesomeIcon icon={faMap} />
                <FontAwesomeIcon icon={faPlus} />
                Create new journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
