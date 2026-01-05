import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import JourneyFolder from "@/models/JourneyFolder";
import JourneyAssignment from "@/models/JourneyAssignment";
import JourneysInteractive from "./JourneysInteractive";

export default async function JourneysPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="p-8 text-center">
        You must be logged in to view this page.
      </div>
    );
  }

  await dbConnect();
  const userId = user.sub;

  // Fetch journeys, folders, assignments for this user
  const journeysResult = await Journey.find({ userId });
  const foldersResult = await JourneyFolder.find({ userId });
  const assignmentsResult = await JourneyAssignment.find({ userId });
  // Public journeys: userId does not exist or is null
  const publicJourneysResult = await Journey.find({
    $or: [{ userId: null }, { userId: { $exists: false } }],
  });

  // Convert to plain objects and string ids
  const journeys = journeysResult.map((doc) => {
    const obj = doc.toObject();
    return {
      ...obj,
      _id: doc._id.toString(),
      points:
        obj.points?.map((point) => ({
          ...point,
          _id: point._id.toString(),
        })) || [],
      pointsCount: doc.points?.length || 0,
    };
  });
  const folders = foldersResult.map((doc) => ({
    ...doc.toObject(),
    _id: doc._id.toString(),
  }));
  const assignments = assignmentsResult.map((doc) => {
    const obj = doc.toObject();
    return {
      ...obj,
      _id: doc._id.toString(),
      journeySets:
        obj.journeySets?.map((set) => ({
          ...set,
          _id: set._id?.toString(),
          journeyIDs: set.journeyIDs?.map((id) => id.toString()) || [],
        })) || [],
    };
  });
  const publicJourneys = publicJourneysResult.map((doc) => {
    const obj = doc.toObject();
    return {
      ...obj,
      _id: doc._id.toString(),
      points:
        obj.points?.map((point) => ({
          ...point,
          _id: point._id.toString(),
        })) || [],
      pointsCount: doc.points?.length || 0,
    };
  });

  return (
    <JourneysInteractive
      journeys={journeys}
      folders={folders}
      assignments={assignments}
      publicJourneys={publicJourneys}
      user={user}
    />
  );
}
