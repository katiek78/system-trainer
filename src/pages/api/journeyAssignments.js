import dbConnect from "@/lib/dbConnect";
import JourneyAssignment from "@/models/JourneyAssignment";
import Journey from "@/models/Journey";
import { getSession } from "@auth0/nextjs-auth0";

export default async function handler(req, res) {
  await dbConnect();
  const session = await getSession(req, res);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = session.user.sub;

  // Only GET for now
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only get assignments for numbers discipline
  // Accept discipline as query param, default to '5-minute Numbers'
  const discipline = req.query.discipline || "5-minute Numbers";
  const assignments = await JourneyAssignment.find({ userId, discipline });
  // Gather all journey IDs from all options
  const allJourneyIDs = assignments.flatMap((a) =>
    a.journeySets.flatMap((set) => set.journeyIDs)
  );
  const uniqueJourneyIDs = [...new Set(allJourneyIDs)];
  // Get journey names
  const journeys = await Journey.find({ _id: { $in: uniqueJourneyIDs } });
  const journeyMap = Object.fromEntries(
    journeys.map((j) => [j._id.toString(), j.name])
  );
  // Build options: each option is an array of {id, name}
  const options = assignments.flatMap((a) =>
    a.journeySets.map((set) =>
      set.journeyIDs.map((id) => ({ id, name: journeyMap[id] || "Unknown" }))
    )
  );
  res.status(200).json({ options });
}
