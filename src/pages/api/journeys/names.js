import dbConnect from "../../../lib/dbConnect";
import Journey from "@/models/Journey";
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  const { method } = req;

  const session = await auth0.getSession(req, res);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const userId = session.user.sub;
        const journeys = await Journey.find({ userId: userId }).select(
          "_id name"
        );
        // Serialize ObjectIds to strings
        const serializedJourneys = journeys.map((journey) => ({
          _id: journey._id.toString(),
          name: journey.name,
        }));
        res.status(200).json(serializedJourneys);
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
  }
}
