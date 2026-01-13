"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";

const JourneyFolderForm = ({
  userId,
  formId,
  journeyFolderForm,
  forNewJourneyFolder = true,
}) => {
  const router = useRouter();
  const params = useParams();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: journeyFolderForm.name,
  });

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const id = params?.id;
    const { ...formDataToStore } = form;

    try {
      const res = await fetch(`/api/journeys/folders/${id}`, {
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

      mutate(`/api/journeys/folders/${id}`, data, false); // Update the local data without a revalidation
      router.push(`/journeys/folders/${id}`);
    } catch (error) {
      setMessage("Failed to update journey folder");
    }
  };

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    //populate set

    const { ...formDataToStore } = form;

    try {
      const res = await fetch("/api/journeys/folders", {
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

      router.push(`/journeys/`);
    } catch (error) {
      setMessage("Failed to add journey folder");
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

  /* Makes sure journey folder info is filled */
  const formValidate = () => {
    let err = {};
    if (!form.name) err.name = "Name is required";

    return err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errs = formValidate();
    if (Object.keys(errs).length === 0) {
      forNewJourneyFolder ? postData(form) : putData(form);
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

        <br />

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

export default JourneyFolderForm;
