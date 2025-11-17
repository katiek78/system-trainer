import dbConnect from "../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";
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
        const imageSets = await ImageSet.find({ userId: userId }).select(
          "_id name setType"
        );
        // Only return id, name, and setType (top-level)
        const result = imageSets.map((set) => ({
          _id: set._id,
          name: set.name,
          setType: set.setType,
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
