import { auth0 } from "@/lib/auth0";
import JourneyDetail from "./JourneyDetail";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import { notFound } from "next/navigation";

// Server component for journey detail page
export default async function JourneyPage({ params, searchParams }) {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="p-8 text-center">
        You must be logged in to view this page.
      </div>
    );
  }

  // Await params if it's a Promise (edge case for some Next.js setups)
  const resolvedParams =
    typeof params?.then === "function" ? await params : params;
  await dbConnect();
  const { id } = resolvedParams;
  const userId = user.sub;

  // Fetch journey by id and verify ownership or public access
  const journeyResult = await Journey.findOne({
    _id: id,
    $or: [{ userId: userId }, { userId: null }, { userId: { $exists: false } }],
  }).lean();
  if (!journeyResult) return notFound();
  // Fetch all journeys for linking info (optional, can optimize later)
  const allJourneys = await Journey.find({}).lean();
  // Find journeys that link to this journey
  const linkedFromJourneys = allJourneys.filter((j) =>
    j.points?.some((p) => p.linkedJourneyID === id)
  );
  // Prepare props for client component
  // Convert all _id fields to strings recursively
  function convertIdsToStrings(obj) {
    if (Array.isArray(obj)) {
      return obj.map(convertIdsToStrings);
    } else if (obj && typeof obj === "object") {
      const newObj = {};
      for (const key in obj) {
        if (
          key === "_id" &&
          obj[key] &&
          typeof obj[key].toString === "function"
        ) {
          newObj[key] = obj[key].toString();
        } else {
          newObj[key] = convertIdsToStrings(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

  return (
    <JourneyDetail
      journey={convertIdsToStrings(JSON.parse(JSON.stringify(journeyResult)))}
      journeys={convertIdsToStrings(JSON.parse(JSON.stringify(allJourneys)))}
      linkedFromJourneys={convertIdsToStrings(
        JSON.parse(JSON.stringify(linkedFromJourneys))
      )}
    />
  );
}
