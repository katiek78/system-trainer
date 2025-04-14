import dbConnect from "../../../lib/dbConnect";
import Journey from "@/models/Journey";
import { getSession } from "@auth0/nextjs-auth0";

export default async function handler(req, res) {
  const { method } = req;

  const session = await getSession(req, res);

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
        res.status(200).json(journeys);
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
  }
}
