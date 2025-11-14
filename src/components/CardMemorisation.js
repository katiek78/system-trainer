import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Helper to generate a deck of cards (array of {value, suit})
function generateDecks(numDecks = 1) {
  const suits = ["♠", "♥", "♦", "♣"];
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
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ value, suit });
      }
    }
  }
  return deck;
}

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CardMemorisation({
  decks = 1,
  grouping = 1,
  journey = [],
  imageSet = [],
  onFinish,
}) {
  const router = useRouter();
  // Generate and shuffle cards
  const [cards, setCards] = useState([]);
  useEffect(() => {
    const deck = generateDecks(decks);
    setCards(shuffle(deck));
  }, [decks]);

  // Paging: one deck per page
  const CARDS_PER_DECK = 52;
  const totalPages = decks;
  const [page, setPage] = useState(0);
  // Only show cards for current deck
  const pageStart = page * CARDS_PER_DECK;
  const pageEnd = Math.min(pageStart + CARDS_PER_DECK, cards.length);
  const cardsOnPage = cards.slice(pageStart, pageEnd);

  // Highlight state (grouping within current deck)
  const [highlightIdx, setHighlightIdx] = useState(0);
  const groupSize = Number(grouping) || 1;
  const totalGroups = Math.ceil(cardsOnPage.length / groupSize);

  // Get current group of cards (within deck)
  const start = highlightIdx * groupSize;
  const end = Math.min(start + groupSize, cardsOnPage.length);
  const currentGroup = cardsOnPage.slice(start, end);

  // Get journey point for this group (cycle through points)
  function getCurrentPoint() {
    if (!journey || journey.length === 0) return null;
    // Flatten all points from all journeys
    const allPoints = journey.flatMap((j) =>
      Array.isArray(j.points) ? j.points : []
    );
    if (allPoints.length === 0) return null;
    // One point per group, cycle if needed
    const idx = (page * totalGroups + highlightIdx) % allPoints.length;
    return allPoints[idx] || { name: "-" };
  }
  const currentPoint = getCurrentPoint();

  // Get imageItem and phonetics for this group (if available, like numbers)
  function getImageItemAndPhonetics() {
    if (!imageSet || imageSet.length === 0 || !currentGroup.length)
      return { item: "", phonetics: "" };
    // Map suit to emoji with variation selector (to match image set names)
    const suitToEmoji = {
      "♠": "\u2660\uFE0F",
      "♥": "\u2665\uFE0F",
      "♦": "\u2666\uFE0F",
      "♣": "\u2663\uFE0F",
    };
    const groupName = currentGroup
      .map((card) => card.value + (suitToEmoji[card.suit] || card.suit))
      .join("");
    // Debug: log groupName
    // eslint-disable-next-line no-console
    console.log("[CardMemorisation] groupName:", groupName);
    for (const set of imageSet) {
      if (set.images && Array.isArray(set.images)) {
        // Debug: log all image names in this set
        const allNames = set.images.map((img) => img.name);
        // eslint-disable-next-line no-console
        console.log("[CardMemorisation] all image names:", allNames);
        const found = set.images.find((img) => img.name === groupName);
        // Debug: log found result
        // eslint-disable-next-line no-console
        console.log(
          "[CardMemorisation] found for groupName",
          groupName,
          ":",
          found
        );
        if (!found) {
          // Try to find a close match (e.g. with/without variation selectors)
          const groupNameNoVS = groupName.replace(/\uFE0F/g, "");
          const close = allNames.find(
            (n) => n && n.replace(/\uFE0F/g, "") === groupNameNoVS
          );
          if (close) {
            // eslint-disable-next-line no-console
            console.warn(
              "[CardMemorisation] groupName matches after removing variation selectors:",
              close
            );
          }
        }
        if (found) {
          return {
            item: found.imageItem || found.name || groupName,
            phonetics: found.phonetics || "",
          };
        }
      }
    }
    return { item: "", phonetics: "" };
  }
  const { item: imageItemName, phonetics: imagePhonetics } =
    getImageItemAndPhonetics();

  // Calculate groups per row for up/down navigation
  const GROUPS_PER_ROW = Math.ceil(6 / groupSize); // 6 columns in grid

  // Keyboard navigation (arrows for group, PgUp/PgDn for deck)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowRight") {
        setHighlightIdx((idx) => Math.min(idx + 1, totalGroups - 1));
      } else if (e.key === "ArrowLeft") {
        setHighlightIdx((idx) => Math.max(idx - 1, 0));
      } else if (e.key === "ArrowDown") {
        setHighlightIdx((idx) =>
          Math.min(idx + GROUPS_PER_ROW, totalGroups - 1)
        );
      } else if (e.key === "ArrowUp") {
        setHighlightIdx((idx) => Math.max(idx - GROUPS_PER_ROW, 0));
      } else if (e.key === "PageDown") {
        setPage((p) => Math.min(p + 1, totalPages - 1));
        setHighlightIdx(0);
      } else if (e.key === "PageUp") {
        setPage((p) => Math.max(p - 1, 0));
        setHighlightIdx(0);
      } else if (e.key === " " || e.code === "Space") {
        setPage(0);
        setHighlightIdx(0);
      } else if (
        e.key === "Enter" &&
        highlightIdx === totalGroups - 1 &&
        page === totalPages - 1
      ) {
        if (onFinish) onFinish();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightIdx, totalGroups, onFinish, page, totalPages, GROUPS_PER_ROW]);

  function handleExitToSettings() {
    router.push("/training/cardsSettings");
  }

  // Responsive hint bar styling (match numbersMemorisation)
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded shadow text-gray-900 dark:text-gray-100">
      <button
        onClick={handleExitToSettings}
        className="mb-4 text-blue-600 dark:text-blue-300 hover:underline font-medium"
      >
        ← Exit to Card Settings
      </button>
      <h2 className="text-2xl font-bold mb-4">Cards Memorisation</h2>
      {/* Hint Bar (styled like numbers) */}
      <div
        className="mb-4 px-4 bg-gray-100 dark:bg-slate-800 rounded text-[18px] text-gray-800 dark:text-gray-100 w-full flex items-center gap-2"
        style={{
          minHeight: "2.5rem",
          height: "auto",
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
          <span
            className="block truncate"
            style={{
              textAlign: "left",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "normal",
              paddingTop: "0.5rem",
              height: "2.5rem",
              minHeight: "2.5rem",
              maxHeight: "2.5rem",
              lineHeight: "2.5rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
            }}
          >
            <b>{currentPoint && currentPoint.name ? currentPoint.name : "-"}</b>
            {currentPoint && currentPoint.memoItem
              ? ` - ${currentPoint.memoItem}`
              : ""}
            {imageItemName && (
              <>
                {` : ${imageItemName}`}
                {imagePhonetics && (
                  <span
                    style={{
                      color: "#888",
                      fontStyle: "italic",
                      marginLeft: 6,
                    }}
                  >
                    ({imagePhonetics})
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </div>
      {/* Card List (grid) */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {cardsOnPage.map((card, idx) => {
          const groupIdx = Math.floor(idx / groupSize);
          const isHighlighted = groupIdx === highlightIdx;
          // Color hearts and diamonds red
          const isRedSuit = card.suit === "♥" || card.suit === "♦";
          return (
            <div
              key={idx}
              className={`p-2 border rounded text-center text-lg font-mono transition-all duration-150 ${
                isHighlighted
                  ? "bg-yellow-200 dark:bg-yellow-700 border-yellow-500"
                  : "bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600"
              }`}
            >
              {card.value}
              <span
                className={
                  isRedSuit ? "ml-1 text-red-600 dark:text-red-400" : "ml-1"
                }
              >
                {card.suit}
              </span>
            </div>
          );
        })}
      </div>
      {/* Paging controls (desktop only, like numbers) */}
      {totalPages > 1 && (
        <div className="mt-4 text-center hidden sm:block">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-3 text-gray-900 dark:text-gray-100">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      {/* Mobile navigation for groups (show only on mobile) */}
      <div className="block sm:hidden mt-4">
        <div className="flex items-center justify-center">
          <button
            onClick={() => setHighlightIdx((idx) => Math.max(0, idx - 1))}
            disabled={highlightIdx === 0}
            className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-3 text-sm text-gray-600 dark:text-gray-300">
            {highlightIdx + 1} / {totalGroups || 1}
          </span>
          <button
            onClick={() =>
              setHighlightIdx((idx) =>
                Math.min((totalGroups || 1) - 1, idx + 1)
              )
            }
            disabled={highlightIdx === (totalGroups || 1) - 1}
            className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
