import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import Journey from "@/models/Journey";
import TrainingInteractive from "./TrainingInteractive";

export default async function TrainingPage() {
  // Get the session (user) on the server
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    // Optionally, redirect to login or show a message
    return (
      <div className="p-8 text-center">
        You must be logged in to view this page.
      </div>
    );
  }

  await dbConnect();
  const userId = user.sub;
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

  return (
    <div className="w-full min-h-screen bg-transparent">
      <div className="z-10 font-mono text-lg w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl sm:mx-auto px-1 sm:px-4 md:px-8">
        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Training Centre
        </h1>
        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
          <h3 className="font-semibold">Do some training or drills</h3>
          <p className="font-mono">
            Select your discipline and see all the training options.
          </p>
        </div>
        <TrainingInteractive imageSets={imageSets} journeys={journeys} />
      </div>
    </div>
  );
}
