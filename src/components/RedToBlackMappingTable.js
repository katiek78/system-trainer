"use client";

import React, { useState } from "react";

// All red-first suit pairs
const redPairs = ["dd", "hh", "hd", "dh", "ds", "dc", "hs", "hc"];
// All black-first suit pairs
const blackPairs = ["cc", "ss", "sc", "cs", "sd", "cd", "sh", "ch"];
// Default mapping
const defaultMapping = {
  dd: "cc",
  hh: "ss",
  hd: "sc",
  dh: "cs",
  ds: "sd",
  dc: "cd",
  hs: "sh",
  hc: "ch",
};

// Suit symbols for display
const suitSymbols = {
  h: "♥",
  d: "♦",
  s: "♠",
  c: "♣",
};

function getPairLabel(pair) {
  if (pair.length === 2) {
    // Render each suit with color
    return (
      <>
        <span
          style={{
            color: pair[0] === "h" || pair[0] === "d" ? "red" : undefined,
          }}
        >
          {suitSymbols[pair[0]]}
        </span>
        <span
          style={{
            color: pair[1] === "h" || pair[1] === "d" ? "red" : undefined,
          }}
        >
          {suitSymbols[pair[1]]}
        </span>
      </>
    );
  }
  return pair;
}

export default function RedToBlackMappingTable() {
  // Try to load from localStorage, else use default
  const [mapping, setMapping] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("redToBlackMappingTable");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Only keep valid keys
          return { ...defaultMapping, ...parsed };
        } catch (e) {
          // fallback to default
        }
      }
    }
    return defaultMapping;
  });

  function handleChange(redPair, blackPair) {
    const newMapping = { ...mapping, [redPair]: blackPair };
    setMapping(newMapping);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "redToBlackMappingTable",
        JSON.stringify(newMapping)
      );
    }
  }

  return (
    <table className="w-full border text-center">
      <thead>
        <tr>
          <th className="p-2 border">Red-first pair</th>
          <th className="p-2 border">Maps to black-first pair</th>
        </tr>
      </thead>
      <tbody>
        {redPairs.map((redPair) => (
          <tr key={redPair}>
            <td className="p-2 border font-mono text-lg">
              {getPairLabel(redPair)}
            </td>
            <td className="p-2 border">
              <select
                value={mapping[redPair] || defaultMapping[redPair]}
                onChange={(e) => handleChange(redPair, e.target.value)}
                className="p-1 rounded border"
              >
                {blackPairs.map((blackPair) => (
                  <option key={blackPair} value={blackPair}>
                    {/* Render suit symbols with color in dropdown */}
                    {getPairLabel(blackPair)}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
