import { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { getPopulatedImageArray } from "@/lib/getPopulatedImageArray";
import { getPopulatedPhoneticsArray } from "@/lib/getPopulatedPhoneticsArray";

const ImageSetForm = ({ userId, formId, imageSetForm, forNewSet = true }) => {
  const router = useRouter();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: imageSetForm.name,
    setType: imageSetForm.setType,
    phoneticsType: imageSetForm.phoneticsType,
    // wordType: wordForm.wordType
  });

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const { id } = router.query;
    const { setType, ...formDataToStore } = form;

    try {
      const res = await fetch(`/api/imageSets/${id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(formDataToStore),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();

      mutate(`/api/imageSets/${id}`, data, false); // Update the local data without a revalidation
      router.push({ pathname: `/imageSets/${id}` });
    } catch (error) {
      setMessage("Failed to update image set");
    }
  };

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    //populate set
    const imageArray = getPopulatedImageArray(form.setType);
    form.images = imageArray;
    const phoneticsArray = getPopulatedPhoneticsArray(
      form.setType,
      form.phoneticsType
    );
    form.images = form.images.map((el, i) => ({
      ...el,
      phonetics: phoneticsArray[i],
    }));

    const { setType, phoneticsType, ...formDataToStore } = form;

    try {
      const res = await fetch("/api/imageSets", {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({ ...formDataToStore, userId: userId }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      router.push({ pathname: `/imageSets` });
    } catch (error) {
      setMessage("Failed to add image set");
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

  /* Makes sure image set info is filled */
  const formValidate = () => {
    let err = {};
    if (!form.name) err.name = "Name is required";

    return err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errs = formValidate();
    if (Object.keys(errs).length === 0) {
      forNewSet ? postData(form) : putData(form);
    } else {
      setErrors({ errs });
    }
  };

  return (
    <>
      <form
        className="rounded pt-6 pb-8 mb-4"
        id={formId}
        onSubmit={handleSubmit}
      >
        <label htmlFor="name">Name</label>
        <input
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="60"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        {/* <label htmlFor="meaning">Meaning</label>
        <input
          type="text"
          maxLength="100"
          name="meaning"
          value={form.meaning}
          onChange={handleChange}
          required
        />
 */}
        <label htmlFor="setType">What type of set is this?</label>
        <select
          name="setType"
          value={form.setType || "other"}
          onChange={handleChange}
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
        {form.setType !== "other" && (
          <>
            <label htmlFor="phoneticsType">
              Select phonetics if applicable:
            </label>
            <select
              name="phoneticsType"
              value={form.phoneticsType || "none"}
              onChange={handleChange}
              className="ml-3"
              required
            >
              <option value="none">None</option>
              {form.setType !== "1c" && form.setType !== "3cs" && (
                <option value="maj">Major System</option>
              )}
              {(form.setType === "2c" ||
                form.setType === "2cv" ||
                form.setType === "3d" ||
                form.setType === "3cv") && (
                <>
                  <option value="ben">Ben System</option>
                  <option value="dben">D Ben System</option>
                </>
              )}
              {(form.setType === "2c" ||
                form.setType === "2cv" ||
                form.setType === "4d") && (
                <option value="kben">Katie Ben System</option>
              )}
              {form.setType === "2c" && (
                <option value="hbhm">Half Ben Half Major</option>
              )}
            </select>
          </>
        )}
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

export default ImageSetForm;
