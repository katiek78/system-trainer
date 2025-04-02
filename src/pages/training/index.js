import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import dbConnect from "@/lib/dbConnect";
//import { getRequiredBPM } from "@/utilities/timing";
import { ML_DISCIPLINES } from "@/lib/disciplines";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import { faPlay } from "@fortawesome/free-solid-svg-icons";
import ImageSet from "@/models/ImageSet";

const TrainingPage = ({ user, imageSets }) => {
  const [errors, setErrors] = useState({});

  const handleSelectFlashcards = () => {
    const imageSetId = document.getElementById("imageSet").value;
    window.location.href = `/training/set-learning?imageSet=${imageSetId}`;
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg">
        <h1 className="py-2 font-mono text-4xl">Training Centre</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">Do some training or drills</h3>
          <p className="font-mono">
            Select your discipline and see all the training options.
          </p>
        </div>
        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">Image learning</h3>
          <p className="font-mono">Flashcards</p>
          <select
            className="shadow appearance-none border rounded w-100 mt-1 mx-3 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="imageSet"
            id="imageSet"
          >
            {imageSets.map((imageSet) => (
              <option value={imageSet._id}>{imageSet.name}</option>
            ))}
          </select>
          <button
            onClick={handleSelectFlashcards}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">Journey learning</h3>
        </div>
      </div>
    </>
  );
};

export default TrainingPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
    const db = await dbConnect();

    if (!auth0User || !auth0User.user) {
      return { props: { user: null, imageSets: [] } }; // Handle unauthenticated users
    }

    const userId = auth0User.user.sub; // Auth0 user ID
    const dbResult = await ImageSet.find({ userId }, { name: 1 }); // Filter by userId

    const imageSets = dbResult.map((doc) => ({
      ...doc.toObject(),
      _id: doc._id.toString(),
    }));

    return {
      props: {
        user: auth0User.user,
        imageSets,
      },
    };
  },
});
