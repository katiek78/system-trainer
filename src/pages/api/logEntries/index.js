import dbConnect from "../../../lib/dbConnect";
import LogEntry from "@/models/LogEntry";
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
        const logEntries = await LogEntry.find({
          userId,
        }); /* find all the data for this user */
        res.status(200).json({ success: true, data: logEntries });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        const logEntry = await LogEntry.create({
          ...req.body,
          userId,
        }); /* create a new model in the database */
        res.status(201).json({ success: true, data: logEntry });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}
