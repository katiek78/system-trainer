"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getConfidenceLevel,
  confidenceLabels,
  confidenceColours,
} from "@/utilities/confidenceLevel";

export default function ImageSetStatsPage() {
  const params = useParams();
  const id = params.id;
  const [imageSet, setImageSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [sortDesc, setSortDesc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [overallStats, setOverallStats] = useState(null);
  const [pageInput, setPageInput] = useState("");
  const [filter, setFilter] = useState("");
  const [filterInput, setFilterInput] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : "";
    fetch(
      `/api/imageSets/${id}/stats?page=${currentPage}&limit=100&sortBy=${sortBy}&sortDesc=${sortDesc}${filterParam}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.data) {
          setImageSet(data.data);
          setPagination(data.data.pagination);
          setOverallStats(data.data.overallStats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, currentPage, sortBy, sortDesc, filter]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (pageNum && pageNum >= 1 && pageNum <= pagination.totalPages) {
      goToPage(pageNum);
      setPageInput("");
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setFilter(filterInput);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilter = () => {
    setFilter("");
    setFilterInput("");
    setCurrentPage(1);
  };

  const renderQuickNav = () => {
    if (!pagination || !imageSet || sortBy !== "name" || filter) return null; // Hide when filter is active

    const totalImages = pagination.totalImages;
    const pageLimit = 100;

    // For 2-digit, 3-digit, 4-digit number sets
    if (totalImages === 100 || totalImages === 1000 || totalImages === 10000) {
      const step = totalImages === 100 ? 10 : 100;
      const numDigits = totalImages === 100 ? 2 : totalImages === 1000 ? 3 : 4;

      return (
        <div className="flex flex-row items-center gap-2 mt-3 flex-wrap">
          <span>Jump to:</span>
          <select
            onChange={(e) => goToPage(Number(e.target.value))}
            value={currentPage}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            {Array.from({ length: Math.ceil(totalImages / step) }, (_, i) => {
              const startNum = (i * step).toString().padStart(numDigits, "0");
              const page = Math.floor((i * step) / pageLimit) + 1;
              return (
                <option key={i} value={page}>
                  {startNum}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    return null;
  };

  const getSortedImages = () => {
    // Server is handling sorting now, so just return the images
    if (!imageSet || !imageSet.images) return [];
    return imageSet.images;
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-400"> ↕</span>;
    return sortDesc ? <span> ↓</span> : <span> ↑</span>;
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!imageSet) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="text-lg">Image set not found</div>
      </div>
    );
  }

  const sortedImages = getSortedImages();

  if (!imageSet || !overallStats) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-transparent">
      <div className="z-10 font-mono text-lg w-full sm:mx-auto px-1 sm:px-4 md:px-8 lg:max-w-7xl">
        <div className="flex justify-between items-center mt-4 mb-2">
          <Link
            href={`/imageSets/${id}`}
            className="text-blue-700 hover:underline font-bold"
          >
            ← Back to Image Set
          </Link>
          <Link
            href="/imageSets"
            className="text-blue-700 hover:underline font-bold"
          >
            All Image Sets →
          </Link>
        </div>

        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Statistics: {imageSet.name}
        </h1>

        {/* Filter */}
        <div className="mt-4 mb-2">
          <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-semibold">Filter by name starts with:</label>
            <input
              type="text"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              placeholder="e.g. 10"
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 w-32"
            />
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Apply
            </button>
            {filter && (
              <button
                type="button"
                onClick={clearFilter}
                className="px-4 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Clear Filter
              </button>
            )}
            {filter && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                (Filtered: showing items starting with "{filter}")
              </span>
            )}
          </form>
        </div>

        {/* Quick Navigation */}
        {renderQuickNav()}

        <div className="bg-white dark:bg-slate-800 py-5 px-1 sm:px-5 rounded mb-4">
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {pagination ? pagination.totalImages : 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Images
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {overallStats.totalDrilled}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Images Drilled
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {overallStats.avgTimeOverall.toFixed(2)}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Time (All)
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {overallStats.totalAttempts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Attempts
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {sortedImages.map((image, idx) => {
              const level = getConfidenceLevel(image.recentAttempts);
              const color = confidenceColours[level] || confidenceColours[0];
              return (
                <div
                  key={idx}
                  className="border border-gray-300 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-slate-900"
                >
                  <div className="font-bold text-lg mb-2">
                    {image.name || image.imageItem || "-"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Confidence:
                      </span>
                      <div className="mt-1">
                        <span
                          style={{
                            backgroundColor: color,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            color: level >= 4 ? "black" : "white",
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                          }}
                        >
                          {confidenceLabels[level]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Avg Time:
                      </span>
                      <div className="font-semibold">
                        {image.averageDrillTime > 0
                          ? `${image.averageDrillTime.toFixed(2)}s`
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Drills:
                      </span>
                      <div className="font-semibold">
                        {image.totalDrills || 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Last Drilled:
                      </span>
                      <div className="font-semibold text-xs">
                        {image.lastDrilledAt
                          ? new Date(image.lastDrilledAt).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-gray-400 dark:border-gray-600">
              <thead>
                <tr>
                  <th
                    className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort("name")}
                  >
                    Image <SortIcon field="name" />
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort("confidence")}
                  >
                    Flashcard confidence <SortIcon field="confidence" />
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort("avgTime")}
                  >
                    Avg Time <SortIcon field="avgTime" />
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort("totalDrills")}
                  >
                    Drills <SortIcon field="totalDrills" />
                  </th>
                  <th
                    className="px-2 py-2 border-b border-gray-400 dark:border-gray-600 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSort("lastDrilled")}
                  >
                    Last Drilled <SortIcon field="lastDrilled" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedImages.map((image, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700">
                      {image.name || image.imageItem || "-"}
                    </td>
                    <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-center">
                      {(() => {
                        const level = getConfidenceLevel(image.recentAttempts);
                        const color =
                          confidenceColours[level] || confidenceColours[0];
                        return (
                          <span
                            style={{
                              backgroundColor: color,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              color: level >= 4 ? "black" : "white",
                              fontWeight: "bold",
                            }}
                            title={confidenceLabels[level]}
                          >
                            {confidenceLabels[level]}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-right">
                      {image.averageDrillTime > 0
                        ? `${image.averageDrillTime.toFixed(2)}s`
                        : "-"}
                    </td>
                    <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700 text-center">
                      {image.totalDrills || 0}
                    </td>
                    <td className="px-2 py-2 border-b border-gray-300 dark:border-gray-700">
                      {image.lastDrilledAt
                        ? new Date(image.lastDrilledAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages} (
                {pagination.totalImages} total images)
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-center">
                <button
                  onClick={() => goToPage(1)}
                  disabled={loading || currentPage === 1}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  ««
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={loading || currentPage === 1}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  ‹ Prev
                </button>

                {/* Page Jump Input */}
                <form
                  onSubmit={handlePageJump}
                  className="flex items-center gap-1"
                >
                  <span className="text-sm">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="#"
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Go
                  </button>
                </form>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={loading || currentPage === pagination.totalPages}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next ›
                </button>
                <button
                  onClick={() => goToPage(pagination.totalPages)}
                  disabled={loading || currentPage === pagination.totalPages}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
