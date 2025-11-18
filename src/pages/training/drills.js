import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const DrillsPage = () => {
  const router = useRouter();
  const { imageSet } = router.query;
  const [imageSetName, setImageSetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setType, setSetType] = useState("");
  // Remove imagesLength, rely only on setType
  const [showModal, setShowModal] = useState(false);
  const [userImageSets, setUserImageSets] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [showTimeTestInstructions, setShowTimeTestInstructions] =
    useState(false);
  const [timeTestActive, setTimeTestActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeTestItems, setTimeTestItems] = useState([]);
  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [timings, setTimings] = useState([]); // {item, ms}
  const [itemStartTime, setItemStartTime] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const [imageSetData, setImageSetData] = useState(null);
  // Fetch the full image set data when imageSet changes (for hint lookup)
  useEffect(() => {
    if (!imageSet) return;
    fetch(`/api/imageSets/${imageSet}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setImageSetData(data && data.data ? data.data : null))
      .catch(() => setImageSetData(null));
  }, [imageSet]);

  // Utility for rendering card with emoji and color
  function renderCardString(v, s) {
    const suitToEmoji = { Spades: "♠", Hearts: "♥", Diamonds: "♦", Clubs: "♣" };
    const suitToColor = {
      Spades: "black",
      Clubs: "black",
      Hearts: "red",
      Diamonds: "red",
    };
    const emoji = suitToEmoji[s] || s;
    const color = suitToColor[s] || "black";
    return `<span style='color:${color}'>${v}${emoji}</span>`;
  }

  // Helper to get the answer/hint for a card pair string from the image set data
  function getHintForCurrentItem(itemHtml, imageSetData) {
    if (!imageSetData || !imageSetData.images) return "(No image data)";
    // Parse the HTML string to extract card values and suits
    // e.g. <span style='color:red'>K♥</span><span style='color:black'>8♣</span>
    const div = document.createElement("div");
    div.innerHTML = itemHtml;
    const spans = div.querySelectorAll("span");
    if (spans.length < 2) return "(No match)";
    // Convert e.g. 'K♥' to 'K♥', '8♣' to '8♣' (emoji suits)
    // Use full emoji with variation selector (e.g., '♥️', '♣️')
    function cardTextToEmoji(card) {
      const value = card.replace(/[^A-Z0-9]/gi, "");
      let suit = "";
      if (card.includes("♠") || card.toLowerCase().includes("s")) suit = "♠️";
      else if (card.includes("♥") || card.toLowerCase().includes("h"))
        suit = "♥️";
      else if (card.includes("♦") || card.toLowerCase().includes("d"))
        suit = "♦️";
      else if (card.includes("♣") || card.toLowerCase().includes("c"))
        suit = "♣️";
      return value + suit;
    }
    const card1 = spans[0].textContent;
    const card2 = spans[1].textContent;
    const key =
      card1 && card2 ? cardTextToEmoji(card1) + cardTextToEmoji(card2) : "";
    // Try to find an image with a matching name (case-insensitive, no spaces)
    const found = imageSetData.images.find((img) => {
      if (!img.name) return false;
      // Remove spaces and compare case-insensitive
      return (
        img.name.replace(/\s+/g, "").toLowerCase() ===
        key.replace(/\s+/g, "").toLowerCase()
      );
    });
    if (found && found.imageItem) return found.imageItem;
    // fallback: try key or show the key
    console.log(key);
    console.log(imageSetData.images);
    const foundByKey = imageSetData.images.find((img) => {
      if (img.key && img.key.toLowerCase() === key.toLowerCase()) return true;
      return false;
    });
    if (foundByKey && foundByKey.imageItem) return foundByKey.imageItem;
    return key + " not found";
  }
  // Handler to advance to next item (shared by button and Enter key)
  const advanceTimeTest = () => {
    const now = Date.now();
    const elapsed = itemStartTime ? now - itemStartTime : 0;
    setTimings((prev) => [
      ...prev,
      { item: timeTestItems[currentItemIdx], ms: elapsed },
    ]);
    setShowHint(false);
    if (currentItemIdx < timeTestItems.length - 1) {
      setCurrentItemIdx(currentItemIdx + 1);
      setItemStartTime(Date.now());
    } else {
      setTimeTestActive(false);
      setShowResults(true);
      setItemStartTime(null);
    }
  };

  // Listen for Enter key during time test
  useEffect(() => {
    if (!timeTestActive) return;
    const handler = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        advanceTimeTest();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timeTestActive, currentItemIdx, itemStartTime, timeTestItems]);
  // Listen for 'h' key to show hint during time test
  useEffect(() => {
    if (!timeTestActive) return;
    const handler = (e) => {
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowHint(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timeTestActive]);

  // Fetch image set metadata (name, setType only)
  // Fetch all image sets for the user when modal opens
  const fetchUserImageSets = async () => {
    setModalLoading(true);
    setUserImageSets([]);
    try {
      const res = await fetch("/api/imageSets/names");
      if (!res.ok) {
        setModalLoading(false);
        return;
      }
      const data = await res.json();
      // /api/imageSets/names returns a plain array
      setUserImageSets(Array.isArray(data) ? data : []);
    } catch {
      setUserImageSets([]);
    }
    setModalLoading(false);
  };
  useEffect(() => {
    if (imageSet) {
      setLoading(true);
      setError("");
      fetch(`/api/imageSets/getName?id=${imageSet}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && (data.name || data.setType)) {
            setImageSetName(data.name || "");
            setSetType(data.setType || "");
          } else {
            setImageSetName("");
            setSetType("");
            setError("Image set not found");
          }
        })
        .catch(() => {
          setError("Error fetching image set metadata");
        })
        .finally(() => setLoading(false));
    }
  }, [imageSet]);

  // No need for pageLimit logic, setType is sufficient

  // Navigation UI logic (subset selection)
  const renderSubsetSelector = () => {
    if (!setType) return null;

    // 64-set navigation: dropdown for first suit
    if (setType === "64") {
      const suitNames = ["Hearts", "Diamonds", "Spades", "Clubs"];
      const suitSymbols = ["♥️", "♦️", "♠️", "♣️"];
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">First suit</span>
          <select className="mr-2" id="firstSuit64">
            {suitNames.map((s, i) => (
              <option key={s} value={i}>
                {suitSymbols[i]} {s}
              </option>
            ))}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const suitIdx = parseInt(
                document.getElementById("firstSuit64").value
              );
              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    // 3cv navigation: two dropdowns for card 1 and card 2 (A-K)
    if (setType === "3cv") {
      const cardValues = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Card 1</span>
          <select className="mr-2" id="card1Value3cv">
            {cardValues.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>
          <span className="mr-2">Card 2</span>
          <select className="mr-2" id="card2Value3cv">
            {cardValues.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const c1 = parseInt(
                document.getElementById("card1Value3cv").value
              );
              const c2 = parseInt(
                document.getElementById("card2Value3cv").value
              );
              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    // Single card set (52)
    if (setType === "1c") {
      const values = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      const suits = ["♠", "♥", "♦", "♣"];
      const suitNames = ["Spades", "Hearts", "Diamonds", "Clubs"];
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Select subset:</span>
          <select className="mr-2" id="cardValueSelect">
            {values.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>
          <select className="mr-2" id="cardSuitSelect">
            {suits.map((s, i) => (
              <option key={s} value={i}>
                {suitNames[i]}
              </option>
            ))}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const valueIdx = parseInt(
                document.getElementById("cardValueSelect").value
              );
              const suitIdx = parseInt(
                document.getElementById("cardSuitSelect").value
              );
              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    // 2-card set (2cv or 2c)
    if (["2cv", "2c"].includes(setType)) {
      const values = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
      const suitColors = ["Black", "Red"];
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-1">Card 1</span>
          <select className="mr-2" id="card1Value">
            <option value="any">Any</option>
            {values.map((v, i) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select className="mr-1" id="card1Suit">
            <option value="any">Any</option>
            <option value="black">Black (♠/♣)</option>
            <option value="red">Red (♥/♦)</option>
            {suits.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="mr-1">Card 2</span>
          <select className="mr-2" id="card2Value">
            <option value="any">Any</option>
            {values.map((v, i) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select className="mr-1" id="card2Suit">
            <option value="any">Any</option>
            <option value="black">Black (♠/♣)</option>
            <option value="red">Red (♥/♦)</option>
            {suits.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const c1v = document.getElementById("card1Value").value;
              const c1s = document.getElementById("card1Suit").value;
              const c2v = document.getElementById("card2Value").value;
              const c2s = document.getElementById("card2Suit").value;

              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    // Number sets
    if (setType === "2d") {
      // 2-digit: select first digit (00, 10, ... 90)
      const options = [];
      for (let i = 0; i < 100; i += 10) {
        options.push(
          <option key={i} value={i}>
            {i.toString().padStart(2, "0")}
          </option>
        );
      }
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Select first digit:</span>
          <select className="mr-2" id="numberSetSelect2d">
            {options}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const idx = parseInt(
                document.getElementById("numberSetSelect2d").value
              );

              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    if (setType === "3d") {
      // 3-digit: select first digit (0-9)
      const options = [];
      for (let i = 0; i < 10; i++) {
        options.push(
          <option key={i} value={i}>
            {i}
          </option>
        );
      }
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Select first digit:</span>
          <select className="mr-2" id="numberSetSelect3d">
            {options}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const idx = parseInt(
                document.getElementById("numberSetSelect3d").value
              );

              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    if (setType === "4d") {
      // 4-digit: select first two digits (00-99)
      const options = [];
      for (let i = 0; i < 100; i++) {
        options.push(
          <option key={i} value={i}>
            {i.toString().padStart(2, "0")}
          </option>
        );
      }
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-2">Select first 2 digits:</span>
          <select className="mr-2" id="numberSetSelect4d">
            {options}
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const idx = parseInt(
                document.getElementById("numberSetSelect4d").value
              );

              setShowResults(false);
              setShowTimeTestInstructions(true);
            }}
          >
            Time Test
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen flex justify-center bg-transparent">
      <div className="z-10 font-mono text-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
        <div className="flex justify-end mt-4 mb-2">
          <button
            className="btn bg-gray-200 hover:bg-gray-300 text-black font-mono font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => {
              setShowModal(true);
              fetchUserImageSets();
            }}
          >
            Switch image set
          </button>
        </div>
        {/* Modal for switching image set */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-black dark:hover:text-white"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Select an image set</h2>
              {modalLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : userImageSets.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No image sets found.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                  {userImageSets.map((set) => (
                    <li
                      key={set._id}
                      className="py-2 flex items-center justify-between"
                    >
                      <span className="font-mono text-base">{set.name}</span>
                      <button
                        className="ml-4 btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                        onClick={() => {
                          setShowModal(false);
                          setShowResults(false);
                          setTimings([]);
                          setTimeTestItems([]);
                          setCurrentItemIdx(0);
                          router.push(`/training/drills?imageSet=${set._id}`);
                        }}
                      >
                        Select
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Drills
        </h1>
        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4 text-center">
          {loading ? (
            <p className="font-mono text-lg">Loading...</p>
          ) : error ? (
            <p className="font-mono text-lg text-red-600">{error}</p>
          ) : (
            <>
              <h2 className="font-semibold text-xl">{imageSetName}</h2>
              {renderSubsetSelector()}

              {showTimeTestInstructions && !timeTestActive && !showResults && (
                <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded font-mono text-base">
                  <strong>Time Test Instructions:</strong>
                  <br />
                  You will be shown each item of the subset in a shuffled order.
                  <br />
                  Press <kbd>Enter</kbd> or the <strong>OK!</strong> button to
                  move on.
                  <br />
                  Your time for recognising each item will be recorded.
                  <br />
                  <button
                    className="mt-4 btn bg-green-700 hover:bg-green-800 text-white font-bold py-1 px-4 rounded"
                    onClick={() => {
                      // Generate the subset items based on setType and selection
                      let items = [];
                      if (setType === "64") {
                        const suitIdx = parseInt(
                          document.getElementById("firstSuit64").value
                        );
                        const suitNames = [
                          "Hearts",
                          "Diamonds",
                          "Spades",
                          "Clubs",
                        ];
                        const suit = suitNames[suitIdx];
                        const values = [
                          "A",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "10",
                          "J",
                          "Q",
                          "K",
                        ];
                        items = values.map((v) => `${v} of ${suit}`);
                      } else if (setType === "3cv") {
                        const cardValues = [
                          "A",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "10",
                          "J",
                          "Q",
                          "K",
                        ];
                        const c1 = parseInt(
                          document.getElementById("card1Value3cv").value
                        );
                        const c2 = parseInt(
                          document.getElementById("card2Value3cv").value
                        );
                        items = [
                          `Card 1: ${cardValues[c1]}`,
                          `Card 2: ${cardValues[c2]}`,
                        ];
                      } else if (setType === "1c") {
                        const values = [
                          "A",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "10",
                          "J",
                          "Q",
                          "K",
                        ];
                        const suitNames = [
                          "Spades",
                          "Hearts",
                          "Diamonds",
                          "Clubs",
                        ];
                        const valueIdx = parseInt(
                          document.getElementById("cardValueSelect").value
                        );
                        const suitIdx = parseInt(
                          document.getElementById("cardSuitSelect").value
                        );
                        items = [
                          `${values[valueIdx]} of ${suitNames[suitIdx]}`,
                        ];
                      } else if (["2cv", "2c"].includes(setType)) {
                        const values = [
                          "A",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "10",
                          "J",
                          "Q",
                          "K",
                        ];
                        const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
                        const suitColors = {
                          black: ["Spades", "Clubs"],
                          red: ["Hearts", "Diamonds"],
                        };
                        const c1v = document.getElementById("card1Value").value;
                        const c1s = document.getElementById("card1Suit").value;
                        const c2v = document.getElementById("card2Value").value;
                        const c2s = document.getElementById("card2Suit").value;
                        // Build all combinations for the subset
                        let card1Values = c1v === "any" ? values : [c1v];
                        let card2Values = c2v === "any" ? values : [c2v];
                        let card1Suits =
                          c1s === "any"
                            ? suits
                            : c1s === "black"
                            ? suitColors.black
                            : c1s === "red"
                            ? suitColors.red
                            : [c1s];
                        let card2Suits =
                          c2s === "any"
                            ? suits
                            : c2s === "black"
                            ? suitColors.black
                            : c2s === "red"
                            ? suitColors.red
                            : [c2s];
                        items = [];
                        for (let v1 of card1Values) {
                          for (let s1 of card1Suits) {
                            for (let v2 of card2Values) {
                              for (let s2 of card2Suits) {
                                // Compact string: e.g. 4♥3♠, with red for red suits
                                items.push(
                                  `${renderCardString(
                                    v1,
                                    s1
                                  )}${renderCardString(v2, s2)}`
                                );
                              }
                            }
                          }
                        }
                      } else if (setType === "2d") {
                        const start = parseInt(
                          document.getElementById("numberSetSelect2d").value
                        );
                        items = [];
                        for (let i = start; i < start + 10; i++) {
                          items.push(i.toString().padStart(2, "0"));
                        }
                      } else if (setType === "3d") {
                        const start = parseInt(
                          document.getElementById("numberSetSelect3d").value
                        );
                        items = [];
                        for (let i = 0; i < 100; i++) {
                          items.push(
                            `${start}${i.toString().padStart(2, "0")}`
                          );
                        }
                      } else if (setType === "4d") {
                        const start = parseInt(
                          document.getElementById("numberSetSelect4d").value
                        );
                        items = [];
                        for (let i = 0; i < 100; i++) {
                          items.push(
                            `${start.toString().padStart(2, "0")}${i
                              .toString()
                              .padStart(2, "0")}`
                          );
                        }
                      }
                      // Shuffle items
                      for (let i = items.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [items[i], items[j]] = [items[j], items[i]];
                      }
                      setTimeTestItems(items);
                      setCurrentItemIdx(0);
                      setTimings([]);
                      setShowResults(false);
                      setTimeTestActive(true);
                      setShowTimeTestInstructions(false);
                      setItemStartTime(Date.now());
                    }}
                  >
                    Start
                  </button>
                </div>
              )}
              {timeTestActive && timeTestItems.length > 0 && (
                <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded font-mono text-xl flex flex-col items-center">
                  <div className="mb-2 text-base text-gray-700 dark:text-gray-200">
                    Item {currentItemIdx + 1} of {timeTestItems.length}
                  </div>
                  <div className="mb-4 text-2xl">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: timeTestItems[currentItemIdx],
                      }}
                    />
                  </div>
                  <div className="flex flex-row gap-4 mb-2">
                    <button
                      className="btn bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 px-6 rounded"
                      onClick={advanceTimeTest}
                    >
                      OK!
                    </button>
                    <button
                      className="btn bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-4 rounded"
                      onClick={() => setShowHint(true)}
                    >
                      Hint
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    (Press Enter to continue, or H for hint)
                  </div>
                  {showHint && (
                    <div className="mt-3 p-2 bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 rounded text-lg font-mono">
                      {getHintForCurrentItem(
                        timeTestItems[currentItemIdx],
                        imageSetData
                      )}
                    </div>
                  )}
                </div>
              )}

              {showResults && timings.length > 0 && (
                <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded font-mono text-base">
                  <div className="mb-2 font-bold text-lg">
                    Time Test Results (slowest to fastest)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-400 dark:border-gray-600">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 border-b border-gray-400 dark:border-gray-600">
                            Item
                          </th>
                          <th className="px-2 py-1 border-b border-gray-400 dark:border-gray-600">
                            Time (seconds)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...timings]
                          .sort((a, b) => b.ms - a.ms)
                          .map((t, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1 border-b border-gray-300 dark:border-gray-700">
                                <span
                                  dangerouslySetInnerHTML={{ __html: t.item }}
                                />
                              </td>
                              <td className="px-2 py-1 border-b border-gray-300 dark:border-gray-700">
                                {(t.ms / 1000).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="mt-4 btn bg-gray-700 hover:bg-gray-800 text-white font-bold py-1 px-4 rounded"
                    onClick={() => {
                      setShowResults(false);
                      setTimings([]);
                      setTimeTestItems([]);
                      setCurrentItemIdx(0);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillsPage;
