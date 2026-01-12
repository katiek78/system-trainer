"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [recallCountdownRemaining, setRecallCountdownRemaining] =
    useState(null);
  const [memoStartTime, setMemoStartTime] = useState(null);
  const [memoEndTime, setMemoEndTime] = useState(null);
  const recallCountdownInitialized = useRef(false);
  const memoCountdownInitialized = useRef(false);

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

  // Each page is a separately shuffled deck of 52 cards
  const CARDS_PER_DECK = 52;
  const totalPages = decks;
  const [page, setPage] = useState(0);
  const [cardsOnPage, setCardsOnPage] = useState(() =>
    shuffle(generateDecks(1))
  );

  useEffect(() => {
    // On every page change, generate a new shuffled deck
    setCardsOnPage(shuffle(generateDecks(1)));
  }, [page]);

  // Highlight state (grouping within current deck)
  const [highlightIdx, setHighlightIdx] = useState(0);
  const groupSize = Number(grouping) || 1;
  const totalGroups = Math.ceil(cardsOnPage.length / groupSize);

  // Clamp highlightIdx to valid range when page/cardsOnPage/totalGroups change
  useEffect(() => {
    if (highlightIdx > totalGroups - 1) {
      setHighlightIdx(totalGroups - 1);
    }
  }, [page, cardsOnPage.length, totalGroups]);

  // Helper to get all points from all journeys
  const allPoints = journey.flatMap((j) =>
    Array.isArray(j.points) ? j.points : []
  );
  // Helper to get all journeys with points
  const journeysWithPoints = journey.filter(
    (j) => Array.isArray(j.points) && j.points.length > 0
  );
  // Compute current journey index from page and system logic
  let currentJourneyIdx = 0;
  if (
    groupsPerLocation === "variable-black" ||
    groupsPerLocation === "variable-red"
  ) {
    if (journeysWithPoints.length > 0) {
      currentJourneyIdx = page % journeysWithPoints.length;
    }
  }
  // For non-variable systems, you may want to use a different mapping if needed
  const currentJourney =
    journeysWithPoints.length > 0
      ? journeysWithPoints[currentJourneyIdx]
      : null;

  // Get current group of cards (within deck)
  const start = highlightIdx * groupSize;
  const end = Math.min(start + groupSize, cardsOnPage.length);
  const currentGroup = cardsOnPage.slice(start, end);

  // Parse grouping pattern (e.g., "1-1-1" or "2" or "3-2")
  function parseGroupingPattern(grouping) {
    if (!grouping || typeof grouping !== "string") return [];
    return grouping
      .split("-")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
  }
  const groupingPattern = parseGroupingPattern(grouping);

  // Determine which pattern group this highlight index belongs to
  function getPatternGroupIndex(highlightIdx, groupingPattern) {
    if (groupingPattern.length <= 1) return 0;
    // For multi-group patterns, cycle through the pattern
    return highlightIdx % groupingPattern.length;
  }
  const patternGroupIdx = getPatternGroupIndex(highlightIdx, groupingPattern);

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
    // Normalize function to remove variation selectors and spaces
    function normalizeName(str) {
      return (str || "")
        .replace(/\uFE0F/g, "")
        .replace(/\s/g, "")
        .normalize("NFC");
    }

    // Helper to get mapping table
    function getRedToBlackMapping() {
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
      return mappingTable;
    }

    // Build groupName and normalized version
    let groupName = currentGroup
      .map((card) => card.value + (suitToEmoji[card.suit] || card.suit))
      .join("");
    let groupNameNorm = normalizeName(groupName);

    // Log the original groupName and normalized version before mapping
    console.log(
      "[CardMemorisation] Looking up card pair:",
      groupName,
      "| Normalized:",
      groupNameNorm
    );

    // If variable system and group is a red-first pair, use mapping
    if (
      (groupsPerLocation === "variable-black" ||
        groupsPerLocation === "variable-red") &&
      currentGroup.length === 2 &&
      ["♥", "♦"].includes(currentGroup[0].suit)
    ) {
      // Get mapping table
      const mappingTable = getRedToBlackMapping();
      console.log(mappingTable);
      // Build pair key using suit letters (h, d, s, c)
      function suitToLetter(suit) {
        if (suit === "♥") return "h";
        if (suit === "♦") return "d";
        if (suit === "♠") return "s";
        if (suit === "♣") return "c";
        return suit;
      }
      const pairKey =
        suitToLetter(currentGroup[0].suit) + suitToLetter(currentGroup[1].suit);
      const mappedPair = mappingTable[pairKey];
      console.log("Mapped pair for", pairKey, "is", mappedPair);
      if (mappedPair) {
        // Replace suits in groupName with mapped black suits
        const value1 = currentGroup[0].value;
        const value2 = currentGroup[1].value;
        // mappedPair is e.g. "cc", "ss", "sh", etc.
        const suitMap = { c: "♣", s: "♠", h: "♥", d: "♦" };
        const mappedSuit1 = suitMap[mappedPair[0]];
        const mappedSuit2 = suitMap[mappedPair[1]];
        const mappedGroupName =
          value1 +
          (suitToEmoji[mappedSuit1] || mappedSuit1) +
          value2 +
          (suitToEmoji[mappedSuit2] || mappedSuit2);
        const mappedGroupNameNorm = normalizeName(mappedGroupName);
        console.log(mappedGroupNameNorm);
        // Log the mapped groupName and normalized version
        console.log(
          "[CardMemorisation] Mapped to black-first pair:",
          mappedGroupName,
          "| Normalized:",
          mappedGroupNameNorm
        );
        groupName = mappedGroupName;
        groupNameNorm = mappedGroupNameNorm;
      }
    }

    // Debug: log groupName and first imageSet item
    if (
      Array.isArray(imageSet) &&
      imageSet.length > 0 &&
      imageSet[0].images &&
      imageSet[0].images.length > 0
    ) {
      // eslint-disable-next-line no-console
      console.log(
        "[CardMemorisation] groupName:",
        groupName,
        "| groupNameNorm:",
        groupNameNorm
      );
      // eslint-disable-next-line no-console
      console.log(
        "[CardMemorisation] first imageSet[0].images[0].name:",
        imageSet[0].images[0].name
      );
    }

    // For multi-group patterns, use the appropriate image set for this pattern group
    const imageSetsToSearch = Array.isArray(imageSet) ? imageSet : [];
    let targetImageSet = null;
    if (
      groupingPattern.length > 1 &&
      patternGroupIdx < imageSetsToSearch.length
    ) {
      targetImageSet = imageSetsToSearch[patternGroupIdx];
    } else if (imageSetsToSearch.length > 0) {
      targetImageSet = imageSetsToSearch[0];
    }

    const setsToCheck = targetImageSet ? [targetImageSet] : imageSetsToSearch;

    for (const set of setsToCheck) {
      if (set.images && Array.isArray(set.images)) {
        let found = set.images.find(
          (img) => normalizeName(img.name) === groupNameNorm
        );
        if (!found) {
          found = set.images.find(
            (img) => normalizeName(img.name) === groupNameNorm
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
    // If not found, show groupName as fallback (as before)
    return { item: groupName, phonetics: "", compImageUrl: null };
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
          if (
            (groupsPerLocation === "variable-black" ||
              groupsPerLocation === "variable-red") &&
            currentGroup.length === 2 &&
            ["♥", "♦"].includes(currentGroup[0].suit)
          ) {
            // Get mapping table
            const mappingTable = getRedToBlackMapping();
            // Build pair key using single-letter suit codes to match mapping table
            function suitToLetter(suit) {
              if (suit === "♥") return "h";
              if (suit === "♦") return "d";
              if (suit === "♠") return "s";
              if (suit === "♣") return "c";
              return suit;
            }
            const pairKey =
              suitToLetter(currentGroup[0].suit) +
              suitToLetter(currentGroup[1].suit);
            const mappedPair = mappingTable[pairKey];
            if (mappedPair) {
              // Replace suits in groupName with mapped black suits
              const value1 = currentGroup[0].value;
              const value2 = currentGroup[1].value;
              // mappedPair is e.g. "cc" or "ss"
              const suitMap = { c: "♣", s: "♠" };
              const mappedSuit1 = suitMap[mappedPair[0]];
              const mappedSuit2 = suitMap[mappedPair[1]];
              const mappedGroupName =
                value1 +
                (suitToEmoji[mappedSuit1] || mappedSuit1) +
                value2 +
                (suitToEmoji[mappedSuit2] || mappedSuit2);
              const mappedGroupNameNorm = normalizeName(mappedGroupName);
              // Log the mapped groupName and normalized version
              console.log(
                "[CardMemorisation] Mapped to black-first pair:",
                mappedGroupName,
                "| Normalized:",
                mappedGroupNameNorm
              );
              groupName = mappedGroupName;
              groupNameNorm = mappedGroupNameNorm;
            }
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
  }, [
    memoCountdownRemaining,
    timedMode,
    timeRemaining,
    showRecall,
    isPaused,
    memorisationTime,
  ]);

  // Start recall timer when recall mode begins (timed mode only)
  useEffect(() => {
    if (
      showRecall &&
      timedMode &&
      recallTimeRemaining === null &&
      recallCountdownRemaining === null
    ) {
      setRecallTimeRemaining(recallTime);
    }
  }, [
    showRecall,
    timedMode,
    recallTime,
    recallCountdownRemaining,
    recallTimeRemaining,
  ]);

  // Start timer when timed mode is enabled
  useEffect(() => {
    if (memoCountdownInitialized.current) {
      return; // Already initialized, don't restart
    }

    if (
      timedMode &&
      timeRemaining === null &&
      memoCountdownRemaining === null
    ) {
      // Start with memo countdown if configured
      if (memoCountdown > 0) {
        setMemoCountdownRemaining(memoCountdown);
      } else {
        setMemoStartTime(Date.now());
        setTimeRemaining(memorisationTime);
      }
      setShowRecall(false);
      memoCountdownInitialized.current = true;
    } else if (
      !timedMode &&
      memoCountdownRemaining === null &&
      timeRemaining === null
    ) {
      // Non-timed mode - no countdown, just start directly
      setMemoStartTime(Date.now());
      setTimeRemaining(null);
      setShowRecall(false);
      memoCountdownInitialized.current = true;
    }
  }, [
    timedMode,
    memorisationTime,
    memoCountdown,
    timeRemaining,
    memoCountdownRemaining,
  ]);

  // Keyboard navigation (arrows for group, PgUp/PgDn for deck)
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't handle keys during countdowns
      if (
        memoCountdownRemaining !== null ||
        (showRecall && recallCountdownRemaining !== null)
      ) {
        return;
      }

      if (e.key === "d" && !e.repeat && !showRecall) {
        setShowDetailsModal((prev) => !prev);
      } else if (
        e.key === "Enter" &&
        !showRecall &&
        memoCountdownRemaining === null
      ) {
        // Enter to start recall mode
        e.preventDefault();
        if (!memoEndTime && memoStartTime) {
          setMemoEndTime(Date.now());
        }
        setShowDetailsModal(false);
        setShowRecall(true);
      } else if (e.key === "ArrowRight" && !showRecall) {
        if (highlightIdx === totalGroups - 1) {
          setPage((p) => p + 1);
          setHighlightIdx(0);
        } else {
          setHighlightIdx((idx) => Math.min(idx + 1, totalGroups - 1));
        }
      } else if (e.key === "ArrowLeft" && !showRecall) {
        // Only allow navigation if NOT at the absolute first group of the first deck
        const atFirstGroupOfFirstDeck = highlightIdx === 0 && page === 0;
        if (atFirstGroupOfFirstDeck) {
          // Do nothing: already at the start, cannot go left
          return;
        }
        if (highlightIdx === 0) {
          // At first group, go to previous page or previous journey
          if (page > 0) {
            setPage((p) => p - 1);
            // Need to set highlightIdx to last group of previous page
            // Since each page is a new deck, just set to last group
            setHighlightIdx(totalGroups - 1);
          } else {
            // At first page, but not at absolute start (should not happen due to check above)
            // Defensive: do nothing
            return;
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
            {/* Yellow info box for location and memo item */}
            {currentPoint && (currentPoint.name || currentPoint.memoItem) && (
              <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded text-base">
                <b>{currentPoint.name || "-"}</b>
                {currentPoint.memoItem ? ` - ${currentPoint.memoItem}` : ""}
              </div>
            )}

            {/* Purple info box for group details (cards and their image names) */}
            {currentGroup && currentGroup.length > 0 && (
              <div className="mb-2 p-2 bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100 rounded text-sm">
                {/* Top row: card names with emoji/suit, inline and centered */}
                <div
                  className="text-center"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  {currentGroup.map((card, idx) => {
                    const suitToEmoji = {
                      "♠": "\u2660\uFE0F",
                      "♥": "\u2665\uFE0F",
                      "♦": "\u2666\uFE0F",
                      "♣": "\u2663\uFE0F",
                    };
                    return (
                      <span key={idx}>
                        {card.value}
                        {suitToEmoji[card.suit] || card.suit}
                      </span>
                    );
                  })}
                </div>
                {/* Second row: image item and phonetics (as in Numbers) */}
                <div className="text-center" style={{ fontSize: "1rem" }}>
                  {imageItemName ? imageItemName : "-"}
                  {imagePhonetics ? (
                    <span
                      style={{
                        color: "#888",
                        fontStyle: "italic",
                        marginLeft: 6,
                      }}
                    >
                      ({imagePhonetics})
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Location image or street view, with overlays */}
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
          </div>
        </SimpleModal>
      )}

      {/* Main content - only show after memo countdown finishes */}
      {memoCountdownRemaining === null && (
        <>
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
                <b>
                  {currentPoint && currentPoint.name ? currentPoint.name : "-"}
                </b>
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
          {/* Card List (grid, desktop only) - groups overlapped horizontally */}
          <div
            className="flex flex-wrap gap-4 mb-6 hidden sm:flex"
            style={{ minHeight: 62 }}
          >
            {Array.from({ length: totalGroups }).map((_, groupIdx) => {
              const startIdx = groupIdx * groupSize;
              const endIdx = Math.min(startIdx + groupSize, cardsOnPage.length);
              const groupCards = cardsOnPage.slice(startIdx, endIdx);
              const isHighlighted = groupIdx === highlightIdx;
              // Calculate total width of overlapped cards
              const cardsWidth = 40 + (groupCards.length - 1) * 20;
              return (
                <div
                  key={groupIdx}
                  className="relative flex items-center"
                  style={{
                    minWidth: cardsWidth,
                    height: 62,
                    marginRight: 16,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => setHighlightIdx(groupIdx)}
                >
                  {isHighlighted && (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: cardsWidth,
                        height: 62,
                        background: "#fde68a",
                        borderRadius: 8,
                        boxShadow: "0 0 0 2px #fbbf24",
                        transform: "translate(-50%, -50%)",
                        zIndex: 0,
                        transition: "background 0.2s, box-shadow 0.2s",
                      }}
                    />
                  )}
                  {groupCards.map((card, idx) => {
                    const suitMap = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
                    const valueMap = { A: "01", J: "11", Q: "12", K: "13" };
                    let valueNum = valueMap[card.value] || card.value;
                    if (!valueNum.match(/^[0-9]+$/)) valueNum = "01";
                    if (valueNum.length === 1) valueNum = "0" + valueNum;
                    const suit = suitMap[card.suit] || "s";
                    const filename = `/assets/Card images 1/${suit}${valueNum}.png`;
                    return (
                      <img
                        key={idx}
                        src={filename}
                        alt={`${card.value}${card.suit}`}
                        style={{
                          width: 40,
                          height: 58,
                          objectFit: "contain",
                          background: "#fff",
                          position: "absolute",
                          left: idx * 20,
                          zIndex: idx + 1, // ensure above highlight
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Deck indicator and focus box for current group (mobile only) */}
          <div className="block sm:hidden mb-6">
            {/* Deck indicator for mobile */}
            {totalPages > 1 && (
              <div className="flex justify-center mb-2">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-xs font-semibold shadow">
                  Deck {page + 1} of {totalPages}
                </span>
              </div>
            )}
            <div className="flex justify-center">
              <div className="border-2 border-yellow-500 rounded-lg bg-yellow-100 dark:bg-yellow-900 p-4 flex gap-2 items-center min-w-[120px]">
                {currentGroup.map((card, idx) => {
                  const suitMap = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
                  const valueMap = { A: "01", J: "11", Q: "12", K: "13" };
                  let valueNum = valueMap[card.value] || card.value;
                  if (!valueNum.match(/^\d+$/)) valueNum = "01";
                  if (valueNum.length === 1) valueNum = "0" + valueNum;
                  const suit = suitMap[card.suit] || "s";
                  const filename = `/assets/Card images 1/${suit}${valueNum}.png`;
                  return (
                    <img
                      key={idx}
                      src={filename}
                      alt={`${card.value}${card.suit}`}
                      style={{
                        width: 64,
                        height: 92,
                        objectFit: "contain",
                        marginLeft: idx === 0 ? 0 : -32,
                        zIndex: idx,
                        borderRadius: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                        border: "1.5px solid #bbb",
                        background: "#fff",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

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
                  // Always increment page, never reset
                  setPage((p) => p + 1);
                  setHighlightIdx(0);
                  // If variable system and at end of journey, increment journeyIdx
                  if (
                    (groupsPerLocation === "variable-black" ||
                      groupsPerLocation === "variable-red") &&
                    page === totalPages - 1
                  ) {
                    const newIdx =
                      journeysWithPoints.length > 0
                        ? (journeyIdx + 1) % journeysWithPoints.length
                        : 0;
                    setJourneyIdx(newIdx);
                  }
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
                          const newIdx =
                            journeysWithPoints.length > 0
                              ? (idx - 1 + journeysWithPoints.length) %
                                journeysWithPoints.length
                              : 0;
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
                          const newIdx =
                            journeysWithPoints.length > 0
                              ? (idx + 1) % journeysWithPoints.length
                              : 0;
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
