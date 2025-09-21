import { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";

const ImportLocationsForm = ({ formId, importLocationsForm }) => {
  const router = useRouter();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    locationList: importLocationsForm.locationList,
  });

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    const { id } = router.query;
    const pointNames = form.locationList
      .split("\n")
      .map((point) => point.trim()); // Split input into an array of point names
    const newPoints = pointNames.map((name) => ({
      name: name,
      location: "", // Set default or leave it empty
      heading: 0, // Set default or leave it as needed
      pitch: 0, // Set default or leave it as needed
      fov: 0, // Set default or leave it as needed
      memoItem: "", // Set default or leave it empty
      memoPic: "",
    }));

    try {
      const res = await fetch(`/api/journeys/${id}/import`, {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(newPoints),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();
      router.push(`/journeys/${data._id}`);
    } catch (error) {
      setMessage("Failed to import locations");
    }
  };

  const formValidate = () => {
    let err = {};
    if (!form.locationList) err.locationList = "Please enter some locations";
    setForm(form);
    return err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = formValidate();
    if (Object.keys(errs).length === 0) {
      postData(form);
    } else {
      setErrors({ errs });
    }
  };

  const handleChange = (e) => {
    const target = e.target;

    const value = target.value;
    const name = target.name;
    setForm({
      ...form,
      [name]: value,
    });
  };

  return (
    <>
      <form
        className="rounded pt-6 pb-8 mb-4"
        id={formId}
        onSubmit={handleSubmit}
      >
        <label htmlFor="name">List of locations:</label>
        <textarea
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          cols="60"
          rows="30"
          name="locationList"
          value={form.locationList}
          onChange={handleChange}
          required
        />

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

export default ImportLocationsForm;
