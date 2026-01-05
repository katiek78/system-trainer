"use client";
import { useState } from "react";

export default function TrainingInteractive({ imageSets, journeys }) {
  const [selectedImageSet, setSelectedImageSet] = useState(
    imageSets[0]?._id || ""
  );
  const [selectedJourney, setSelectedJourney] = useState(
    journeys[0]?._id || ""
  );

  const handleSelectFlashcards = () => {
    if (selectedImageSet) {
      window.location.href = `/training/set-learning?imageSet=${selectedImageSet}`;
    }
  };

  const handleSelectDrills = () => {
    if (selectedImageSet) {
      window.location.href = `/training/drills?imageSet=${selectedImageSet}`;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
        <h3 className="font-semibold">Image learning</h3>
        <p className="font-mono">Flashcards</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            className="shadow appearance-none border rounded w-full sm:w-auto mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="imageSet"
            id="imageSet"
            value={selectedImageSet}
            onChange={(e) => setSelectedImageSet(e.target.value)}
          >
            {imageSets.map((imageSet) => (
              <option key={imageSet._id} value={imageSet._id}>
                {imageSet.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSelectFlashcards}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            Go
          </button>
        </div>

        <p className="font-mono">Drills</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            className="shadow appearance-none border rounded w-full sm:w-auto mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="imageSet2"
            id="imageSet2"
            value={selectedImageSet}
            onChange={(e) => setSelectedImageSet(e.target.value)}
          >
            {imageSets.map((imageSet) => (
              <option key={imageSet._id} value={imageSet._id}>
                {imageSet.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSelectDrills}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            Go
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
        <h3 className="font-semibold">Journey learning</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            className="shadow appearance-none border rounded w-full sm:w-auto mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="journey"
            id="journey"
            value={selectedJourney}
            onChange={(e) => setSelectedJourney(e.target.value)}
          >
            {journeys.map((journey) => (
              <option key={journey._id} value={journey._id}>
                {journey.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => alert("Not yet implemented")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            Go
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mt-5 mb-4">
        <h3 className="font-semibold">Competition training</h3>
        <ul className="list-disc list-inside font-mono">
          <li>
            <a
              href="/training/cardsSettings"
              className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-mono"
              style={{ cursor: "pointer" }}
            >
              Cards
            </a>
          </li>
          <li>
            <a
              href="/training/settings"
              className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-mono"
              style={{ cursor: "pointer" }}
            >
              Numbers
            </a>
          </li>
          <li>
            <a
              href="#"
              className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-mono"
              style={{ cursor: "pointer" }}
              onClick={() =>
                alert("Words training settings not yet implemented")
              }
            >
              Words
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
