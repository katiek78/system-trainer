"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import SimpleModal from "@/components/SimpleModal";

import EmbedStreetView from "@/components/EmbedStreetView";
import EmbedImage from "@/components/EmbedImage";
import { isLocationStreetView } from "@/utilities/isLocationStreetView";

export const dynamic = "force-dynamic";

function NumbersMemorisationContent() {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handler to go back to numbers settings page
  function handleExitToSettings() {
    router.push("/training/settings");
  }

  const amount = searchParams.get("amount") || 0;
  const mode = searchParams.get("mode") || "5N";
  const imagePattern = searchParams.get("imagePattern") || "";
  const locationPattern = searchParams.get("locationPattern") || "";
  const navigateBy = searchParams.get("navigateBy") || "image";
  const focusBoxShows = searchParams.get("focusBoxShows") || "image";
  const imageSets = searchParams.get("imageSets") || "";
  const journeyIds = searchParams.get("journeyIds") || "";
  const allowedPrefixes = searchParams.get("allowedPrefixes") || "";
  const journeyHints = searchParams.get("journeyHints") || "1";
  const timedModeParam = searchParams.get("timedMode") || "0";
  const memorisationTimeParam = searchParams.get("memorisationTime") || "60";
  const endOnNextClickParam = searchParams.get("endOnNextClick") || "0";
  const locationCycleMode =
    searchParams.get("locationCycleMode") || "per-highlight";
  const locationCycleValue = Number(
    searchParams.get("locationCycleValue") || "1"
  );
  const focusBoxMode = searchParams.get("focusBoxMode") || "highlight-only";
  const focusBoxPattern = searchParams.get("focusBoxPattern") || "";

  const timedMode = timedModeParam === "1";
  const memorisationTime = Number(memorisationTimeParam);
  const recallTimeParam = searchParams.get("recallTime") || "240";
  const recallTime = Number(recallTimeParam);

  // For ML Numbers (MN mode), always end on next click when on last group
  // For customised (XN mode), use the endOnNextClick setting
  // For all other modes, never end on next click (only on Enter)
  const endOnNextClick =
    mode === "MN" ? true : mode === "XN" && endOnNextClickParam === "1";

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showRecall, setShowRecall] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recallTimeRemaining, setRecallTimeRemaining] = useState(null);
  const [userInput, setUserInput] = useState([]);
  const [score, setScore] = useState(null);
  const [showScore, setShowScore] = useState(false);
  const [hoveredInput, setHoveredInput] = useState(null);
  const [touchedInput, setTouchedInput] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1000);

  // Set client-side window width after mount to avoid hydration errors
  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showJourneyHints =
    journeyHints === "1" || journeyHints === 1 || journeyHints === true;
  // Parse imageSets param to array of IDs
  const imageSetIds = imageSets ? imageSets.split(",").filter(Boolean) : [];
  // Parse allowedPrefixes param to array (one per group)
  // Each group: comma-separated prefixes, groups separated by |
  const allowedPrefixesArr = allowedPrefixes
    ? decodeURIComponent(allowedPrefixes)
        .split("|")
        .map((s) =>
          s
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        )
    : [];
  // Now allowedPrefixesArr[i] is an array of allowed prefixes for group i, or [] for no restriction

  // --- State for digits, highlight, and page ---
  const [digits, setDigits] = useState("");
  const [highlightGroupIdx, setHighlightGroupIdx] = useState(0);
  const [page, setPage] = useState(0);
  const DIGITS_PER_ROW = 40;
  const ROWS_PER_PAGE = 12;

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
      timedMode &&
      showRecall &&
      recallTimeRemaining !== null &&
      recallTimeRemaining > 0 &&
      !showScore &&
      !isPaused
    ) {
      const interval = setInterval(() => {
        setRecallTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinishRecall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showRecall, recallTimeRemaining, showScore, isPaused]);

  // Initialize user input when recall mode begins
  useEffect(() => {
    if (showRecall && userInput.length === 0) {
      setUserInput(Array(digits.length).fill(""));
    }
  }, [showRecall, digits.length, userInput.length]);

  // Start recall timer when recall mode begins (timed mode only)
  useEffect(() => {
    if (showRecall && timedMode && recallTimeRemaining === null) {
      setRecallTimeRemaining(recallTime);
    }
  }, [showRecall, timedMode, recallTime]);

  // Auto-focus first input when recall mode starts
  useEffect(() => {
    if (showRecall && !showScore) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          const firstInput = document.querySelector('input[type="text"]');
          if (firstInput) {
            firstInput.focus();
          }
        }, 50);
      });
    }
  }, [showRecall, showScore]);

  // Start timer when timed mode is enabled
  useEffect(() => {
    if (timedMode && timeRemaining === null) {
      setTimeRemaining(memorisationTime);
      setShowRecall(false);
    } else if (!timedMode) {
      setTimeRemaining(null);
      setShowRecall(false);
    }
  }, [timedMode, memorisationTime]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // 'd' to show/hide details modal
      if (e.key === "d" && !e.repeat) {
        setShowDetailsModal((prev) => !prev);
      }
      // Enter to start recall mode (only during memorization)
      if (e.key === "Enter" && !showRecall && !showScore) {
        e.preventDefault();
        // For ML Numbers, start recall immediately; for others, show confirmation
        if (mode === "MN") {
          setShowRecall(true);
        } else {
          setShowConfirmFinish(true);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRecall, showScore, mode]);

  // Fetch image set data for selected IDs
  const [imageSetData, setImageSetData] = useState([]);
  useEffect(() => {
    async function fetchImageSets() {
      if (imageSetIds.length === 0) {
        setImageSetData([]);
        return;
      }
      // Fetch all sets in parallel
      const results = await Promise.all(
        imageSetIds.map(async (id) => {
          const res = await fetch(`/api/imageSets/${id}`);
          if (res.ok) {
            const data = await res.json();
            return data.data || null;
          }
          return null;
        })
      );
      setImageSetData(results.filter(Boolean));
    }
    fetchImageSets();
  }, [imageSets]);

  // Fetch selected journey(s) and use their points for hints
  const journeyIdArr = journeyIds ? journeyIds.split(",").filter(Boolean) : [];
  const [journeyData, setJourneyData] = useState([]);
  useEffect(() => {
    async function fetchJourneys() {
      console.log("Fetching journeys for IDs:", journeyIdArr);
      if (journeyIdArr.length === 0) {
        setJourneyData([]);
        return;
      }
      const results = await Promise.all(
        journeyIdArr.map(async (id) => {
          const res = await fetch(`/api/journeys/${id}`);
          if (res.ok) {
            const data = await res.json();
            return data.data || null;
          }
          return null;
        })
      );
      setJourneyData(results.filter(Boolean));
      console.log("Fetched journey data:", results.filter(Boolean));
    }
    fetchJourneys();
  }, [journeyIds]);

  // Parse patterns
  const imageGroups = imagePattern
    ? imagePattern.split("-").map(Number).filter(Boolean)
    : [];
  const locationGroups = locationPattern
    ? locationPattern.split("-").map(Number).filter(Boolean)
    : [];

  // Utility: generate a string of random digits of given length
  function generateRandomDigits(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  // Generate ranges for a pattern (e.g., [3, 2] => [[0,3], [3,5], [5,8], [8,10], ...])
  function getRanges(groups) {
    const ranges = [];
    let idx = 0;
    while (idx < digits.length) {
      for (let g = 0; g < groups.length && idx < digits.length; g++) {
        const len = groups[g];
        const start = idx;
        const end = Math.min(idx + len, digits.length);
        ranges.push([start, end]);
        idx = end;
      }
    }
    return ranges;
  }

  const imageRanges = imageGroups.length > 0 ? getRanges(imageGroups) : [];
  const locationRanges =
    locationGroups.length > 0 ? getRanges(locationGroups) : [];

  // Navigation ranges: what we navigate through (either images or locations)
  const navRanges = navigateBy === "location" ? locationRanges : imageRanges;

  // Find which location a given image index belongs to
  function getLocationIdxForImageIdx(imageIdx) {
    if (imageRanges.length === 0 || locationRanges.length === 0) return 0;

    const [imageStart] = imageRanges[imageIdx] || [0];

    // Find which location range contains this image's start
    for (let i = 0; i < locationRanges.length; i++) {
      const [locStart, locEnd] = locationRanges[i];
      if (imageStart >= locStart && imageStart < locEnd) {
        return i;
      }
    }
    return 0;
  }

  // Find which image index corresponds to a navigation index
  function getImageIdxForNavIdx(navIdx) {
    if (navigateBy === "image") {
      return navIdx;
    } else {
      // navigateBy === "location"
      // Return the first image in this location
      if (locationRanges.length === 0 || imageRanges.length === 0) return 0;

      const [locStart] = locationRanges[navIdx] || [0];

      // Find first image that starts at or after locStart
      for (let i = 0; i < imageRanges.length; i++) {
        const [imgStart] = imageRanges[i];
        if (imgStart >= locStart) {
          return i;
        }
      }
      return 0;
    }
  }

  // Keyboard navigation for highlight group
  useEffect(() => {
    function handleKeyDown(e) {
      // Spacebar returns to start of first page and first highlight group
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setPage(0);
        setHighlightGroupIdx(0);
        return;
      }
      // Arrow navigation (uses nav ranges - either images or locations)
      if (navRanges.length === 0) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        // If endOnNextClick is enabled and we're on the last group, start recall
        if (endOnNextClick && highlightGroupIdx === navRanges.length - 1) {
          setShowRecall(true);
        } else {
          setHighlightGroupIdx((idx) =>
            Math.min(idx + 1, navRanges.length - 1)
          );
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setHighlightGroupIdx((idx) => Math.max(idx - 1, 0));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        // Move to the group containing the digit DIGITS_PER_ROW below the current group's start
        setHighlightGroupIdx((idx) => {
          if (navRanges.length === 0) return idx;
          const [curStart] = navRanges[idx] || [0];
          const targetIdx = navRanges.findIndex(
            ([start, end]) =>
              curStart + DIGITS_PER_ROW >= start &&
              curStart + DIGITS_PER_ROW < end
          );
          return targetIdx !== -1 ? targetIdx : idx;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // Move to the group containing the digit DIGITS_PER_ROW above the current group's start
        setHighlightGroupIdx((idx) => {
          if (navRanges.length === 0) return idx;
          const [curStart] = navRanges[idx] || [0];
          const targetIdx = navRanges.findIndex(
            ([start, end]) =>
              curStart - DIGITS_PER_ROW >= start &&
              curStart - DIGITS_PER_ROW < end
          );
          return targetIdx !== -1 ? targetIdx : idx;
        });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRanges.length, endOnNextClick, highlightGroupIdx]);

  // Sync page with highlight group so that navigating highlight moves to the correct page
  // Use a ref to prevent interference with manual page changes
  const [lastManualPage, setLastManualPage] = useState(null);

  useEffect(() => {
    if (navRanges.length === 0) return;
    // Find the page that contains the start of the current navigation group
    const [groupStart] = navRanges[highlightGroupIdx] || [0];
    const groupPage = Math.floor(groupStart / (DIGITS_PER_ROW * ROWS_PER_PAGE));
    // Only sync if this wasn't a manual page change
    if (groupPage !== page && lastManualPage === null) {
      setPage(groupPage);
    }
    if (lastManualPage !== null) {
      setLastManualPage(null);
    }
  }, [highlightGroupIdx, navRanges, page, lastManualPage]);

  // Reset highlight index if digits or patterns change
  useEffect(() => {
    setHighlightGroupIdx(0);
  }, [digits, imagePattern, locationPattern, navigateBy]);

  // Discipline label lookup
  const modeOptions = [
    { value: "MN", label: "ML Numbers" },
    { value: "5N", label: "5-minute Numbers" },
    { value: "15N", label: "15-minute Numbers" },
    { value: "30N", label: "30-minute Numbers" },
    { value: "60N", label: "Hour Numbers" },
    { value: "XN", label: "Customised" },
  ];
  const disciplineLabel =
    modeOptions.find((m) => m.value === mode)?.label || "Numbers";

  // Generate digits with allowed prefixes enforced per group, but only once unless user regenerates
  useEffect(() => {
    if (digits) return; // Only generate if not already set
    if (amount > 0 && imageGroups.length > 0) {
      let result = "";
      let totalDigits = Number(amount);
      let groupIdx = 0;
      while (result.length < totalDigits) {
        const groupLen = imageGroups[groupIdx % imageGroups.length];
        const allowed =
          allowedPrefixesArr[groupIdx % allowedPrefixesArr.length] || [];
        let group = "";
        if (allowed.length > 0) {
          // Pick a random prefix from allowed
          const prefix = allowed[Math.floor(Math.random() * allowed.length)];
          const remainingLen = groupLen - prefix.length;
          let rest = "";
          if (remainingLen > 0) {
            rest = generateRandomDigits(remainingLen);
          }
          group = prefix + rest;
        } else {
          group = generateRandomDigits(groupLen);
        }
        result += group;
        groupIdx++;
      }
      setDigits(result.slice(0, totalDigits));
    } else if (amount > 0) {
      setDigits(generateRandomDigits(Number(amount)));
    }
  }, [amount, imagePattern, allowedPrefixesArr, digits]);

  if (!amount || amount <= 0) {
    return <div>No amount specified.</div>;
  }

  const totalRows = Math.ceil(digits.length / DIGITS_PER_ROW);
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  // Clamp page to valid range
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const startRow = safePage * ROWS_PER_PAGE;
  const endRow = startRow + ROWS_PER_PAGE;

  // Build all rows for the current page
  const rows = [];
  for (
    let rowIdx = startRow;
    rowIdx < endRow && rowIdx * DIGITS_PER_ROW < digits.length;
    rowIdx++
  ) {
    const rowDigits = digits
      .slice(rowIdx * DIGITS_PER_ROW, (rowIdx + 1) * DIGITS_PER_ROW)
      .split("");
    rows.push(rowDigits);
  }

  // Calculate digit font size and spacing based on container width and number of digits per row
  // Target: 40 digits per row, fit within ~90vw (max 1200px)
  const containerMaxWidth = 1200;
  const containerPadding = 64; // left+right
  const availableWidth = isClient
    ? Math.min(windowWidth * 0.9, containerMaxWidth) - containerPadding
    : 1000;
  const digitWidth = Math.max(Math.floor(availableWidth / 40), 18); // min 18px
  const digitFontSize = Math.max(Math.floor(digitWidth * 0.9), 16); // min 16px
  const digitGap = Math.max(Math.floor(digitWidth * 0.15), 2); // min 2px

  // Helper: is digit at global index highlighted?
  function isDigitHighlighted(globalIdx) {
    if (navRanges.length === 0) return false;
    const [start, end] = navRanges[highlightGroupIdx] || [];
    return globalIdx >= start && globalIdx < end;
  }

  // Get digits for current navigation group
  function getDigitsForCurrentNav() {
    if (navRanges.length === 0) return "";
    const [start, end] = navRanges[highlightGroupIdx] || [];
    return digits.slice(start, end);
  }

  // Get digits for focus box based on settings
  function getDigitsForFocusBox() {
    if (focusBoxShows === "image") {
      // Show current image only
      const imageIdx = getImageIdxForNavIdx(highlightGroupIdx);
      if (imageRanges.length === 0) return "";
      const [start, end] = imageRanges[imageIdx] || [];
      return digits.slice(start, end);
    } else if (focusBoxShows === "location-separated") {
      // Show current location with image pattern separators
      const imageIdx = getImageIdxForNavIdx(highlightGroupIdx);
      const locIdx = getLocationIdxForImageIdx(imageIdx);
      if (locationRanges.length === 0) return "";
      const [start, end] = locationRanges[locIdx] || [];

      // Format with image pattern separators
      const locationDigits = digits.slice(start, end);
      if (imageGroups.length > 0) {
        let formatted = "";
        let idx = 0;
        while (idx < locationDigits.length) {
          for (
            let g = 0;
            g < imageGroups.length && idx < locationDigits.length;
            g++
          ) {
            const len = imageGroups[g];
            if (formatted) formatted += " ";
            formatted += locationDigits.slice(
              idx,
              Math.min(idx + len, locationDigits.length)
            );
            idx += len;
          }
        }
        return formatted;
      }
      return locationDigits;
    } else {
      // location-noseparated: Show current location without separators
      const imageIdx = getImageIdxForNavIdx(highlightGroupIdx);
      const locIdx = getLocationIdxForImageIdx(imageIdx);
      if (locationRanges.length === 0) return "";
      const [start, end] = locationRanges[locIdx] || [];
      return digits.slice(start, end);
    }
  }

  // Get image text for current navigation position
  function getImageTextForGroup() {
    if (imageSetData.length === 0 || imageGroups.length === 0) return "";

    // Get the current image index
    const imageIdx = getImageIdxForNavIdx(highlightGroupIdx);
    const groupInCycle = imageIdx % imageGroups.length;
    const set = imageSetData[groupInCycle];
    if (!set || !Array.isArray(set.images)) return "";

    // Get digits for this image
    const [start, end] = imageRanges[imageIdx] || [];
    const digitsStr = digits.slice(start, end);

    let found = set.images.find((img) => img.name === digitsStr);
    if (!found) {
      return digitsStr;
    }
    let text = found.imageItem || found.name || digitsStr;
    if (found.phonetics) {
      text += ` (${found.phonetics})`;
    }
    return text;
  }

  // Get location and object for current navigation position
  function getLocationAndObject() {
    if (!journeyData || journeyData.length === 0)
      return { location: "", object: "" };

    // Get current image and its location
    const imageIdx = getImageIdxForNavIdx(highlightGroupIdx);
    const locIdx = getLocationIdxForImageIdx(imageIdx);

    // Which journey to use (cycle if more than one)
    const journeyIdx = locIdx % journeyData.length;
    const journey = journeyData[journeyIdx];
    if (
      !journey ||
      !Array.isArray(journey.points) ||
      journey.points.length === 0
    )
      return { location: "", object: "" };

    // Which point to use (cycle if more than points available)
    const pointIdx = locIdx % journey.points.length;
    const point = journey.points[pointIdx];
    return {
      location: point?.name || "",
      object: point?.memoItem || "",
    };
  }
  // --- End moved logic inside component ---

  // Calculate score based on user input
  function calculateScore() {
    const totalRows = Math.ceil(digits.length / DIGITS_PER_ROW);
    let totalScore = 0;

    // Find the last index with user input
    let lastInputIdx = -1;
    for (let i = userInput.length - 1; i >= 0; i--) {
      if (userInput[i] !== "") {
        lastInputIdx = i;
        break;
      }
    }

    for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
      const rowStart = rowIdx * DIGITS_PER_ROW;
      const rowEnd = Math.min((rowIdx + 1) * DIGITS_PER_ROW, digits.length);
      const isLastRow = rowIdx === totalRows - 1;

      // Check if this row has any input up to lastInputIdx
      if (lastInputIdx < rowStart) {
        // No input in this row or beyond
        break;
      }

      // Count mistakes in this row
      let mistakes = 0;
      let digitsToCheck = rowEnd - rowStart;

      // For the last row with input, only count up to last digit entered
      if (lastInputIdx >= rowStart && lastInputIdx < rowEnd) {
        digitsToCheck = lastInputIdx - rowStart + 1;
      }

      for (let i = 0; i < digitsToCheck; i++) {
        const globalIdx = rowStart + i;
        const expected = digits[globalIdx];
        const actual = userInput[globalIdx] || "";

        if (actual === "" || actual !== expected) {
          mistakes++;
        }
      }

      // Calculate score for this row
      let rowScore = 0;
      if (digitsToCheck === DIGITS_PER_ROW) {
        // Full row
        if (mistakes === 0) {
          rowScore = 40;
        } else if (mistakes === 1) {
          rowScore = 20;
        }
      } else {
        // Partial row (last row with input)
        if (mistakes === 0) {
          rowScore = digitsToCheck;
        } else if (mistakes === 1) {
          rowScore = Math.floor(digitsToCheck / 2);
        }
      }

      totalScore += rowScore;
    }

    return totalScore;
  }

  function handleFinishRecall() {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowScore(true);
    setIsPaused(false);
  }

  function getLocationAndObjectURLs() {
    // Find the current journey and point for the highlighted group
    if (!journeyData || journeyData.length === 0)
      return { locationUrl: null, compImageUrl: null, memoPicUrl: null };

    // Get current image and its location
    const imageIdx = getImageIdxForNavIdx(highlightGroupIdx);
    const locIdx = getLocationIdxForImageIdx(imageIdx);

    const journeyIdx = locIdx % journeyData.length;
    const journey = journeyData[journeyIdx];
    if (
      !journey ||
      !Array.isArray(journey.points) ||
      journey.points.length === 0
    )
      return { locationUrl: null, compImageUrl: null, memoPicUrl: null };
    const pointIdx = locIdx % journey.points.length;
    const point = journey.points[pointIdx];

    // Find comp image URL for the current group of digits (from image set)
    let compImageUrl = null;
    let debugDigitsStr = null;
    let debugFound = null;
    if (imageSetData.length > 0 && imageGroups.length > 0) {
      const groupInCycle = imageIdx % imageGroups.length;
      const set = imageSetData[groupInCycle];
      if (set && Array.isArray(set.images)) {
        // Get digits for this image
        const [start, end] = imageRanges[imageIdx] || [];
        const digitsStr = digits.slice(start, end);
        debugDigitsStr = digitsStr;
        const found = set.images.find((img) => img.name === digitsStr);
        debugFound = found;
        if (found) {
          // Try both 'url' and 'URL' (case-insensitive)
          compImageUrl = found.url || found.URL || null;
        }
      }
    }

    return {
      locationUrl: point?.location || null, // e.g., Google Maps/Street View URL
      compImageUrl, // from image set, matching digits
      memoPicUrl: point?.memoPic || null, // from journey point
    };
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css?family=Roboto+Mono:400,700&display=swap"
        rel="stylesheet"
      />
      <div className="p-6 text-gray-900 dark:text-gray-100">
        <div className="mb-6 text-center" style={{ minHeight: "140px" }}>
          {showScore && score !== null && (
            <div className="inline-block px-12 py-6 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg shadow-lg">
              <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                SCORE
              </div>
              <div className="text-6xl font-bold text-green-800 dark:text-green-100">
                {score}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
            {disciplineLabel}
          </h1>
          <div className="flex items-center gap-4">
            {timedMode && !showScore && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ⏱️{" "}
                  {showRecall && recallTimeRemaining !== null
                    ? `${Math.floor(recallTimeRemaining / 60)}:${String(
                        recallTimeRemaining % 60
                      ).padStart(2, "0")}`
                    : timeRemaining !== null
                    ? `${Math.floor(timeRemaining / 60)}:${String(
                        timeRemaining % 60
                      ).padStart(2, "0")}`
                    : "0:00"}
                </span>
                {!showScore && (
                  <button
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                )}
              </div>
            )}
            <button
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              onClick={handleExitToSettings}
              aria-label="Exit to Settings Page"
            >
              Exit to settings
            </button>
          </div>
        </div>

        {/* HINT BAR: Only show if journey hints are enabled */}
        {showJourneyHints && (
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
                  height: windowWidth < 640 ? "6rem" : "2.5rem",
                  minHeight: windowWidth < 640 ? "6rem" : "2.5rem",
                  maxHeight: windowWidth < 640 ? "6rem" : "2.5rem",
                  lineHeight: windowWidth < 640 ? "1.3" : "2.5rem",
                  overflow: windowWidth < 640 ? "auto" : "hidden",
                  textOverflow: windowWidth < 640 ? "clip" : "ellipsis",
                  width: "100%",
                  margin: windowWidth < 640 ? "0 auto" : undefined,
                }}
              >
                {(() => {
                  const { location, object } = getLocationAndObject();
                  if (!location && !object) return null;
                  return (
                    <span>
                      <b>{location}</b>
                      {object ? ` - ${object}` : ""}
                    </span>
                  );
                })()}
              </span>
            </div>
            <button
              className="px-2 py-1 text-xs bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 rounded hover:bg-blue-300 dark:hover:bg-blue-600 flex-shrink-0"
              style={{ minWidth: 32 }}
              aria-label="Show details"
              onClick={() => setShowDetailsModal(true)}
            >
              Details
            </button>
          </div>
        )}

        {/* Details Modal: If journey hints are off, show the hint bar info here too */}
        {showDetailsModal &&
          (() => {
            const { locationUrl, compImageUrl, memoPicUrl } =
              getLocationAndObjectURLs();
            const { location, object } = getLocationAndObject();
            const imageText = getImageTextForGroup();
            return (
              <SimpleModal
                open={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
              >
                <div style={{ textAlign: "center", minWidth: 200 }}>
                  {!showJourneyHints && (location || object || imageText) && (
                    <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded text-base">
                      <b>{location}</b>
                      {object ? ` - ${object}` : ""}
                      {imageText ? `: ${imageText}` : ""}
                    </div>
                  )}
                  {showJourneyHints && imageText && (
                    <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded text-base">
                      {imageText}
                    </div>
                  )}
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
                        <EmbedImage
                          location={locationUrl}
                          width={320}
                          height={200}
                        />
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
                    {/* Overlay memoPicUrl (now on left) */}
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
                    {/* Overlay compImageUrl (now on right) */}
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
                  {/* Close button removed; use the '×' in the modal corner */}
                </div>
              </SimpleModal>
            );
          })()}

        {/* Confirmation modal for finishing memorisation */}
        {showConfirmFinish && (
          <SimpleModal
            open={showConfirmFinish}
            onClose={() => setShowConfirmFinish(false)}
          >
            <div className="p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Finish Memorisation?
              </h3>
              <p className="mb-4 text-gray-900 dark:text-gray-100">
                Are you sure you want to finish memorisation and start recall?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmFinish(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmFinish(false);
                    setShowRecall(true);
                  }}
                  className="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-800"
                >
                  Yes, Start Recall
                </button>
              </div>
            </div>
          </SimpleModal>
        )}

        {/* MOBILE: Only show focused digits, with navigation, fixed height */}
        <div className="block sm:hidden">
          {showRecall ? (
            <div
              className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-md px-4 mb-6"
              style={{
                minHeight: "220px",
                height: "auto",
                width: "320px",
                maxWidth: "90vw",
                marginLeft: "auto",
                marginRight: "auto",
                boxSizing: "border-box",
                padding: "20px",
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Recall Mode
              </h2>
              <p className="text-center mb-4 text-gray-700 dark:text-gray-300 text-sm">
                Enter the digits (Row {safePage + 1}):
              </p>
              <div className="flex flex-wrap gap-1 justify-center mb-4">
                {rows[0] &&
                  rows[0].map((_, i) => {
                    const globalIdx = startRow * DIGITS_PER_ROW + i;
                    const correctDigit = digits[globalIdx];
                    const userDigit = userInput[globalIdx] || "";
                    const isCorrect = showScore && userDigit === correctDigit;
                    const isIncorrect =
                      showScore &&
                      userDigit !== "" &&
                      userDigit !== correctDigit;
                    const isHovered = hoveredInput === globalIdx;
                    const isTouched = touchedInput === globalIdx;
                    const shouldShowCorrect =
                      showScore && !isCorrect && (isHovered || isTouched);
                    // Check if this input is in the current highlight group
                    const [groupStart, groupEnd] =
                      navRanges[highlightGroupIdx] || [];
                    const isHighlighted =
                      navRanges.length > 0 &&
                      globalIdx >= groupStart &&
                      globalIdx < groupEnd;
                    // New: Use a distinct green with stripes/gradient for correct but not recalled
                    let inputBackground = undefined;
                    if (shouldShowCorrect) {
                      // Green stripes/gradient for correct but not recalled
                      inputBackground =
                        "repeating-linear-gradient(135deg, #34d399 0px, #34d399 8px, #e0ffe0 8px, #e0ffe0 16px)";
                    } else if (isCorrect) {
                      inputBackground = "#d1fae5"; // solid green
                    } else if (isIncorrect) {
                      inputBackground = "#fee2e2"; // red
                    }
                    // Find which image group this digit belongs to
                    let groupIdxForDigit = -1;
                    for (let g = 0; g < imageRanges.length; g++) {
                      const [start, end] = imageRanges[g];
                      if (globalIdx >= start && globalIdx < end) {
                        groupIdxForDigit = g;
                        break;
                      }
                    }
                    return (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        autoFocus={i === 0 && !showScore}
                        value={
                          shouldShowCorrect
                            ? correctDigit
                            : userInput[globalIdx] || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setUserInput((prev) => {
                            const newInput = [...prev];
                            newInput[globalIdx] = val;
                            return newInput;
                          });
                          // Auto-focus next input and update highlight if needed
                          if (val && i < rows[0].length - 1) {
                            const nextInput = e.target.nextElementSibling;
                            if (nextInput) {
                              nextInput.focus();
                              // Check if next input belongs to a different navigation group
                              const nextGlobalIdx = globalIdx + 1;
                              for (let g = 0; g < navRanges.length; g++) {
                                const [start, end] = navRanges[g];
                                if (
                                  nextGlobalIdx >= start &&
                                  nextGlobalIdx < end &&
                                  g !== highlightGroupIdx
                                ) {
                                  setHighlightGroupIdx(g);
                                  break;
                                }
                              }
                            }
                          }
                        }}
                        onClick={() => {
                          // Update highlight group
                          if (groupIdxForDigit !== -1) {
                            setHighlightGroupIdx(groupIdxForDigit);
                          }
                          // Show correct digit on touch for incorrect/blank
                          if (showScore && !isCorrect) {
                            setTouchedInput(globalIdx);
                            setTimeout(() => setTouchedInput(null), 1000);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Backspace" &&
                            !userInput[globalIdx] &&
                            i > 0
                          ) {
                            const prevInput = e.target.previousElementSibling;
                            if (prevInput) prevInput.focus();
                          }
                        }}
                        onMouseEnter={() => setHoveredInput(globalIdx)}
                        onMouseLeave={() => setHoveredInput(null)}
                        readOnly={showScore}
                        className="w-8 h-10 text-center text-lg font-mono border-2 rounded text-gray-900 dark:text-gray-100"
                        style={{
                          fontFamily: "'Roboto Mono', monospace",
                          background: inputBackground,
                          transition:
                            "background 0.3s ease, box-shadow 0.3s ease",
                          borderColor: isHighlighted ? "#ffd700" : undefined,
                          boxShadow: isHighlighted
                            ? "0 0 0 3px #ffe066"
                            : undefined,
                        }}
                      />
                    );
                  })}
              </div>
              {!showScore && (
                <button
                  onClick={handleFinishRecall}
                  className="mt-2 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Finish
                </button>
              )}
              {showScore && totalPages > 1 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      const newPage = Math.max(0, safePage - 1);
                      setPage(newPage);
                      setLastManualPage(newPage);
                    }}
                    disabled={safePage === 0}
                    className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
                  >
                    Previous Row
                  </button>
                  <span className="mx-3 text-gray-900 dark:text-gray-100 text-sm">
                    Row {safePage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = Math.min(totalPages - 1, safePage + 1);
                      setPage(newPage);
                      setLastManualPage(newPage);
                    }}
                    disabled={safePage === totalPages - 1}
                    className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
                  >
                    Next Row
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-md px-4 mb-6"
              style={{
                minHeight: "220px",
                height: "220px",
                maxHeight: "260px",
                width: "320px",
                maxWidth: "90vw",
                marginLeft: "auto",
                marginRight: "auto",
                boxSizing: "border-box",
              }}
            >
              <span
                className="text-4xl font-mono tracking-widest text-gray-900 dark:text-gray-100 select-all mb-6"
                style={{
                  minHeight: "2.5em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getDigitsForFocusBox()}
              </span>
              <div className="flex items-center justify-center mt-4">
                <button
                  onClick={() =>
                    setHighlightGroupIdx((idx) => Math.max(0, idx - 1))
                  }
                  disabled={highlightGroupIdx === 0}
                  className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
                  aria-label="Previous group"
                >
                  Previous
                </button>
                <span className="mx-3 text-sm text-gray-600 dark:text-gray-300">
                  {highlightGroupIdx + 1} / {navRanges.length || 1}
                </span>
                <button
                  onClick={() => {
                    const newIdx = Math.min(
                      (navRanges.length || 1) - 1,
                      highlightGroupIdx + 1
                    );
                    // If endOnNextClick is enabled and we're on the last group, start recall
                    if (
                      endOnNextClick &&
                      highlightGroupIdx === (navRanges.length || 1) - 1
                    ) {
                      setShowRecall(true);
                    } else {
                      setHighlightGroupIdx(newIdx);
                    }
                  }}
                  disabled={
                    highlightGroupIdx === (navRanges.length || 1) - 1 &&
                    !endOnNextClick
                  }
                  className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
                  aria-label="Next group"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP: Focus box showing current highlighted digits */}
        {!showRecall && (
          <div
            className="hidden sm:flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-md px-4 mb-6"
            style={{
              minHeight: "180px",
              height: "180px",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              boxSizing: "border-box",
            }}
          >
            <span
              className="text-5xl font-mono tracking-widest text-gray-900 dark:text-gray-100 select-all"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getDigitsForFocusBox()}
            </span>
          </div>
        )}

        {/* DESKTOP: Full grid or Recall boxes */}
        {showRecall ? (
          <div
            className="hidden sm:flex flex-col justify-start bg-white dark:bg-slate-800 rounded-lg shadow-md px-8 py-3 mb-6 font-mono min-h-[400px]"
            style={{
              width: "98vw",
              maxWidth: "none",
              margin: "0 -24px 24px -24px",
            }}
          >
            {rows.map((row, idx) => {
              const globalRowIdx = startRow + idx;
              return (
                <div
                  key={idx}
                  className="flex items-center mb-3 flex-nowrap"
                  style={{ fontSize: digitFontSize }}
                >
                  <span className="min-w-[48px] text-red-700 dark:text-red-400 italic text-[16px] mr-4 text-right">
                    {globalRowIdx + 1}
                  </span>
                  <span className="flex gap-1 relative">
                    {row.map((_, i) => {
                      const globalIdx = globalRowIdx * DIGITS_PER_ROW + i;
                      const correctDigit = digits[globalIdx];
                      const userDigit = userInput[globalIdx] || "";
                      const isCorrect = showScore && userDigit === correctDigit;
                      const isIncorrect =
                        showScore &&
                        userDigit !== "" &&
                        userDigit !== correctDigit;
                      const isHovered = hoveredInput === globalIdx;
                      const shouldShowCorrect =
                        showScore && !isCorrect && isHovered;
                      // Check if this input is in the current highlight group
                      const [groupStart, groupEnd] =
                        navRanges[highlightGroupIdx] || [];
                      const isHighlighted =
                        navRanges.length > 0 &&
                        globalIdx >= groupStart &&
                        globalIdx < groupEnd;
                      // New: Use a distinct green with stripes/gradient for correct but not recalled
                      let inputBackground = undefined;
                      if (shouldShowCorrect) {
                        // Green stripes/gradient for correct but not recalled
                        inputBackground =
                          "repeating-linear-gradient(135deg, #34d399 0px, #34d399 8px, #e0ffe0 8px, #e0ffe0 16px)";
                      } else if (isCorrect) {
                        inputBackground = "#d1fae5"; // solid green
                      } else if (isIncorrect) {
                        inputBackground = "#fee2e2"; // red
                      }
                      // Find which highlight group this digit belongs to
                      let groupIdxForDigit = -1;
                      for (let g = 0; g < imageRanges.length; g++) {
                        const [start, end] = imageRanges[g];
                        if (globalIdx >= start && globalIdx < end) {
                          groupIdxForDigit = g;
                          break;
                        }
                      }
                      return (
                        <input
                          key={i}
                          type="text"
                          maxLength="1"
                          autoFocus={idx === 0 && i === 0 && !showScore}
                          value={
                            shouldShowCorrect
                              ? correctDigit
                              : userInput[globalIdx] || ""
                          }
                          onClick={() => {
                            if (groupIdxForDigit !== -1) {
                              setHighlightGroupIdx(groupIdxForDigit);
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setUserInput((prev) => {
                              const newInput = [...prev];
                              newInput[globalIdx] = val;
                              return newInput;
                            });
                            // Auto-focus next input and update highlight if needed
                            if (val && i < row.length - 1) {
                              const nextInput = e.target.nextElementSibling;
                              if (nextInput) {
                                nextInput.focus();
                                // Check if next input belongs to a different group
                                const nextGlobalIdx = globalIdx + 1;
                                for (let g = 0; g < imageRanges.length; g++) {
                                  const [start, end] = imageRanges[g];
                                  if (
                                    nextGlobalIdx >= start &&
                                    nextGlobalIdx < end &&
                                    g !== highlightGroupIdx
                                  ) {
                                    setHighlightGroupIdx(g);
                                    break;
                                  }
                                }
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Backspace" &&
                              !userInput[globalIdx] &&
                              i > 0
                            ) {
                              const prevInput = e.target.previousElementSibling;
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          onMouseEnter={() => setHoveredInput(globalIdx)}
                          onMouseLeave={() => setHoveredInput(null)}
                          readOnly={showScore}
                          className="text-center border-2 rounded text-gray-900 dark:text-gray-100"
                          style={{
                            width: digitWidth,
                            height: Math.max(digitWidth * 1.2, 28),
                            fontSize: digitFontSize,
                            fontFamily: "'Roboto Mono', monospace",
                            padding: 0,
                            background: inputBackground,
                            transition:
                              "background 0.3s ease, box-shadow 0.3s ease",
                            borderColor: isHighlighted ? "#ffd700" : undefined,
                            boxShadow: isHighlighted
                              ? "0 0 0 3px #ffe066"
                              : undefined,
                          }}
                        />
                      );
                    })}
                  </span>
                </div>
              );
            })}
            {!showScore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleFinishRecall}
                  className="px-8 py-3 bg-green-500 text-white text-lg font-bold rounded hover:bg-green-600"
                >
                  Finish
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="hidden sm:flex flex-col justify-start bg-white dark:bg-slate-800 rounded-lg shadow-md px-8 py-3 mb-6 font-mono min-h-[400px]"
            style={{
              width: "98vw",
              maxWidth: "none",
              margin: "0 -24px 24px -24px",
            }}
          >
            {rows.map((row, idx) => {
              const globalRowIdx = startRow + idx;
              return (
                <div
                  key={idx}
                  className="flex items-center mb-3 flex-nowrap"
                  style={{ fontSize: digitFontSize }}
                >
                  <span className="min-w-[48px] text-red-700 dark:text-red-400 italic text-[16px] mr-4 text-right">
                    {globalRowIdx + 1}
                  </span>
                  <span className="flex gap-1 relative">
                    {/* Highlight rectangle for group if any part of group is in this row */}
                    {(() => {
                      if (navRanges.length === 0) return null;
                      const [groupStart, groupEnd] =
                        navRanges[highlightGroupIdx] || [];
                      // Compute the range of global indices for this row
                      const rowStartIdx = globalRowIdx * DIGITS_PER_ROW;
                      const rowEndIdx = rowStartIdx + row.length;
                      // If the highlight group overlaps this row, render a highlight rectangle
                      const highlightStart = Math.max(groupStart, rowStartIdx);
                      const highlightEnd = Math.min(groupEnd, rowEndIdx);
                      if (highlightStart < highlightEnd) {
                        // Compute left offset and width in px
                        const left =
                          (highlightStart - rowStartIdx) *
                          (digitWidth + digitGap);
                        const width =
                          (highlightEnd - highlightStart) *
                            (digitWidth + digitGap) -
                          digitGap;
                        return (
                          <div
                            style={{
                              position: "absolute",
                              left,
                              top: 0,
                              height: "100%",
                              width,
                              background: "#ffe066",
                              borderRadius: 6,
                              boxShadow: "0 0 0 2px #ffd700 inset",
                              zIndex: 0,
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                    {row.map((digit, i) => {
                      const globalIdx = globalRowIdx * DIGITS_PER_ROW + i;
                      // Find which highlight group this digit belongs to
                      let groupIdxForDigit = -1;
                      for (let g = 0; g < imageRanges.length; g++) {
                        const [start, end] = imageRanges[g];
                        if (globalIdx >= start && globalIdx < end) {
                          groupIdxForDigit = g;
                          break;
                        }
                      }
                      return (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            minWidth: digitWidth,
                            textAlign: "center",
                            color:
                              groupIdxForDigit === highlightGroupIdx
                                ? "#222"
                                : undefined,
                            position: "relative",
                            zIndex: 1,
                            cursor:
                              groupIdxForDigit !== -1 ? "pointer" : undefined,
                            outline: "none",
                          }}
                          onClick={() => {
                            if (groupIdxForDigit !== -1)
                              setHighlightGroupIdx(groupIdxForDigit);
                          }}
                          tabIndex={groupIdxForDigit !== -1 ? 0 : -1}
                          aria-label={
                            groupIdxForDigit !== -1
                              ? `Select group ${groupIdxForDigit + 1}`
                              : undefined
                          }
                        >
                          {digit}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                const newPage = Math.max(0, safePage - 1);
                setPage(newPage);
                setLastManualPage(newPage);
                // Move highlight to first group on the new page
                if (imageRanges.length > 0) {
                  const pageStartIdx = newPage * DIGITS_PER_ROW * ROWS_PER_PAGE;
                  const firstGroupOnPage = imageRanges.findIndex(
                    ([start]) => start >= pageStartIdx
                  );
                  if (firstGroupOnPage !== -1) {
                    setHighlightGroupIdx(firstGroupOnPage);
                  }
                }
              }}
              disabled={safePage === 0}
              className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Previous Page
            </button>
            <span className="mx-3 text-gray-900 dark:text-gray-100">
              Page {safePage + 1} of {totalPages}
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(totalPages - 1, safePage + 1);
                setPage(newPage);
                setLastManualPage(newPage);
                // Move highlight to first group on the new page
                if (imageRanges.length > 0) {
                  const pageStartIdx = newPage * DIGITS_PER_ROW * ROWS_PER_PAGE;
                  const firstGroupOnPage = imageRanges.findIndex(
                    ([start]) => start >= pageStartIdx
                  );
                  if (firstGroupOnPage !== -1) {
                    setHighlightGroupIdx(firstGroupOnPage);
                  }
                }
              }}
              disabled={safePage === totalPages - 1}
              className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function NumbersMemorisation() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      }
    >
      <NumbersMemorisationContent />
    </Suspense>
  );
}
