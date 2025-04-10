import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
// import Journey from "@/models/Journey";
// import MemoSystem from "@/models/MemoSystem";
import ImageSet from "@/models/ImageSet";
import TrafficLights from "@/components/TrafficLights";
import ConfidenceLevel from "@/components/ConfidenceLevel";
import QuickEditForm from "@/components/QuickEditForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ImageSearch from "@/components/ImageSearch";
import {
  faCheck,
  faXmark,
  faEdit,
  faImage,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import {
  confidenceLabels,
  getConfidenceLevel,
} from "@/utilities/confidenceLevel";
import RedHeartsAndDiamonds from "@/components/RedHD";
import { determineSetType } from "@/utilities/setType";

// import SiteUser from "@/models/SiteUser";

const TrainingCenter = ({ user, imageSet }) => {
  const router = useRouter();
  const contentType = "application/json";

  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(true);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const imageSetID = router.query.imageSet;
  //const [updatableImageSet, setUpdatableImageSet] = useState(imageSet);
  //const [imageSet, setImageSet] = useState({});
  const [randImage, setRandImage] = useState({});
  const [isStarred, setIsStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [isFrontSide, setIsFrontSide] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [imageGroup, setImageGroup] = useState("all");
  const [imageGroupD1, setImageGroupD1] = useState("all");
  const [imageGroupD2, setImageGroupD2] = useState("all");
  const [imageGroupS1, setImageGroupS1] = useState("all");
  const [imageGroupS2, setImageGroupS2] = useState("all");
  const [filteredData, setFilteredData] = useState(imageSet.images);
  const [needNewCard, setNeedNewCard] = useState(false);
  const [field, setField] = useState("imageItem");
  const [starredOnly, setStarredOnly] = useState(false);
  const [cardsAvailable, setCardsAvailable] = useState(false);
  // let filteredData = [];

  const setType = determineSetType(imageSet.images.length);
  const isCardSet = setType.includes("c");

  useEffect(() => {
    if (isLoading) return;
    setIsLoading(true);
    setCardsAvailable(false);

    //Filter by confidence level
    let newSet = [...imageSet.images];
    if (imageGroup !== "all")
      newSet = newSet.filter(
        (image) =>
          getConfidenceLevel(image.recentAttempts) === parseInt(imageGroup)
      );

    //Filter by digits
    if (imageGroupD1 !== "all" || imageGroupD2 !== "all") {
      if (isCardSet) {
        newSet = newSet.filter((image) => {
          // Extract card values (A, 2-10, J, Q, K)
          const values = image.name.match(/(A|10|[2-9]|J|Q|K)/g);

          if (!values || values.length < 2) return false; // Ensure at least two values

          const [firstValue, secondValue] = values; // Extract first and second card values

          // console.log(
          //   image.name,
          //   firstValue,
          //   secondValue,
          //   imageGroupD1,
          //   imageGroupD2
          // );

          return (
            (firstValue === imageGroupD1 || imageGroupD1 === "all") &&
            (secondValue === imageGroupD2 || imageGroupD2 === "all")
          );
        });
      } else {
        newSet = newSet.filter(
          (image) =>
            (image.name[0] === imageGroupD1 || imageGroupD1 === "all") &&
            (image.name[1] === imageGroupD2 || imageGroupD2 === "all")
        );
      }
    }

    //Filter by suits
    if (imageGroupS1 && (imageGroupS1 !== "all" || imageGroupS2 !== "all")) {
      newSet = newSet.filter((image) => {
        // Mapping for suit emojis to plain suits
        const suitRegexMap = {
          "♥️": "♥",
          "♠️": "♠",
          "♣️": "♣",
          "♦️": "♦",
        };

        // Convert imageGroupS1 and imageGroupS2 to the correct suit symbols
        const firstSuit = suitRegexMap[imageGroupS1] || imageGroupS1; // Default to the input if it's not an emoji
        const secondSuit = suitRegexMap[imageGroupS2] || imageGroupS2;

        // Handle special cases for "b" (black suits) and "r" (red suits)
        const getSuitRegex = (suit) => {
          if (suit === "b") return "[♠♣]"; // Black suits (♠ or ♣)
          if (suit === "r") return "[♦♥]"; // Red suits (♦ or ♥)
          if (suit === "all") return "[♠♣♦♥]"; // All suits
          return suit; // Return the specific suit for other cases
        };

        // Convert the image name to match plain suit characters (e.g., replace ♥️ with ♥)
        const convertedName = image.name
          .replace(/♥️/g, "♥")
          .replace(/♠️/g, "♠")
          .replace(/♣️/g, "♣")
          .replace(/♦️/g, "♦");

        // Now we need to check if the converted name contains both suits
        const suits = convertedName.match(/[♠♣♦♥]/g); // Match all suits after conversion

        if (suits && suits.length === 2) {
          const [firstSuitInName, secondSuitInName] = suits;

          const firstSuitMatches = new RegExp(getSuitRegex(firstSuit)).test(
            firstSuitInName
          );

          // Ensure second suit matches `imageGroupS2`
          const secondSuitMatches = new RegExp(getSuitRegex(secondSuit)).test(
            secondSuitInName
          );

          return firstSuitMatches && secondSuitMatches;
        }
        return false; // If there are not exactly 2 suits, return false
      });
    }

    if (starredOnly) newSet = newSet.filter((image) => image.starred);
    setFilteredData(newSet, starredOnly);

    if (filteredData.length) {
      getImage();
      toggleRotate(null, true);
      setIsEditable(false);
      setMessage("");
      setCardsAvailable(true);
    } else {
      setMessage(
        "There are no cards of this type! Change the options and try again."
      );
      setShowOptions(true);
      // setCardsAvailable(false);
    }
    setNeedNewCard(false);
    setIsLoading(false);
  }, [needNewCard]);

  const handleImageSelect = (index, imageUrl) => {
    randImage.URL = imageUrl;
    saveData();
    setShowImageSearch(false);
  };

  const handleShowImageSearch = () => {
    setShowImageSearch(true);
  };

  const toggleRotate = (e, toFront = false) => {
    if (!isEditable) {
      if (
        toFront ||
        (e.target.tagName !== "BUTTON" &&
          e.target.tagName !== "svg" &&
          e.target.tagName !== "path")
      ) {
        //if it's called in getNextImage or is not triggered via the button, then we consider toggle

        if (
          (toFront &&
            document.querySelectorAll(".card-flip").length > 0 &&
            document
              .querySelectorAll(".card-flip")[0]
              .classList.contains("[transform:rotateY(180deg)]")) ||
          !toFront
        ) {
          document
            .querySelectorAll(".card-flip")
            .forEach((card) =>
              card.classList.toggle("[transform:rotateY(180deg)]")
            );
        }
      }
    }
  };

  const getGroupTotals = () => {
    // console.log("getting group totals - this means page has refreshed") //this happens when you change select, when you click Start, when you click submit, when you press correct
    let result = [];
    for (let i = 0; i < confidenceLabels.length; i++) {
      const group = imageSet.images.filter(
        (image) => getConfidenceLevel(image.recentAttempts) === parseInt(i)
      );
      result.push(group.length);
    }
    return result;
  };

  const groupTotals = getGroupTotals();

  function handleKeyDown(e) {
    e.stopPropagation();

    if (e.keyCode === 39) setNeedNewCard(true);
  }

  const handleStartTraining = () => {
    document.addEventListener("keydown", handleKeyDown);
    setShowOptions(false);
    setNeedNewCard(true);
    setIsStarted(true);
  };

  const handleStopTraining = () => {
    document.removeEventListener("keydown", handleKeyDown);
    setIsStarted(false);
    setShowOptions(true);
    //handleChangeSelect();
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.target.blur();
    setNeedNewCard(true);
  };

  const getImage = () => {
    //get random image from set

    const randIndex = Math.floor(Math.random() * filteredData.length);
    setRandImage(filteredData[randIndex]);
    setIsStarred(filteredData[randIndex].starred);
  };

  const handleEdit = (e, field) => {
    //Now entering editable mode
    e.stopPropagation();
    setIsEditable(true);
    setField(field);
  };

  const handleCorrect = (e) => {
    e.stopPropagation();
    addToRecentAttempts(true);
    setNeedNewCard(true);
  };

  const handleIncorrect = (e) => {
    e.stopPropagation();
    addToRecentAttempts(false);
    setNeedNewCard(true);
  };

  const addToRecentAttempts = async (isCorrect) => {
    //create the property if it doesn't exist
    if (!randImage.recentAttempts) randImage.recentAttempts = [];

    //cap at 7 attempts
    if (randImage.recentAttempts.length === 7) randImage.recentAttempts.shift();

    randImage.recentAttempts.push(isCorrect ? 1 : 0);

    saveData();
  };

  const handleSubmitEdit = async (e, field, item) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditable(false);

    if (field === "imageItem") {
      randImage.imageItem = item;
    } else if (field === "URL") {
      randImage.URL = item;
    } else {
      if (randImage.starred === undefined) randImage.starred = false;
      randImage.starred = !randImage.starred;
      setIsStarred(randImage.starred);
    }

    saveData();

    //   refreshData();
  };

  const saveData = async () => {
    try {
      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(randImage),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }
      const { data } = await res.json();
    } catch (error) {
      setMessage("Failed to save training data");
    }
  };

  const handleChangeSelect = () => {
    const level = document.getElementById("selSet")?.value || "all";
    setImageGroup(level);
    setNeedNewCard(true);
  };

  const handleChangeSelectD1 = () => {
    const digit1 = document.getElementById("selDigit1").value;
    setImageGroupD1(digit1);
    setNeedNewCard(true);
  };

  const handleChangeSelectD2 = () => {
    const digit2 = document.getElementById("selDigit2").value;
    setImageGroupD2(digit2);
    setNeedNewCard(true);
  };

  const handleChangeSelectS1 = () => {
    const suit1 = document.getElementById("selSuit1").value;
    setImageGroupS1(suit1);
    setNeedNewCard(true);
  };

  const handleChangeSelectS2 = () => {
    const suit2 = document.getElementById("selSuit2").value;
    setImageGroupS2(suit2);
    setNeedNewCard(true);
  };

  const handleToggleStar = async (id) => {
    if (randImage.starred === undefined) randImage.starred = false;
    randImage.starred = !randImage.starred;

    setIsStarred(randImage.starred);

    try {
      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(randImage),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }
      const { data } = await res.json();
    } catch (error) {
      setMessage("Failed to toggle star - " + error);
    }
  };

  const handleToggleStarredDisplay = () => {
    setStarredOnly(!starredOnly);
    setNeedNewCard(true);
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        {/* <h1 className="py-2 font-mono text-4xl">Training Centre</h1> */}
        {/* Soon this will be part of a Training Centre where you can do drills etc. but not yet */}
        <h2 className="text-4xl">Image set training</h2>
        <Link
          href="/imageSets/[id]"
          as={`/imageSets/${imageSet._id}`}
          legacyBehavior
        >
          &lt;&lt; Back to image set page
        </Link>
        {imageSet && !isLoading && (
          <>
            <div className="flex flex-col justify-center items-center">
              <div className="mt-10 font-mono text-3xl">{imageSet.name}</div>

              {showOptions && (
                <div>
                  <p className="text-xl">Which images do you want to train?</p>
                  <label htmlFor="selSet">Confidence level</label>
                  <select
                    id="selSet"
                    className="w-full rounded-md dark:bg-slate-800"
                    onChange={handleChangeSelect}
                  >
                    <option value="all">All 🌍</option>
                    {confidenceLabels.map((label, i) => (
                      <option value={i}>
                        {label} ({groupTotals && groupTotals[i]})
                      </option>
                    ))}
                  </select>
                  <label for="selDigit1">
                    {isCardSet ? "Value 1" : "Digit 1"}
                  </label>
                  <select
                    id="selDigit1"
                    className="w-full rounded-md dark:bg-slate-800"
                    onChange={handleChangeSelectD1}
                  >
                    <option value="all">All</option>
                    {isCardSet &&
                      ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"].map(
                        (digit) => <option value={digit}>{digit}</option>
                      )}
                    {!isCardSet &&
                      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                        <option value={digit}>{digit}</option>
                      ))}
                  </select>
                  <label for="selDigit2">
                    {isCardSet ? "Value 2" : "Digit 2"}
                  </label>
                  <select
                    id="selDigit2"
                    className="w-full rounded-md dark:bg-slate-800"
                    onChange={handleChangeSelectD2}
                  >
                    <option value="all">All</option>
                    {isCardSet &&
                      ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"].map(
                        (digit) => <option value={digit}>{digit}</option>
                      )}
                    {!isCardSet &&
                      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                        <option value={digit}>{digit}</option>
                      ))}
                  </select>
                  {setType === "2c" && (
                    <>
                      <label for="selSuit1">Suit 1</label>
                      <select
                        id="selSuit1"
                        className="w-full rounded-md dark:bg-slate-800"
                        onChange={handleChangeSelectS1}
                      >
                        <option value="all">All</option>
                        <option value="b">Black</option>
                        <option value="r">Red</option>
                        <option value="♥️">♥️</option>
                        <option value="♦️">♦️</option>
                        <option value="♣️">♣️</option>
                        <option value="♠️">♠️</option>
                      </select>

                      <label for="selSuit2">Suit 2</label>
                      <select
                        id="selSuit2"
                        className="w-full rounded-md dark:bg-slate-800"
                        onChange={handleChangeSelectS2}
                      >
                        <option value="all">All</option>
                        <option value="b">Black</option>
                        <option value="r">Red</option>
                        <option value="♥️">♥️</option>
                        <option value="♦️">♦️</option>
                        <option value="♣️">♣️</option>
                        <option value="♠️">♠️</option>
                      </select>
                    </>
                  )}
                  Starred only?{" "}
                  <input
                    type="checkbox"
                    value="false"
                    onChange={handleToggleStarredDisplay}
                  ></input>
                </div>
              )}

              {!isStarted && cardsAvailable && (
                <button
                  onClick={handleStartTraining}
                  className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Start
                </button>
              )}

              {isStarted && cardsAvailable && (
                <div className="flex flex-col justify-center items-center">
                  <div classHame="group [perspective:1000px]">
                    <div className="z-3 relative m-2 h-40 w-60 lg:h-80 lg:w-96 rounded-xl shadow-xl ">
                      <div
                        id="card-front"
                        onClick={(e) => toggleRotate(e, false)}
                        className="card-flip absolute inset-0 rounded-xl border-4 border-slate-700 bg-white [backface-visibility:hidden]"
                      >
                        <div className="flex-col rounded-xl px-12 bg-white text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <h1 className="card-suit text-3xl font-bold">
                            <RedHeartsAndDiamonds text={randImage.name} />
                          </h1>
                        </div>
                      </div>
                      <div
                        id="card-back"
                        onClick={(e) => toggleRotate(e, false)}
                        className="card-flip absolute inset-0 h-full w-full  rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden]"
                      >
                        <div className="flex-col rounded-xl bg-black/40 text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <h1 className="lg:text-3xl text-2xl font-bold">
                            {isEditable ? (
                              <QuickEditForm
                                formId="quick-edit-form"
                                field={field}
                                name={randImage.name}
                                item={
                                  field === "imageItem"
                                    ? randImage.imageItem
                                    : randImage.URL
                                }
                                handleSubmitEdit={handleSubmitEdit}
                              />
                            ) : (
                              randImage.imageItem
                            )}
                          </h1>
                          <h5 class="lg:text-lg text-sm">
                            {randImage.phonetics}
                          </h5>
                          <h5 class="">
                            <TrafficLights
                              recentAttempts={randImage.recentAttempts}
                            />
                          </h5>
                          <ConfidenceLevel
                            recentAttempts={randImage.recentAttempts}
                          />
                        </div>
                        {randImage.starred ? (
                          <FontAwesomeIcon
                            onClick={() => handleToggleStar(randImage._id)}
                            className="absolute top-7 left-3 text-yellow-500"
                            icon={faStar}
                          />
                        ) : (
                          <FontAwesomeIcon
                            onClick={() => handleToggleStar(randImage._id)}
                            className="absolute top-7 left-3 text-white"
                            icon={faStarOutline}
                          />
                        )}
                        {isEditable ? (
                          <></>
                        ) : (
                          <>
                            <FontAwesomeIcon
                              className="cursor-pointer absolute left-3/4 top-3/4 text-white h-6 lg:h-8"
                              icon={faEdit}
                              onClick={(e) => handleEdit(e, "imageItem")}
                            />
                            <FontAwesomeIcon
                              className="absolute cursor-pointer left-[87%] top-3/4 text-white h-6 lg:h-8"
                              icon={faImage}
                              onClick={handleShowImageSearch}
                            />
                          </>
                        )}
                        <img
                          class="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40"
                          src={
                            randImage.URL && randImage.URL.length > 0
                              ? randImage.URL
                              : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"
                          }
                          alt=""
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className={
                      isEditable ? "invisible" : "flex flex-col items-center"
                    }
                  >
                    <FontAwesomeIcon
                      className="cursor-pointer h-10 w-40 btn bg-green-400 hover:bg-green-500 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={handleCorrect}
                      icon={faCheck}
                    />
                    <FontAwesomeIcon
                      className="cursor-pointer h-10 w-40 btn bg-red-400 hover:bg-red-500 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={handleIncorrect}
                      icon={faXmark}
                    />
                    <button
                      onClick={(e) => handleNextImage(e)}
                      className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Next
                    </button>
                    {isStarted && (
                      <button
                        onClick={handleStopTraining}
                        className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        Back to options
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {showImageSearch && (
          <ImageSearch
            img={randImage}
            index={null}
            onImageSelect={handleImageSelect}
          />
        )}
        <div>{message}</div>
      </div>
    </>
  );
};

export default TrainingCenter;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (ctx) => {
    const id = ctx.query.imageSet;
    {
      /* const id = req.params.imageSet; */
    }
    const auth0User = await getSession(ctx.req, ctx.res);
    await dbConnect();

    // Fetch the user from the db (by email)
    // let user = await SiteUser.findOne({ where: { email: auth0User?.user.email } });

    let user;
    // You might want to move the creation of the user somewhere else like afterCallback
    // Checkout https://auth0.github.io/nextjs-auth0/modules/handlers_callback.html
    if (!user) {
      // user = db.user.create(auth0User?.user);  //EVENTUALLY SOMETHING LIKE THIS
      user = auth0User.user;
    }

    /* find this image set and make sure it belongs to the user */
    const result = await ImageSet.findOne({ _id: id, userId: user.sub });
    const imageSetToPass = JSON.parse(JSON.stringify(result));

    return { props: { user: user, imageSet: imageSetToPass } };
  },
});
