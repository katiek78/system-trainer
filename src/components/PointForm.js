import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import LocationExplanation from "@/components/LocationExplanation";
import EmbedStreetView from "./EmbedStreetView";
import ImageSearch from "./ImageSearch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { isLocationStreetView } from "@/utilities/isLocationStreetView";

const PAGE_LIMIT = 20; // Must match the PAGE_LIMIT in JourneyDetail.js

const PointForm = ({
  formId,
  pointForm,
  forNewPoint = true,
  journeyId,
  pointIndex,
}) => {
  const router = useRouter();
  const params = useParams();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showImageSearch, setShowImageSearch] = useState(false);

  const [form, setForm] = useState({
    name: pointForm.name,
    location: pointForm.location,
    heading: pointForm.heading || 90,
    pitch: pointForm.pitch || 0,
    fov: pointForm.fov || 100,
    memoItem: pointForm.memoItem || "",
    memoPic: pointForm.memoPic || "",
  });

  const handleImageSelect = (index, imageUrl) => {
    const updatedForm = { ...form };
    updatedForm.memoPic = imageUrl;
    setForm(updatedForm);
  };

  const handleShowImageSearch = () => {
    setShowImageSearch(true);
  };

  const handleCloseImageSearch = () => {
    setShowImageSearch(false);
  };

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const id = params.id;

    try {
      const res = await fetch(`/api/points/${id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(form),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      await res.json();

      const pageToGoTo = Math.floor(pointIndex / PAGE_LIMIT) + 1;

      router.push(`/journeys/${journeyId}?page=${pageToGoTo}`);
    } catch (error) {
      setMessage("Failed to update location");
    }
  };

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    const id = params.id;

    const insertAt = pointIndex;

    try {
      const res = await fetch(`/api/points/${id}`, {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({
          ...form,
          insertAt, // add insertAt into the body
        }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();

      // Calculate the correct page based on where the point was inserted
      let pageToGoTo;
      if (pointIndex !== null && pointIndex !== undefined) {
        // If inserting at a specific index, go to that page
        pageToGoTo = Math.floor(pointIndex / PAGE_LIMIT) + 1;
      } else {
        // If adding to the end, go to the last page
        const totalPoints = data.points.length;
        pageToGoTo = Math.ceil(totalPoints / PAGE_LIMIT);
      }

      router.push(`/journeys/${data._id}?page=${pageToGoTo}`);
    } catch (error) {
      setMessage("Failed to add point");
    }
  };

  const formValidate = () => {
    let err = {};
    if (!form.name) err.name = "Name is required";
    setForm(validateLocation(form.location));
    return err;
  };

  const validateLocation = (locationValue) => {
    if (!locationValue || locationValue === "")
      return { ...form, location: "" };
    function getPosition(str, char, index) {
      return str.split(char, index).join(char).length;
    }
    console.log(locationValue);
    //if it includes @ then parse as a Google Street View URL
    if (locationValue.includes("@")) {
      const slicedLocationValue = locationValue.slice(
        locationValue.indexOf("@") + 1
      );
      const secondCommaAt = getPosition(slicedLocationValue, ",", 2);
      const parsedLocation = slicedLocationValue.slice(
        slicedLocationValue.indexOf("@") + 1,
        secondCommaAt
      );
      //get heading, pitch and fov values too
      const thirdCommaAt = getPosition(slicedLocationValue, ",", 3);
      const fov = slicedLocationValue.slice(
        thirdCommaAt + 1,
        slicedLocationValue.indexOf("y")
      );
      const fourthCommaAt = getPosition(slicedLocationValue, ",", 4);
      const heading = slicedLocationValue.slice(
        fourthCommaAt + 1,
        slicedLocationValue.indexOf("h")
      );
      const fifthCommaAt = getPosition(slicedLocationValue, ",", 5);
      const pitch = slicedLocationValue.slice(
        fifthCommaAt + 1,
        slicedLocationValue.indexOf("t")
      );

      locationValue = parsedLocation;
      return {
        ...form,
        location: parsedLocation,
        heading,
        pitch: (pitch - 90).toFixed(2),
        fov,
      };
    }
    //if it starts with ( then parse as a coordinates set from mobile app (need to remove brackets and spaces)
    if (locationValue[0] === "(") {
      locationValue = locationValue.replaceAll(/[\(\)\s]/g, "");
      return { ...form, location: locationValue };
    }

    //else assume it's an image URL
    return { ...form, location: locationValue };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = formValidate();
    if (Object.keys(errs).length === 0) {
      forNewPoint ? postData(form, pointIndex) : putData(form);
    } else {
      setErrors({ errs });
    }
  };

  const handleChange = (e) => {
    const target = e.target;
    //const value = target.name === 'location'? validateLocation(target.value) : target.value; //coordinates change should cause street view to update

    if (target.name === "location") {
      setForm(validateLocation(target.value));
    } else {
      const value = target.value;
      const name = target.name;
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  return (
    <>
      <form
        className="rounded pt-6 pb-8 mb-4"
        id={formId}
        onSubmit={handleSubmit}
      >
        <label htmlFor="name">Description of the location</label>
        <input
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="60"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="location">
          Co-ordinates/address from Google Street View OR image address
        </label>
        <input
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
        />
        <LocationExplanation />

        {form.location && isLocationStreetView(form.location) && (
          <div>
            <EmbedStreetView
              width={400}
              height={330}
              location={form.location}
              heading={form.heading}
              pitch={form.pitch}
              fov={form.fov}
            />
            <p>Adjust the values below to customise your view:</p>
            <label htmlFor="heading">Heading (orientation, -180 to 360)</label>
            <input
              className="ml-7"
              type="number"
              maxLength="4"
              min="-180"
              max="360"
              name="heading"
              value={form.heading}
              onChange={handleChange}
              step="any"
            />
            <br />
            <label htmlFor="pitch">Pitch (up/down, -90 to 90)</label>
            <input
              className="ml-7"
              type="number"
              maxLength="4"
              min="-90"
              max="90"
              name="pitch"
              value={form.pitch}
              onChange={handleChange}
              step="any"
            />
            <br />
            <label htmlFor="fov">FOV (field of view, 10 to 100)</label>
            <input
              className="ml-7"
              type="number"
              maxLength="4"
              min="10"
              max="100"
              name="fov"
              value={form.fov}
              onChange={handleChange}
              step="any"
            />
          </div>
        )}
        <br />
        <br />
        <label htmlFor="memoItem">Item / person to store here</label>
        <input
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          name="memoItem"
          value={form.memoItem}
          onChange={handleChange}
        />
        <label htmlFor="memoPic">Image URL</label>
        <input
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          name="memoPic"
          value={form.memoPic}
          onChange={handleChange}
        />

        <ImageSearch
          key={form.memoItem}
          description={form.memoItem}
          index={1}
          onImageSelect={handleImageSelect}
          onClose={handleCloseImageSearch}
        />
        {/* )} */}
        <br />
        <button
          type="submit"
          className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Submit
        </button>
      </form>
      <p>{message}</p>
      <div>
        {Object.keys(errors).map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </div>
    </>
  );
};

export default PointForm;
