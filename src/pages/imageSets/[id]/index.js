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

  const pageLimit = isCardSet() ? 26 : 20;

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
    // const res = await fetch(`/api/imageSets/${id}/${currentPage - 1}`, {
    const url = `/api/imageSets/${id}/${
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
    if (isEditable) return <div className="mt-3 mx-0.5 h-10"></div>;
    let div = [];
    const BUTTON_MAX = 10; //how many buttons are shown before there should be a '...'
    const totalButtons = Math.ceil(allNames.images.length / pageLimit);
    const buttonsToBeShown = Math.min(BUTTON_MAX, totalButtons); //lower of maximum and total buttons
    const isEven = BUTTON_MAX % 2 === 0;
    const numberToShowBeforeCurrentPage = isEven
      ? BUTTON_MAX / 2 + 1
      : (BUTTON_MAX - 1) / 2; //6 when we have 10 buttons max

    //const firstButton = (currentPage <= numberToShowBeforeCurrentPage) ? 0 : currentPage - numberToShowBeforeCurrentPage
    let firstButton;
    if (currentPage <= numberToShowBeforeCurrentPage) {
      firstButton = 0;
    } else if (
      currentPage >
      totalButtons - BUTTON_MAX + numberToShowBeforeCurrentPage
    ) {
      // unless we are in last BUTTON_MAX-nts buttons because then there are none showing after
      firstButton = totalButtons - BUTTON_MAX;
    } else firstButton = currentPage - numberToShowBeforeCurrentPage;

    const lastButton = Math.min(
      firstButton + buttonsToBeShown - 1,
      totalButtons - 1
    );

    const isThereMoreAtEnd = lastButton < totalButtons - 1;
    const isThereMoreAtStart = firstButton > 0;

    if (isThereMoreAtStart) {
      let i = 0;
      const firstInRange = allNames.images[i * pageLimit].name;
      const lastInRange =
        i * pageLimit + pageLimit - 1 < allNames.images.length
          ? allNames.images[i * pageLimit + pageLimit - 1]?.name
          : allNames.images[allNames.images.length - 1].name;
      div.push(
        <button
          className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => handlePageChange(i + 1)}
          key={i + 1}
        >
          <RedHeartsAndDiamonds text={firstInRange} />-
          <RedHeartsAndDiamonds text={lastInRange} />
        </button>
      );
      div.push(" ... ");
    }

    for (let i = firstButton; i <= lastButton; i++) {
      const firstInRange = allNames.images[i * pageLimit]?.name;
      const lastInRange =
        i * pageLimit + pageLimit - 1 < allNames.images.length
          ? allNames.images[i * pageLimit + pageLimit - 1]?.name
          : allNames.images[allNames.images.length - 1].name;
      if (i === currentPage - 1) {
        div.push(
          <button
            className="btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => handlePageChange(i + 1)}
            key={i + 1}
          >
            <RedHeartsAndDiamonds text={firstInRange} />-
            <RedHeartsAndDiamonds text={lastInRange} />
          </button>
        );
      } else
        div.push(
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => handlePageChange(i + 1)}
            key={i + 1}
          >
            <RedHeartsAndDiamonds text={firstInRange} />-
            <RedHeartsAndDiamonds text={lastInRange} />
          </button>
        );
    }

    if (isThereMoreAtEnd) {
      div.push(" ... ");
      let i = totalButtons - 1;
      const firstInRange = allNames.images[i * pageLimit].name;
      const lastInRange =
        i * pageLimit + pageLimit - 1 < allNames.images.length
          ? allNames.images[i * pageLimit + pageLimit - 1]?.name
          : allNames.images[allNames.images.length - 1].name;
      div.push(
        <button
          className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => handlePageChange(i + 1)}
          key={i + 1}
        >
          <RedHeartsAndDiamonds text={firstInRange} />-
          <RedHeartsAndDiamonds text={lastInRange} />
        </button>
      );
    }

    let jump;
    if (isCardSet()) {
      jump = 104;
    } else {
      if (allNames.images.length > 1000) {
        jump = 500;
      } else if (allNames.images.length > 100) {
        jump = 100;
      }
    }

    const options = allNames.images.map((item, index) => {
      if (index % jump === 0) {
        const entryNumber = index / pageLimit;
        return (
          <option key={entryNumber} value={entryNumber + 1}>
            {item.name}
          </option>
        );
      }
      return null;
    });

    if (jump)
      div.push(
        <>
          <span> Jump to: </span>
          <select
            id="entry"
            onChange={() =>
              handlePageChange(
                document.getElementById("entry").options[
                  document.getElementById("entry").selectedIndex
                ].value
              )
            }
          >
            {/* Add default option   <option value="">-- Select an option --</option> */}
            {options}
          </select>
        </>
      );
    return div;
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

    //   //first, get imageSet being imported from
    const fromID = importImagesForm.imageSetFrom;

    try {
      console.log(
        "fromID:",
        fromID,
        "imageSet._id:",
        imageSet._id,
        "overwrite:",
        importImagesForm.overwrite
      );

      const res = await fetch(`/api/imageSets/${imageSet._id}/importImages`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({
          sourceSetID: fromID,
          overwrite: importImagesForm.overwrite,
        }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();

      getImageSet(imageSet._id);

      setIsShowingImportPhoneticsDiv(false);
    } catch (error) {
      setMessage("Failed to update images." + error);
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
              {/* show all image sets except this one */}
              {imageSets
                .filter((el) => el._id !== imageSet._id)
                .map((el) => (
                  <option value={el._id}>{el.name}</option>
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
