import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const DIGITS_PER_ROW = 40;
const ROWS_PER_PAGE = 12;

function generateRandomDigits(amount) {
  let digits = "";
  for (let i = 0; i < amount; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

export default function NumbersMemorisation() {
  const router = useRouter();
  const { amount = 0, mode = "5N", highlightGrouping = "" } = router.query;
  const [digits, setDigits] = useState("");
  const [page, setPage] = useState(0);
  // Highlight state
  const [highlightGroupIdx, setHighlightGroupIdx] = useState(0);
  // Parse highlight grouping string to array
  function parseHighlightGrouping(str) {
    if (!str) return [];
    return str
      .split("-")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
  }
  const highlightGroups = parseHighlightGrouping(highlightGrouping);
  // Compute highlight ranges (start, end) for all groups
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
