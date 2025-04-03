import React, { useState } from "react";

const ImageSearch = ({ img, index, onImageSelect }) => {
  const [query, setQuery] = useState(""); // Local state for the search query for this item
  const [searchResults, setSearchResults] = useState([]); // Local state for search results of this item

  const handleSearch = async () => {
    if (!query) return;

    try {
      const res = await fetch(`/api/imageSearch?query=${query}`);
      const data = await res.json();
      console.log(data);
      if (data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error fetching image search results:", error);
    }
  };

  return (
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

      <div className="image-results mt-2">
        {/* {searchResults.map((image) => (
          <img
            key={image.link}
            src={image.link}
            alt={image.title}
            className="w-24 h-24 m-2 cursor-pointer"
            onClick={() => onImageSelect(index, image.link)} // Placeholder for selection
          />
        ))} */}
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
  );
};

export default ImageSearch;
