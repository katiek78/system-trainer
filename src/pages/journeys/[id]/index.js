import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect } from "react";
import { mutate } from "swr";
import { useRouter } from "next/router";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import EmbedStreetView from "@/components/EmbedStreetView";
import EmbedImage from "@/components/EmbedImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEdit,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { refreshData } from "@/lib/refreshData";
import "./styles.css";

const JourneyPage = ({ journey, points, totalPages }) => {
  const router = useRouter();
  const contentType = "application/json";
  // const [journey, setJourney] = useState({});
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(
    router.query.page ? parseInt(router.query.page) : 1
  );

  const [isListView, setIsListView] = useState(true);
  const [currentSlideshowPoint, setCurrentSlideshowPoint] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [journeyForm, setJourneyForm] = useState({});

  useEffect(() => {
    setIsLoading(true);
    setJourneyForm({ name: journey.name });
    const id = router.query.id;
    setIsLoading(false);
  }, [currentPage]);

  useEffect(() => {
    const pageFromUrl = router.query.page ? parseInt(router.query.page) : 1;
    setCurrentPage(pageFromUrl);
  }, [router.query.page]);

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
  // const handlePageChange = (page) => {
  //     setCurrentPage(page);
  //   }

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

  //   const putDataImages = async (imageForm) => {

  //    const { id } = router.query

  //    try {

  //      const res = await fetch(`/api/imageSets/${id}/${currentPage}`, {
  //        method: 'PUT',
  //        headers: {
  //          Accept: contentType,
  //          'Content-Type': contentType,
  //        },
  //        body: JSON.stringify({name: imageForm.name, images: imageForm.images}),
  //      })

  //      // Throw error with status code in case Fetch API req failed
  //      if (!res.ok) {
  //        throw new Error(res.status)
  //      }

  //      const { data } = await res.json()

  //    } catch (error) {
  //      setMessage('Failed to update images')
  //    }
  //  }

  //   const handleChangePointForm = (e) => {
  //     const target = e.target
  //     const value = target.value
  //     const name = target.name

  //     const updatedForm = { ...pointForm };

  //     let thisIndex;

  // }

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
    console.log("deleting point");
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

  const handleChangeTitle = (e) => {
    setJourneyForm({ ...journeyForm, name: e.target.value });
  };

  const handleToggleEditable = () => {
    setIsEditable(!isEditable);
  };

  //   /* Makes sure image set info is filled */
  //   const formValidate = () => {
  //     let err = {}
  //     if (!form.name) err.name = 'Name is required'

  //     return err
  //   }

  const handleSubmitJourneyForm = (e) => {
    e.preventDefault();

    putDataJourney(journeyForm);
    setIsEditable(false);
  };

  // const updatedForm = { ...pointForm };
  // const thisIndex = findIndexById(updatedForm.images, id);
  // if (thisIndex) updatedForm.images[thisIndex].starred = thisImage.starred

  // setPointForm(updatedForm);

  // try {

  //   const res = await fetch(`/api/imageSets/${journey._id}`, {
  //     method: 'PUT',
  //     headers: {
  //       Accept: contentType,
  //       'Content-Type': contentType,
  //     },
  //     body: JSON.stringify(thisImage),
  //   })

  //   // Throw error with status code in case Fetch API req failed
  //   if (!res.ok) {
  //     throw new Error(res.status)
  //   }
  //   const { data } = await res.json()

  // } catch (error) {
  //   setMessage('Failed to save image')
  // }

  const isLocationStreetView = (location) => {
    return /^[-\d]/.test(location);
  };

  const handleSlideshow = () => {
    setIsListView(false);
    setCurrentSlideshowPoint(0);
  };

  const handleGallery = () => {
    setIsListView(true);
  };

  const handlePrevious = () => {
    setCurrentSlideshowPoint(
      currentSlideshowPoint > 0 ? currentSlideshowPoint - 1 : 0
    );
  };

  const handleNext = () => {
    setCurrentSlideshowPoint(
      currentSlideshowPoint < points.length - 1
        ? currentSlideshowPoint + 1
        : points.length - 1
    );
  };

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 600px)");
    const mobileView = mql.matches;
    const mql2 = window.matchMedia("(min-width: 600px)");
    const midView = mql2.matches;
    const mql3 = window.matchMedia("(min-width: 1000px)");
    const largeView = mql3.matches;

    let width = 0,
      height = 0;
    if (mobileView) {
      (width = 300), (height = 200);
    } else if (largeView) {
      (width = 900), (height = 500);
    } else {
      (width = 400), (height = 300);
    }

    setWidth(width);
    setHeight(height);
  }, []);

  return (
    <>
      <div className="z-10 justify-between font-mono pl-2 md:pl-2 lg:pl-0">
        <h1 className="py-2 font-mono text-sm md:text-md lg:text-lg ">
          Journey:{" "}
        </h1>
        <h2 className="py-2 font-mono text-2xl md:text-3xl lg:text-5xl ">
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
        </h2>

        <div class="journey-btn-container">
          {journey.id && (
            <Link
              href="/journeys/[id]/new"
              as={`/journeys/${journey.id}/new`}
              legacyBehavior
            >
              <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                Add a location
              </button>
            </Link>
          )}
          <Link
            href="/journeys/[id]/import"
            as={`/journeys/${journey.id}/import`}
            legacyBehavior
          >
            <button className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
              Import locations
            </button>
          </Link>
          {points.length > 0 ? (
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
          {/* <Link href="/journeys/[id]/view" as={`/${journey.points[0]._id}/view`} legacyBehavior> */}
          {/* </Link> */}
        </div>

        <div
          className="relative w-full overflow-hidden py-2 md:py-4 lg:py-5 px-2 lg:px-5 rounded bg-white dark:bg-slate-800"
          style={{ minHeight: "400px" }}
        >
          {isListView ? (
            <>
              <h2 className="mb-5 text-lg md:text-2xl lg:text-2xl font-semibold">
                Locations:
              </h2>
              <div>{renderPageNumbers()}</div>
              <div className="p-2 lg:p-5 flex flex-wrap justify-center">
                {points?.map((point) => (
                  <div className="point-card-container flex justify-center">
                    <div
                      className={`point-card ${
                        point.location ? "" : "small-point-card"
                      } flex justify-center relative mb-4 border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition duration-300`}
                      key={point._id}
                    >
                      <div className="card-content w-full px-0 md:px-1 lg:px-2 h-full">
                        <p
                          className={`point-name max-w-xs text-center h-12 whitespace-normal`}
                          style={{ maxWidth: 300 }}
                        >
                          {point.name}
                        </p>

                        <div className="street-view-container relative">
                          {point.location &&
                            isLocationStreetView(point.location) && (
                              <EmbedStreetView
                                width={300}
                                height={200}
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

                          <div className="icon-container flex flex-row space-x-3 px-3 pb-5 justify-end items-end">
                            <Link
                              href="/journeys/[id]/editPoint"
                              as={`/journeys/${point._id}/editPoint`}
                              legacyBehavior
                            >
                              <FontAwesomeIcon icon={faEdit} size="2x" />
                            </Link>
                            <FontAwesomeIcon
                              className="ml-5"
                              icon={faTrash}
                              size="2x"
                              onClick={() => handleDeletePoint(point._id)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {journey && journey.id && (
                  <div className="plusIcon flex items-center justify-center mb-16">
                    <Link
                      href="/journeys/[id]/new"
                      as={`/journeys/${journey.id}/new`}
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
            <div className="p-2 lg:p-5 flex flex-wrap justify-center">
              <div className="point-card-container flex justify-center">
                <div
                  className="point-card-big flex justify-center relative mb-4 border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                  key={points[currentSlideshowPoint]._id}
                >
                  <div className="card-content w-full px-0 md:px-1 lg:px-2 h-full flex flex-col justify-center">
                    <p className="point-name text-center h-12 whitespace-normal">
                      {points[currentSlideshowPoint].name}
                    </p>
                    <button onClick={handlePrevious}>Previous</button>{" "}
                    <button onClick={handleNext}>Next</button>
                    <div className="street-view-container relative">
                      {points[currentSlideshowPoint].location &&
                        isLocationStreetView(
                          points[currentSlideshowPoint].location
                        ) && (
                          <EmbedStreetView
                            width={width}
                            height={height}
                            location={points[currentSlideshowPoint].location}
                            heading={
                              points[currentSlideshowPoint].heading || 90
                            }
                            pitch={points[currentSlideshowPoint].pitch || 0}
                            fov={points[currentSlideshowPoint].fov || 100}
                          />
                        )}
                      {points[currentSlideshowPoint].location &&
                        !isLocationStreetView(
                          points[currentSlideshowPoint].location
                        ) && (
                          <EmbedImage
                            width={width}
                            height={height}
                            location={points[currentSlideshowPoint].location}
                          />
                        )}
                      <div className="icon-container flex flex-row space-x-3 px-3 pb-5 justify-end items-end">
                        <Link
                          href="/journeys/[id]/points/[id]/editPoint"
                          as={`/journeys/${journey.id}/points/${points[currentSlideshowPoint]._id}/editPoint`}
                          legacyBehavior
                        >
                          <FontAwesomeIcon icon={faEdit} size="2x" />
                        </Link>
                        <FontAwesomeIcon
                          className="ml-5"
                          icon={faTrash}
                          size="2x"
                          onClick={() =>
                            handleDeletePoint(points[currentSlideshowPoint]._id)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>{message}</div>

        {/* Add a button to add an image manually */}
      </div>
    </>
  );
};

export default JourneyPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ params, query, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect();

    const journeyResult = await Journey.find({
      userId: user.sub,
      _id: params.id,
    });
    const journey = JSON.parse(JSON.stringify(journeyResult))[0];

    const page = parseInt(query.page) || 1; // Get the current page from the query string
    const pageLimit = 10; // Number of points per page

    // Calculate the offset for the current page
    const offset = (page - 1) * pageLimit;

    // Get the points for the current page
    const points = journey.points.slice(offset, offset + pageLimit);

    {
      /* if (journey && journey._id) journey._id = journey._id.toString();

    return { props: { user, journey } }; */
    }

    return {
      props: {
        journey: {
          id: journey._id,
          name: journey.name,
          // Add any other necessary journey fields here
        },
        points: points,
        totalPages: Math.ceil(journey.points.length / pageLimit),
      },
    };
  },
});
