import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";

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
  const { user, isLoading: userLoading } = useUser();
  const [settings, setSettings] = useState({
    mode: "SC",
    decks: 1,
    memorisationTime: 60,
    recallTime: 240,
    cardGrouping: "1",
    imageSet: "",
    cardGroupsPerLocation: 1,
  });
  const [settingsRestored, setSettingsRestored] = useState(false);
  // Restore settings from localStorage on mount
  useEffect(() => {
    const mode = localStorage.getItem("cardMode") || "SC";
    const decks = Number(localStorage.getItem("cardDecks")) || 1;
    const memorisationTime =
      Number(localStorage.getItem("cardMemorisationTime")) || 60;
    const recallTime = Number(localStorage.getItem("cardRecallTime")) || 240;
    const cardGrouping = localStorage.getItem("cardGrouping") || "1";
    const imageSet = localStorage.getItem("cardImageSet") || "";
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
    setSettings({
      mode,
      decks,
      memorisationTime,
      recallTime,
      cardGrouping,
      imageSet,
      cardGroupsPerLocation,
    });
    setSettingsRestored(true);
  }, []);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);
  const [userJourneys, setUserJourneys] = useState([]);
  const [userImageSets, setUserImageSets] = useState([]);
  const router = useRouter();

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
    if (userLoading) return;
    // Only fetch if settings.mode is set (restored)
    if (!settings.mode) return;
    async function fetchOptionsAndJourneys() {
      setLoadingJourneys(true);
      const discipline = getDisciplineLabel(settings.mode);
      // Fetch journey options (sets) for this discipline
      const resOpt = await fetch(
        `/api/journeyAssignments?discipline=${encodeURIComponent(discipline)}`
      );
      let fetchedOptions = [];
      if (resOpt.ok) {
        const data = await resOpt.json();
        fetchedOptions = data.options || [];
      }
      // Fetch all user journeys
      let fetchedJourneys = [];
      let fetchedImageSets = [];
      if (user && user.sub) {
        // Fetch only this user's journey names
        const resJourneys = await fetch("/api/journeys/names");
        if (resJourneys.ok) {
          const data = await resJourneys.json();
          fetchedJourneys = data
            .map((j) => ({ id: j._id, name: j.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        // Fetch all user image sets (names and setType only)
        const resImageSets = await fetch("/api/imageSets/names");
        if (resImageSets.ok) {
          const data = await resImageSets.json();
          fetchedImageSets = data.map((set) => ({
            id: set._id,
            name: set.name,
            setType: set.setType,
          }));
        }
      }
      setOptions(fetchedOptions);
      setUserJourneys(fetchedJourneys);
      setUserImageSets(fetchedImageSets);
      // Restore selected option from localStorage if available and valid
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
    }
    fetchOptionsAndJourneys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, user, userLoading, settingsRestored]);

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
    setSettings((prev) => ({
      ...prev,
      [name]:
        name === "cardGrouping" || name === "imageSet"
          ? value
          : name === "cardGroupsPerLocation"
          ? value === "variable-black" || value === "variable-red"
            ? value
            : Number(value)
          : Number(value),
    }));
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
    handleSave({ suppressAlert: true }).then(async (saved) => {
      if (!saved) return;
      // Store full image set info for hint bar (with images array)
      let imageSetsToStore = [];
      if (settings.imageSet) {
        try {
          const res = await fetch(`/api/imageSets/${settings.imageSet}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.data) {
              // Use same shape as before but with images array
              imageSetsToStore = [
                {
                  id: data.data._id,
                  name: data.data.name,
                  count: data.data.images.length,
                  images: data.data.images,
                },
              ];
            }
          }
        } catch (e) {
          // fallback to summary only
          const selectedImageSet = userImageSets.find(
            (set) => set.id === settings.imageSet
          );
          if (selectedImageSet) {
            imageSetsToStore = [selectedImageSet];
          }
        }
      }
      localStorage.setItem("cardImageSets", JSON.stringify(imageSetsToStore));
      router.push({
        pathname: "/training/cards",
        query: {
          mode: settings.mode,
          decks: settings.decks,
          memorisationTime: settings.memorisationTime,
          recallTime: settings.recallTime,
          journeyOption: selectedOption,
          cardGrouping: settings.cardGrouping,
          imageSet: settings.imageSet,
          cardGroupsPerLocation: settings.cardGroupsPerLocation,
        },
      });
    });
  }

  const isCustom = settings.mode === "XC";

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded shadow text-gray-900 dark:text-gray-100">
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
        <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Mode
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

        <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
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
          Card grouping
        </label>
        <select
          name="cardGrouping"
          value={settings.cardGrouping}
          onChange={handleChange}
          className="mb-2 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>

        <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Card groups per location
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
          <option value="variable-black">
            Variable (end on black, cap at 3)
          </option>
          <option value="variable-red">Variable (end on red, cap at 3)</option>
        </select>
        {(settings.cardGroupsPerLocation === "variable-black" ||
          settings.cardGroupsPerLocation === "variable-red") && (
          <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            {settings.cardGroupsPerLocation === "variable-black"
              ? "Each location takes a variable number of card groups. Move to the next location after a black-first pair."
              : "Each location takes a variable number of card groups. Move to the next location after a red-first pair."}
          </div>
        )}

        <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Image set
        </label>
        <select
          name="imageSet"
          value={settings.imageSet}
          onChange={handleChange}
          className="mb-4 p-2 border rounded w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          <option value="">Select image set...</option>
          {(() => {
            const cg = settings.cardGrouping;
            let filterFn = (set) => true;
            // Use setType for filtering (actual setType values: 2d, 3d, 4d, 2c, 2cv, 3cv)
            if (cg === "1") {
              filterFn = (set) =>
                set.setType === "2d" ||
                set.setType === "3d" ||
                set.setType === "4d";
            } else if (cg === "2") {
              filterFn = (set) => set.setType === "2c" || set.setType === "2cv";
            } else if (cg === "3") {
              filterFn = (set) => set.setType === "3cv";
            }
            return userImageSets.filter(filterFn).map((set) => (
              <option key={set.id || set._id} value={set.id || set._id}>
                {set.name} {set.setType ? `(${set.setType})` : ""}
              </option>
            ));
          })()}
        </select>

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
    </div>
  );
}
