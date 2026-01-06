"use client";
import { useState } from "react";
import { getRequiredBPM } from "@/utilities/timing";
import { ML_DISCIPLINES } from "@/lib/disciplines";

export default function TimingInteractive() {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    discipline: ML_DISCIPLINES[0],
    time: "",
    grouping: "",
    grabData: "",
    grabTime: "",
  });
  const [bpm, setBpm] = useState(null);

  const getUnits = (discipline) => {
    // Split the input string into words
    const words = discipline.trim().split(/\s+/);

    // Check if there are at least two words in the input
    if (words.length >= 2) {
      // Return the last word converted to lowercase
      return words[words.length - 1].toLowerCase();
    } else {
      // If there's no second word, return an empty string or handle it as needed
      return words[0].toLowerCase();
    }
  };

  const handleCalculate = () => {
    if (form.time === "") {
      alert("You need to enter your target time.");
      return;
    }
    const requiredBPM = getRequiredBPM(
      form.discipline,
      form.grouping,
      form.grabData,
      form.grabTime,
      form.time
    );
    setBpm(requiredBPM);
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
      <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
        <h3 className="font-semibold">
          Calculate the BPM for your target time
        </h3>
        <p className="font-mono">
          Select your discipline, target time and a couple of other details and
          you'll be given a BPM. Once you have your API key, you'll be able to
          find songs that match the BPM to help you get a feel for the timing.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
        <form>
          I want to achieve a time of
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="7"
            name="time"
            value={form.time}
            onChange={handleChange}
          />{" "}
          seconds&nbsp; in:
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
          </select>
          with a grouping of:
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="2"
            name="grouping"
            value={form.grouping}
            onChange={handleChange}
          />{" "}
          {getUnits(form.discipline)} &nbsp; and grabbing:
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="2"
            name="grabData"
            value={form.grabData}
            onChange={handleChange}
          />{" "}
          {getUnits(form.discipline)} &nbsp; in:
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="2"
            name="grabTime"
            value={form.grabTime}
            onChange={handleChange}
          />{" "}
          seconds &nbsp;
          <br />
          <button
            type="button"
            onClick={handleCalculate}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold mt-3 py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Calculate
          </button>
          {bpm && (
            <div className="mt-5">
              <p className="text-3xl font-semibold">
                Your required BPM is: {bpm.join(" / ")}
              </p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Song search functionality will be available once you add your
                GetSongBPM API key.
              </p>
            </div>
          )}
          <div>
            {Object.keys(errors).map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
        <h3 className="font-semibold mb-3">BPM Data Provider</h3>
        <p className="font-mono mb-3">
          BPM data provided by:{" "}
          <a
            href="https://getsongbpm.com/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            GetSongBPM API
          </a>
        </p>
      </div>
    </>
  );
}
