import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();
  const session = await auth0.getSession(req, res);
  const user = session?.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { journeyIds, name } = req.body;
  if (!Array.isArray(journeyIds) || journeyIds.length < 2) {
    return res
      .status(400)
      .json({ message: "At least two journey IDs required" });
  }

  // Fetch all journeys in order
  const journeys = await Journey.find({
    _id: { $in: journeyIds },
    userId: user.sub,
  });
  // Ensure all requested journeys belong to user and are found
  if (journeys.length !== journeyIds.length) {
    return res
      .status(400)
      .json({ message: "Some journeys not found or not owned by user" });
  }

  // Merge points in order
  let mergedPoints = [];
  for (const id of journeyIds) {
    const j = journeys.find((j) => j._id.toString() === id);
    if (j && Array.isArray(j.points)) {
      mergedPoints = mergedPoints.concat(j.points);
    }
  }

  // Create new journey
  const newJourney = new Journey({
    userId: user.sub,
    name: name || "Merged Journey",
    points: mergedPoints,
    folderId: null,
  });
  await newJourney.save();

  res.status(201).json({
    message: "Journey created",
    journey: { _id: newJourney._id, name: newJourney.name },
  });
}
