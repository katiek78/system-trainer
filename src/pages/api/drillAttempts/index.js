import dbConnect from "../../../lib/dbConnect";
import DrillAttempt from "@/models/DrillAttempt";
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  const { method } = req;
  const session = await auth0.getSession(req, res);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = session.user.sub;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const drillAttempts = await DrillAttempt.find({
          userId,
        }).sort({
          date: -1,
        }); /* find all the data for this user, newest first */
        res.status(200).json({ success: true, data: drillAttempts });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        const drillAttempt = await DrillAttempt.create({
          ...req.body,
          userId,
        }); /* create a new model in the database */
        res.status(201).json({ success: true, data: drillAttempt });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "DELETE":
      try {
        const { id } = req.body;
        const deleted = await DrillAttempt.findOneAndDelete({
          _id: id,
          userId, // Ensure user can only delete their own attempts
        });
        if (!deleted) {
          return res.status(404).json({ success: false, message: "Not found" });
        }
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}
