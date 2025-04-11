import dbConnect from "../../../../lib/dbConnect";
import JourneyFolder from "@/models/JourneyFolder";

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const journeyFolders = await JourneyFolder.find(
          {}
        ); /* find all the data in our database */
        res.status(200).json({ success: true, data: journeyFolders });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      console.log(req.body);
      try {
        const journeyFolder = await JourneyFolder.create(
          req.body
        ); /* create a new model in the database */
        res.status(201).json({ success: true, data: journeyFolder });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}
