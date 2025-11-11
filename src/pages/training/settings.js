import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const defaultSettings = {
  mode: "MN",
  digits: 80,
  memorisationTime: 60,
  recallTime: 240,
  journeys: [],
  highlightGrouping: "", // NEW
  imageSets: [], // NEW: array of selected image set ids
};

export default function NumberTrainingSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [options, setOptions] = useState([]); // all journeySets for this discipline
  const [selectedOption, setSelectedOption] = useState(0);
  const [userJourneys, setUserJourneys] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (options.length > 0 && Array.isArray(options[selectedOption])) {
      setSettings((prev) => ({
        ...prev,
        journeys: options[selectedOption].map((j) => j.id),
      }));
    }
  }, [options, selectedOption]);

  // Helper: parse highlight grouping string to array
  function parseHighlightGrouping(str) {
    if (!str) return [];
    return str
      .split("-")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
  }
  const highlightGroups = parseHighlightGrouping(settings.highlightGrouping);

  // Fetch all image sets (private and public)
  const [allImageSets, setAllImageSets] = useState([]);
  useEffect(() => {
    async function fetchImageSets() {
      const res = await fetch("/api/imageSets");
      if (res.ok) {
        const data = await res.json();
        setAllImageSets(data.data || []);
      }
    }
    fetchImageSets();
  }, []);

  // For each group, filter image sets by image count (e.g. 100 for 2-digit, 1000 for 3-digit, etc.)
  function setsForGroupLength(len) {
    // 2-digit: 100, 3-digit: 1000, 4-digit: 10000, etc.
    const expected = Math.pow(10, len);
    return allImageSets.filter(
      (set) => Array.isArray(set.images) && set.images.length === expected
    );
  }

  // Handle image set selection for each group
  function handleImageSetChange(idx, val) {
    setSettings((prev) => {
      const arr = Array.isArray(prev.imageSets) ? [...prev.imageSets] : [];
      arr[idx] = val;
      return { ...prev, imageSets: arr };
    });
  }

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

  // ...existing code...

  // Save journey options to backend
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

  // Map mode to discipline label for API
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
      default:
        return "5-minute Numbers";
    }
  }

  // Fetch all journey options (sets) for the selected discipline
  useEffect(() => {
    async function fetchOptions() {
      setLoadingJourneys(true);
      const discipline = getDisciplineLabel(settings.mode);
      const res = await fetch(
        `/api/journeyAssignments?discipline=${encodeURIComponent(discipline)}`
      );
      if (res.ok) {
        const data = await res.json();
        setOptions(data.options || []);
        setSelectedOption(0);
      } else {
        setOptions([]);
        setSelectedOption(0);
      }
      setLoadingJourneys(false);
    }
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode]);

  // Fetch all user journeys for add-journey dropdown
  useEffect(() => {
    async function fetchUserJourneys() {
      const res = await fetch("/api/journeys");
      if (res.ok) {
        const data = await res.json();
        // data.data is the array of journeys
        setUserJourneys(data.data.map((j) => ({ id: j._id, name: j.name })));
      }
    }
    fetchUserJourneys();
  }, []);

  const handleModeChange = (e) => {
    const mode = e.target.value;
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
  };

  const isCustom = settings.mode === "XN";

  // Option and journey manipulation handlers
  const handleSelectOption = (idx) => setSelectedOption(idx);

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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Numbers Training Settings</h2>
      <form>
        <label className="block mb-2 font-semibold">Mode</label>
        <select
          name="mode"
          value={settings.mode}
          onChange={handleModeChange}
          className="mb-4 p-2 border rounded w-full"
        >
          {modeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="block mb-2 font-semibold">Journey Option</label>

        {/* {loadingJourneys ? (
          <div className="mb-4">Loading journey options...</div>
        ) : (
          <div className="mb-4">
            <div className="flex mb-2 items-center">
              <select
                className="mr-2 px-2 py-1 border rounded text-blue-800"
                value={selectedOption}
                onChange={e => handleSelectOption(Number(e.target.value))}
                style={{ minWidth: 120 }}
              >
                {options.map((_, idx) => (
                  <option key={idx} value={idx}>{`Option ${idx + 1}`}</option>
                ))}
              </select>
              <button type="button" className="px-2 py-1 bg-green-200 text-green-800 rounded" onClick={handleAddOption}>+ Add Option</button>
              {options.length > 1 && (
                <button type="button" className="ml-2 px-2 py-1 bg-red-200 text-red-800 rounded" onClick={() => handleRemoveOption(selectedOption)}>Remove Option</button>
              )}
            </div>
            {options.length === 0 ? (
              <div className="mb-2 text-gray-500">No options for this discipline</div>
            ) : (
              <ul>
                {options[selectedOption].length === 0 && <div className="mb-2 text-gray-500">No journeys selected</div>}
                {options[selectedOption].map((j, idx) => (
                  <li key={j.id} className="flex items-center mb-1">
                    <span className="flex-1">{j.name}</span>
                    <button type="button" className="ml-2 text-red-600" onClick={() => handleRemoveJourney(idx)} title="Remove">✕</button>
                    <button type="button" className="ml-1 text-gray-600" onClick={() => handleReorderJourney(idx, idx-1)} disabled={idx===0} title="Move up">▲</button>
                    <button type="button" className="ml-1 text-gray-600" onClick={() => handleReorderJourney(idx, idx+1)} disabled={idx===options[selectedOption].length-1} title="Move down">▼</button>
                  </li>
                ))}
              </ul>
            )}
            <select
              className="mt-2 px-2 py-1 border rounded text-blue-800"
              onChange={handleAddJourney}
              value=""
            >
              <option value="">Add journey...</option>
              {userJourneys
                .filter(j => !options[selectedOption]?.some(sel => sel.id === j.id))
                .map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
            </select>
          </div>
        )} */}

        {loadingJourneys ? (
          <div className="mb-4">Loading journey options...</div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <select
                className="px-3 py-1 mr-2 rounded border"
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
                className="px-2 py-1 bg-green-200 text-green-800 rounded"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
              {options.length > 1 && (
                <button
                  type="button"
                  className="ml-2 px-2 py-1 bg-red-200 text-red-800 rounded"
                  onClick={() => handleRemoveOption(selectedOption)}
                >
                  Remove Option
                </button>
              )}
            </div>
            {options.length === 0 ? (
              <div className="mb-2 text-gray-500">
                No options for this discipline
              </div>
            ) : (
              <ul>
                {options[selectedOption].length === 0 && (
                  <div className="mb-2 text-gray-500">No journeys selected</div>
                )}
                {options[selectedOption].map((j, idx) => (
                  <li key={j.id} className="flex items-center mb-1">
                    <span className="flex-1">{j.name}</span>
                    <button
                      type="button"
                      className="ml-2 text-red-600"
                      onClick={() => handleRemoveJourney(idx)}
                      title="Remove"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      className="ml-1 text-gray-600"
                      onClick={() => handleReorderJourney(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="ml-1 text-gray-600"
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
              className="mt-2 px-2 py-1 border rounded text-blue-800"
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

        <label className="block mb-2 font-semibold">Number of digits</label>
        <input
          type="number"
          name="digits"
          value={settings.digits}
          onChange={handleChange}
          className="mb-4 p-2 border rounded w-full"
          disabled={!isCustom}
        />

        <label className="block mb-2 font-semibold">
          Memorisation time (seconds)
        </label>
        <input
          type="number"
          name="memorisationTime"
          value={settings.memorisationTime}
          onChange={handleChange}
          className="mb-4 p-2 border rounded w-full"
          disabled={!isCustom}
        />

        <label className="block mb-2 font-semibold">
          Recall time (seconds)
        </label>
        <input
          type="number"
          name="recallTime"
          value={settings.recallTime}
          onChange={handleChange}
          className="mb-4 p-2 border rounded w-full"
          disabled={!isCustom}
        />

        <label className="block mb-2 font-semibold">
          Highlight grouping (e.g. 4 or 3-2-3)
        </label>
        <input
          type="text"
          name="highlightGrouping"
          value={settings.highlightGrouping}
          onChange={handleChange}
          className="mb-4 p-2 border rounded w-full"
          placeholder="e.g. 4 or 3-2-3"
        />

        {/* Image set(s) selection UI */}
        <label className="block mb-2 font-semibold mt-4">Image set(s)</label>
        {highlightGroups.length === 0 ? (
          <div className="mb-4 text-gray-500">
            Enter a highlight grouping to select image sets.
          </div>
        ) : (
          <div className="mb-4">
            {highlightGroups.map((len, idx) => {
              const sets = setsForGroupLength(len);
              return (
                <div key={idx} className="mb-2">
                  <label className="block text-sm font-semibold mb-1">
                    Group {idx + 1} ({len} digit{len > 1 ? "s" : ""})
                  </label>
                  <select
                    className="p-2 border rounded w-full"
                    value={settings.imageSets[idx] || ""}
                    onChange={(e) => handleImageSetChange(idx, e.target.value)}
                  >
                    <option value="">Select image set...</option>
                    {sets.map((set) => (
                      <option key={set._id} value={set._id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                  {sets.length === 0 && (
                    <div className="text-xs text-gray-500">
                      No image sets found for {len} digits.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() =>
              router.push({
                pathname: "/training/numbersMemorisation",
                query: {
                  amount: settings.digits,
                  highlightGrouping: settings.highlightGrouping,
                  imageSets: (settings.imageSets || []).join(","),
                  journeyIds: (settings.journeys || []).join(","),
                },
              })
            }
          >
            Start Training
          </button>
          <button
            type="button"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSaveOptions}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
