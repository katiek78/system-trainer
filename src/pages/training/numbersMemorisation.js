import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SimpleModal from "@/components/SimpleModal";

import EmbedStreetView from "@/components/EmbedStreetView";
import EmbedImage from "@/components/EmbedImage";
import { isLocationStreetView } from "@/utilities/isLocationStreetView";

export default function NumbersMemorisation() {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Handler to go back to numbers settings page
  function handleExitToSettings() {
    router.push("/training/settings");
  }
  const router = useRouter();
  const {
    amount = 0,
    mode = "5N",
    highlightGrouping = "",
    imageSets = "",
    journeyIds = "",
    allowedPrefixes = "",
    journeyHints = "1",
  } = router.query;
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

  // Keyboard shortcut for 'd' to show details alert
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "d" && !e.repeat) {
        setShowDetailsModal((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // --- Begin moved logic inside component ---
  // State for digits, highlight, and page
  const [digits, setDigits] = useState("");
  const [highlightGroupIdx, setHighlightGroupIdx] = useState(0);
  const [page, setPage] = useState(0);
  const DIGITS_PER_ROW = 40;
  const ROWS_PER_PAGE = 12;

  // Parse highlight grouping
  const highlightGroups = highlightGrouping
    ? highlightGrouping.split("-").map(Number).filter(Boolean)
    : [];

  // Utility: generate a string of random digits of given length
  function generateRandomDigits(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  function getHighlightRanges(groups) {
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
  const highlightRanges =
    highlightGroups.length > 0 ? getHighlightRanges(highlightGroups) : [];

  // Keyboard navigation for highlight group
  useEffect(() => {
    function handleKeyDown(e) {
      // Spacebar returns to start of first page and first highlight group
      if (e.key === " " || e.code === "Space") {
        setPage(0);
        setHighlightGroupIdx(0);
        return;
      }
      // Arrow navigation for highlight group
      if (highlightRanges.length === 0) return;
      if (e.key === "ArrowRight") {
        setHighlightGroupIdx((idx) =>
          Math.min(idx + 1, highlightRanges.length - 1)
        );
      } else if (e.key === "ArrowLeft") {
        setHighlightGroupIdx((idx) => Math.max(idx - 1, 0));
      } else if (e.key === "ArrowDown") {
        // Move to the group containing the digit DIGITS_PER_ROW below the current group's start
        setHighlightGroupIdx((idx) => {
          if (highlightRanges.length === 0) return idx;
          const [curStart] = highlightRanges[idx] || [0];
          const targetIdx = highlightRanges.findIndex(
            ([start, end]) =>
              curStart + DIGITS_PER_ROW >= start &&
              curStart + DIGITS_PER_ROW < end
          );
          return targetIdx !== -1 ? targetIdx : idx;
        });
      } else if (e.key === "ArrowUp") {
        // Move to the group containing the digit DIGITS_PER_ROW above the current group's start
        setHighlightGroupIdx((idx) => {
          if (highlightRanges.length === 0) return idx;
          const [curStart] = highlightRanges[idx] || [0];
          const targetIdx = highlightRanges.findIndex(
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
  }, [highlightRanges.length]);

  // Sync page with highlight group so that navigating highlight moves to the correct page
  useEffect(() => {
    if (highlightRanges.length === 0) return;
    // Find the page that contains the start of the current highlight group
    const [groupStart] = highlightRanges[highlightGroupIdx] || [0];
    const groupPage = Math.floor(groupStart / (DIGITS_PER_ROW * ROWS_PER_PAGE));
    if (groupPage !== page) {
      setPage(groupPage);
    }
  }, [highlightGroupIdx, highlightRanges, page]);

  // Reset highlight index if digits or grouping changes
  useEffect(() => {
    setHighlightGroupIdx(0);
  }, [digits, highlightGrouping]);

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
    if (amount > 0 && highlightGroups.length > 0) {
      let result = "";
      let totalDigits = Number(amount);
      let groupIdx = 0;
      while (result.length < totalDigits) {
        const groupLen = highlightGroups[groupIdx % highlightGroups.length];
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
  }, [amount, highlightGrouping, allowedPrefixesArr, digits]);

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

  // Helper: is digit at global index highlighted?
  function isDigitHighlighted(globalIdx) {
    if (highlightRanges.length === 0) return false;
    const [start, end] = highlightRanges[highlightGroupIdx] || [];
    return globalIdx >= start && globalIdx < end;
  }

  // Calculate digit font size and spacing based on container width and number of digits per row
  // Target: 40 digits per row, fit within ~90vw (max 1200px)
  const containerMaxWidth = 1200;
  const containerPadding = 64; // left+right
  const availableWidth =
    typeof window !== "undefined"
      ? Math.min(window.innerWidth * 0.9, containerMaxWidth) - containerPadding
      : 1000;
  const digitWidth = Math.max(Math.floor(availableWidth / 40), 18); // min 18px
  const digitFontSize = Math.max(Math.floor(digitWidth * 0.9), 16); // min 16px
  const digitGap = Math.max(Math.floor(digitWidth * 0.15), 2); // min 2px

  // For complex groupings, all subgroups in a cycle use the same location
  function getLocationIdxForGroupIdx(groupIdx) {
    if (highlightGroups.length === 0) return 0;
    let total = 0;
    let locIdx = 0;
    while (total <= groupIdx) {
      total += highlightGroups.length;
      if (total > groupIdx) break;
      locIdx++;
    }
    return locIdx;
  }
  function getDigitsForGroup() {
    if (highlightRanges.length === 0) return "";
    const [start, end] = highlightRanges[highlightGroupIdx] || [];
    return digits.slice(start, end);
  }
  function getImageTextForGroup() {
    if (imageSetData.length === 0 || highlightGroups.length === 0) return "";
    const groupInCycle = highlightGroupIdx % highlightGroups.length;
    const set = imageSetData[groupInCycle];
    if (!set || !Array.isArray(set.images)) return "";
    const digitsStr = getDigitsForGroup();
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
  function getLocationAndObject() {
    // Use journeyData and their points
    // For now, use the first journey (or cycle if multiple)
    if (!journeyData || journeyData.length === 0)
      return { location: "", object: "" };
    const locIdx = getLocationIdxForGroupIdx(highlightGroupIdx);
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

  function getLocationAndObjectURLs() {
    // Find the current journey and point for the highlighted group
    if (!journeyData || journeyData.length === 0)
      return { locationUrl: null, compImageUrl: null, memoPicUrl: null };
    const locIdx = getLocationIdxForGroupIdx(highlightGroupIdx);
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
    if (imageSetData.length > 0 && highlightGroups.length > 0) {
      const groupInCycle = highlightGroupIdx % highlightGroups.length;
      const set = imageSetData[groupInCycle];
      if (set && Array.isArray(set.images)) {
        const digitsStr = getDigitsForGroup();
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
      <Head>
        <link
          href="https://fonts.googleapis.com/css?family=Roboto+Mono:400,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="p-6 text-gray-900 dark:text-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
            {disciplineLabel}
          </h1>
          <button
            className="ml-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            onClick={handleExitToSettings}
            aria-label="Exit to Settings Page"
          >
            Exit to settings
          </button>
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
                {(() => {
                  const { location, object } = getLocationAndObject();
                  const imageText = getImageTextForGroup();
                  if (!location && !object && !imageText) return null;
                  return (
                    <span>
                      <b>{location}</b>
                      {object ? ` - ${object}` : ""}
                      {imageText ? `: ${imageText}` : ""}
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

        {/* MOBILE: Only show focused digits, with navigation, fixed height */}
        <div className="block sm:hidden">
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
              {getDigitsForGroup()}
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
                {highlightGroupIdx + 1} / {highlightRanges.length || 1}
              </span>
              <button
                onClick={() =>
                  setHighlightGroupIdx((idx) =>
                    Math.min((highlightRanges.length || 1) - 1, idx + 1)
                  )
                }
                disabled={
                  highlightGroupIdx === (highlightRanges.length || 1) - 1
                }
                className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
                aria-label="Next group"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP: Full grid */}
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
                    if (highlightRanges.length === 0) return null;
                    const [groupStart, groupEnd] =
                      highlightRanges[highlightGroupIdx] || [];
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
                    for (let g = 0; g < highlightRanges.length; g++) {
                      const [start, end] = highlightRanges[g];
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

        {totalPages > 1 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="mr-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="mx-3 text-gray-900 dark:text-gray-100">
              Page {safePage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="ml-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
