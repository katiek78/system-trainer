import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { mutate } from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faDumbbell,
  faEdit,
  faGrip,
  faList,
  faStar,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { getPopulatedImageArray } from "@/lib/getPopulatedImageArray";
import { getPopulatedPhoneticsArray } from "@/lib/getPopulatedPhoneticsArray";
import { majorValues } from "@/lib/phoneticsConstants";
import TrafficLights from "@/components/TrafficLights";
import ConfidenceLevel from "@/components/ConfidenceLevel";
import RedHeartsAndDiamonds from "@/components/RedHD";
import { determineSetType } from "@/utilities/setType";
import ImageSearch from "@/components/ImageSearch";
import { isAdmin } from "@/lib/adminCheck";
import PasteImagesForm from "@/components/PasteImagesForm";

const ImageSetPage = ({
  user,
  allNames,
  imageSets,
  isPublicImageSet,
  isAdmin,
}) => {
  const router = useRouter();
  const imageSetID = router.query.id;
  const contentType = "application/json";
  const [imageSet, setImageSet] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [phoneticsType, setPhoneticsType] = useState("");
  const [existingPhoneticsType, setExistingPhoneticsType] = useState("");
  const [swapDigit1, setSwapDigit1] = useState("");
  const [swapDigit2, setSwapDigit2] = useState("");

  const [message, setMessage] = useState("");

  const [isListView, setIsListView] = useState(true);
  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowingPhoneticsDiv, setIsShowingPhoneticsDiv] = useState(false);
  const [isShowingImportPhoneticsDiv, setIsShowingImportPhoneticsDiv] =
    useState(false);

  const [imageForm, setImageForm] = useState({});
  const [importImagesForm, setImportImagesForm] = useState({
    imageSetFrom: "",
    overwrite: false,
  });
  const [populateForm, setPopulateForm] = useState({
    setType: "other",
  });

  const determinePhonetics = () => {
    if (!allNames.images.some((image) => image.phonetics)) {
      return "";
    }

    console.log("ther are some phonetics in set ");

    if (allNames.images.some((image) => image.phonetics === "soos")) {
      return "ben";
    }

    if (allNames.images.some((image) => image.phonetics === "s+s+s")) {
      return "maj";
    }

    if (allNames.images.some((image) => image.phonetics === "stoos")) {
      return "kben";
    }

    return "";
  };

  useEffect(() => {
    console.log(allNames);
    const phonetics = determinePhonetics();
    setPhoneticsType(phonetics);
  }, []);

  const isCardSet = () => {
    // return imageForm && imageForm.setType && imageForm.setType.includes("c");
    return determineSetType(allNames.images.length).includes("c");
  };

  // For 64-set, use 16 per page. For 3cv (2197), use 13 per page. For card sets, 26. Otherwise, 100.
  const pageLimit =
    allNames.images.length === 64
      ? 16
      : imageForm.setType === "3cv" || allNames.images.length === 2197
      ? 13
      : isCardSet()
      ? 26
      : 100;

  // Handler to update the image URL of a specific item
  const handleImageSelect = (index, imageUrl) => {
    // const updatedImages = [...images];
    // updatedImages[index].URL = imageUrl; // Set the URL of the selected image
    // setImages(updatedImages); // Update the state with the new image URL
    const updatedForm = { ...imageForm };
    updatedForm.images[index].URL = imageUrl;
    setImageForm(updatedForm);
  };

  const getImageSet = async (id) => {
    //get image set from DB
    let url = `/api/imageSets/${id}/${
      currentPage - 1
    }?isCardSet=${isCardSet()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: contentType,
        "Content-Type": contentType,
      },
    });
    const data = await res.json();
    setImageSet(data.data);
    let setType = data.data.setType;
    if (!setType || setType === "")
      setType = determineSetType(allNames.images.length);
    setImageForm({
      name: data.data.name,
      setType: setType,
      images: data.data.images,
    });
  };

  useEffect(() => {
    setIsLoading(true);
    const id = router.query.id;
    //get image set here

    getImageSet(id);

    setIsLoading(false);
  }, [currentPage]);

  // <script
  //                           async
  //                           src="https://cse.google.com/cse.js?cx=46c1e2702781e4955"
  //                         ></script>

  useEffect(() => {
    // Dynamically load the Google Custom Search script
    const script = document.createElement("script");
    script.src = "https://cse.google.com/cse.js?cx=46c1e2702781e4955";
    script.async = true;
    document.body.appendChild(script);

    // Cleanup the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const renderPageNumbers = () => {
    // Debug: log the first 30 image names to inspect the set order
    if (allNames && allNames.images && allNames.images.length > 0) {
      console.log(
        "First 30 images:",
        allNames.images.slice(0, 600).map((img) => img.name)
      );
    }
    if (isEditable) return <div className="mt-3 mx-0.5 h-10"></div>;
    // Card navigation helpers
    const suits = ["♠", "♥", "♦", "♣"];
    const suitNames = ["Spades", "Hearts", "Diamonds", "Clubs"];
    const values = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    // Number navigation helpers
    const getNumberOptions = (step = 10) => {
      const options = [];
      for (let i = 0; i < allNames.images.length; i += step) {
        const label = allNames.images[i]?.name || i.toString().padStart(2, "0");
        options.push(
          <option key={i} value={Math.floor(i / pageLimit) + 1}>
            {label}
          </option>
        );
      }
      return options;
    };

    // 64-set navigation: dropdown for first suit, 16 per page, order is heart-heart-heart, heart-heart-diamond, etc.
    if (allNames.images.length === 64) {
      // Suits in order: Hearts, Diamonds, Spades, Clubs
      const suitNames = ["Hearts", "Diamonds", "Spades", "Clubs"];
      const suitSymbols = ["♥️", "♦️", "♠️", "♣️"];
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">First suit</span>
          <select className="mr-2" id="firstSuit64">
            {suitNames.map((s, i) => (
              <option key={s} value={i}>
                {suitSymbols[i]} {s}
              </option>
            ))}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const suitIdx = parseInt(
                document.getElementById("firstSuit64").value
              );
              // Each suit block is 16 items (4^3)
              const idx = suitIdx * 16;
              const page = Math.floor(idx / 16) + 1;
              handlePageChange(page);
            }}
          >
            Go
          </button>
        </div>
      );
    }
    // 3cv (2197) navigation: two dropdowns for card 1 and card 2 (A-K), 13 per page
    if (imageForm.setType === "3cv" && allNames.images.length === 2197) {
      // Card values A-K
      const cardValues = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      // Compute index: card1 * 169 + card2 * 13
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Card 1</span>
          <select className="mr-2" id="card1Value3cv">
            {cardValues.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>
          <span className="mr-2">Card 2</span>
          <select className="mr-2" id="card2Value3cv">
            {cardValues.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const c1 = parseInt(
                document.getElementById("card1Value3cv").value
              );
              const c2 = parseInt(
                document.getElementById("card2Value3cv").value
              );
              // Each page is 13 items: so AAA, AA2, ... AAK is page 1, AAQ is page 12, etc.
              // Index = c1 * 169 + c2 * 13
              const idx = c1 * 169 + c2 * 13;
              const page = Math.floor(idx / 13) + 1;
              handlePageChange(page);
            }}
          >
            Go
          </button>
        </div>
      );
    }

    // Single card set (52)
    if (imageForm.setType === "1c" && allNames.images.length === 52) {
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Jump to:</span>

          <select
            className="mr-2"
            onChange={(e) => {
              const valueIdx = parseInt(e.target.value);
              const suitIdx = parseInt(
                document.getElementById("cardSuitSelect").value
              );
              const idx = suitIdx * 13 + valueIdx;
              handlePageChange(Math.floor(idx / pageLimit) + 1);
            }}
            id="cardValueSelect"
            defaultValue={0}
          >
            {values.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>

          <select
            className="mr-2"
            onChange={(e) => {
              const suitIdx = parseInt(e.target.value);
              const valueIdx = parseInt(
                document.getElementById("cardValueSelect").value
              );
              const idx = suitIdx * 13 + valueIdx;
              handlePageChange(Math.floor(idx / pageLimit) + 1);
            }}
            id="cardSuitSelect"
            defaultValue={0}
          >
            {suits.map((s, i) => (
              <option key={s} value={i}>
                {suitNames[i]}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // 2-card set (1352 or 2704)
    if (
      (imageForm.setType === "2cv" && allNames.images.length === 1352) ||
      (imageForm.setType === "2c" && allNames.images.length === 2704)
    ) {
      // Utility function for both 2cv (1352) and 2c (2704) sets
      // is2cv: true for 1352 set, false for 2704 set
      // s1: card 1 suit (0=Spades, 1=Hearts, 2=Diamonds, 3=Clubs)
      // v1: card 1 value (0=A, 1=2, ... 12=K)
      // c2: card 2 color (0=Red, 1=Black)
      function getPageNumber(is2cv, s1, v1, c2, pageLimit = 26) {
        // Your internal suit order (from earlier):
        // 0 = Spades, 1 = Hearts, 2 = Diamonds, 3 = Clubs
        //
        // Your dataset suit order (from image list you provided):
        // Hearts, Diamonds, Spades, Clubs
        //
        // So map your s1 → dataset index:
        const mapToDatasetOrder = [2, 0, 1, 3];
        // s1=0 (Spades)   → dataset index 2
        // s1=1 (Hearts)   → dataset index 0
        // s1=2 (Diamonds) → dataset index 1
        // s1=3 (Clubs)    → dataset index 3

        const suitIndex = mapToDatasetOrder[s1];

        // Normalise colour:
        // internal mapping: 0 = red, 1 = black
        let colour;
        if (typeof c2 === "string") {
          colour = c2.toLowerCase().startsWith("r") ? 0 : 1;
        } else {
          // numeric: treat 0 as red, 1 as black
          colour = c2 === 0 ? 0 : 1;
        }

        // Dataset structure:
        // Per suit block:       13 * 52 = 676
        // Per value block:      52
        // Per colour block:     26 (reds then blacks)
        const idxFull = suitIndex * 676 + v1 * 52 + colour * 26;

        let idx = idxFull;

        // Reduced set: skip first 1352 items (all red-first pairs)
        if (is2cv) {
          idx = idx - 1352;
          if (idx < 0) idx = 0; // clamp
        }

        return Math.floor(idx / pageLimit) + 1;
      }

      // UI for 2c (2704) and 2cv (1352) - both use getPageNumber
      if (
        (imageForm.setType === "2c" && allNames.images.length === 2704) ||
        (imageForm.setType === "2cv" && allNames.images.length === 1352)
      ) {
        return (
          <div className="flex flex-row items-center mt-3">
            <span className="mr-1">Card 1</span>
            <select className="mr-2" id="card1Value">
              {values.map((v, i) => (
                <option key={v} value={i}>
                  {v}
                </option>
              ))}
            </select>
            <select className="mr-1" id="card1Suit">
              {suits.map((s, i) => (
                <option key={suitNames[i]} value={i}>
                  {suitNames[i]}
                </option>
              ))}
            </select>
            <span className="mr-1">Card 2</span>
            <select className="mr-1" id="card2Color">
              <option value={0}>Red (♥/♦)</option>
              <option value={1}>Black (♠/♣)</option>
            </select>
            <button
              className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
              onClick={() => {
                const c1s = parseInt(
                  document.getElementById("card1Suit").value
                );
                const c1v = parseInt(
                  document.getElementById("card1Value").value
                );
                const c2color = parseInt(
                  document.getElementById("card2Color").value
                );
                const is2cv =
                  imageForm.setType === "2cv" &&
                  allNames.images.length === 1352;
                const page = getPageNumber(is2cv, c1s, c1v, c2color);
                handlePageChange(page);
              }}
            >
              Go
            </button>
          </div>
        );
      }
    }

    // Number sets (2d, 3d, 4d)
    if (["2d", "3d", "4d"].includes(imageForm.setType)) {
      // For 2d: 00, 10, 20, ...; for 3d: 000, 010, ...
      const step = imageForm.setType === "2d" ? 10 : 100;
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Jump to:</span>
          <select
            onChange={(e) => handlePageChange(Number(e.target.value))}
            defaultValue={1}
          >
            {getNumberOptions(step)}
          </select>
        </div>
      );
    }

    return null;
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this set?"
    );
    if (confirmed) {
      try {
        const { id } = router.query;
        await fetch(`/api/imageSets/${id}`, {
          method: "Delete",
        });
        router.push(`/imageSets`);
      } catch (error) {
        setMessage("Failed to delete the set.");
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const putDataPopulate = async (populateForm) => {
    const imageArray = getPopulatedImageArray(populateForm.setType);

    const { id } = router.query;
    try {
      setImageForm({ ...imageForm, images: imageArray });
      const res = await fetch(`/api/imageSets/${id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({ ...imageSet, images: imageArray }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();

      mutate(`/api/imageSets/${id}`, data, false); // Update the local data without a revalidation
      refreshData(router);
    } catch (error) {
      setMessage("Failed to add images to set");
    }
  };

  const putDataImages = async (imageForm) => {
    // function replaceElementsWithNewImages(originalArray, i, newImages) {

    //   // Replace elements starting from index `i`
    //   for (let j = 0; j < newImages.length; j++) {
    //     if (i + j < originalArray.length) {
    //       originalArray[i + j] = newImages[j];
    //     } else {
    //       originalArray.push(newImages[j]);
    //     }
    //   }

    //   return originalArray
    // }

    // replaceElementsWithNewImages

    const { id } = router.query;

    try {
      const res = await fetch(`/api/imageSets/${id}/${currentPage}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({
          name: imageForm.name,
          images: imageForm.images,
        }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();
    } catch (error) {
      setMessage("Failed to update images");
    }
  };

  const handleChangeImageForm = (e) => {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    const updatedForm = { ...imageForm };
    const isURL = name.includes("URL");
    let thisIndex;
    if (isURL) {
      thisIndex = name.slice(6) % pageLimit;
      updatedForm.images[thisIndex].URL = value;
    } else {
      thisIndex = name.slice(8) % pageLimit;
      updatedForm.images[thisIndex].imageItem = value;
    }
    setImageForm(updatedForm);
  };

  const handleChangePopulateForm = (e) => {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    setPopulateForm({
      ...populateForm,
      [name]: value,
    });
  };

  const handleChangeTitle = (e) => {
    setImageForm({ ...imageForm, name: e.target.value });
  };

  //   /* Makes sure image set info is filled */
  //   const formValidate = () => {
  //     let err = {}
  //     if (!form.name) err.name = 'Name is required'

  //     return err
  //   }

  const handleSubmitPopulateForm = (e) => {
    e.preventDefault();

    putDataPopulate(populateForm);
  };

  const handleSubmitImageForm = (e) => {
    e.preventDefault();

    putDataImages(imageForm);
    setIsEditable(false);
  };

  const handleToggleEditable = () => {
    setIsEditable(!isEditable);
    setIsListView(true);
  };

  const handleToggleListView = () => {
    setIsListView(!isListView);
  };

  const handleRemovePicture = (index) => {
    const updatedForm = { ...imageForm };
    updatedForm.images[index].URL = "";
    setImageForm(updatedForm);
  };

  const handleTraining = () => {
    router.push("/training/set-learning?imageSet=" + imageSet._id);
  };

  const toggleRotate = (e, toFront = false) => {
    if (!isListView) {
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

  const handleToggleStar = async (id) => {
    const thisImage = imageSet.images.filter((el) => el._id === id)[0];
    if (!thisImage) return;
    if (thisImage.starred === undefined) thisImage.starred = false;
    thisImage.starred = !thisImage.starred;

    //change it in the form as well
    function findIndexById(array, id) {
      for (let i = 0; i < array.length; i++) {
        if (array[i]._id === id) {
          return i;
        }
      }
      return -1;
    }

    const updatedForm = { ...imageForm };
    const thisIndex = findIndexById(updatedForm.images, id);
    if (thisIndex) updatedForm.images[thisIndex].starred = thisImage.starred;

    setImageForm(updatedForm);

    try {
      const res = await fetch(`/api/imageSets/${imageSet._id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(thisImage),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }
      const { data } = await res.json();
    } catch (error) {
      setMessage("Failed to save image");
    }
  };

  const handlePhoneticsChange = (e) => {
    const target = e.target;
    const value = target.value;
    setPhoneticsType(value);
  };

  const handleSwap1Change = (e) => {
    const target = e.target;
    const value = target.value;
    setSwapDigit1(value);
  };

  const handleSwap2Change = (e) => {
    const target = e.target;
    const value = target.value;
    setSwapDigit2(value);
  };

  const handleImportPhoneticsChange = (e) => {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    //setting form correctly

    setImportImagesForm({
      ...importImagesForm,
      [name]: name === "overwrite" ? target.checked : value,
    });
    setIsShowingPhoneticsDiv(false);
  };

  const handleShowPhoneticsDiv = () => {
    setIsShowingPhoneticsDiv(true);
  };

  const handleCancelPhonetics = () => {
    setIsShowingPhoneticsDiv(false);
  };

  const handleShowImportPhoneticsDiv = () => {
    setIsShowingImportPhoneticsDiv(true);
  };

  const handleCancelImportPhonetics = () => {
    setIsShowingImportPhoneticsDiv(false);
  };

  const getReplacementMajorConsonants = (s1, s2) => {
    if (s1 === s2 || s1 === "-" || s2 === "-") return majorValues;
    let majorValuesCopy = [...majorValues];
    majorValuesCopy[s1] = majorValues[s2];
    majorValuesCopy[s2] = majorValues[s1];
    return majorValuesCopy;
  };

  const handleSubmitPhonetics = async (e) => {
    e.preventDefault();
    const phoneticsArray = getPopulatedPhoneticsArray(
      imageForm.setType,
      phoneticsType,
      getReplacementMajorConsonants(swapDigit1, swapDigit2)
    );

    try {
      const res = await fetch(`/api/imageSets/${imageSet._id}/phonetics`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(phoneticsArray),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const updatedImageSet = { ...imageSet };
      const updatedImages = updatedImageSet.images.map((image, index) => ({
        ...image,
        phonetics: phoneticsArray[index],
      }));
      updatedImageSet.images = updatedImages;
      setImageSet(updatedImageSet);
    } catch (error) {
      setMessage("Failed to update image set");
    }
  };

  const handleSubmitImportPhonetics = async (e) => {
    e.preventDefault();

    const fromID = importImagesForm.imageSetFrom;
    const batchSize = 200;
    let batchIndex = 0;
    let moreBatches = true;
    let totalUpdated = 0;

    try {
      while (moreBatches) {
        const res = await fetch(`/api/imageSets/${imageSet._id}/importImages`, {
          method: "PUT",
          headers: {
            Accept: contentType,
            "Content-Type": contentType,
          },
          body: JSON.stringify({
            sourceSetID: fromID,
            overwrite: importImagesForm.overwrite,
            batchSize,
            batchIndex,
          }),
        });
        if (!res.ok) {
          throw new Error(res.status);
        }
        const result = await res.json();
        totalUpdated += result.updatedCount || 0;
        moreBatches = result.moreBatches;
        batchIndex = result.nextBatchIndex || 0;
      }
      getImageSet(imageSet._id);
      setIsShowingImportPhoneticsDiv(false);
      setMessage(`Import complete. Images updated: ${totalUpdated}`);
    } catch (error) {
      setMessage("Failed to update images. " + error);
    }
  };

  return (
    <>
      <div className="z-10 justify-between w-full font-mono pl-2 md:pl-2 lg:pl-0">
        <h1 className="py-2 font-mono text-sm md:text-md lg:text-lg ">
          Image set{isPublicImageSet && " (PUBLIC)"}:{" "}
        </h1>
        <h2 className="py-2 font-mono  text-2xl md:text-3xl lg:text-5xl">
          {isEditable ? (
            <input
              onChange={handleChangeTitle}
              className=" text-2xl md:text-3xl lg:text-5xl"
              style={{ width: "90%" }}
              value={imageForm.name}
            ></input>
          ) : (
            <span>
              {imageForm.name}{" "}
              {(!isPublicImageSet || isAdmin) && (
                <FontAwesomeIcon
                  className="hover:text-gray-700 hover:cursor-pointer ml-5"
                  onClick={handleDelete}
                  icon={faTrash}
                  size="1x"
                />
              )}
            </span>
          )}
        </h2>
        {!isShowingPhoneticsDiv && (!isPublicImageSet || isAdmin) && (
          <button
            onClick={handleShowPhoneticsDiv}
            className="btn bg-gray-700 hover:bg-gray-700 text-white font-bold my-2 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Change/add phonetics
          </button>
        )}
        {!isShowingImportPhoneticsDiv && (!isPublicImageSet || isAdmin) && (
          <button
            onClick={handleShowImportPhoneticsDiv}
            className="btn bg-gray-700 hover:bg-gray-700 text-white font-bold ml-3 my-2 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Import images from set
          </button>
        )}
        {(!isPublicImageSet || isAdmin) && (
          <Link
            href="/imageSets/[id]/pasteImages"
            as={`/imageSets/${imageSetID}/pasteImages`}
            legacyBehavior
          >
            <button className="btn bg-black hover:bg-gray-700 text-white font-bold ml-3 mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
              Import images via copy/paste
            </button>
          </Link>
        )}

        {isShowingPhoneticsDiv && (
          <div
            id="changePhoneticsDiv"
            className="px-2 py-2 my-5 rounded-xl bg-gray-200 dark:bg-gray-800"
          >
            <label htmlFor="phoneticsType">Change phonetics system:</label>
            <select
              name="phoneticsType"
              value={phoneticsType || "none"}
              onChange={handlePhoneticsChange}
              className="text-black ml-3 mr-3 px-3 py-3 w-56 rounded text-lg"
              required
            >
              <option value="none">None</option>
              {imageForm.setType !== "1c" && (
                <option value="maj">Major System</option>
              )}
              {(imageForm.setType === "2c" ||
                imageForm.setType === "2cv" ||
                imageForm.setType === "3d") && (
                <option value="ben">Ben System</option>
              )}
              {(imageForm.setType === "2c" ||
                imageForm.setType === "2cv" ||
                imageForm.setType === "4d" ||
                imageForm.setType === "3cv") && (
                <option value="kben">Katie Ben System</option>
              )}
              {imageForm.setType === "3cv" && (
                <option value="dben">D Ben System</option>
              )}
            </select>
            <br />
            <span>Swap consonants:</span>
            <select
              name="swapDigit1"
              value={swapDigit1 || "-"}
              onChange={handleSwap1Change}
              className="text-black mt-3 ml-3 mr-3 px-3 py-3 w-20 rounded text-lg"
            >
              <option value="-">-</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
            and
            <select
              name="swapDigit2"
              value={swapDigit2 || "-"}
              onChange={handleSwap2Change}
              className="text-black mt-3 ml-3 mr-3 px-3 py-3 w-20 rounded text-lg"
            >
              <option value="-">-</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
            <br />
            <button
              onClick={handleCancelPhonetics}
              className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitPhonetics}
              className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        )}

        {isShowingImportPhoneticsDiv && (
          <div
            id="importImagesDiv"
            className="px-2 py-2 my-5 rounded-xl bg-gray-200"
          >
            <label htmlFor="imageSetFrom">
              Select image set to import from:
            </label>
            <select
              name="imageSetFrom"
              value={importImagesForm.imageSetFrom}
              onChange={handleImportPhoneticsChange}
              className="ml-3"
              required
            >
              <option value="">-- Select an image set --</option>
              {/* show all image sets except this one */}
              {imageSets
                .filter((el) => el._id !== imageSet._id)
                .map((el) => (
                  <option key={el._id} value={el._id}>
                    {el.name}
                  </option>
                ))}
            </select>

            <label htmlFor="overwrite">Overwrite existing images?</label>
            <input
              type="checkbox"
              name="overwrite"
              value={importImagesForm.overwrite}
              onChange={handleImportPhoneticsChange}
            ></input>

            <br />
            <button
              onClick={handleCancelImportPhonetics}
              className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitImportPhonetics}
              className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        )}

        <div className="flex flex-row">
          <div
            className={
              isEditable
                ? "invisible flex flex-row basis-1/3"
                : "flex flex-row basis-1/3"
            }
          >
            <div className="">
              <FontAwesomeIcon
                className={
                  isListView
                    ? "px-3 rounded bg-white text-black text-6xl"
                    : "px-3 text-gray-100 hover:text-gray-700 hover:cursor-pointer"
                }
                onClick={handleToggleListView}
                icon={faList}
                size="3x"
              />
            </div>
            <div className="ml-2">
              <FontAwesomeIcon
                className={
                  isListView
                    ? "px-3 text-gray-100 hover:text-gray-700 hover:cursor-pointer"
                    : "px-3 rounded bg-white text-black text-6xl"
                }
                onClick={handleToggleListView}
                icon={faGrip}
                size="3x"
              />
            </div>
          </div>

          <div className="basis-1/3">
            {isEditable ? (
              <FontAwesomeIcon
                className="hover:text-gray-700 hover:cursor-pointer"
                onClick={handleSubmitImageForm}
                icon={faCheck}
                size="3x"
              />
            ) : (
              (!isPublicImageSet || isAdmin) && (
                <FontAwesomeIcon
                  className="hover:text-gray-700 hover:cursor-pointer"
                  onClick={handleToggleEditable}
                  icon={faEdit}
                  size="3x"
                />
              )
            )}
          </div>

          <div className="basis-1/3">
            {!isEditable && !isPublicImageSet && (
              <FontAwesomeIcon
                className="hover:text-gray-700 hover:cursor-pointer"
                onClick={handleTraining}
                icon={faDumbbell}
                size="3x"
              />
            )}
          </div>
        </div>

        <div>{renderPageNumbers()}</div>
        {isListView && (
          <div className="mt-6 w-full">
            {/* Table Headers (only visible on larger screens) */}
            <div className="hidden sm:grid grid-cols-7 font-bold text-lg border-b border-gray-400 py-2">
              <div className="col-span-1">Item</div>
              <div className="col-span-1">Phonetics</div>
              <div className="col-span-2">Image description</div>
              <div className="col-span-2 sm:ml-3">Picture</div>
              <div className="col-span-1"> </div>
            </div>

            {/* Table Rows (Cards on Mobile) */}
            {!isLoading &&
              imageSet &&
              imageSet.images &&
              imageSet.images.length > 0 &&
              imageSet.images.map((img, i) => {
                return (
                  <div
                    key={img._id}
                    className="grid grid-cols-1 sm:grid-cols-7 border border-gray-300 sm:border-gray-500 p-4 sm:p-2 rounded-lg bg-white dark:bg-gray-800 rounded sm:rounded-none shadow-md sm:shadow-none mb-4 sm:mb-0"
                  >
                    {/* Name */}
                    <div className="col-span-1 font-bold text-xl">
                      <RedHeartsAndDiamonds text={img.name} />
                    </div>

                    {/* Phonetics */}
                    <div className="col-span-1">
                      <RedHeartsAndDiamonds text={img.phonetics} />
                    </div>

                    {/* Image Description */}
                    <div className="col-span-2">
                      {isEditable ? (
                        <input
                          className="border border-gray-400 p-2 rounded-md w-full focus:border-blue-500 focus:ring focus:ring-blue-300"
                          onChange={handleChangeImageForm}
                          value={img.imageItem}
                          id={"inpImage" + (i + (currentPage - 1) * pageLimit)}
                          name={
                            "inpImage" + (i + (currentPage - 1) * pageLimit)
                          }
                        />
                      ) : (
                        img.imageItem || "<no image yet>"
                      )}
                    </div>

                    {/* Picture URL */}
                    <div className="sm:ml-3 col-span-2">
                      {isEditable ? (
                        <>
                          {!img.URL && (
                            <>
                              <ImageSearch
                                key={imageForm.images[i].imageItem}
                                description={imageForm.images[i].imageItem}
                                index={i}
                                onImageSelect={handleImageSelect}
                              />
                            </>
                          )}
                          {img.URL && img.URL.length ? (
                            <div className="flex items-center">
                              <img
                                className="h-20 sm:h-14"
                                src={img.URL}
                                alt="item"
                              />
                              <button
                                className="ml-auto p-2"
                                onClick={() => handleRemovePicture(i)}
                              >
                                <FontAwesomeIcon
                                  className="text-red-500"
                                  icon={faTrash}
                                />
                              </button>
                            </div>
                          ) : (
                            <span></span>
                          )}
                        </>
                      ) : img.URL && img.URL.length ? (
                        <img className="h-20 sm:h-14" src={img.URL} />
                      ) : (
                        <div></div>
                      )}
                    </div>

                    {/* Star Button */}
                    <div className="col-span-1">
                      {!isPublicImageSet ? (
                        img.starred ? (
                          <FontAwesomeIcon
                            onClick={() => handleToggleStar(img._id)}
                            className="ml-3 text-yellow-500 text-2xl"
                            icon={faStar}
                          />
                        ) : (
                          <FontAwesomeIcon
                            onClick={() => handleToggleStar(img._id)}
                            className="ml-3 mt-2 black dark:text-gray-500 text-2xl"
                            icon={faStarOutline}
                          />
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {!isListView && (
          <div className="flex flex-wrap">
            {/* Create a card for each imageItem */}
            {/* {!isLoading && imageSet && imageSet.images && imageSet.images.length > 0 && imageSet.images.filter((img, i) => i < currentPage*pageLimit && i >= (currentPage - 1)*pageLimit).map((img) => ( */}
            {!isLoading &&
              imageSet &&
              imageSet.images &&
              imageSet.images.length > 0 &&
              imageSet.images.map((img) => (
                <>
                  <div className="group [perspective:1000px]">
                    <div className="z-3 relative m-2 h-40 w-60 rounded-xl shadow-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                      <div className="absolute inset-0 rounded-xl border-4 border-slate-700 bg-white [backface-visibility:hidden]">
                        <div className="flex-col rounded-xl px-12  text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <h1 className="text-3xl font-bold">
                            <RedHeartsAndDiamonds text={img.name} />
                          </h1>
                        </div>
                      </div>
                      <div className="absolute inset-0 h-full w-full  rounded-xl  [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <div className="flex-col rounded-xl bg-black/60 px-12  text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <h1 className="text-3xl font-bold">
                            {img.imageItem}
                          </h1>
                          <h5 className="absolute top-24 text-md">
                            {img.phonetics}
                          </h5>
                          <h5 className="mt-3 text-2xl">
                            <TrafficLights
                              recentAttempts={img.recentAttempts}
                            />
                          </h5>
                          <ConfidenceLevel
                            recentAttempts={img.recentAttempts}
                          />
                          {!isPublicImageSet && (
                            <>
                              {img.starred ? (
                                <FontAwesomeIcon
                                  onClick={() => handleToggleStar(img._id)}
                                  className="absolute top-7 left-3 text-yellow-500"
                                  icon={faStar}
                                />
                              ) : (
                                <FontAwesomeIcon
                                  onClick={() => handleToggleStar(img._id)}
                                  className="absolute top-7 left-3 text-white"
                                  icon={faStarOutline}
                                />
                              )}
                            </>
                          )}
                        </div>
                        <img
                          className="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40"
                          src={
                            img.URL && img.URL.length > 0
                              ? img.URL
                              : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"
                          }
                          alt=""
                        />
                      </div>
                    </div>
                  </div>
                </>
              ))}
          </div>
        )}

        {!isLoading &&
          imageSet &&
          imageSet.images &&
          imageSet.images.length === 0 && (
            <>
              <p>
                You have not added any images to this set. <br />
                Add some images manually, or select the set type and then click
                Populate Set to add the images automatically (e.g. 000-999 for a
                3-digit set).{" "}
              </p>

              <form
                className="rounded pt-6 pb-8 mb-4"
                id="populate-set-form"
                onSubmit={handleSubmitPopulateForm}
              >
                <label htmlFor="setType">What type of set is this?</label>
                <select
                  name="setType"
                  value={populateForm.setType || "other"}
                  onChange={handleChangePopulateForm}
                  className="ml-3"
                  required
                >
                  <option value="2d">2-digit</option>
                  <option value="3d">3-digit</option>
                  <option value="4d">4-digit</option>
                  <option value="1c">1-card</option>
                  <option value="2cv">2-card (1352)</option>
                  <option value="2c">2-card (2704)</option>
                  <option value="3cv">3-card (values)</option>
                  <option value="3cs">3-card (suits)</option>
                  <option value="other">other</option>
                </select>
                <br />
                <button
                  type="submit"
                  className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Populate Set
                </button>
              </form>
            </>
          )}

        <div>{message}</div>

        {/* Add a button to add an image manually */}
      </div>
    </>
  );
};

export default ImageSetPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    if (!auth0User || !auth0User.user) {
      return { props: { user: null, allNames: null, imageSets: [] } }; // Prevent unauthorized access
    }
    await dbConnect();

    const adminStatus = isAdmin(auth0User.user);

    //get all names
    // const allNames = await ImageSet.findOne({_id: params.id}, {images: {_id: 1, name: 1, phonetics: 1, imageItem: 1}});
    const userId = auth0User.user.sub; // Get the current user's Auth0 ID

    const allNames = await ImageSet.findOne(
      {
        _id: params.id,
        $or: [
          { userId: userId }, // If the user is the owner
          { userId: null }, // If the image set is public
          { userId: { $exists: false } }, // If there's no userId field at all
        ],
      },
      { images: { name: 1 }, userId: 1 }
    );

    if (!allNames) {
      return { notFound: true }; // Prevent access if the image set doesn't belong to the user
    }

    const serializedNames = JSON.parse(JSON.stringify(allNames));

    //get all image sets name and ids
    const result2 = await ImageSet.find({ userId }, { name: 1 });

    const imageSets = result2.map((doc) => ({
      ...doc.toObject(),
      _id: doc._id.toString(),
    }));

    return {
      props: {
        user: auth0User.user,
        allNames: serializedNames,
        imageSets,
        isPublicImageSet: !allNames.userId,
        isAdmin: adminStatus,
      },
    };
  },
});
