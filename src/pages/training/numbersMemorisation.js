import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function NumbersMemorisation() {
  const router = useRouter();
  const {
    amount = 0,
    mode = "5N",
    highlightGrouping = "",
    imageSets = "",
    journeyIds = "",
  } = router.query;
  // Parse imageSets param to array of IDs
  const imageSetIds = imageSets ? imageSets.split(",").filter(Boolean) : [];

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
  const ROWS_PER_PAGE = 10;

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
      if (highlightRanges.length === 0) return;
      if (e.key === "ArrowRight") {
        setHighlightGroupIdx((idx) =>
          Math.min(idx + 1, highlightRanges.length - 1)
        );
      } else if (e.key === "ArrowLeft") {
        setHighlightGroupIdx((idx) => Math.max(idx - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightRanges.length]);

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

  useEffect(() => {
    if (amount > 0) {
      setDigits(generateRandomDigits(Number(amount)));
    }
  }, [amount]);

  if (!amount || amount <= 0) {
    return <div>No amount specified.</div>;
  }

  const totalRows = Math.ceil(digits.length / DIGITS_PER_ROW);
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startRow = page * ROWS_PER_PAGE;
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

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css?family=Roboto+Mono:400,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 24, fontSize: 30 }}>{disciplineLabel}</h1>

        {/* HINT BAR */}
        <div
          style={{
            marginBottom: 16,
            padding: "8px 16px",
            background: "#f8f9fa",
            borderRadius: 6,
            fontSize: 18,
            color: "#333",
            minHeight: 32,
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
        </div>

        {/* DEBUG: Show journey data and indices */}
        <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
          <details>
            <summary>Debug: Journey/Point Mapping</summary>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {(() => {
                if (!journeyData || journeyData.length === 0)
                  return "No journey data.";
                const locIdx = getLocationIdxForGroupIdx(highlightGroupIdx);
                const journeyIdx = locIdx % journeyData.length;
                const journey = journeyData[journeyIdx];
                if (
                  !journey ||
                  !Array.isArray(journey.points) ||
                  journey.points.length === 0
                )
                  return "No points in journey.";
                const pointIdx = locIdx % journey.points.length;
                const point = journey.points[pointIdx];
                return [
                  `journeyIds: ${journeyIds}`,
                  `locIdx: ${locIdx}`,
                  `journeyIdx: ${journeyIdx}`,
                  `pointIdx: ${pointIdx}`,
                  `journey.name: ${journey.name}`,
                  `point.location: ${point?.location}`,
                  `point.name: ${point?.name}`,
                  `point.memoItem: ${point?.memoItem}`,
                  `point: ${JSON.stringify(point, null, 2)}`,
                ].join("\n");
              })()}
            </pre>
          </details>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            padding: "12px 32px 32px 32px",
            width: "98vw",
            maxWidth: "none",
            margin: "0 -24px 24px -24px",
            fontFamily: "Roboto Mono",
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          {rows.map((row, idx) => {
            const globalRowIdx = startRow + idx;
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: digitFontSize,
                  fontFamily: "Roboto Mono",
                  marginBottom: 12,
                  flexWrap: "nowrap",
                }}
              >
                <span
                  style={{
                    minWidth: 48,
                    color: "#c00",
                    fontStyle: "italic",
                    fontSize: 16,
                    marginRight: 18,
                    textAlign: "right",
                  }}
                >
                  {globalRowIdx + 1}
                </span>
                <span
                  style={{
                    display: "flex",
                    gap: digitGap,
                    position: "relative",
                  }}
                >
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
                    const highlighted = isDigitHighlighted(globalIdx);
                    return (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          minWidth: digitWidth,
                          textAlign: "center",
                          color: highlighted ? "#222" : undefined,
                          position: "relative",
                          zIndex: 1,
                        }}
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
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ marginRight: 12 }}
            >
              Previous
            </button>
            <span style={{ margin: "0 12px" }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ marginLeft: 12 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
