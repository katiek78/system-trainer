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
  const [subsetInfo, setSubsetInfo] = useState("");
  // Remove pageLimit and currentPage, not needed for subset selection UI

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
      fetch(`/api/imageSets/${imageSet}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.data) {
            setImageSetName(data.data.name || "");
            setSetType(data.data.setType || "");
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
              setSubsetInfo(
                `Subset: First suit is ${suitNames[suitIdx]} (${suitSymbols[suitIdx]})`
              );
            }}
          >
            Choose
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
              setSubsetInfo(
                `Subset: Card 1 = ${cardValues[c1]}, Card 2 = ${cardValues[c2]}`
              );
            }}
          >
            Choose
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
              setSubsetInfo(
                `Subset: ${values[valueIdx]} of ${suitNames[suitIdx]}`
              );
            }}
          >
            Choose
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
      const suits = ["♠", "♥", "♦", "♣"];
      const suitNames = ["Spades", "Hearts", "Diamonds", "Clubs"];
      return (
        <div className="flex flex-row items-center mt-3">
          <span className="mr-1">Card 1</span>
          <select className="mr-2" id="card1Value">
            {values.map((v, i) => (
              <option key={v} value={i}>
                {v}
              </option>
            ))}
          </select>
          <select className="mr-1" id="card1Suit">
            {suits.map((s, i) => (
              <option key={suitNames[i]} value={i}>
                {suitNames[i]}
              </option>
            ))}
          </select>
          <span className="mr-1">Card 2</span>
          <select className="mr-1" id="card2Color">
            <option value={0}>Red (♥/♦)</option>
            <option value={1}>Black (♠/♣)</option>
          </select>
          <button
            className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={() => {
              const c1s = parseInt(document.getElementById("card1Suit").value);
              const c1v = parseInt(document.getElementById("card1Value").value);
              const c2color = parseInt(
                document.getElementById("card2Color").value
              );
              setSubsetInfo(
                `Subset: Card 1 = ${values[c1v]} of ${
                  suitNames[c1s]
                }, Card 2 color = ${c2color === 0 ? "Red" : "Black"}`
              );
            }}
          >
            Choose
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
              setSubsetInfo(
                `Subset: Starting at ${idx.toString().padStart(2, "0")}`
              );
            }}
          >
            Choose
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
              setSubsetInfo(`Subset: Starting at ${idx}xx`);
            }}
          >
            Choose
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
              setSubsetInfo(
                `Subset: Starting at ${idx.toString().padStart(2, "0")}`
              );
            }}
          >
            Choose
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
              {subsetInfo && (
                <div className="mt-4 text-blue-700 dark:text-blue-300 font-mono text-lg">
                  {subsetInfo}
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
