import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

const PasteImagesForm = ({ formId, pasteImagesForm }) => {
  const router = useRouter();
  const params = useParams();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    imageList: pasteImagesForm.imageList,
    overwrite: false,
  });

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    const id = params.id;
    console.log(id);
    const newImages = form.imageList
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t"));
    console.log(newImages);

    try {
      const res = await fetch(`/api/imageSets/${id}/importFromPaste`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify({
          newImages: newImages,
          overwrite: form.overwrite,
        }),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      await res.json();
      router.push(`/imageSets/${id}`);
    } catch (error) {
      setMessage("Failed to import images");
    }
  };

  const formValidate = () => {
    let err = {};
    if (!form.imageList) err.imageList = "Please enter some images";
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
        <label htmlFor="overwrite">Overwrite existing images?</label>
        <input
          type="checkbox"
          name="overwrite"
          value={form.overwrite}
          onChange={handleChange}
        ></input>
        <br />
        <textarea
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          cols="60"
          rows="30"
          name="imageList"
          value={form.imageList}
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

export default PasteImagesForm;
