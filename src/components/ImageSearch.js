import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

const ImageSearch = ({ img, index, onImageSelect }) => {
  const [query, setQuery] = useState(img.imageItem); // Local state for the search query for this item
  const [searchResults, setSearchResults] = useState([]); // Local state for search results of this item
  const [isSearchVisible, setSearchVisible] = useState(false); // State to toggle visibility
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query) return;

    setError(null); // Reset error before a new request
    setSearchResults([]); // Clear previous results

    try {
      const response = await fetch(`/api/imageSearch?query=${query}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error("No images found.");
      }

      setSearchResults(data);
    } catch (err) {
      console.error("Image search error:", err);
      setError(err.message || "Something went wrong.");
    }
  };

  const handleCloseSearch = () => {
    setSearchVisible(false); // Hide the search when clicking "Close"
  };

  const handleToggleSearch = () => {
    setSearchVisible(!isSearchVisible); // Toggle the search visibility
  };

  useEffect(() => {
    if (!index) setSearchVisible(true);
  }, []);

  return (
    <div>
      <button onClick={handleToggleSearch} className="toggle-search-button">
        <FontAwesomeIcon icon={isSearchVisible ? faTimes : faSearch} />
      </button>
      {isSearchVisible && (
        <div className="image-search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)} // Update local query state
            placeholder="Search for images"
            className="border border-gray-400 p-2 rounded-md w-full focus:border-blue-500 focus:ring focus:ring-blue-300"
          />
          <button
            onClick={handleSearch}
            className="mt-2 p-2 bg-blue-500 text-white rounded-md"
          >
            Search
          </button>
          {isSearchVisible && (
            <button
              onClick={handleCloseSearch}
              className="ml-3 mt-2 p-2 bg-blue-500 text-white rounded-md"
            >
              Close
            </button>
          )}

          <div
            className={`image-results mt-2 ${!index && "sm:flex sm:flex-row"}`}
          >
            {searchResults.map((image) => {
              // Check if the image URL is secure (starts with 'https://')
              if (image.link.startsWith("https://")) {
                return (
                  <img
                    key={image.link}
                    src={image.link}
                    alt={image.title}
                    className="w-24 h-24 m-2 cursor-pointer"
                    onClick={() => onImageSelect(index, image.link)}
                  />
                );
              } else {
                return null; // Don't render the image if it's not secure
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSearch;
