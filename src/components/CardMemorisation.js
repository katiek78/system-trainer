"use client";

import React, { useState, useEffect, useRef } from "react";
import RedToBlackMappingTable from "./RedToBlackMappingTable";
import SimpleModal from "./SimpleModal";
import EmbedStreetView from "./EmbedStreetView";
import EmbedImage from "./EmbedImage";
import { isLocationStreetView } from "@/utilities/isLocationStreetView";
import { useRouter } from "next/navigation";

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
  cardGroupsPerLocation: cardGroupsPerLocationProp,
  mode = "SC",
  timedMode: timedModeParam = "0",
  memorisationTime: memorisationTimeProp = 60,
  recallTime: recallTimeProp = 240,
  memoCountdown: memoCountdownProp = 20,
  recallCountdownMode: recallCountdownModeProp = "0",
  recallCountdown: recallCountdownProp = 20,
}) {
  const router = useRouter();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Timer and countdown state
  const timedMode = timedModeParam === "1" || timedModeParam === 1;
  const memorisationTime = Number(memorisationTimeProp);
  const recallTime = Number(recallTimeProp);
  const memoCountdown = Number(memoCountdownProp);
  const recallCountdownMode = recallCountdownModeProp;
  const recallCountdownFixed = Number(recallCountdownProp);

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showRecall, setShowRecall] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recallTimeRemaining, setRecallTimeRemaining] = useState(null);
  const [memoCountdownRemaining, setMemoCountdownRemaining] = useState(null);
  const [recallCountdownRemaining, setRecallCountdownRemaining] = useState(null);
  const [memoStartTime, setMemoStartTime] = useState(null);
  const [memoEndTime, setMemoEndTime] = useState(null);
  const recallCountdownInitialized = useRef(false);

  // router already declared at the top
  // Card groups per location: from prop, localStorage, or default 1
  const [groupsPerLocation, setGroupsPerLocation] = useState(1);
  useEffect(() => {
    let value = 1;
    if (cardGroupsPerLocationProp) {
      if (
        cardGroupsPerLocationProp === "variable-black" ||
        cardGroupsPerLocationProp === "variable-red"
      ) {
        value = cardGroupsPerLocationProp;
      } else {
        value = Math.max(1, Math.min(4, Number(cardGroupsPerLocationProp)));
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cardGroupsPerLocation");
      if (stored === "variable-black" || stored === "variable-red") {
        value = stored;
      } else {
        const num = Number(stored);
        if (!isNaN(num) && num > 0) value = Math.max(1, Math.min(4, num));
      }
    }
    setGroupsPerLocation(value);
  }, [cardGroupsPerLocationProp]);

  // Save groupsPerLocation to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && groupsPerLocation) {
      localStorage.setItem("cardGroupsPerLocation", groupsPerLocation);
    }
  }, [groupsPerLocation]);

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

  // Clamp highlightIdx to valid range when page/cardsOnPage/totalGroups change
  useEffect(() => {
    if (highlightIdx > totalGroups - 1) {
      setHighlightIdx(totalGroups - 1);
    }
    // eslint-disable-next-line no-console
    console.log(
      "[CardMemorisation] DEBUG: highlightIdx:",
      highlightIdx,
      "totalGroups:",
      totalGroups,
      "page:",
      page,
      "cardsOnPage.length:",
      cardsOnPage.length
    );
  }, [page, cardsOnPage.length, totalGroups]);

  // Journey navigation state (for cycling journeys)
  const [journeyIdx, setJourneyIdx] = useState(0);
  // Helper to get all points from all journeys
  const allPoints = journey.flatMap((j) =>
    Array.isArray(j.points) ? j.points : []
  );
  // Helper to get all journeys with points
  const journeysWithPoints = journey.filter(
    (j) => Array.isArray(j.points) && j.points.length > 0
  );
  // Helper to get current journey (for variable logic)
  const currentJourney =
    journeysWithPoints.length > 0
      ? journeysWithPoints[journeyIdx % journeysWithPoints.length]
      : null;

  // When journey or journeyIdx changes, reset page/highlightIdx
  useEffect(() => {
    setPage(0);
    setHighlightIdx(0);
  }, [journeyIdx, journey]);

  // Get current group of cards (within deck)
  const start = highlightIdx * groupSize;
  const end = Math.min(start + groupSize, cardsOnPage.length);
  const currentGroup = cardsOnPage.slice(start, end);

  // Helper: get the mapping from group index to location index for variable logic
  function getVariableLocationMap(cardsOnPage, groupSize, allPoints, mode) {
    // Always use a mapping table for variable mode. The mapping table is user-definable and stored in localStorage.
    // For 'variable-black', advance location on black-first group; for 'variable-red', use the mapping table to map red-first pairs to black-first pairs.
    // The mapping table should be loaded from localStorage or use sensible defaults.
    const map = [];
    let locIdx = 0;
    let groupsInCurrentLocation = 0;
    const isBlack = (card) => card && (card.suit === "♠" || card.suit === "♣");
    const isRed = (card) => card && (card.suit === "♥" || card.suit === "♦");
    const numGroups = Math.ceil(cardsOnPage.length / groupSize);

    // Load mapping table from localStorage or use defaults
    let mappingTable = null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("redToBlackMappingTable");
      if (stored) {
        try {
          mappingTable = JSON.parse(stored);
        } catch (e) {
          mappingTable = null;
        }
      }
    }
    // Default mapping if not set
    if (!mappingTable) {
      mappingTable = {
        dd: "cc",
        hh: "ss",
        hd: "sc",
        dh: "cs",
        ds: "sd",
        dc: "cd",
        hs: "sh",
        hc: "ch",
      };
    }

    for (let g = 0; g < numGroups; g++) {
      map.push(locIdx);
      groupsInCurrentLocation++;
      const firstCard = cardsOnPage[g * groupSize];
      let shouldAdvance = false;
      if (mode === "variable-black" && isBlack(firstCard)) {
        shouldAdvance = true;
      } else if (mode === "variable-red" && isRed(firstCard)) {
        // Use mapping table to determine if this red-first pair should advance as per its mapped black-first pair
        // For simplicity, assume groupSize === 2 for pair logic
        if (groupSize === 2 && firstCard && cardsOnPage[g * groupSize + 1]) {
          const c1 = firstCard;
          const c2 = cardsOnPage[g * groupSize + 1];
          const pairKey =
            (c1.suit === "♥" || c1.suit === "♦") &&
            (c2.suit === "♥" || c2.suit === "♦")
              ? (c1.suit[0] + c2.suit[0]).toLowerCase()
              : null;
          if (pairKey && mappingTable[pairKey]) {
            // Map to black-first pair
            // If the mapped black pair would advance, then so should this red pair
            // For now, just treat all red pairs as advancing, as before
            shouldAdvance = true;
          }
        } else {
          // For non-pair groupings, just advance on red as before
          shouldAdvance = true;
        }
      }
      if (groupsInCurrentLocation >= 3) {
        shouldAdvance = true;
      }
      if (shouldAdvance) {
        locIdx = (locIdx + 1) % allPoints.length;
        groupsInCurrentLocation = 0;
      }
    }
    return map;
  }

  function getCurrentPoint() {
    if (!journey || journey.length === 0) return null;
    if (
      groupsPerLocation === "variable-black" ||
      groupsPerLocation === "variable-red"
    ) {
      // Variable logic: use only current journey, cycle through journeys
      if (!currentJourney) return { name: "-" };
      const points = currentJourney.points;
      if (!points || points.length === 0) return { name: "-" };
      // Compute mapping for this page
      const map = getVariableLocationMap(
        cardsOnPage,
        groupSize,
        points,
        groupsPerLocation
      );
      const idx = map[highlightIdx] || 0;
      return points[idx] || { name: "-" };
    } else {
      // Non-variable: flatten all points, cycle through all journeys
      if (!allPoints || allPoints.length === 0) return { name: "-" };
      const groupNumber = page * totalGroups + highlightIdx;
      const idx = groupNumber % allPoints.length;
      return allPoints[idx] || { name: "-" };
    }
  }
  const currentPoint = getCurrentPoint();

  // Get imageItem, phonetics, compImageUrl for this group (like numbers)
  function getImageItemAndPhonetics() {
    if (!imageSet || imageSet.length === 0 || !currentGroup.length)
      return { item: "", phonetics: "", compImageUrl: null };
    const suitToEmoji = {
      "♠": "\u2660\uFE0F",
      "♥": "\u2665\uFE0F",
      "♦": "\u2666\uFE0F",
      "♣": "\u2663\uFE0F",
    };
    const groupName = currentGroup
      .map((card) => card.value + (suitToEmoji[card.suit] || card.suit))
      .join("");
    for (const set of imageSet) {
      if (set.images && Array.isArray(set.images)) {
        const allNames = set.images.map((img) => img.name);
        const found = set.images.find((img) => img.name === groupName);
        if (!found) {
          const groupNameNoVS = groupName.replace(/\uFE0F/g, "");
          const close = allNames.find(
            (n) => n && n.replace(/\uFE0F/g, "") === groupNameNoVS
          );
        }
        if (found) {
          return {
            item: found.imageItem || found.name || groupName,
            phonetics: found.phonetics || "",
            compImageUrl: found.url || found.URL || null,
          };
        }
      }
    }
    return { item: "", phonetics: "", compImageUrl: null };
  }
  const {
    item: imageItemName,
    phonetics: imagePhonetics,
    compImageUrl,
  } = getImageItemAndPhonetics();

  // Get journey point location, memoPic, etc for modal
  const locationUrl =
    currentPoint && currentPoint.location ? currentPoint.location : null;
  const memoPicUrl =
    currentPoint && currentPoint.memoPic ? currentPoint.memoPic : null;

  // Calculate groups per row for up/down navigation
  const GROUPS_PER_ROW = Math.ceil(10 / groupSize); // 10 columns in grid

  // Memo countdown effect (runs before memorization starts)
  useEffect(() => {
    if (
      memoCountdownRemaining !== null &&
      memoCountdownRemaining > 0 &&
      !isPaused &&
      timeRemaining === null
    ) {
      const interval = setInterval(() => {
        setMemoCountdownRemaining((prev) => {
          if (prev <= 1) {
            // Start memorization
            setMemoStartTime(Date.now());
            if (timedMode) {
              setTimeRemaining(memorisationTime);
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [memoCountdownRemaining, isPaused, timedMode, memorisationTime, timeRemaining]);

  // Timer countdown effect
  useEffect(() => {
    if (
      timedMode &&
      timeRemaining !== null &&
      timeRemaining > 0 &&
      !showRecall &&
      !isPaused
    ) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setMemoEndTime(Date.now());
            setShowDetailsModal(false);
            setShowRecall(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timedMode, timeRemaining, showRecall, isPaused]);

  // Recall timer countdown effect
  useEffect(() => {
    if (
      showRecall &&
      timedMode &&
      recallTimeRemaining !== null &&
      recallTimeRemaining > 0 &&
      !isPaused &&
      recallCountdownRemaining === null
    ) {
      const interval = setInterval(() => {
        setRecallTimeRemaining((prev) => {
          if (prev <= 1) {
            // Recall time finished
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [
    showRecall,
    recallTimeRemaining,
    isPaused,
    recallCountdownRemaining,
    timedMode,
  ]);

  // Recall countdown effect (runs before recall inputs are shown)
  useEffect(() => {
    if (
      recallCountdownRemaining !== null &&
      recallCountdownRemaining > 0 &&
      !isPaused &&
      showRecall
    ) {
      const interval = setInterval(() => {
        setRecallCountdownRemaining((prev) => {
          if (prev <= 1) {
            // Countdown finished, show recall inputs
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [recallCountdownRemaining, isPaused, showRecall]);

  // Initialize recall countdown when recall mode starts
  useEffect(() => {
    if (showRecall && !recallCountdownInitialized.current) {
      // Calculate recall countdown time
      let countdownTime = 0;
      if (recallCountdownMode === "remaining") {
        // Use remaining memorization time
        if (memoStartTime && memoEndTime) {
          const elapsedMemo = (memoEndTime - memoStartTime) / 1000; // in seconds
          const remainingMemo = Math.max(0, memorisationTime - elapsedMemo);
          countdownTime = Math.ceil(remainingMemo);
        } else if (memoStartTime) {
          // Manual finish - calculate elapsed time
          const elapsedMemo = (Date.now() - memoStartTime) / 1000;
          const remainingMemo = Math.max(0, memorisationTime - elapsedMemo);
          countdownTime = Math.ceil(remainingMemo);
        }
      } else {
        // Use fixed countdown time
        countdownTime = recallCountdownFixed;
      }

      if (countdownTime > 0) {
        setRecallCountdownRemaining(countdownTime);
        recallCountdownInitialized.current = true;
      } else {
        // No countdown, proceed directly
        setRecallCountdownRemaining(null);
        recallCountdownInitialized.current = true;
      }
    }
  }, [
    showRecall,
    recallCountdownMode,
    recallCountdownFixed,
    memoStartTime,
    memoEndTime,
    memorisationTime,
  ]);

  // Start recall timer when recall mode begins (timed mode only)
  useEffect(() => {
    if (showRecall && timedMode && recallTimeRemaining === null && recallCountdownRemaining === null) {
      setRecallTimeRemaining(recallTime);
    }
  }, [showRecall, timedMode, recallTime, recallCountdownRemaining, recallTimeRemaining]);

  // Start timer when timed mode is enabled
  useEffect(() => {
    if (timedMode && timeRemaining === null && memoCountdownRemaining === null) {
      // Start with memo countdown if configured
      if (memoCountdown > 0) {
        setMemoCountdownRemaining(memoCountdown);
      } else {
        setMemoStartTime(Date.now());
        setTimeRemaining(memorisationTime);
      }
      setShowRecall(false);
    } else if (!timedMode && memoCountdownRemaining === null && timeRemaining === null) {
      // Non-timed mode - still show memo countdown
      if (memoCountdown > 0) {
        setMemoCountdownRemaining(memoCountdown);
      } else {
        setMemoStartTime(Date.now());
      }
      setTimeRemaining(null);
      setShowRecall(false);
    }
  }, [timedMode, memorisationTime, memoCountdown, timeRemaining, memoCountdownRemaining]);

  // Keyboard navigation (arrows for group, PgUp/PgDn for deck)
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't handle keys during countdowns
      if (memoCountdownRemaining !== null || (showRecall && recallCountdownRemaining !== null)) {
        return;
      }

      if (e.key === "d" && !e.repeat && !showRecall) {
        setShowDetailsModal((prev) => !prev);
      } else if (e.key === "Enter" && !showRecall && memoCountdownRemaining === null) {
        // Enter to start recall mode
        e.preventDefault();
        if (!memoEndTime && memoStartTime) {
          setMemoEndTime(Date.now());
        }
        setShowDetailsModal(false);
        setShowRecall(true);
      } else if (e.key === "ArrowRight" && !showRecall) {
        if (highlightIdx === totalGroups - 1) {
          // At end of group, go to next journey for variable logic, else next page
          if (
            groupsPerLocation === "variable-black" ||
            groupsPerLocation === "variable-red"
          ) {
            setJourneyIdx((idx) => {
              // eslint-disable-next-line no-console
              console.log(
                "[CardMemorisation] DEBUG: About to move to NEXT journey. idx:",
                idx,
                "journeysWithPoints.length:",
                journeysWithPoints.length,
                "current:",
                journeysWithPoints[idx]?.name || "?"
              );
              const newIdx =
                journeysWithPoints.length > 0
                  ? (idx + 1) % journeysWithPoints.length
                  : 0;
              // eslint-disable-next-line no-console
              console.log(
                "[CardMemorisation] Moving to NEXT journey (variable logic):",
                newIdx,
                journeysWithPoints[newIdx]?.name || "?"
              );
              return newIdx;
            });
            setPage(0);
            setHighlightIdx(0);
          } else {
            // Non-variable: go to next page or cycle
            if (page < totalPages - 1) {
              setPage((p) => p + 1);
              setHighlightIdx(0);
            } else {
              setPage(0);
              setHighlightIdx(0);
            }
          }
        } else {
          setHighlightIdx((idx) => Math.min(idx + 1, totalGroups - 1));
        }
      } else if (e.key === "ArrowLeft" && !showRecall) {
        if (highlightIdx === 0) {
          // At first group, go to previous page or previous journey
          if (page > 0) {
            setPage((p) => p - 1);
            // Need to set highlightIdx to last group of previous page
            const prevPageStart = (page - 1) * CARDS_PER_DECK;
            const prevPageEnd = Math.min(
              prevPageStart + CARDS_PER_DECK,
              cards.length
            );
            const prevCardsOnPage = cards.slice(prevPageStart, prevPageEnd);
            const prevTotalGroups = Math.ceil(
              prevCardsOnPage.length / groupSize
            );
            setHighlightIdx(prevTotalGroups - 1);
          } else {
            // At first page
            if (
              groupsPerLocation === "variable-black" ||
              groupsPerLocation === "variable-red"
            ) {
              // Variable: move to previous journey, cycle
              setJourneyIdx((idx) => {
                // eslint-disable-next-line no-console
                console.log(
                  "[CardMemorisation] DEBUG: About to move to PREVIOUS journey. idx:",
                  idx,
                  "journeysWithPoints.length:",
                  journeysWithPoints.length,
                  "current:",
                  journeysWithPoints[idx]?.name || "?"
                );
                const newIdx =
                  journeysWithPoints.length > 0
                    ? (idx - 1 + journeysWithPoints.length) %
                      journeysWithPoints.length
                    : 0;
                // eslint-disable-next-line no-console
                console.log(
                  "[CardMemorisation] Moving to PREVIOUS journey (variable logic):",
                  newIdx,
                  journeysWithPoints[newIdx]?.name || "?"
                );
                // After journeyIdx is set, set highlightIdx to last group of that journey's first page
                setTimeout(() => {
                  // Get the points for the new journey
                  const points = journeysWithPoints[newIdx]?.points || [];
                  // Generate a deck for the first page
                  const deck = generateDecks(decks);
                  const pageStart = 0;
                  const pageEnd = Math.min(CARDS_PER_DECK, deck.length);
                  const cardsOnPage = deck.slice(pageStart, pageEnd);
                  const totalGroups = Math.ceil(cardsOnPage.length / groupSize);
                  setHighlightIdx(totalGroups - 1);
                  setPage(0);
                }, 0);
                return newIdx;
              });
            } else {
              // Non-variable: cycle to last group
              setPage(totalPages - 1);
              setHighlightIdx(totalGroups - 1);
            }
          }
        } else {
          setHighlightIdx((idx) => Math.max(idx - 1, 0));
        }
      } else if (e.key === "ArrowDown" && !showRecall) {
        setHighlightIdx((idx) =>
          Math.min(idx + GROUPS_PER_ROW, totalGroups - 1)
        );
      } else if (e.key === "ArrowUp" && !showRecall) {
        setHighlightIdx((idx) => Math.max(idx - GROUPS_PER_ROW, 0));
      } else if (e.key === "PageDown" && !showRecall) {
        if (
          groupsPerLocation === "variable-black" ||
          groupsPerLocation === "variable-red"
        ) {
          setJourneyIdx((idx) => {
            const newIdx =
              journeysWithPoints.length > 0
                ? (idx + 1) % journeysWithPoints.length
                : 0;
            // eslint-disable-next-line no-console
            console.log(
              "[CardMemorisation] Moving to NEXT journey (variable logic):",
              newIdx,
              journeysWithPoints[newIdx]?.name || "?"
            );
            return newIdx;
          });
          setPage(0);
          setHighlightIdx(0);
        } else {
          if (page < totalPages - 1) {
            setPage((p) => p + 1);
            setHighlightIdx(0);
          } else {
            setPage(0);
            setHighlightIdx(0);
          }
        }
      } else if (e.key === "PageUp" && !showRecall) {
        if (page > 0) {
          setPage((p) => p - 1);
          setHighlightIdx(0);
        } else {
          // At first page
          if (
            groupsPerLocation === "variable-black" ||
            groupsPerLocation === "variable-red"
          ) {
            setJourneyIdx((idx) => {
              const newIdx =
                journeysWithPoints.length > 0
                  ? (idx - 1 + journeysWithPoints.length) %
                    journeysWithPoints.length
                  : 0;
              // eslint-disable-next-line no-console
              console.log(
                "[CardMemorisation] Moving to PREVIOUS journey (variable logic):",
                newIdx,
                journeysWithPoints[newIdx]?.name || "?"
              );
              return newIdx;
            });
          } else {
            setPage(totalPages - 1);
            setHighlightIdx(totalGroups - 1);
          }
        }
      } else if ((e.key === " " || e.code === "Space") && !showRecall) {
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
  }, [
    highlightIdx,
    totalGroups,
    onFinish,
    page,
    totalPages,
    GROUPS_PER_ROW,
    groupsPerLocation,
    journeysWithPoints.length,
    groupSize,
    cards,
    totalGroups,
    showRecall,
    memoCountdownRemaining,
    recallCountdownRemaining,
    memoStartTime,
    memoEndTime,
  ]);

  function handleExitToSettings() {
    router.push("/training/cardsSettings");
  }

  // Responsive hint bar styling (match numbersMemorisation)
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded shadow text-gray-900 dark:text-gray-100">
      {/* Memo Countdown Overlay */}
      {memoCountdownRemaining !== null && memoCountdownRemaining > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-2xl text-center">
            <div className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Memorisation starts in
            </div>
            <div className="text-8xl font-bold text-blue-600 dark:text-blue-400">
              {memoCountdownRemaining}
            </div>
          </div>
        </div>
      )}

      {/* Recall Countdown Overlay */}
      {recallCountdownRemaining !== null &&
        recallCountdownRemaining > 0 &&
        showRecall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-2xl text-center">
              <div className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
                Recall starts in
              </div>
              <div className="text-8xl font-bold text-green-600 dark:text-green-400">
                {recallCountdownRemaining}
              </div>
            </div>
          </div>
        )}

      {/* Details Modal: show on 'd' key */}
      {showDetailsModal && (
        <SimpleModal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        >
          <div style={{ textAlign: "center", minWidth: 200 }}>
            <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded text-base">
              <b>
                {currentPoint && currentPoint.name ? currentPoint.name : "-"}
              </b>
              {currentPoint && currentPoint.memoItem
                ? ` - ${currentPoint.memoItem}`
                : ""}
              {imageItemName ? `: ${imageItemName}` : ""}
              {imagePhonetics && (
                <span
                  style={{ color: "#888", fontStyle: "italic", marginLeft: 6 }}
                >
                  ({imagePhonetics})
                </span>
              )}
            </div>
            <div
              style={{
                margin: "16px 0",
                position: "relative",
                display: "inline-block",
                width: 320,
                height: 200,
              }}
            >
              {locationUrl ? (
                isLocationStreetView(locationUrl) ? (
                  <EmbedStreetView
                    location={locationUrl}
                    width={320}
                    height={200}
                  />
                ) : (
                  <EmbedImage location={locationUrl} width={320} height={200} />
                )
              ) : (
                <div
                  style={{
                    color: "#888",
                    width: 320,
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  No location available
                </div>
              )}
              {/* Overlay memoPicUrl (left) */}
              {memoPicUrl && (
                <img
                  src={memoPicUrl}
                  alt="Memo"
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 80,
                    height: 60,
                    objectFit: "contain",
                    zIndex: 3,
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 8,
                  }}
                />
              )}
              {/* Overlay compImageUrl (right) */}
              {compImageUrl && (
                <img
                  src={compImageUrl}
                  alt="Comp"
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    width: 120,
                    height: 90,
                    objectFit: "contain",
                    zIndex: 2,
                    border: "2px solid #fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 8,
                  }}
                />
              )}
            </div>
            <div className="mb-2">
              <div>Current Group:</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {currentGroup.map((card, idx) => {
                  const isRedSuit = card.suit === "♥" || card.suit === "♦";
                  return (
                    <span
                      key={idx}
                      className="text-2xl font-mono flex items-center"
                    >
                      {card.value}
                      <span
                        className={
                          isRedSuit
                            ? "ml-1 text-red-600 dark:text-red-400"
                            : "ml-1"
                        }
                      >
                        {card.suit}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </SimpleModal>
      )}
      <button
        onClick={handleExitToSettings}
        className="mb-4 text-blue-600 dark:text-blue-300 hover:underline font-medium"
      >
        ← Exit to Card Settings
      </button>
      
      {/* Header with title and timer */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Cards Memorisation {mode && `(${mode})`}
        </h2>
        {timedMode && memoCountdownRemaining === null && (
          <div className="flex items-center gap-2">
            {!showRecall && (
              <>
                <span className="text-lg font-bold">
                  ⏱️{" "}
                  {timeRemaining !== null
                    ? `${Math.floor(timeRemaining / 60)}:${String(
                        timeRemaining % 60
                      ).padStart(2, "0")}`
                    : "0:00"}
                </span>
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
              </>
            )}
            {showRecall && recallCountdownRemaining === null && (
              <span className="text-lg font-bold">
                ⏱️{" "}
                {recallTimeRemaining !== null
                  ? `${Math.floor(recallTimeRemaining / 60)}:${String(
                      recallTimeRemaining % 60
                    ).padStart(2, "0")}`
                  : "0:00"}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* No card groups per location input here; should be on settings page */}
      
      {/* Main content - only show after memo countdown finishes */}
      {memoCountdownRemaining === null && (
        <>
          {/* Hint Bar (styled like numbers) */}
          <div
        className="mb-4 px-4 bg-gray-100 dark:bg-slate-800 rounded text-[18px] text-gray-800 dark:text-gray-100 w-full flex items-center gap-2"
        style={{
          minHeight:
            typeof window !== "undefined" && window.innerWidth < 640
              ? "6rem"
              : "2.5rem",
          height:
            typeof window !== "undefined" && window.innerWidth < 640
              ? "6rem"
              : "2.5rem",
          paddingTop: 0,
          paddingBottom: 0,
          minWidth: "340px",
          maxWidth: "100%",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
          <span
            className="block truncate font-mono"
            style={{
              textAlign: "left",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "normal"
                  : "nowrap",
              paddingTop: "0.5rem",
              height:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "6rem"
                  : "2.5rem",
              minHeight:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "6rem"
                  : "2.5rem",
              maxHeight:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "6rem"
                  : "2.5rem",
              lineHeight:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "1.3"
                  : "2.5rem",
              overflow:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "auto"
                  : "hidden",
              textOverflow:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "clip"
                  : "ellipsis",
              width: "100%",
              margin:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "0 auto"
                  : undefined,
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
      {/* Card List (grid, desktop only) */}
      <div className="grid grid-cols-10 gap-2 mb-6 hidden sm:grid">
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

      {/* Focus box for current group (mobile only) */}
      <div className="block sm:hidden mb-6">
        <div className="flex justify-center">
          <div className="border-2 border-yellow-500 rounded-lg bg-yellow-100 dark:bg-yellow-900 p-4 flex gap-2 items-center min-w-[120px]">
            {currentGroup.map((card, idx) => {
              const isRedSuit = card.suit === "♥" || card.suit === "♦";
              return (
                <span
                  key={idx}
                  className="text-2xl font-mono flex items-center"
                >
                  {card.value}
                  <span
                    className={
                      isRedSuit ? "ml-1 text-red-600 dark:text-red-400" : "ml-1"
                    }
                  >
                    {card.suit}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      {/* Paging controls (desktop only, like numbers) */}
      {totalPages > 1 && (
        <div className="mt-4 text-center hidden sm:block">
          <button
            onClick={() => {
              if (page > 0) {
                setPage((p) => p - 1);
              } else {
                if (
                  groupsPerLocation === "variable-black" ||
                  groupsPerLocation === "variable-red"
                ) {
                  setJourneyIdx((idx) => {
                    const newIdx =
                      journeysWithPoints.length > 0
                        ? (idx - 1 + journeysWithPoints.length) %
                          journeysWithPoints.length
                        : 0;
                    // eslint-disable-next-line no-console
                    console.log(
                      "[CardMemorisation] Moving to PREVIOUS journey (variable logic):",
                      newIdx,
                      journeysWithPoints[newIdx]?.name || "?"
                    );
                    return newIdx;
                  });
                } else {
                  setPage(totalPages - 1);
                  setHighlightIdx(totalGroups - 1);
                }
              }
              setHighlightIdx(0);
            }}
            disabled={
              page === 0 &&
              (!journeysWithPoints.length ||
                (groupsPerLocation !== "variable-black" &&
                  groupsPerLocation !== "variable-red"))
            }
            className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-3 text-gray-900 dark:text-gray-100">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages - 1) {
                setPage((p) => p + 1);
              } else {
                if (
                  groupsPerLocation === "variable-black" ||
                  groupsPerLocation === "variable-red"
                ) {
                  setJourneyIdx((idx) => {
                    const newIdx =
                      journeysWithPoints.length > 0
                        ? (idx + 1) % journeysWithPoints.length
                        : 0;
                    // eslint-disable-next-line no-console
                    console.log(
                      "[CardMemorisation] Moving to NEXT journey (variable logic):",
                      newIdx,
                      journeysWithPoints[newIdx]?.name || "?"
                    );
                    return newIdx;
                  });
                } else {
                  setPage(0);
                  setHighlightIdx(0);
                }
              }
              setHighlightIdx(0);
            }}
            disabled={
              page === totalPages - 1 &&
              (!journeysWithPoints.length ||
                (groupsPerLocation !== "variable-black" &&
                  groupsPerLocation !== "variable-red"))
            }
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
            onClick={() => {
              if (highlightIdx === 0) {
                if (page > 0) {
                  setPage((p) => p - 1);
                  const prevPageStart = (page - 1) * CARDS_PER_DECK;
                  const prevPageEnd = Math.min(
                    prevPageStart + CARDS_PER_DECK,
                    cards.length
                  );
                  const prevCardsOnPage = cards.slice(
                    prevPageStart,
                    prevPageEnd
                  );
                  const prevTotalGroups = Math.ceil(
                    prevCardsOnPage.length / groupSize
                  );
                  setHighlightIdx(prevTotalGroups - 1);
                } else {
                  if (
                    groupsPerLocation === "variable-black" ||
                    groupsPerLocation === "variable-red"
                  ) {
                    setJourneyIdx((idx) => {
                      // eslint-disable-next-line no-console
                      console.log(
                        "[CardMemorisation] DEBUG: About to move to PREVIOUS journey. idx:",
                        idx,
                        "journeysWithPoints.length:",
                        journeysWithPoints.length,
                        "current:",
                        journeysWithPoints[idx]?.name || "?"
                      );
                      const newIdx =
                        journeysWithPoints.length > 0
                          ? (idx - 1 + journeysWithPoints.length) %
                            journeysWithPoints.length
                          : 0;
                      // eslint-disable-next-line no-console
                      console.log(
                        "[CardMemorisation] Moving to PREVIOUS journey (variable logic):",
                        newIdx,
                        journeysWithPoints[newIdx]?.name || "?"
                      );
                      return newIdx;
                    });
                  } else {
                    setPage(totalPages - 1);
                    setHighlightIdx(totalGroups - 1);
                  }
                }
              } else {
                setHighlightIdx((idx) => Math.max(0, idx - 1));
              }
            }}
            disabled={
              highlightIdx === 0 &&
              page === 0 &&
              (!journeysWithPoints.length ||
                (groupsPerLocation !== "variable-black" &&
                  groupsPerLocation !== "variable-red"))
            }
            className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-3 text-sm text-gray-600 dark:text-gray-300">
            {highlightIdx + 1} / {totalGroups || 1}
          </span>
          <button
            onClick={() => {
              if (highlightIdx === (totalGroups || 1) - 1) {
                if (page < totalPages - 1) {
                  setPage((p) => p + 1);
                  setHighlightIdx(0);
                } else {
                  if (
                    groupsPerLocation === "variable-black" ||
                    groupsPerLocation === "variable-red"
                  ) {
                    setJourneyIdx((idx) => {
                      // eslint-disable-next-line no-console
                      console.log(
                        "[CardMemorisation] DEBUG: About to move to NEXT journey. idx:",
                        idx,
                        "journeysWithPoints.length:",
                        journeysWithPoints.length,
                        "current:",
                        journeysWithPoints[idx]?.name || "?"
                      );
                      const newIdx =
                        journeysWithPoints.length > 0
                          ? (idx + 1) % journeysWithPoints.length
                          : 0;
                      // eslint-disable-next-line no-console
                      console.log(
                        "[CardMemorisation] Moving to NEXT journey (variable logic):",
                        newIdx,
                        journeysWithPoints[newIdx]?.name || "?"
                      );
                      return newIdx;
                    });
                  } else {
                    setPage(0);
                    setHighlightIdx(0);
                  }
                }
              } else {
                setHighlightIdx((idx) =>
                  Math.min((totalGroups || 1) - 1, idx + 1)
                );
              }
            }}
            disabled={
              highlightIdx === (totalGroups || 1) - 1 &&
              page === totalPages - 1 &&
              (!journeysWithPoints.length ||
                (groupsPerLocation !== "variable-black" &&
                  groupsPerLocation !== "variable-red"))
            }
            className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
