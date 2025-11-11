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

  if (req.method === "GET") {
    // Accept discipline as query param, default to '5-minute Numbers'
    const discipline = req.query.discipline || "5-minute Numbers";
    // Get all assignments for this user and discipline
    const assignments = await JourneyAssignment.find({ userId, discipline });
    // Merge all journeySets from all assignments
    const allJourneySets = assignments.flatMap((a) => a.journeySets);
    // Gather all journey IDs from all sets
    const allJourneyIDs = allJourneySets.flatMap((set) => set.journeyIDs);
    const uniqueJourneyIDs = [...new Set(allJourneyIDs)];
    // Get journey names
    const journeys = await Journey.find({ _id: { $in: uniqueJourneyIDs } });
    const journeyMap = Object.fromEntries(
      journeys.map((j) => [j._id.toString(), j.name])
    );
    // Build options: each option is an array of {id, name}
    const options = allJourneySets.map((set) =>
      set.journeyIDs.map((id) => ({ id, name: journeyMap[id] || "Unknown" }))
    );
    return res.status(200).json({ options });
  }

  if (req.method === "POST") {
    const { discipline, options } = req.body;
    if (!discipline || !Array.isArray(options)) {
      return res.status(400).json({ error: "discipline and options required" });
    }
    // Find or create assignment for this user and discipline
    let assignment = await JourneyAssignment.findOne({ userId, discipline });
    if (!assignment) {
      assignment = new JourneyAssignment({
        userId,
        discipline,
        journeySets: [],
      });
    }
    // Replace journeySets with new options
    assignment.journeySets = options.map((ids) => ({ journeyIDs: ids }));
    await assignment.save();
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
