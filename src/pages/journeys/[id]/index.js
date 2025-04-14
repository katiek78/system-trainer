import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect } from "react";
import { mutate } from "swr";
import { useRouter } from "next/router";
import dbConnect from "@/lib/dbConnect";
import { isAdmin } from "@/lib/adminCheck";
import Journey from "@/models/Journey";
import EmbedStreetView from "@/components/EmbedStreetView";
import EmbedStreetViewDynamic from "@/components/EmbedStreetViewDynamic";
import EmbedImage from "@/components/EmbedImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PAGE_LIMIT } from "@/lib/journeyConstants";
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
//import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { getStreetViewUrl } from "@/utilities/getStreetViewURL";
import streetViewCache from "@/utilities/streetViewCache";
import "./styles.css";

const JourneyPage = ({
  journey,
  points,
  totalPages,
  isPublicJourney,
  user,
  isAdmin,
  journeys,
}) => {
  const router = useRouter();
  const contentType = "application/json";
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(
    router.query.page ? parseInt(router.query.page) : 1
  );

  const [isListView, setIsListView] = useState(!router.query.slideshow);
  const [currentSlideshowPoint, setCurrentSlideshowPoint] = useState(0);
  const [allPoints, setAllPoints] = useState(null);
  const [loadingAllPoints, setLoadingAllPoints] = useState(false);

  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [journeyForm, setJourneyForm] = useState({});
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [selectedPointIndexForLinking, setSelectedPointIndexForLinking] =
    useState(null);
  const [newJourneyName, setNewJourneyName] = useState("");

  // const fetchJourneys = async () => {
  //   const res = await fetch("/api/journeys/names");
  //   const data = await res.json();
  //   const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
  //   setJourneys(sortedData);
  // };
  console.log(journey.name);

  useEffect(() => {
    const pageFromUrl = router.query.page ? parseInt(router.query.page) : 1;
    setCurrentPage(pageFromUrl); // Update the page state

    // Handle loading the points based on the current page and view mode
    setIsLoading(true);
    setJourneyForm({ name: journey.name });

    if (!isListView && !allPoints) {
      fetchAllPoints();
    }
    setIsLoading(false);
  }, [router.query.page, journey, isListView]);

  const preloadStreetViewImages = async () => {
    const preloadPromises = points.map(async (point) => {
      if (!isLocationStreetView(point.location)) return Promise.resolve();
      const heading = point.heading || 90;
      const pitch = point.pitch || 0;
      const fov = point.fov || 100;
      const key = `${point.location}-${heading}-${pitch}-${fov}-image`;

      const url = await getStreetViewUrl(
        point.location,
        heading,
        pitch,
        fov,
        "image"
      );

      if (url) {
        // Store in cache
        streetViewCache[key] = url;

        // Preload the image
        const img = new Image();
        img.src = url;

        // Return a promise that resolves when the image is loaded
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }

      return Promise.resolve(); // if no URL, just resolve
    });

    await Promise.all(preloadPromises);
  };

  // Call preload function before rendering your gallery
  useEffect(() => {
    if (points) {
      preloadStreetViewImages();
    }
  }, [points]);

  const renderPageNumbers = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return pages.map((page) => (
      <Link href={`/journeys/${router.query.id}?page=${page}`} key={page}>
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
    ));
  };

  const fetchAllPoints = async () => {
    if (allPoints) {
      //setPoints(allPoints);
      return;
    }
    if (loadingAllPoints) return; // Avoid duplicate fetches

    setLoadingAllPoints(true);
    const response = await fetch(`/api/journeys/${router.query.id}`);
    const data = await response.json();
    const loadedPoints = data.data.points;
    setAllPoints(loadedPoints);

    setCurrentSlideshowPoint(0);
    setLoadingAllPoints(false);
  };

  const putDataJourney = async (journeyForm) => {
    const { id } = router.query;

    try {
      const res = await fetch(`/api/journeys/${id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({ name: journeyForm.name, points: [] }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();
    } catch (error) {
      setMessage("Failed to update journey");
    }
  };

  const handleDelete = async () => {
    const journeyID = router.query.id;

    try {
      await fetch(`/api/journeys/${journeyID}`, {
        method: "Delete",
      });
      router.push(`/journeys`);
    } catch (error) {
      setMessage("Failed to delete the journey.");
    }
  };

  const handleDeletePoint = async (pointID, e) => {
    try {
      await fetch(`/api/points/${pointID}`, {
        method: "Delete",
      });
      // router.push(`/`)
      refreshData(router);
    } catch (error) {
      setMessage("Failed to delete the point.");
    }
  };

  const handleInsertPointAt = async (insertAt) => {
    router.push(`/journeys/${router.query.id}/new?insertAt=${insertAt}`);
  };

  const handleChangeTitle = (e) => {
    setJourneyForm({ ...journeyForm, name: e.target.value });
  };

  const handleToggleEditable = () => {
    setIsEditable(!isEditable);
  };

  const handleSubmitJourneyForm = (e) => {
    e.preventDefault();

    putDataJourney(journeyForm);
    setIsEditable(false);
  };

  const isLocationStreetView = (location) => {
    return /^[-\d]/.test(location);
  };

  const handleSlideshow = async () => {
    router.push(
      {
        pathname: router.pathname, // Keep the current page
        query: { id: router.query.id, slideshow: "true" }, // Ensure `id` is present
      },
      undefined,
      { shallow: true }
    );
    setIsListView(false);
    await fetchAllPoints();
    //setCurrentSlideshowPoint(0);
  };

  const handleGallery = () => {
    // Use replace to ensure we reload the page without adding a new entry to the history
    router.replace(
      {
        pathname: router.pathname,
        query: { id: router.query.id, page: "1" }, // Reset to page 1
      },
      undefined,
      { shallow: false } // This ensures a full reload and that getServerSideProps runs
    );

    setIsListView(true); // Switch to gallery view
  };

  const handlePrevious = () => {
    setCurrentSlideshowPoint(
      currentSlideshowPoint > 0 ? currentSlideshowPoint - 1 : 0
    );
  };

  const handleNext = () => {
    setCurrentSlideshowPoint(
      currentSlideshowPoint < allPoints.length - 1
        ? currentSlideshowPoint + 1
        : allPoints.length - 1
    );
  };

  const handleGoToStart = () => {
    setCurrentSlideshowPoint(0);
  };

  const handleGoToEnd = () => {
    setCurrentSlideshowPoint(allPoints.length - 1);
  };

  const handleLinkJourney = (pointIndex) => {
    setSelectedPointIndexForLinking(pointIndex);
    setShowJourneyModal(true);
  };

  const linkJourney = async (pointIndex, linkedJourneyID) => {
    await fetch(`/api/journeys/${router.query.id}/linkJourney`, {
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
    router.push(`/journeys/${router.query.id}`);
  };

  const handleUnlinkJourney = async (pointIndex) => {
    await fetch(`/api/journeys/${router.query.id}/linkJourney`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pointIndex,
      }),
    });
    router.push(`/journeys/${router.query.id}`);
  };

  const handleCreateNewJourney = async () => {
    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({ name: newJourneyName, userId: user.sub }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json(); // <- this gives you the created journey
      const newlyCreatedJourneyID = data._id;
      await linkJourney(selectedPointIndexForLinking, newlyCreatedJourneyID);
      //router.push(`/journeys/${journey.id}`);
    } catch (error) {
      setMessage("Failed to add journey");
    }
  };

  const handleNameChange = (e) => {
    setNewJourneyName(e.target.value); // Update the name when the user types
  };

  const handleCreateNewJourneyClick = () => {
    if (newJourneyName.trim()) {
      console.log("creating new journey");
      handleCreateNewJourney(newJourneyName); // Pass the name when creating the new journey
    }
    setShowJourneyModal(false);
  };

  const movePointBackwards = async (pointIndex) => {
    try {
      await fetch(`/api/journeys/${router.query.id}/reorderPoint`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointIndex,
          direction: "b",
        }),
      });
      refreshData(router);
    } catch (error) {
      setMessage("Failed to move the point.");
    }
  };

  //TODO: Make these two functions the same function with a parameter
  const movePointForwards = async (pointIndex) => {
    try {
      await fetch(`/api/journeys/${router.query.id}/reorderPoint`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointIndex,
          direction: "f",
        }),
      });
      refreshData(router);
    } catch (error) {
      setMessage("Failed to move the point.");
    }
  };
  useEffect(() => {
    // Function to check window size and set the width and height
    const updateDimensions = () => {
      const mql = window.matchMedia("(max-width: 600px)");
      const mobileView = mql.matches;
      const mql2 = window.matchMedia("(min-width: 600px)");
      const midView = mql2.matches;
      const mql3 = window.matchMedia("(min-width: 1350px)");
      const largeView = mql3.matches;

      let newWidth = 0,
        newHeight = 0;
      if (mobileView) {
        newWidth = 300;
        newHeight = 200;
      } else if (largeView) {
        newWidth = 1200;
        newHeight = 700;
      } else {
        newWidth = 500;
        newHeight = 400;
      }

      setWidth(newWidth);
      setHeight(newHeight);
    };

    // Initial call to set dimensions
    updateDimensions();

    // Set up the resize event listener
    window.addEventListener("resize", updateDimensions);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  return (
    <>
      <div className="z-10 justify-between font-mono pl-2 md:pl-2 lg:pl-0">
        <h3 className="underline py-0 font-mono text-sm md:text-md lg:text-lg">
          <Link
            href={{
              pathname: "/journeys",
              query: { startWithJourneyView: "true" },
            }}
          >
            Back to Journeys
          </Link>
        </h3>
        {/* <h1 className="py-2 font-mono text-sm sm:text-2xl">
          <FontAwesomeIcon icon={faMap} />
          {isPublicJourney && " (PUBLIC)"}:
        </h1> */}
        <h2 className="py-2 font-mono text-2xl md:text-3xl lg:text-5xl ">
          <FontAwesomeIcon
            icon={faMap}
            color="palegoldenrod"
            className="mr-5"
          />
          {isPublicJourney && " (PUBLIC)"}
          {isEditable ? (
            <input
              onChange={handleChangeTitle}
              className="text-2xl md:text-3xl lg:text-5xl "
              style={{ width: "90%" }}
              value={journeyForm.name}
            ></input>
          ) : (
            journeyForm.name
          )}
          {isEditable ? (
            <FontAwesomeIcon
              className="hover:text-gray-700 hover:cursor-pointer ml-5"
              onClick={handleSubmitJourneyForm}
              icon={faCheck}
              size="1x"
            />
          ) : (
            <>
              {" "}
              {(!isPublicJourney || isAdmin) && (
                <>
                  <FontAwesomeIcon
                    className="hover:text-gray-700 hover:cursor-pointer ml-5"
                    onClick={handleToggleEditable}
                    icon={faEdit}
                    size="1x"
                  />
                  <FontAwesomeIcon
                    className="hover:text-gray-700 hover:cursor-pointer ml-5"
                    onClick={handleDelete}
                    icon={faTrash}
                    size="1x"
                  />{" "}
                </>
              )}
            </>
          )}
        </h2>

        <div className="journey-btn-container">
          {journey.id && points && (
            <>
              {(!isPublicJourney || !isAdmin) && (
                <>
                  <Link
                    href={`/journeys/[id]/new?insertAt=${
                      (currentPage - 1) * PAGE_LIMIT + points?.length
                    }`}
                    as={`/journeys/${journey.id}/new?insertAt=${
                      (currentPage - 1) * PAGE_LIMIT + points?.length
                    }`}
                    legacyBehavior
                  >
                    <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                      Add a location
                    </button>
                  </Link>

                  <Link
                    href="/journeys/[id]/import"
                    as={`/journeys/${journey.id}/import`}
                    legacyBehavior
                  >
                    <button className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                      Import locations
                    </button>
                  </Link>
                </>
              )}

              {points?.length > 0 ? (
                isListView ? (
                  <button
                    onClick={handleSlideshow}
                    className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Slideshow
                  </button>
                ) : (
                  <button
                    onClick={handleGallery}
                    className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Gallery
                  </button>
                )
              ) : (
                <></>
              )}
            </>
          )}
        </div>

        <div
          className="relative w-full overflow-hidden py-2 md:py-0 lg:py-0 px-2 lg:px-5 rounded bg-white dark:bg-slate-800"
          style={{ minHeight: "400px" }}
        >
          {isListView ? (
            <>
              <h2 className="mb-5 text-lg md:text-2xl lg:text-2xl font-semibold">
                Locations:
              </h2>
              <div>{renderPageNumbers()}</div>
              <div className="cards-container p-2 lg:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {points?.map((point, i) => (
                  <div
                    className="point-card flex flex-col justify-between items-center relative mb-4 p-3 border border-gray-300 rounded-lg shadow-md hover:shadow-xl transition duration-300"
                    key={i}
                  >
                    <div className="card-content w-full px-0 md:px-1 lg:px-2 flex flex-col justify-center items-center h-full overflow-hidden">
                      <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                        {point.name}
                      </p>

                      <div className="street-view-container relative">
                        {point.location &&
                          isLocationStreetView(point.location) && (
                            <EmbedStreetView
                              width={300}
                              height={150}
                              location={point.location}
                              heading={point.heading || 90}
                              pitch={point.pitch || 0}
                              fov={point.fov || 100}
                            />
                          )}

                        {point.location &&
                          !isLocationStreetView(point.location) && (
                            <EmbedImage
                              width={300}
                              height={200}
                              location={point.location}
                            />
                          )}
                      </div>
                      <div className="min-h-[5rem] flex flex-col justify-center items-center">
                        <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
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
                                className="ml-5"
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
                            />
                          </div>
                          <div className="icon-container flex flex-row space-x-3 px-3 pb-5 justify-end items-end">
                            <Link
                              href="/journeys/[id]/editPoint"
                              as={`/journeys/${point._id}/editPoint`}
                              legacyBehavior
                            >
                              <FontAwesomeIcon
                                title="Edit this point"
                                icon={faEdit}
                                size="2x"
                              />
                            </Link>
                            <FontAwesomeIcon
                              title="Delete this point"
                              className="ml-5"
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

                {journey && journey.id && (!isPublicJourney || isAdmin) && (
                  <div className="plusIcon flex items-center justify-center mb-16">
                    <Link
                      href={`/journeys/[id]/new?insertAt=${
                        (currentPage - 1) * PAGE_LIMIT + points?.length
                      }`}
                      as={`/journeys/${journey.id}/new?insertAt=${
                        (currentPage - 1) * PAGE_LIMIT + points?.length
                      }`}
                      legacyBehavior
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
                  <div
                    className="point-card-big flex justify-center relative mb-4 border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                    key={allPoints[currentSlideshowPoint]._id}
                  >
                    <div className="card-content w-full px-0 md:px-1 lg:px-2 h-full flex flex-col justify-center">
                      <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                        {allPoints[currentSlideshowPoint].name}
                      </p>
                      <div className="street-view-container relative">
                        {allPoints[currentSlideshowPoint].location &&
                          isLocationStreetView(
                            allPoints[currentSlideshowPoint].location
                          ) && (
                            <EmbedStreetViewDynamic
                              width={width}
                              height={height}
                              location={
                                allPoints[currentSlideshowPoint].location
                              }
                              heading={
                                allPoints[currentSlideshowPoint].heading || 90
                              }
                              pitch={
                                allPoints[currentSlideshowPoint].pitch || 0
                              }
                              fov={allPoints[currentSlideshowPoint].fov || 100}
                            />
                          )}
                        {allPoints[currentSlideshowPoint].location &&
                          !isLocationStreetView(
                            allPoints[currentSlideshowPoint].location
                          ) && (
                            <EmbedImage
                              width={width}
                              height={height}
                              location={
                                allPoints[currentSlideshowPoint].location
                              }
                            />
                          )}
                        <p className="text-2xl point-name max-w-full text-center whitespace-normal overflow-wrap break-word">
                          {allPoints[currentSlideshowPoint].memoItem}
                        </p>
                        <div className="icon-container flex flex-row justify-center items-center">
                          {/* Show the backward button if we're not on the first point */}
                          {currentSlideshowPoint > 0 && (
                            <FontAwesomeIcon
                              className="ml-5"
                              icon={faBackward}
                              size="2x"
                              onClick={handleGoToStart}
                            />
                          )}
                          <div className="w-10"></div>

                          {/* Show previous button if we're not on the first point */}
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

                          {/* Show next button if we're not on the last point */}
                          {currentSlideshowPoint < allPoints.length - 1 && (
                            <FontAwesomeIcon
                              className="ml-5"
                              icon={faPlay}
                              size="2x"
                              onClick={handleNext}
                            />
                          )}
                          <div className="w-10"></div>

                          {/* Show forward button if we're not on the last point */}
                          {currentSlideshowPoint < allPoints.length - 1 && (
                            <FontAwesomeIcon
                              className="ml-5"
                              icon={faForward}
                              size="2x"
                              onClick={handleGoToEnd}
                            />
                          )}
                        </div>

                        {!isPublicJourney || !isAdmin ? (
                          <div className="icon-container flex flex-row space-x-3 px-3 pb-5 justify-end items-end">
                            <Link
                              href="/journeys/[id]/points/[id]/editPoint"
                              as={`/journeys/${journey.id}/points/${allPoints[currentSlideshowPoint]._id}/editPoint`}
                              legacyBehavior
                            >
                              <FontAwesomeIcon icon={faEdit} size="2x" />
                            </Link>
                            <FontAwesomeIcon
                              className="ml-5"
                              icon={faTrash}
                              size="2x"
                              onClick={() =>
                                handleDeletePoint(
                                  allPoints[currentSlideshowPoint]._id
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div>{message}</div>

        {/* Add a button to add an image manually */}
      </div>
      {showJourneyModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Link to journey
              </h2>

              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {journeys &&
                  journeys.map((journey) => (
                    <li
                      key={journey._id}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-800 dark:text-gray-100"
                      onClick={() =>
                        linkJourney(selectedPointIndexForLinking, journey._id)
                      }
                    >
                      <FontAwesomeIcon
                        icon={faMap}
                        className="mr-2 text-yellow-500"
                      />
                      {journey.name}
                    </li>
                  ))}
              </ul>

              {/* Input field to create a new journey */}
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
                  disabled={!newJourneyName.trim()} // Disable if the name is empty
                >
                  <FontAwesomeIcon icon={faMap} />
                  <FontAwesomeIcon icon={faPlus} />
                  Create new journey
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default JourneyPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ params, query, req, res }) => {
    console.log("getting server side props");
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect();

    const adminStatus = isAdmin(auth0User.user);

    const journeyResult = await Journey.findOne({
      _id: params.id,
      $or: [
        { userId: user.sub },
        { userId: null },
        { userId: { $exists: false } }, // Handle missing userId
      ],
    });

    if (!journeyResult) {
      return { notFound: true };
    }

    const journey = JSON.parse(JSON.stringify(journeyResult));

    const journeyNamesResult = await Journey.find(
      { userId: user.sub }, // adjust if needed
      "_id name" // only these fields
    ).lean();

    const journeyNames = JSON.parse(JSON.stringify(journeyNamesResult));
    const sortedJourneyNames = journeyNames.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const page = query.page ? parseInt(query.page) : 1;
    const pageLimit = PAGE_LIMIT;
    const offset = (page - 1) * pageLimit;

    const points = journey.points.slice(offset, offset + pageLimit);
    console.log("passing in journey name " + journey.name);
    return {
      props: {
        journey: {
          id: journey._id,
          name: journey.name,
          // Add any other necessary journey fields here
        },
        points,
        totalPages: Math.ceil(journey.points.length / pageLimit),
        isPublicJourney: !journey.userId,
        user,
        isAdmin: adminStatus,
        journeys: sortedJourneyNames,
      },
    };
  },
});
