import dbConnect from "../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";
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
        // Get user's private image sets
        const privateImageSets = await ImageSet.find({ userId: userId }).select(
          "_id name setType userId"
        );
        // Get public image sets (no userId or null)
        const publicImageSets = await ImageSet.find({
          $or: [{ userId: null }, { userId: { $exists: false } }],
        }).select("_id name setType userId");

        // Combine and serialize ObjectIds to strings
        const allSets = [...privateImageSets, ...publicImageSets];
        const result = allSets.map((set) => ({
          _id: set._id.toString(),
          name: set.name,
          setType: set.setType,
          userId: set.userId || null,
        }));
        res.status(200).json(result);
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.status(405).json({ error: "Method not allowed" });
      break;
  }
}
