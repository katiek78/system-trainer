"use client";

import { useState, useEffect } from "react";
import RedToBlackMappingTable from "@/components/RedToBlackMappingTable";
import { useRouter } from "next/navigation";

const cardModes = [
  {
    value: "SC",
    label: "Speed Cards",
    decks: 1,
    memorisationTime: 60,
    recallTime: 240,
  },
  {
    value: "10C",
    label: "10-minute Cards",
    decks: 12,
    memorisationTime: 600,
    recallTime: 240,
  },
  {
    value: "30C",
    label: "30-minute Cards",
    decks: 25,
    memorisationTime: 1800,
    recallTime: 240,
  },
  {
    value: "60C",
    label: "Hour Cards",
    decks: 40,
    memorisationTime: 3600,
    recallTime: 240,
  },
  {
    value: "XC",
    label: "Customised",
    decks: 1,
    memorisationTime: 60,
    recallTime: 240,
  },
];

export default function CardTrainingSettings() {
  const [settings, setSettings] = useState({
    mode: "SC",
    decks: 1,
    memorisationTime: 60,
    recallTime: 240,
    cardGrouping: "1",
    imageSet: "",
    imageSets: [],
    cardGroupsPerLocation: 1,
    timedMode: false,
    memoCountdown: 20,
    recallCountdownMode: "0",
    recallCountdown: 20,
    navigateBy: "image",
  });
  // Red-to-black mapping state
  // --- Navigate By Setting ---
  function handleNavigateByChange(e) {
    const value = e.target.value;
    setSettings((prev) => {
      localStorage.setItem("cardNavigateBy", value);
      return { ...prev, navigateBy: value };
    });
  }
  const [redToBlackMapping, setRedToBlackMapping] = useState("default");
  const [settingsRestored, setSettingsRestored] = useState(false);
  const [allImageSets, setAllImageSets] = useState([]);
  // Restore settings from localStorage on mount
  useEffect(() => {
    const mode = localStorage.getItem("cardMode") || "SC";
    const decks = Number(localStorage.getItem("cardDecks")) || 1;
    const memorisationTime =
      Number(localStorage.getItem("cardMemorisationTime")) || 60;
    const recallTime = Number(localStorage.getItem("cardRecallTime")) || 240;
    const cardGrouping = localStorage.getItem("cardGrouping") || "1";
    const imageSet = localStorage.getItem("cardImageSet") || "";
    const timedMode =
      localStorage.getItem("cardTimedMode") === "true" ||
      localStorage.getItem("cardTimedMode") === "1";
    const memoCountdown =
      Number(localStorage.getItem("cardMemoCountdown")) || 20;
    const recallCountdownMode =
      localStorage.getItem("cardRecallCountdownMode") || "0";
    const recallCountdown =
      Number(localStorage.getItem("cardRecallCountdown")) || 20;
    const navigateBy = localStorage.getItem("cardNavigateBy") || "image";
    let cardGroupsPerLocation = localStorage.getItem("cardGroupsPerLocation");
    // Support string values for variable options
    if (
      cardGroupsPerLocation === "variable-black" ||
      cardGroupsPerLocation === "variable-red"
    ) {
      // leave as string
    } else {
      cardGroupsPerLocation = Number(cardGroupsPerLocation) || 1;
    }

    // Restore imageSets array
    let imageSets = [];
    try {
      const stored = localStorage.getItem("cardImageSets");
      if (stored) imageSets = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing cardImageSets:", e);
    }
    // Ensure imageSets length matches cardGroups length
    let cardGroups = [];
    if (cardGrouping && typeof cardGrouping === "string") {
      cardGroups = cardGrouping
        .split("-")
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n) && n > 0);
    } else if (typeof cardGrouping === "number" && cardGrouping > 0) {
      cardGroups = [cardGrouping];
    }
    if (imageSets.length < cardGroups.length) {
      imageSets = [
        ...imageSets,
        ...Array(cardGroups.length - imageSets.length).fill(""),
      ];
    } else if (imageSets.length > cardGroups.length) {
      imageSets = imageSets.slice(0, cardGroups.length);
    }

    // Restore card value and suit arrays
    let cardValues = [];
    let cardSuits = [];
    try {
      const storedValues = localStorage.getItem("cardAllowedFirstCardValues");
      if (storedValues) cardValues = JSON.parse(storedValues);
    } catch (e) {
      console.error("Error parsing cardAllowedFirstCardValues:", e);
    }
    try {
      const storedSuits = localStorage.getItem("cardAllowedFirstCardSuits");
      if (storedSuits) cardSuits = JSON.parse(storedSuits);
    } catch (e) {
      console.error("Error parsing cardAllowedFirstCardSuits:", e);
    }

    setSettings({
      mode,
      decks,
      memorisationTime,
      recallTime,
      cardGrouping,
      imageSet,
      imageSets,
      cardGroupsPerLocation,
      timedMode,
      memoCountdown,
      recallCountdownMode,
      recallCountdown,
      navigateBy,
    });
    setSettingsRestored(true);
  }, []);
  function handleNavigateByChange(e) {
    const value = e.target.value;
    setSettings((prev) => {
      localStorage.setItem("cardNavigateBy", value);
      return { ...prev, navigateBy: value };
    });
  }
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);
  const [userJourneys, setUserJourneys] = useState([]);
  const [userImageSets, setUserImageSets] = useState([]);
  const router = useRouter();

  // Parse cardGrouping to get array of card counts per image
  function parsePattern(str) {
    if (!str) return [];
    return str
      .split("-")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
  }
  const cardGroups = parsePattern(settings.cardGrouping);

  // Fetch all image sets
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
          }))
        );
      }
    }
    fetchImageSets();
  }, []);

  // Function to get appropriate image sets for a given card group size
  function setsForGroupLength(len) {
    // For cards: 1 card = 2d sets, 2 cards = 2c/2cv sets, 3 cards = 3cv sets
    if (!Array.isArray(allImageSets)) return [];

    if (len === 1) {
      return allImageSets.filter(
        (set) =>
          set.setType === "2d" || set.setType === "3d" || set.setType === "4d"
      );
    } else if (len === 2) {
      return allImageSets.filter(
        (set) => set.setType === "2c" || set.setType === "2cv"
      );
    } else if (len === 3) {
      return allImageSets.filter((set) => set.setType === "3cv");
    }
    return [];
  }

  // Handle image set change for a specific group
  function handleImageSetChange(idx, val) {
    setSettings((prev) => {
      const arr = Array.isArray(prev.imageSets) ? [...prev.imageSets] : [];
      arr[idx] = val; // val is the imageSet._id
      localStorage.setItem("cardImageSets", JSON.stringify(arr));
      return { ...prev, imageSets: arr };
    });
  }

  // Map mode to discipline label for API
  function getDisciplineLabel(mode) {
    switch (mode) {
      case "SC":
        return "Speed Cards";
      case "10C":
        return "10-minute Cards";
      case "30C":
        return "30-minute Cards";
      case "60C":
        return "Hour Cards";
      case "XC":
        return "Customised Cards";
      default:
        return "Speed Cards";
    }
  }

  // Fetch journey options for Cards discipline, whenever mode changes (after settings restored)
  useEffect(() => {
    if (!settingsRestored) return;
    if (!settings.mode) return;
    const fetchOptionsAndJourneys = async () => {
      setLoadingJourneys(true);
      const discipline = getDisciplineLabel(settings.mode);
      const resOpt = await fetch(
        `/api/journeyAssignments?discipline=${encodeURIComponent(discipline)}`
      );
      let fetchedOptions = [];
      if (resOpt.ok) {
        const data = await resOpt.json();
        fetchedOptions = data.options || [];
      }
      let fetchedJourneys = [];
      let fetchedImageSets = [];

      const resJourneys = await fetch("/api/journeys/names");
      if (resJourneys.ok) {
        const data = await resJourneys.json();
        fetchedJourneys = data
          .map((j) => ({ id: j._id, name: j.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      const resImageSets = await fetch("/api/imageSets/names");
      if (resImageSets.ok) {
        const data = await resImageSets.json();
        fetchedImageSets = data.map((set) => ({
          id: set._id,
          name: set.name,
          setType: set.setType,
        }));
      }

      setOptions(fetchedOptions);
      setUserJourneys(fetchedJourneys);
      setUserImageSets(fetchedImageSets);
      const storedSelectedOption = localStorage.getItem("cardSelectedOption");
      let idx = 0;
      if (
        storedSelectedOption !== null &&
        !isNaN(Number(storedSelectedOption)) &&
        fetchedOptions &&
        Number(storedSelectedOption) < fetchedOptions.length
      ) {
        idx = Number(storedSelectedOption);
      }
      setSelectedOption(idx);
      setLoadingJourneys(false);
    };
    fetchOptionsAndJourneys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, settingsRestored]);

  function handleModeChange(e) {
    const selected = cardModes.find((m) => m.value === e.target.value);
    setSettings((prev) => ({
      ...prev,
      mode: selected.value,
      decks: selected.decks,
      memorisationTime: selected.memorisationTime,
      recallTime: selected.recallTime,
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setSettings((prev) => {
      let newSettings = { ...prev };
      if (name === "cardGrouping" || name === "imageSet") {
        newSettings[name] = value;
      } else if (name === "cardGroupsPerLocation") {
        newSettings[name] =
          value === "variable-black" || value === "variable-red"
            ? value
            : Number(value);
      } else if (name === "navigateBy") {
        newSettings[name] = value;
        localStorage.setItem("cardNavigateBy", value);
      } else {
        newSettings[name] = Number(value);
      }

      // If cardGrouping changes away from "2", reset cardGroupsPerLocation if it's a variable option
      if (name === "cardGrouping" && value !== "2") {
        if (
          newSettings.cardGroupsPerLocation === "variable-black" ||
          newSettings.cardGroupsPerLocation === "variable-red"
        ) {
          newSettings.cardGroupsPerLocation = 1;
        }
      }

      return newSettings;
    });
  }

  function handleCardGroupsPerLocationBlur(e) {
    let value = e.target.value;
    let num = Number(value);
    if (isNaN(num) || value === "") num = 1;
    num = Math.max(1, Math.min(4, num));
    setSettings((prev) => ({
      ...prev,
      cardGroupsPerLocation: num,
    }));
  }

  function handleSelectOption(idx) {
    setSelectedOption(idx);
    localStorage.setItem("cardSelectedOption", idx);
  }

  function handleAddOption() {
    setOptions((prev) => [...prev, []]);
    setSelectedOption(options.length);
  }

  function handleRemoveOption(idx) {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedOption((prev) => (prev > 0 ? prev - 1 : 0));
  }

  function handleRemoveJourney(idx) {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === selectedOption ? opt.filter((_, j) => j !== idx) : opt
      )
    );
  }

  function handleAddJourney(e) {
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
  }

  function handleReorderJourney(fromIdx, toIdx) {
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
  }

  // Save settings, optionally suppressing alerts (for Start button)
  async function handleSave({ suppressAlert = false } = {}) {
    localStorage.setItem("cardMode", settings.mode);
    localStorage.setItem("cardDecks", settings.decks);
    localStorage.setItem("cardMemorisationTime", settings.memorisationTime);
    localStorage.setItem("cardRecallTime", settings.recallTime);
    localStorage.setItem("cardGrouping", settings.cardGrouping);
    localStorage.setItem("cardImageSet", settings.imageSet);
    localStorage.setItem("cardJourneyOptions", JSON.stringify(options));
    localStorage.setItem("cardSelectedOption", selectedOption);
    localStorage.setItem(
      "cardGroupsPerLocation",
      settings.cardGroupsPerLocation
    );
    localStorage.setItem("cardTimedMode", settings.timedMode.toString());
    localStorage.setItem("cardMemoCountdown", settings.memoCountdown);
    localStorage.setItem(
      "cardRecallCountdownMode",
      settings.recallCountdownMode
    );
    localStorage.setItem("cardRecallCountdown", settings.recallCountdown);

    // Store only image set IDs for selection
    if (Array.isArray(settings.imageSets)) {
      localStorage.setItem("cardImageSets", JSON.stringify(settings.imageSets));
    } else if (settings.imageSet) {
      localStorage.setItem(
        "cardImageSets",
        JSON.stringify([settings.imageSet])
      );
    } else {
      localStorage.setItem("cardImageSets", JSON.stringify([]));
    }
    // Store navigateBy
    localStorage.setItem("cardNavigateBy", settings.navigateBy);

    // Only save if there are options
    if (!options || options.length === 0) {
      if (!suppressAlert) alert("No journey options to save.");
      return false;
    }

    try {
      const res = await fetch("/api/journeyAssignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discipline: getDisciplineLabel(settings.mode),
          options: options.map((opt) => opt.map((j) => j.id)),
          cardGrouping: settings.cardGrouping,
          imageSet: settings.imageSet,
        }),
      });
      if (!res.ok) {
        if (!suppressAlert) alert("Failed to save options.");
        return false;
      }
      // No alert on success
      return true;
    } catch (err) {
      if (!suppressAlert) alert("Error saving options.");
      return false;
    }
  }

  function handleStart() {
    handleSave({ suppressAlert: true }).then((saved) => {
      if (!saved) return;
      // Store only image set IDs for selection
      if (Array.isArray(settings.imageSets)) {
        localStorage.setItem(
          "cardImageSets",
          JSON.stringify(settings.imageSets)
        );
      } else if (settings.imageSet) {
        localStorage.setItem(
          "cardImageSets",
          JSON.stringify([settings.imageSet])
        );
      } else {
        localStorage.setItem("cardImageSets", JSON.stringify([]));
      }
      router.push(
        `/training/cards?mode=${settings.mode}&decks=${
          settings.decks
        }&memorisationTime=${settings.memorisationTime}&recallTime=${
          settings.recallTime
        }&journeyOption=${selectedOption}&cardGrouping=${
          settings.cardGrouping
        }&imageSet=${settings.imageSet}&cardGroupsPerLocation=${
          settings.cardGroupsPerLocation
        }&timedMode=${settings.timedMode ? "1" : "0"}&memoCountdown=${
          settings.memoCountdown
        }&recallCountdownMode=${settings.recallCountdownMode}&recallCountdown=${
          settings.recallCountdown
        }`
      );
    });
  }

  const isCustom = settings.mode === "XC";

  // Move filteredImageSets calculation above return to avoid IIFE in JSX
  const cg = settings.cardGrouping;
  let filterFn = (set) => true;
  if (cg === "1") {
    filterFn = (set) =>
      set.setType === "2d" || set.setType === "3d" || set.setType === "4d";
  } else if (cg === "2") {
    filterFn = (set) => set.setType === "2c" || set.setType === "2cv";
  } else if (cg === "3") {
    filterFn = (set) => set.setType === "3cv";
  }
  const filteredImageSets = Array.isArray(userImageSets)
    ? userImageSets.filter(filterFn)
    : [];

  return (
    <div className="w-[90%] mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded shadow text-gray-900 dark:text-gray-100">
      <a
        href="/training"
        className="inline-block mb-4 text-blue-600 dark:text-blue-300 hover:underline"
        style={{ fontWeight: 500 }}
      >
        ← Back to Memory Training
      </a>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Cards Training Settings
      </h2>
      <form>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Discipline
            </label>
            <select
              name="mode"
              value={settings.mode}
              onChange={handleModeChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              {cardModes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Number of decks
            </label>
            <input
              type="number"
              name="decks"
              min={1}
              max={52}
              value={settings.decks}
              onChange={handleChange}
              className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              disabled={!isCustom}
            />

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
                  localStorage.setItem("cardTimedMode", e.target.checked);
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
                  min={10}
                  value={settings.memorisationTime}
                  onChange={handleChange}
                  className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />

                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Recall time (seconds)
                </label>
                <input
                  type="number"
                  name="recallTime"
                  min={10}
                  value={settings.recallTime}
                  onChange={handleChange}
                  className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />

                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Memorisation countdown (seconds)
                </label>
                <input
                  type="number"
                  name="memoCountdown"
                  min={0}
                  max={60}
                  value={settings.memoCountdown}
                  onChange={handleChange}
                  className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />

                <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Recall countdown mode
                </label>
                <select
                  name="recallCountdownMode"
                  value={settings.recallCountdownMode}
                  onChange={handleChange}
                  className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                >
                  <option value="0">Fixed time</option>
                  <option value="remaining">Remaining memorisation time</option>
                </select>

                {settings.recallCountdownMode === "0" && (
                  <>
                    <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
                      Recall countdown (seconds)
                    </label>
                    <input
                      type="number"
                      name="recallCountdown"
                      min={0}
                      max={60}
                      value={settings.recallCountdown}
                      onChange={handleChange}
                      className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </>
                )}
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
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Cards per Image
            </label>
            <input
              type="text"
              name="cardGrouping"
              value={settings.cardGrouping}
              onChange={handleChange}
              className="mb-2 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="e.g. 2 or 1-1-1"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              How many cards per image (e.g., 2 for pairs, or 1-1-1 for PAO with
              different image sets).
            </div>

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Images per Location
            </label>
            <select
              name="cardGroupsPerLocation"
              value={settings.cardGroupsPerLocation}
              onChange={handleChange}
              className="mb-2 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              {settings.cardGrouping === "2" && (
                <>
                  <option value="variable-black">
                    Variable (end on black, cap at 3)
                  </option>
                  <option value="variable-red">
                    Variable (end on red, cap at 3)
                  </option>
                </>
              )}
            </select>
            {(settings.cardGroupsPerLocation === "variable-black" ||
              settings.cardGroupsPerLocation === "variable-red") && (
              <>
                <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  {settings.cardGroupsPerLocation === "variable-black"
                    ? "Each location takes a variable number of images. Move to the next location after a black-first pair."
                    : "Each location takes a variable number of images. Move to the next location after a red-first pair."}
                </div>
                {/* Red-to-black mapping options */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded">
                  <div className="font-semibold mb-1">
                    Red-First to Black-First Pair Mapping
                  </div>
                  <div className="text-xs mb-2 text-gray-600 dark:text-gray-300">
                    When using a 1352 set, only black-first pairs are defined.
                    Please specify how red-first suit pairs should mirror
                    black-first pairs.
                  </div>
                  {/* Red-first to black-first mapping table */}
                  <RedToBlackMappingTable />
                </div>
              </>
            )}

            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Image set{cardGroups.length > 1 ? "(s)" : ""}
            </label>
            {cardGroups.length === 0 ? (
              <div className="mb-4 text-gray-500 dark:text-gray-400">
                Enter a cards per image pattern to select image sets.
              </div>
            ) : (
              <div className="mb-4">
                {cardGroups &&
                  cardGroups.length > 0 &&
                  cardGroups.map((len, idx) => {
                    // Only allow image sets with setType matching group length
                    const validTypes = [`${len}c`, `${len}cv`];
                    const sets = setsForGroupLength(len).filter((set) =>
                      validTypes.includes(set.setType)
                    );
                    // If saved value is not in filtered sets, fallback to blank
                    // savedValue should be imageSet._id
                    const savedValue = settings.imageSets[idx];
                    const selectedValue = sets.some(
                      (set) => set._id === savedValue
                    )
                      ? savedValue
                      : "";
                    return (
                      <div key={idx} className="mb-4">
                        <label className="block text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
                          Group {idx + 1} ({len} card{len > 1 ? "s" : ""})
                        </label>
                        <select
                          className="p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                          value={selectedValue}
                          onChange={(e) =>
                            handleImageSetChange(idx, e.target.value)
                          }
                        >
                          <option value="">Select image set...</option>
                          {sets &&
                            sets.map((set) => (
                              <option key={set._id} value={set._id}>
                                {set.name} ({set.setType})
                              </option>
                            ))}
                        </select>
                        {sets.length === 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            No image sets found for {len} card
                            {len > 1 ? "s" : ""}.
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Navigate By Setting */}
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Navigate by:
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
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-900 text-white font-bold py-2 px-4 rounded"
            onClick={handleStart}
          >
            Start Training
          </button>
          <button
            type="button"
            className="bg-green-500 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-900 text-white font-bold py-2 px-4 rounded"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </form>

      {/* Attribution for card images */}
      <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 text-center">
        Standard cards: Copyright 2015 Chris Aguilar conjurenation@gmail.com,
        <br />
        Licensed under{" "}
        <a
          href="https://www.gnu.org/licenses/lgpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 dark:text-blue-400"
        >
          LGPL 3
        </a>
      </div>
    </div>
  );
}
