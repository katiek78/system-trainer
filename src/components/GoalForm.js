import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import { ML_DISCIPLINES } from "@/lib/disciplines";
import { TRADITIONAL_DISCIPLINES } from "@/lib/disciplines";
import { getTodayDate, formatDate } from "@/utilities/day";
import { useUser } from "@auth0/nextjs-auth0/client";

const GoalForm = ({ formId, goalForm, forNewEntry = true }) => {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isScore, setIsScore] = useState(true);

  const [form, setForm] = useState({
    startDate: forNewEntry ? getTodayDate() : formatDate(goalForm.startDate),
    endDate: formatDate(goalForm.endDate),
    discipline: goalForm.discipline || ML_DISCIPLINES[0],
    score: goalForm.score,
    time: goalForm.time,
    achieved: goalForm.achieved || false,
  });

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const id = params.id;

    try {
      const res = await fetch(`/api/goals/${id}`, {
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

      const { data } = await res.json();

      mutate(`/api/goals/${id}`, data, false); // Update the local data without a revalidation
      router.push("/goals");
    } catch (error) {
      setMessage("Failed to update goal");
    }
  };

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
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

      router.push("/goals");
    } catch (error) {
      setMessage("Failed to add goals");
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

  /* Makes sure plan entry info is filled */
  const formValidate = () => {
    let err = {};
    if (!form.discipline) err.discipline = "Discipline is required";

    return err;
  };

  const handleToggleScoreTime = (e) => {
    setIsScore(!isScore);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = formValidate();
    if (Object.keys(errs).length === 0) {
      forNewEntry ? postData(form) : putData(form);
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
        By:
        <input
          className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
        />
        I want to achieve a
        <select className="mx-4 " onChange={handleToggleScoreTime}>
          <option id="score">score</option>
          <option id="time">time</option>
        </select>
        of
        {isScore && (
          <input
            className="shadow appearance-none border rounded w-14 mx-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="5"
            name="score"
            value={form.score}
            onChange={handleChange}
          />
        )}
        {!isScore && (
          <>
            <input
              className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              maxLength="7"
              name="time"
              value={form.time}
              onChange={handleChange}
            />{" "}
            seconds&nbsp;
          </>
        )}
        in:
        <select
          className="shadow appearance-none border rounded w-full mt-1 mx-3 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          name="discipline"
          value={form.discipline || ML_DISCIPLINES[0]}
          onChange={handleChange}
          required
        >
          {ML_DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
          {TRADITIONAL_DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
          <option value="other">other</option>
        </select>
        {/* <label htmlFor="startDate">Start Date</label>
        <input className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="date"       
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          required          
        />

        <label htmlFor="endDate">End Date</label>
        <input className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="date"       
          name="endDate"
          value={form.endDate}
          onChange={handleChange}                  
        />

        <label htmlFor="discipline">Discipline</label>
        <select className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"       
          name="discipline"      
          value={form.discipline || ML_DISCIPLINES[0]}
          onChange={handleChange}          
          required
                >
                {ML_DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                {TRADITIONAL_DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
        <option value="other">other</option>
        </select> 

        <label htmlFor="score">Score</label>
        <input className="shadow appearance-none border rounded w-14 ml-3 mr-1 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="5"
          name="score"
          value={form.score}
          onChange={handleChange}               
        /> 

        <label htmlFor="time">Time</label>
        <input className="shadow appearance-none border rounded w-14 ml-3 mr-1 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="7"
          name="time"
          value={form.time}
          onChange={handleChange}               
        />  */}
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

export default GoalForm;
