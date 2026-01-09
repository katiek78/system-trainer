"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const defaultSettings = {
  mode: "MN",
  digits: 80,
  memorisationTime: 60,
  recallTime: 240,
  journeys: [],
  imagePattern: "",
  locationPattern: "",
  imageSets: [],
  journeyHints: true,
  timedMode: false,
  navigateBy: "image",
  focusBoxShows: "image",
};

export default function NumberTrainingSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [allImageSets, setAllImageSets] = useState([]);
  const [allowedPrefixes, setAllowedPrefixes] = useState([]);
  const [modeLoaded, setModeLoaded] = useState(false);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);
  const [userJourneys, setUserJourneys] = useState([]);
  const router = useRouter();

  const modeOptions = [
    {
      value: "MN",
      label: "ML Numbers",
      digits: 80,
      memorisationTime: 60,
      recallTime: 240,
    },
    {
      value: "5N",
      label: "5-minute Numbers",
      digits: 760,
      memorisationTime: 300,
      recallTime: 900,
    },
    {
      value: "15N",
      label: "15-minute Numbers",
      digits: 1560,
      memorisationTime: 900,
      recallTime: 1800,
    },
    {
      value: "30N",
      label: "30-minute Numbers",
      digits: 2360,
      memorisationTime: 1800,
      recallTime: 3600,
    },
    {
      value: "60N",
      label: "Hour Numbers",
      digits: 4120,
      memorisationTime: 3600,
      recallTime: 7200,
    },
    { value: "XN", label: "Customised" },
  ];

  function getDisciplineLabel(mode) {
    switch (mode) {
      case "MN":
        return "ML Numbers";
      case "5N":
        return "5-minute Numbers";
      case "15N":
        return "15-minute Numbers";
      case "30N":
        return "30-minute Numbers";
      case "60N":
        return "Hour Numbers";
      case "XN":
        return "Customised Numbers";
      default:
        return "5-minute Numbers";
    }
  }

  useEffect(() => {
    const storedImagePattern = localStorage.getItem("imagePattern");
    const storedLocationPattern = localStorage.getItem("locationPattern");
    const storedNavigateBy = localStorage.getItem("navigateBy");
    const storedFocusBoxShows = localStorage.getItem("focusBoxShows");
    const storedMode = localStorage.getItem("mode");
    const storedTimedMode = localStorage.getItem("timedMode");
    const preset = modeOptions.find((opt) => opt.value === storedMode);
    let customValues = {};
    if (storedMode === "XN") {
      const customDigits = localStorage.getItem("customDigits");
      const customMemTime = localStorage.getItem("customMemorisationTime");
      const customRecallTime = localStorage.getItem("customRecallTime");
      if (customDigits) customValues.digits = Number(customDigits);
      if (customMemTime) customValues.memorisationTime = Number(customMemTime);
      if (customRecallTime) customValues.recallTime = Number(customRecallTime);
    }
    setSettings((prev) => ({
      ...prev,
      ...(storedImagePattern ? { imagePattern: storedImagePattern } : {}),
      ...(storedLocationPattern
        ? { locationPattern: storedLocationPattern }
        : {}),
      ...(storedNavigateBy ? { navigateBy: storedNavigateBy } : {}),
      ...(storedFocusBoxShows ? { focusBoxShows: storedFocusBoxShows } : {}),
      ...(storedMode ? { mode: storedMode } : {}),
      ...(storedTimedMode !== null
        ? { timedMode: storedTimedMode === "true" }
        : {}),
      ...(storedMode && storedMode !== "XN" && preset
        ? {
            digits: preset.digits,
            memorisationTime: preset.memorisationTime,
            recallTime: preset.recallTime,
          }
        : {}),
      ...(storedMode === "XN" ? customValues : {}),
    }));
    setModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!modeLoaded) return;
    const mode = settings.mode || defaultSettings.mode;
    const hintsKey = `journeyHints_${mode}`;
    const storedHints = localStorage.getItem(hintsKey);
    if (storedHints !== null) {
      setSettings((prev) => ({
        ...prev,
        journeyHints: storedHints === "true",
      }));
    }
  }, [modeLoaded, settings.mode]);

  useEffect(() => {
    if (!modeLoaded) return;
    const storedSelectedOption = localStorage.getItem("selectedOption");
    if (storedSelectedOption !== null && !isNaN(Number(storedSelectedOption))) {
      setSelectedOption(Number(storedSelectedOption));
    }
  }, [settings.mode, modeLoaded]);

  useEffect(() => {
    if (options.length > 0 && Array.isArray(options[selectedOption])) {
      setSettings((prev) => ({
        ...prev,
        journeys: options[selectedOption].map((j) => j.id),
      }));
    }
  }, [options, selectedOption]);

  function parsePattern(str) {
    if (!str) return [];
    return str
      .split("-")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
  }
  const imageGroups = parsePattern(settings.imagePattern);

  useEffect(() => {
    setAllowedPrefixes(Array(imageGroups.length).fill(""));
  }, [settings.imagePattern]);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (
      !modeLoaded ||
      allImageSets.length === 0 ||
      imageGroups.length === 0 ||
      restoredRef.current
    )
      return;
    const storedImageSets = localStorage.getItem("imageSets");
    let parsedImageSets = [];
    if (storedImageSets) {
      try {
        parsedImageSets = JSON.parse(storedImageSets);
      } catch {}
    }
    if (
      Array.isArray(parsedImageSets) &&
      parsedImageSets.length === imageGroups.length &&
      parsedImageSets.every((id, idx) => {
        if (!id) return true;
        const sets = setsForGroupLength(imageGroups[idx]);
        return sets.some((set) => set._id === id);
      })
    ) {
      setSettings((prev) => ({ ...prev, imageSets: parsedImageSets }));
    }
    const storedPrefixes = localStorage.getItem("allowedPrefixes");
    let parsedPrefixes = [];
    if (storedPrefixes) {
      try {
        parsedPrefixes = JSON.parse(storedPrefixes);
      } catch {}
    }
    if (
      Array.isArray(parsedPrefixes) &&
      parsedPrefixes.length === imageGroups.length
    ) {
      setAllowedPrefixes(parsedPrefixes);
    }
    restoredRef.current = true;
  }, [modeLoaded, allImageSets, imageGroups.length]);

  function handlePrefixChange(idx, val) {
    setAllowedPrefixes((prev) => {
      const arr = [...prev];
      arr[idx] = val;
      localStorage.setItem("allowedPrefixes", JSON.stringify(arr));
      return arr;
    });
  }

  useEffect(() => {
    async function fetchImageSets() {
      const res = await fetch("/api/imageSets/names");
      if (res.ok) {
        const data = await res.json();
        setAllImageSets(
          data.map((set) => ({
            _id: set._id,
            name: set.name,
            setType: set.setType,
            images: Array(
              set.setType ? Math.pow(10, parseInt(set.setType)) : 0
            ).fill(1),
          }))
        );
      }
    }
    fetchImageSets();
  }, []);

  function setsForGroupLength(len) {
    return allImageSets.filter(
      (set) => set.setType && parseInt(set.setType) === len
    );
  }

  function handleImageSetChange(idx, val) {
    setSettings((prev) => {
      const arr = Array.isArray(prev.imageSets) ? [...prev.imageSets] : [];
      arr[idx] = val;
      localStorage.setItem("imageSets", JSON.stringify(arr));
      return { ...prev, imageSets: arr };
    });
  }

  const handleSaveOptions = async () => {
    const discipline = getDisciplineLabel(settings.mode);
    const res = await fetch("/api/journeyAssignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discipline,
        options: options.map((opt) => opt.map((j) => j.id)),
      }),
    });
    if (res.ok) {
      alert("Options saved!");
    } else {
      alert("Failed to save options.");
    }
  };

  useEffect(() => {
    if (!modeLoaded) return;
    async function fetchOptions() {
      setLoadingJourneys(true);
      const discipline = getDisciplineLabel(settings.mode);
      const res = await fetch(
        `/api/journeyAssignments?discipline=${encodeURIComponent(discipline)}`
      );
      if (res.ok) {
        const data = await res.json();
        setOptions(data.options || []);
        const storedSelectedOption = localStorage.getItem("selectedOption");
        let idx = 0;
        if (
          storedSelectedOption !== null &&
          !isNaN(Number(storedSelectedOption)) &&
          data.options &&
          Number(storedSelectedOption) < data.options.length
        ) {
          idx = Number(storedSelectedOption);
        }
        setSelectedOption(idx);
      } else {
        setOptions([]);
        setSelectedOption(0);
      }
      setLoadingJourneys(false);
    }
    fetchOptions();
  }, [settings.mode, modeLoaded]);

  useEffect(() => {
    async function fetchUserJourneys() {
      const res = await fetch("/api/journeys/names");
      if (res.ok) {
        const data = await res.json();
        setUserJourneys(data.map((j) => ({ id: j._id, name: j.name })));
      }
    }
    fetchUserJourneys();
  }, []);

  const handleModeChange = (e) => {
    const mode = e.target.value;
    localStorage.setItem("mode", mode);
    const preset = modeOptions.find((opt) => opt.value === mode);
    setSettings((prev) => ({
      ...prev,
      mode,
      digits: preset?.digits || 80,
      memorisationTime: preset?.memorisationTime || 300,
      recallTime: preset?.recallTime || 600,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (settings.mode === "XN") {
      if (name === "digits") localStorage.setItem("customDigits", value);
      if (name === "memorisationTime")
        localStorage.setItem("customMemorisationTime", value);
      if (name === "recallTime")
        localStorage.setItem("customRecallTime", value);
    }
  };

  const isCustom = settings.mode === "XN";

  const handleSelectOption = (idx) => {
    setSelectedOption(idx);
    localStorage.setItem("selectedOption", idx);
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, []]);
    setSelectedOption(options.length);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedOption((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleRemoveJourney = (idx) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === selectedOption ? opt.filter((_, j) => j !== idx) : opt
      )
    );
  };

  const handleAddJourney = (e) => {
    const journeyId = e.target.value;
    if (!journeyId) return;
    const journey = userJourneys.find((j) => j.id === journeyId);
    if (
      journey &&
      !options[selectedOption].some((sel) => sel.id === journey.id)
    ) {
      setOptions((prev) =>
        prev.map((opt, i) => (i === selectedOption ? [...opt, journey] : opt))
      );
    }
  };

  const handleReorderJourney = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= options[selectedOption].length) return;
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== selectedOption) return opt;
        const newJourneys = [...opt];
        const [moved] = newJourneys.splice(fromIdx, 1);
        newJourneys.splice(toIdx, 0, moved);
        return newJourneys;
      })
    );
  };

  return (
    <div className="w-[90%] mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded shadow text-gray-900 dark:text-gray-100">
      <Link
        href="/training"
        className="inline-block mb-4 text-blue-600 dark:text-blue-300 hover:underline"
        style={{ fontWeight: 500 }}
      >
        ← Back to Memory Training
      </Link>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Numbers Training Settings
      </h2>
      <form>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Number of digits
            </label>
            <input
              type="number"
              name="digits"
              value={settings.digits}
              onChange={handleChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              disabled={!isCustom}
            />

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Discipline
            </label>
            <select
              name="mode"
              value={settings.mode}
              onChange={handleModeChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              {modeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                checked={settings.timedMode}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    timedMode: e.target.checked,
                  }));
                  localStorage.setItem("timedMode", e.target.checked);
                }}
              />
              Timed Memorisation + Recall
            </label>

            {settings.timedMode && (
              <>
                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100 mt-4">
                  Memorisation time (seconds)
                </label>
                <input
                  type="number"
                  name="memorisationTime"
                  value={settings.memorisationTime}
                  onChange={handleChange}
                  className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  disabled={!isCustom}
                />

                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Recall time (seconds)
                </label>
                <input
                  type="number"
                  name="recallTime"
                  value={settings.recallTime}
                  onChange={handleChange}
                  className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  disabled={!isCustom}
                />
              </>
            )}

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Journey Option
            </label>

            {loadingJourneys ? (
              <div className="mb-4 text-gray-700 dark:text-gray-300">
                Loading journey options...
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <select
                    className="px-3 py-1 mr-2 rounded border bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    value={selectedOption}
                    onChange={(e) => handleSelectOption(Number(e.target.value))}
                    disabled={options.length === 0}
                  >
                    {options.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Option {idx + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-2 py-1 bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 rounded"
                    onClick={handleAddOption}
                  >
                    + Add Option
                  </button>
                  {options.length > 1 && (
                    <button
                      type="button"
                      className="ml-2 px-2 py-1 bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 rounded"
                      onClick={() => handleRemoveOption(selectedOption)}
                    >
                      Remove Option
                    </button>
                  )}
                </div>
                {options.length === 0 ? (
                  <div className="mb-2 text-gray-500 dark:text-gray-400">
                    No options for this discipline
                  </div>
                ) : (
                  <ul>
                    {options[selectedOption].length === 0 && (
                      <div className="mb-2 text-gray-500 dark:text-gray-400">
                        No journeys selected
                      </div>
                    )}
                    {options[selectedOption].map((j, idx) => (
                      <li key={j.id} className="flex items-center mb-1">
                        <span className="flex-1 text-gray-900 dark:text-gray-100">
                          {j.name}
                        </span>
                        <button
                          type="button"
                          className="ml-2 text-red-600 dark:text-red-400"
                          onClick={() => handleRemoveJourney(idx)}
                          title="Remove"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          className="ml-1 text-gray-600 dark:text-gray-300"
                          onClick={() => handleReorderJourney(idx, idx - 1)}
                          disabled={idx === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="ml-1 text-gray-600 dark:text-gray-300"
                          onClick={() => handleReorderJourney(idx, idx + 1)}
                          disabled={idx === options[selectedOption].length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <select
                  className="mt-2 px-2 py-1 border rounded text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600"
                  onChange={handleAddJourney}
                  value=""
                >
                  <option value="">Add journey...</option>
                  {userJourneys
                    .filter(
                      (j) =>
                        !options[selectedOption]?.some((sel) => sel.id === j.id)
                    )
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                checked={settings.journeyHints}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    journeyHints: e.target.checked,
                  }));
                  const mode = settings.mode || defaultSettings.mode;
                  localStorage.setItem(
                    `journeyHints_${mode}`,
                    e.target.checked
                  );
                }}
              />
              Show journey hints
            </label>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Image Pattern
            </label>
            <input
              type="text"
              name="imagePattern"
              value={settings.imagePattern}
              onChange={handleChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="e.g. 3 or 3-2"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 -mt-3 mb-4">
              How many digits per image (e.g., 2 for 2-digit images from the
              same image set, or e.g. 2-2-2 if you are using PAO and have three
              different 2-digit image sets, or e.g. 3-2-3 if you have an
              alternating pattern).
            </div>

            <label className="block mb-2 font-semibold mt-4 text-gray-900 dark:text-gray-100">
              Image set(s)
            </label>
            {imageGroups.length === 0 ? (
              <div className="mb-4 text-gray-500 dark:text-gray-400">
                Enter an image size pattern to select image sets.
              </div>
            ) : (
              <div className="mb-4">
                {imageGroups.map((len, idx) => {
                  const sets = setsForGroupLength(len);
                  return (
                    <div key={idx} className="mb-4">
                      <label className="block text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
                        Group {idx + 1} ({len} digit{len > 1 ? "s" : ""})
                      </label>
                      <select
                        className="p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        value={settings.imageSets[idx] || ""}
                        onChange={(e) =>
                          handleImageSetChange(idx, e.target.value)
                        }
                      >
                        <option value="">Select image set...</option>
                        {sets.map((set) => (
                          <option key={set._id} value={set._id}>
                            {set.name}
                          </option>
                        ))}
                      </select>
                      {sets.length === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No image sets found for {len} digits.
                        </div>
                      )}

                      <div className="mt-2">
                        <label className="block text-xs font-semibold mb-1 text-gray-900 dark:text-gray-100">
                          Allowed prefixes (optional)
                        </label>
                        <input
                          type="text"
                          className="p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          placeholder="e.g. 1,2,3 or 12,13"
                          value={allowedPrefixes[idx] || ""}
                          onChange={(e) =>
                            handlePrefixChange(idx, e.target.value)
                          }
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Comma-separated. Leave blank for no restriction.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Location Pattern
            </label>
            <input
              type="text"
              name="locationPattern"
              value={settings.locationPattern}
              onChange={handleChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="e.g. 6 or 3-2"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 -mt-3 mb-4">
              How many digits per location (e.g., 6 for 6 digits at each
              location).
            </div>

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Navigate By
            </label>
            <select
              name="navigateBy"
              value={settings.navigateBy}
              onChange={handleChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              <option value="image">Image</option>
              <option value="location">Location</option>
            </select>
            <div className="text-xs text-gray-600 dark:text-gray-400 -mt-3 mb-4">
              Each click/keypress advances to the next image or next location.
            </div>

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Focus Box Shows
            </label>
            <select
              name="focusBoxShows"
              value={settings.focusBoxShows}
              onChange={handleChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              <option value="image">Current Image</option>
              <option value="location-separated">
                Current Location (with separations)
              </option>
              <option value="location-noseparated">
                Current Location (no separations)
              </option>
            </select>
            <div className="text-xs text-gray-600 dark:text-gray-400 -mt-3 mb-4">
              What the focus box displays at the top of the screen.
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-900 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              if (settings.imagePattern) {
                localStorage.setItem("imagePattern", settings.imagePattern);
              }
              if (settings.locationPattern) {
                localStorage.setItem(
                  "locationPattern",
                  settings.locationPattern
                );
              }
              localStorage.setItem("navigateBy", settings.navigateBy);
              localStorage.setItem("focusBoxShows", settings.focusBoxShows);
              localStorage.setItem(
                "imageSets",
                JSON.stringify(settings.imageSets || [])
              );
              localStorage.setItem(
                "allowedPrefixes",
                JSON.stringify(allowedPrefixes)
              );
              router.push(
                `/training/numbersMemorisation?amount=${settings.digits}&mode=${
                  settings.mode
                }&imagePattern=${encodeURIComponent(
                  settings.imagePattern || "3"
                )}&locationPattern=${encodeURIComponent(
                  settings.locationPattern || "3"
                )}&navigateBy=${settings.navigateBy}&focusBoxShows=${
                  settings.focusBoxShows
                }&imageSets=${(settings.imageSets || []).join(
                  ","
                )}&journeyIds=${(settings.journeys || []).join(
                  ","
                )}&allowedPrefixes=${allowedPrefixes
                  .map((p) => encodeURIComponent(p))
                  .join("|")}&journeyHints=${
                  settings.journeyHints ? "1" : "0"
                }&timedMode=${
                  settings.timedMode ? "1" : "0"
                }&memorisationTime=${settings.memorisationTime}&recallTime=${
                  settings.recallTime
                }`
              );
            }}
          >
            Start Training
          </button>
          <button
            type="button"
            className="bg-green-500 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-900 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              if (settings.imagePattern) {
                localStorage.setItem("imagePattern", settings.imagePattern);
              }
              if (settings.locationPattern) {
                localStorage.setItem(
                  "locationPattern",
                  settings.locationPattern
                );
              }
              localStorage.setItem(
                "imageSets",
                JSON.stringify(settings.imageSets || [])
              );
              localStorage.setItem(
                "allowedPrefixes",
                JSON.stringify(allowedPrefixes)
              );
              handleSaveOptions();
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
