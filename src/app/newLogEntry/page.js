import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import LogInteractiveNew from "./LogInteractiveNew";

export default async function NewLogEntryPage() {
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

  // Fetch user's journeys
  const result2 = await Journey.find({ userId: userId }, { name: 1 });
  const journeys = result2.map((doc) => {
    const journey = JSON.parse(JSON.stringify(doc));
    journey._id = journey._id.toString();
    return journey;
  });

  // Fetch public journeys
  const publicJourneyResult = await Journey.find(
    { $or: [{ userId: null }, { userId: { $exists: false } }] },
    { name: 1 }
  );
  const publicJourneys = publicJourneyResult.map((doc) => {
    const journey = JSON.parse(JSON.stringify(doc));
    journey._id = journey._id.toString();
    return journey;
  });

  const logEntryForm = {
    notes: "",
  };

  return (
    <LogInteractiveNew
      journeys={journeys}
      publicJourneys={publicJourneys}
      logEntryForm={logEntryForm}
    />
  );
}
