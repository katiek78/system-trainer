import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import dbConnect from "@/lib/dbConnect";
//import { getRequiredBPM } from "@/utilities/timing";
import { ML_DISCIPLINES } from "@/lib/disciplines";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import { faPlay } from "@fortawesome/free-solid-svg-icons";

import ImageSet from "@/models/ImageSet";
import Journey from "@/models/Journey";

const TrainingPage = ({ user, imageSets, journeys }) => {
  const [errors, setErrors] = useState({});

  const handleSelectFlashcards = () => {
    const imageSetId = document.getElementById("imageSet").value;
    window.location.href = `/training/set-learning?imageSet=${imageSetId}`;
  };

  const handleSelectDrills = () => {
    const imageSetId = document.getElementById("imageSet").value;
    window.location.href = `/training/drills?imageSet=${imageSetId}`;
  };

  return (
    <div className="w-full min-h-screen flex justify-center bg-transparent">
      <div className="z-10 font-mono text-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Training Centre
        </h1>
        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
          <h3 className="font-semibold">Do some training or drills</h3>
          <p className="font-mono">
            Select your discipline and see all the training options.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
          <h3 className="font-semibold">Image learning</h3>
          <p className="font-mono">Flashcards</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              className="shadow appearance-none border rounded w-full sm:w-auto mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              name="imageSet"
              id="imageSet"
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
              name="imageSet"
              id="imageSet"
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
              <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-mono"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  (window.location.href = "/training/cardsSettings")
                }
              >
                Cards
              </button>
            </li>
            <li>
              <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-mono"
                style={{ cursor: "pointer" }}
                onClick={() => (window.location.href = "/training/settings")}
              >
                Numbers
              </button>
            </li>
            <li>
              <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-mono"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  alert("Words training settings not yet implemented")
                }
              >
                Words
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
    const db = await dbConnect();

    if (!auth0User || !auth0User.user) {
      return { props: { user: null, imageSets: [], journeys: [] } };
    }

    const userId = auth0User.user.sub;
    const imageSetResult = await ImageSet.find({ userId }, { name: 1 });
    const journeyResult = await Journey.find({ userId }, { name: 1 });

    const imageSets = imageSetResult.map((doc) => ({
      ...doc.toObject(),
      _id: doc._id.toString(),
    }));
    const journeys = journeyResult
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((doc) => ({
        ...doc.toObject(),
        _id: doc._id.toString(),
      }));

    return {
      props: {
        user: auth0User.user,
        imageSets,
        journeys,
      },
    };
  },
});
