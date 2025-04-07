import dbConnect from "@/lib/dbConnect";
import { getSession } from "@auth0/nextjs-auth0";
import Journey from "@/models/Journey";

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const session = await getSession(req, res);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const userId = session.user.sub;

  await dbConnect();

  const journeyId = req.query.id;

  //fetch journey to check if it belongs to the user
  const result = await Journey.findOne({ _id: id, userId: userId });

  if (!result) {
    return res
      .status(404)
      .json({ success: false, error: "Journey not found for this user" });
  }

  switch (method) {
    case "PUT" /* Reorder a point within a journey */:
      try {
        const { pointIndex, direction } = req.body;
        const index = parseInt(pointIndex, 10);

        if (!journeyId || isNaN(index) || !["f", "b"].includes(direction)) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid parameters" });
        }

        const journey = await Journey.findById(journeyId);
        if (!journey) {
          return res
            .status(404)
            .json({ success: false, error: "Journey not found" });
        }

        const newIndex = direction === "f" ? index + 1 : index - 1;

        const points = [...journey.points]; // Create a shallow copy

        if (newIndex < 0 || newIndex >= points.length) {
          return res
            .status(400)
            .json({ success: false, error: "Move out of bounds" });
        }

        // Swap
        const temp = points[index];
        points[index] = points[newIndex];
        points[newIndex] = temp;

        journey.points = points; // Reassign the updated array to the model

        const updatedJourney = await journey.save();

        return res.status(200).json({ success: true, data: updatedJourney });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: "Server error" });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
